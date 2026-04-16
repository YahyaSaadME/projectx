import mongoose, { Schema, type Model, type Types } from "mongoose";
import { connectMongoose } from "@/lib/mongoose";
import { getOrganizationById, incrementMemberScore, listRankedOrganizationMembers, type ContactFormRecord, type SubmissionRecord } from "@/lib/organizations";
import { findUserById, findUsersByIds } from "@/lib/users";
import { sendAppMail } from "@/lib/mailer";
import { decideLeadRouting } from "@/lib/groq-agent";

export type AgentRuleRecord = {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  enabled: boolean;
  prompt: string;
  rules: string[];
  queueStrategy: "lowest_score" | "round_robin" | "manual";
  stockMode: "auto_confirm" | "manual_review";
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export type SalesLeadRecord = {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  formId: Types.ObjectId;
  submissionId: Types.ObjectId;
  requesterEmail: string;
  requesterName?: string;
  productName?: string;
  quantityRequested?: number;
  quantityAvailable?: number;
  status: "new" | "queued" | "needs_confirmation" | "assigned" | "escalated" | "completed";
  assignedTo?: Types.ObjectId;
  decisionReason?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type StockItemRecord = {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  sku: string;
  name: string;
  quantity: number;
  sourceSheetRow?: string;
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type ReminderRecord = {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  userId?: Types.ObjectId;
  email: string;
  title: string;
  dueAt: Date;
  channel: "email" | "calendar";
  status: "pending" | "sent" | "skipped";
  createdAt: Date;
  updatedAt: Date;
};

export type AssignmentRecord = {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  leadId: Types.ObjectId;
  assignedTo: Types.ObjectId;
  scoreSnapshot: number;
  reason: string;
  createdAt: Date;
  updatedAt: Date;
};

const AgentRuleSchema = new Schema<AgentRuleRecord>(
  {
    organizationId: { type: Schema.Types.ObjectId, required: true, ref: "Organization" },
    enabled: { type: Boolean, required: true, default: true },
    prompt: { type: String, required: true, default: "Route sales leads using score-based queue and stock availability." },
    rules: { type: [String], required: true, default: ["Assign to the lowest score eligible member.", "Escalate stock shortages to the organizer."] },
    queueStrategy: { type: String, required: true, default: "lowest_score", enum: ["lowest_score", "round_robin", "manual"] },
    stockMode: { type: String, required: true, default: "auto_confirm", enum: ["auto_confirm", "manual_review"] },
    updatedBy: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  },
  { timestamps: true, collection: "agent_rules" },
);

const SalesLeadSchema = new Schema<SalesLeadRecord>(
  {
    organizationId: { type: Schema.Types.ObjectId, required: true, ref: "Organization" },
    formId: { type: Schema.Types.ObjectId, required: true, ref: "ContactForm" },
    submissionId: { type: Schema.Types.ObjectId, required: true },
    requesterEmail: { type: String, required: true, lowercase: true, trim: true },
    requesterName: { type: String },
    productName: { type: String },
    quantityRequested: { type: Number },
    quantityAvailable: { type: Number },
    status: { type: String, required: true, default: "new", enum: ["new", "queued", "needs_confirmation", "assigned", "escalated", "completed"] },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    decisionReason: { type: String },
  },
  { timestamps: true, collection: "sales_leads" },
);

const StockItemSchema = new Schema<StockItemRecord>(
  {
    organizationId: { type: Schema.Types.ObjectId, required: true, ref: "Organization" },
    sku: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, default: 0 },
    sourceSheetRow: { type: String },
    lastSyncedAt: { type: Date },
  },
  { timestamps: true, collection: "stock_items" },
);

const ReminderSchema = new Schema<ReminderRecord>(
  {
    organizationId: { type: Schema.Types.ObjectId, required: true, ref: "Organization" },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    email: { type: String, required: true, lowercase: true, trim: true },
    title: { type: String, required: true, trim: true },
    dueAt: { type: Date, required: true },
    channel: { type: String, required: true, default: "email", enum: ["email", "calendar"] },
    status: { type: String, required: true, default: "pending", enum: ["pending", "sent", "skipped"] },
  },
  { timestamps: true, collection: "reminders" },
);

const AssignmentSchema = new Schema<AssignmentRecord>(
  {
    organizationId: { type: Schema.Types.ObjectId, required: true, ref: "Organization" },
    leadId: { type: Schema.Types.ObjectId, required: true, ref: "SalesLead" },
    assignedTo: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    scoreSnapshot: { type: Number, required: true },
    reason: { type: String, required: true },
  },
  { timestamps: true, collection: "assignments" },
);

const AgentRuleModel: Model<AgentRuleRecord> =
  (mongoose.models.AgentRule as Model<AgentRuleRecord> | undefined) ?? mongoose.model<AgentRuleRecord>("AgentRule", AgentRuleSchema);

const SalesLeadModel: Model<SalesLeadRecord> =
  (mongoose.models.SalesLead as Model<SalesLeadRecord> | undefined) ?? mongoose.model<SalesLeadRecord>("SalesLead", SalesLeadSchema);

const StockItemModel: Model<StockItemRecord> =
  (mongoose.models.StockItem as Model<StockItemRecord> | undefined) ?? mongoose.model<StockItemRecord>("StockItem", StockItemSchema);

const ReminderModel: Model<ReminderRecord> =
  (mongoose.models.Reminder as Model<ReminderRecord> | undefined) ?? mongoose.model<ReminderRecord>("Reminder", ReminderSchema);

const AssignmentModel: Model<AssignmentRecord> =
  (mongoose.models.Assignment as Model<AssignmentRecord> | undefined) ?? mongoose.model<AssignmentRecord>("Assignment", AssignmentSchema);

function slugifyText(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function parseQuantity(value?: string) {
  if (!value) return undefined;
  const parsed = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function getAnswerValue(answers: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    const value = answers[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

export async function getAgentRule(organizationId: string) {
  await connectMongoose();
  return AgentRuleModel.findOne({ organizationId }).lean<AgentRuleRecord>().exec();
}

export async function upsertAgentRule(input: {
  organizationId: string;
  prompt: string;
  rules: string[];
  queueStrategy: AgentRuleRecord["queueStrategy"];
  stockMode: AgentRuleRecord["stockMode"];
  enabled: boolean;
  updatedBy: string;
}) {
  await connectMongoose();
  return AgentRuleModel.findOneAndUpdate(
    { organizationId: input.organizationId },
    {
      $set: {
        prompt: input.prompt,
        rules: input.rules,
        queueStrategy: input.queueStrategy,
        stockMode: input.stockMode,
        enabled: input.enabled,
        updatedBy: input.updatedBy,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  )
    .lean<AgentRuleRecord>()
    .exec();
}

export async function listStockItems(organizationId: string) {
  await connectMongoose();
  return StockItemModel.find({ organizationId }).sort({ updatedAt: -1 }).lean<StockItemRecord[]>().exec();
}

export async function upsertStockItems(organizationId: string, rows: Array<{ sku: string; name: string; quantity: number; sourceSheetRow?: string }>) {
  await connectMongoose();

  for (const row of rows) {
    await StockItemModel.findOneAndUpdate(
      { organizationId, sku: row.sku },
      {
        $set: {
          name: row.name,
          quantity: row.quantity,
          sourceSheetRow: row.sourceSheetRow,
          lastSyncedAt: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();
  }
}

export async function createReminder(input: {
  organizationId: string;
  email: string;
  title: string;
  dueAt: Date;
  channel?: "email" | "calendar";
  userId?: string;
}) {
  await connectMongoose();
  const reminder = await ReminderModel.create({
    organizationId: input.organizationId,
    email: input.email,
    title: input.title,
    dueAt: input.dueAt,
    channel: input.channel ?? "email",
    status: "pending",
    userId: input.userId,
  });

  return reminder.toObject() as ReminderRecord;
}

export async function listReminders(organizationId: string) {
  await connectMongoose();
  return ReminderModel.find({ organizationId }).sort({ dueAt: 1 }).lean<ReminderRecord[]>().exec();
}

async function getEligibleMemberUsers(organizationId: string) {
  const members = await listRankedOrganizationMembers(organizationId);
  const memberIds = members.filter((member) => member.role === "member").map((member) => member.userId.toString());
  const adminIds = members.filter((member) => member.role === "admin").map((member) => member.userId.toString());
  const selectedIds = memberIds.length > 0 ? memberIds : adminIds;
  const users = await findUsersByIds(selectedIds);

  return members
    .filter((membership) => selectedIds.includes(membership.userId.toString()))
    .map((membership) => ({
      membership,
      user: users.find((user) => user.id === membership.userId.toString()) ?? null,
    }))
    .filter((entry) => entry.user);
}

async function assignToBestMember(organizationId: string, leadId: string, reason: string) {
  const candidates = await getEligibleMemberUsers(organizationId);

  if (!candidates.length) {
    return null;
  }

  const bestCandidate = candidates[0];
  await AssignmentModel.create({
    organizationId,
    leadId,
    assignedTo: bestCandidate.membership.userId,
    scoreSnapshot: bestCandidate.membership.score,
    reason,
  });

  await incrementMemberScore(organizationId, bestCandidate.membership.userId.toString(), 1, true);

  return bestCandidate.user;
}

async function buildRoutingCandidateSummary(organizationId: string) {
  const members = await listRankedOrganizationMembers(organizationId);
  const eligibleIds = members.filter((member) => member.role === "member").map((member) => member.userId.toString());
  const fallbackIds = members.filter((member) => member.role === "admin").map((member) => member.userId.toString());
  const selectedIds = eligibleIds.length > 0 ? eligibleIds : fallbackIds;
  const users = await findUsersByIds(selectedIds);

  return members
    .filter((member) => selectedIds.includes(member.userId.toString()))
    .map((member) => ({
      name: users.find((user) => user.id === member.userId.toString())?.name ?? member.userId.toString(),
      email: users.find((user) => user.id === member.userId.toString())?.email ?? "",
      score: member.score,
      assignedCount: member.assignedCount,
      role: member.role,
      userId: member.userId.toString(),
    }));
}

export async function processSubmissionAutomation(input: {
  organizationId: string;
  form: ContactFormRecord;
  submission: SubmissionRecord;
}) {
  await connectMongoose();
  const rule = await getAgentRule(input.organizationId);
  const organization = await getOrganizationById(input.organizationId);
  const organizerUser = organization ? await findUserById(organization.createdBy.toString()) : null;
  const organizerEmail = organizerUser?.email ?? process.env.ADMIN_ALERT_EMAIL ?? input.submission.email;

  const requesterName = getAnswerValue(input.submission.answers, ["name", "fullName", "customerName"]);
  const productName = getAnswerValue(input.submission.answers, ["product", "productName", "item", "sku"]);
  const quantityRequested = parseQuantity(getAnswerValue(input.submission.answers, ["quantity", "qty", "count", "orderQuantity"]));
  const candidateSummary = await buildRoutingCandidateSummary(input.organizationId);

  const agentDecision = rule
    ? await decideLeadRouting({
        organizationName: organization?.name ?? "organization",
        agentPrompt: rule.prompt,
        rules: rule.rules,
        stockSummary: productName
          ? `Requested product: ${productName}; quantity requested: ${quantityRequested ?? 1}`
          : "No stock-sensitive request detected.",
        leadSummary: JSON.stringify({ requesterName, requesterEmail: input.submission.email, answers: input.submission.answers }),
        candidates: candidateSummary,
      }).catch(() => null)
    : null;

  const lead = await SalesLeadModel.create({
    organizationId: input.organizationId,
    formId: input.form._id,
    submissionId: input.submission._id,
    requesterEmail: input.submission.email,
    requesterName,
    productName,
    quantityRequested,
    status: "new",
  });

  const stockItem = productName
    ? await StockItemModel.findOne({ organizationId: input.organizationId, $or: [{ sku: slugifyText(productName) }, { name: new RegExp(productName, "i") }] }).exec()
    : null;

  const needsStockValidation = Boolean(productName || quantityRequested);

  if (needsStockValidation && stockItem) {
    const requested = quantityRequested ?? 1;
    const available = stockItem.quantity;

    await SalesLeadModel.updateOne(
      { _id: lead._id },
      {
        $set: {
          quantityAvailable: available,
          status: available >= requested ? "needs_confirmation" : "escalated",
          decisionReason: available >= requested ? "Stock confirmed, waiting for user reconfirmation." : "Stock is insufficient and was escalated to the organizer.",
        },
      },
    ).exec();

    if (available >= requested) {
      stockItem.quantity = Math.max(available - requested, 0);
      stockItem.lastSyncedAt = new Date();
      await stockItem.save();

      const assignedMember =
        agentDecision?.action === "assign" && agentDecision.candidateEmail
          ? candidateSummary.find((candidate) => candidate.email === agentDecision.candidateEmail)?.name
          : null;

      const fallbackAssignee = await assignToBestMember(input.organizationId, lead._id.toString(), rule?.queueStrategy ?? "lowest_score");
      const assignedUser = assignedMember
        ? candidateSummary.find((candidate) => candidate.name === assignedMember)
        : fallbackAssignee
          ? candidateSummary.find((candidate) => candidate.email === fallbackAssignee.email)
          : null;

      const assignedEmail = assignedUser?.email ?? fallbackAssignee?.email ?? null;

      await createReminder({
        organizationId: input.organizationId,
        email: input.submission.email,
        title: `Reconfirm ${requested} x ${productName}`,
        dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        channel: "email",
      });

      await sendAppMail({
        to: input.submission.email,
        subject: `Please reconfirm your order for ${productName}`,
        text: `We have stock for ${requested} unit(s) of ${productName}. Please reply to confirm the order.`,
      });

      await sendAppMail({
        to: organizerEmail,
        subject: `Stock reserved for ${organization?.name ?? "your organization"}`,
        text: `Stock was reserved for ${requested} unit(s) of ${productName}. Awaiting user reconfirmation.`,
      }).catch(() => undefined);

      return { status: "needs_confirmation", assignedMember: assignedEmail };
    }

    await sendAppMail({
      to: organizerEmail,
      subject: `Stock shortage escalation for ${productName}`,
      text: `Requested ${requested} unit(s) of ${productName}, but only ${available} are available.`,
    }).catch(() => undefined);

    return { status: "escalated" };
  }

  const assignedMember =
    agentDecision?.action === "assign" && agentDecision.candidateEmail
      ? candidateSummary.find((candidate) => candidate.email === agentDecision.candidateEmail) ?? null
      : null;

  const fallbackMember = await assignToBestMember(input.organizationId, lead._id.toString(), rule?.queueStrategy ?? "lowest_score");
  const finalAssigned = assignedMember ?? (fallbackMember ? candidateSummary.find((candidate) => candidate.email === fallbackMember.email) ?? null : null);

  if (finalAssigned) {
    await sendAppMail({
      to: finalAssigned.email,
      subject: `New lead assigned from ${organization?.name ?? "your organization"}`,
      text: `A new lead was assigned to you. Customer email: ${input.submission.email}`,
    }).catch(() => undefined);
  }

  await sendAppMail({
    to: input.submission.email,
    subject: `We received your request from ${organization?.name ?? "our team"}`,
    text: `Your request has been received and assigned for follow-up.`,
  }).catch(() => undefined);

  await SalesLeadModel.updateOne(
    { _id: lead._id },
    {
      $set: {
        status: finalAssigned ? "assigned" : "queued",
        ...(finalAssigned ? { assignedTo: candidateSummary.find((candidate) => candidate.email === finalAssigned.email)?.userId } : {}),
        decisionReason: agentDecision?.reason ?? (finalAssigned ? "Assigned by score queue." : "Queued awaiting an available member."),
      },
    },
  ).exec();

  return { status: finalAssigned ? "assigned" : "queued", assignedMember: finalAssigned?.email ?? null };
}

export async function listSalesLeads(organizationId: string) {
  await connectMongoose();
  return SalesLeadModel.find({ organizationId }).sort({ createdAt: -1 }).lean<SalesLeadRecord[]>().exec();
}