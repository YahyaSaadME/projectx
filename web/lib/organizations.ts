import mongoose, { Schema, isValidObjectId, type Model, type Types } from "mongoose";
import { connectMongoose } from "@/lib/mongoose";
import { deleteRedisValue, readRedisValue, writeRedisValue } from "@/lib/redis";

export type OrganizationRole = "admin" | "member";

export type WarehouseStockItem = {
  product: string;
  quantity: number;
};

export type DashboardOrganization = {
  _id: string;
  name: string;
  slug: string;
  role: OrganizationRole;
};

export type OrganizationRecord = {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export type MembershipRecord = {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  userId: Types.ObjectId;
  role: OrganizationRole;
  warehouseName: string;
  warehouseStock: WarehouseStockItem[];
  score: number;
  assignedCount: number;
  lastAssignedAt?: Date;
  acceptedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type InviteRecord = {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  email: string;
  token: string;
  invitedBy: Types.ObjectId;
  status: "pending" | "accepted" | "expired";
  acceptedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type FormFieldType = "text" | "email" | "textarea" | "select";

export type FormField = {
  id: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  placeholder?: string;
  options?: string[];
};

export type ContactFormRecord = {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  name: string;
  slug: string;
  title: string;
  description: string;
  fields: FormField[];
  createdBy: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type SubmissionRecord = {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  formId: Types.ObjectId;
  formSlug: string;
  email: string;
  answers: Record<string, string>;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function randomSuffix() {
  return Math.random().toString(36).slice(2, 8);
}

function normalizeText(value: string) {
  return value.trim();
}

function normalizeWarehouseName(value: string) {
  return value.trim() || "Main warehouse";
}

function normalizeWarehouseStock(input: WarehouseStockItem[]) {
  return input
    .map((item) => ({
      product: item.product.trim(),
      quantity: Math.max(0, Number(item.quantity) || 0),
    }))
    .filter((item) => item.product.length > 0);
}

function buildUniqueSlug(baseValue: string) {
  const baseSlug = slugify(baseValue) || "organization";
  return `${baseSlug}-${randomSuffix()}`;
}

const OrganizationSchema = new Schema<OrganizationRecord>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true, default: "", trim: true },
    createdBy: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  },
  { timestamps: true, collection: "organizations" },
);

const WarehouseStockItemSchema = new Schema<WarehouseStockItem>(
  {
    product: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, default: 0, min: 0 },
  },
  { _id: false },
);

const MembershipSchema = new Schema<MembershipRecord>(
  {
    organizationId: { type: Schema.Types.ObjectId, required: true, ref: "Organization" },
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    role: { type: String, required: true, enum: ["admin", "member"], default: "member" },
    warehouseName: { type: String, required: true, default: "Main warehouse", trim: true },
    warehouseStock: { type: [WarehouseStockItemSchema], required: true, default: [] },
    score: { type: Number, required: true, default: 0 },
    assignedCount: { type: Number, required: true, default: 0 },
    lastAssignedAt: { type: Date },
    acceptedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true, collection: "memberships" },
);

MembershipSchema.index({ organizationId: 1, userId: 1 }, { unique: true });

const InviteSchema = new Schema<InviteRecord>(
  {
    organizationId: { type: Schema.Types.ObjectId, required: true, ref: "Organization" },
    email: { type: String, required: true, lowercase: true, trim: true },
    token: { type: String, required: true, unique: true },
    invitedBy: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    status: { type: String, required: true, enum: ["pending", "accepted", "expired"], default: "pending" },
    acceptedAt: { type: Date },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true, collection: "invites" },
);

const FormFieldSchema = new Schema<FormField>(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    type: { type: String, required: true, enum: ["text", "email", "textarea", "select"] },
    required: { type: Boolean, required: true, default: false },
    placeholder: { type: String },
    options: [{ type: String }],
  },
  { _id: false },
);

const ContactFormSchema = new Schema<ContactFormRecord>(
  {
    organizationId: { type: Schema.Types.ObjectId, required: true, ref: "Organization" },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, default: "", trim: true },
    fields: { type: [FormFieldSchema], required: true, default: [] },
    createdBy: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true, collection: "contact_forms" },
);

const SubmissionSchema = new Schema<SubmissionRecord>(
  {
    organizationId: { type: Schema.Types.ObjectId, required: true, ref: "Organization" },
    formId: { type: Schema.Types.ObjectId, required: true, ref: "ContactForm" },
    formSlug: { type: String, required: true, lowercase: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    answers: { type: Schema.Types.Mixed, required: true, default: {} },
    submittedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true, collection: "form_submissions" },
);

const OrganizationModel: Model<OrganizationRecord> =
  (mongoose.models.Organization as Model<OrganizationRecord> | undefined) ??
  mongoose.model<OrganizationRecord>("Organization", OrganizationSchema);

const MembershipModel: Model<MembershipRecord> =
  (mongoose.models.Membership as Model<MembershipRecord> | undefined) ??
  mongoose.model<MembershipRecord>("Membership", MembershipSchema);

const InviteModel: Model<InviteRecord> =
  (mongoose.models.Invite as Model<InviteRecord> | undefined) ?? mongoose.model<InviteRecord>("Invite", InviteSchema);

const ContactFormModel: Model<ContactFormRecord> =
  (mongoose.models.ContactForm as Model<ContactFormRecord> | undefined) ??
  mongoose.model<ContactFormRecord>("ContactForm", ContactFormSchema);

const SubmissionModel: Model<SubmissionRecord> =
  (mongoose.models.FormSubmission as Model<SubmissionRecord> | undefined) ??
  mongoose.model<SubmissionRecord>("FormSubmission", SubmissionSchema);

export function createOrganizationSlug(name: string) {
  return buildUniqueSlug(name);
}

export async function createOrganization(input: {
  name: string;
  description: string;
  createdBy: string;
}) {
  await connectMongoose();
  const organization = await OrganizationModel.create({
    name: normalizeText(input.name),
    slug: buildUniqueSlug(input.name),
    description: normalizeText(input.description),
    createdBy: input.createdBy,
  });

  return organization.toObject() as OrganizationRecord;
}

export async function updateOrganization(
  organizationId: string,
  input: {
    name: string;
    description: string;
  },
) {
  await connectMongoose();
  const updated = await OrganizationModel.findByIdAndUpdate(
    organizationId,
    {
      $set: {
        name: normalizeText(input.name),
        description: normalizeText(input.description),
      },
    },
    { new: true },
  )
    .lean<OrganizationRecord>()
    .exec();

  return updated;
}

export async function deleteOrganization(organizationId: string) {
  await connectMongoose();
  await Promise.all([
    OrganizationModel.findByIdAndDelete(organizationId).exec(),
    MembershipModel.deleteMany({ organizationId }).exec(),
    InviteModel.deleteMany({ organizationId }).exec(),
    ContactFormModel.deleteMany({ organizationId }).exec(),
    SubmissionModel.deleteMany({ organizationId }).exec(),
  ]);
}

export async function getOrganizationById(organizationId: string) {
  if (!isValidObjectId(organizationId)) {
    return null;
  }

  await connectMongoose();
  return OrganizationModel.findById(organizationId).lean<OrganizationRecord>().exec();
}

export async function getOrganizationBySlug(slug: string) {
  await connectMongoose();
  return OrganizationModel.findOne({ slug }).lean<OrganizationRecord>().exec();
}

export async function listUserOrganizations(userId: string): Promise<DashboardOrganization[]> {
  await connectMongoose();
  const memberships = await MembershipModel.find({ userId }).lean<MembershipRecord[]>().exec();
  const organizationIds = memberships.map((membership) => membership.organizationId);
  const organizations = await OrganizationModel.find({ _id: { $in: organizationIds } })
    .lean<OrganizationRecord[]>()
    .exec();

  return organizations.map((organization) => {
    const membership = memberships.find((item) => item.organizationId.toString() === organization._id.toString());

    return {
      _id: organization._id.toString(),
      name: organization.name,
      slug: organization.slug,
      role: membership?.role ?? "member",
    };
  });
}

export async function getUserMembership(organizationId: string, userId: string) {
  if (!isValidObjectId(organizationId) || !isValidObjectId(userId)) {
    return null;
  }

  await connectMongoose();
  const membership = await MembershipModel.findOne({ organizationId, userId }).lean<MembershipRecord>().exec();

  if (!membership) {
    return null;
  }

  return {
    ...membership,
    warehouseName: membership.warehouseName ?? "Main warehouse",
    warehouseStock: membership.warehouseStock ?? [],
  };
}

export async function isOrganizationAdmin(organizationId: string, userId: string) {
  const membership = await getUserMembership(organizationId, userId);
  return membership?.role === "admin";
}

export async function addMembership(input: {
  organizationId: string;
  userId: string;
  role: OrganizationRole;
}) {
  await connectMongoose();
  const membership = await MembershipModel.findOneAndUpdate(
    { organizationId: input.organizationId, userId: input.userId },
    {
      $set: {
        role: input.role,
        acceptedAt: new Date(),
      },
      $setOnInsert: {
        warehouseName: "Main warehouse",
        warehouseStock: [],
        score: input.role === "admin" ? 100 : 0,
        assignedCount: 0,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  )
    .lean<MembershipRecord>()
    .exec();

  return membership;
}

export async function removeMembership(organizationId: string, userId: string) {
  await connectMongoose();
  await MembershipModel.deleteOne({ organizationId, userId }).exec();
}

export async function incrementMemberScore(
  organizationId: string,
  userId: string,
  delta: number,
  assigned = false,
) {
  await connectMongoose();
  await MembershipModel.updateOne(
    { organizationId, userId },
    {
      $inc: { score: delta, assignedCount: assigned ? 1 : 0 },
      $set: { lastAssignedAt: assigned ? new Date() : undefined, updatedAt: new Date() },
    },
  ).exec();
}

export async function listRankedOrganizationMembers(organizationId: string) {
  await connectMongoose();
  return MembershipModel.find({ organizationId }).sort({ score: 1, assignedCount: 1, lastAssignedAt: 1 }).lean<MembershipRecord[]>().exec();
}

export async function listOrganizationMembers(organizationId: string) {
  await connectMongoose();
  const members = await MembershipModel.find({ organizationId }).lean<MembershipRecord[]>().exec();

  return members.map((member) => ({
    ...member,
    warehouseName: member.warehouseName ?? "Main warehouse",
    warehouseStock: member.warehouseStock ?? [],
  }));
}

export async function updateMemberWarehouse(
  organizationId: string,
  userId: string,
  input: {
    warehouseName: string;
    warehouseStock: WarehouseStockItem[];
  },
) {
  await connectMongoose();

  const updatedMembership = await MembershipModel.findOneAndUpdate(
    { organizationId, userId },
    {
      $set: {
        warehouseName: normalizeWarehouseName(input.warehouseName),
        warehouseStock: normalizeWarehouseStock(input.warehouseStock),
        updatedAt: new Date(),
      },
    },
    { new: true },
  )
    .lean<MembershipRecord>()
    .exec();

  return updatedMembership;
}

export async function createInvite(input: {
  organizationId: string;
  email: string;
  invitedBy: string;
}) {
  await connectMongoose();
  const token = `${slugify(input.email)}-${randomSuffix()}-${Date.now().toString(36)}`;
  const invite = await InviteModel.create({
    organizationId: input.organizationId,
    email: input.email.trim().toLowerCase(),
    token,
    invitedBy: input.invitedBy,
    status: "pending",
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
  });

  await deleteRedisValue(getInviteCacheKey(token));

  return invite.toObject() as InviteRecord;
}

export async function getInviteByToken(token: string) {
  const cacheKey = getInviteCacheKey(token);
  const cachedInvite = await readRedisValue<InviteRecord>(cacheKey);

  if (cachedInvite) {
    return cachedInvite;
  }

  await connectMongoose();
  const invite = await InviteModel.findOne({ token }).lean<InviteRecord>().exec();

  if (invite) {
    await writeRedisValue(cacheKey, invite, 60);
  }

  return invite;
}

export async function acceptInvite(token: string, userId: string, email: string) {
  await connectMongoose();
  const invite = await InviteModel.findOne({ token }).exec();

  if (!invite) {
    return null;
  }

  if (invite.status !== "pending" || invite.expiresAt.getTime() < Date.now()) {
    invite.status = "expired";
    await invite.save();
    return null;
  }

  if (invite.email !== email.trim().toLowerCase()) {
    return null;
  }

  invite.status = "accepted";
  invite.acceptedAt = new Date();
  await invite.save();
  await deleteRedisValue(getInviteCacheKey(token));
  await addMembership({ organizationId: invite.organizationId.toString(), userId, role: "member" });

  return invite.toObject() as InviteRecord;
}

export async function createContactForm(input: {
  organizationId: string;
  name: string;
  title: string;
  description: string;
  fields: FormField[];
  createdBy: string;
}) {
  await connectMongoose();
  const form = await ContactFormModel.create({
    organizationId: input.organizationId,
    name: normalizeText(input.name),
    slug: buildUniqueSlug(input.name),
    title: normalizeText(input.title),
    description: normalizeText(input.description),
    fields: input.fields,
    createdBy: input.createdBy,
    isActive: true,
  });

  await deleteRedisValue(getFormCacheKey(form.slug));

  return form.toObject() as ContactFormRecord;
}

export async function updateContactForm(
  formId: string,
  input: {
    name: string;
    title: string;
    description: string;
    fields: FormField[];
    isActive: boolean;
  },
) {
  await connectMongoose();
  const existing = await ContactFormModel.findById(formId).lean<ContactFormRecord>().exec();
  const updated = await ContactFormModel.findByIdAndUpdate(
    formId,
    {
      $set: {
        name: normalizeText(input.name),
        title: normalizeText(input.title),
        description: normalizeText(input.description),
        fields: input.fields,
        isActive: input.isActive,
      },
    },
    { new: true },
  )
    .lean<ContactFormRecord>()
    .exec();

  if (existing) {
    await deleteRedisValue(getFormCacheKey(existing.slug));
  }

  if (updated) {
    await deleteRedisValue(getFormCacheKey(updated.slug));
  }

  return updated;
}

export async function deleteContactForm(formId: string) {
  await connectMongoose();
  const existing = await ContactFormModel.findById(formId).lean<ContactFormRecord>().exec();
  await Promise.all([
    ContactFormModel.findByIdAndDelete(formId).exec(),
    SubmissionModel.deleteMany({ formId }).exec(),
  ]);

  if (existing) {
    await deleteRedisValue(getFormCacheKey(existing.slug));
  }
}

export async function listOrganizationForms(organizationId: string) {
  await connectMongoose();
  return ContactFormModel.find({ organizationId }).lean<ContactFormRecord[]>().exec();
}

export async function getFormBySlug(slug: string) {
  const cacheKey = getFormCacheKey(slug);
  const cachedForm = await readRedisValue<ContactFormRecord>(cacheKey);

  if (cachedForm) {
    return cachedForm;
  }

  await connectMongoose();
  const form = await ContactFormModel.findOne({ slug, isActive: true }).lean<ContactFormRecord>().exec();

  if (form) {
    await writeRedisValue(cacheKey, form, 60);
  }

  return form;
}

export async function getFormById(formId: string) {
  await connectMongoose();
  return ContactFormModel.findById(formId).lean<ContactFormRecord>().exec();
}

export async function submitContactForm(input: {
  organizationId: string;
  formId: string;
  formSlug: string;
  email: string;
  answers: Record<string, string>;
}) {
  await connectMongoose();
  const submission = await SubmissionModel.create({
    organizationId: input.organizationId,
    formId: input.formId,
    formSlug: input.formSlug,
    email: input.email.trim().toLowerCase(),
    answers: input.answers,
    submittedAt: new Date(),
  });

  return submission.toObject() as SubmissionRecord;
}

export async function listOrganizationSubmissions(organizationId: string) {
  await connectMongoose();
  return SubmissionModel.find({ organizationId }).sort({ submittedAt: -1 }).lean<SubmissionRecord[]>().exec();
}

export async function listFormSubmissions(formId: string) {
  await connectMongoose();
  return SubmissionModel.find({ formId }).sort({ submittedAt: -1 }).lean<SubmissionRecord[]>().exec();
}

function getInviteCacheKey(token: string) {
  return `invite:${token}`;
}

function getFormCacheKey(slug: string) {
  return `form:${slug}`;
}