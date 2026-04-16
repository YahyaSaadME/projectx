import OrganizationTabs from "@/components/organization-tabs";
import AgentRuleForm from "@/components/agent-rule-form";
import StockSyncForm from "@/components/stock-sync-form";
import ReminderForm from "@/components/reminder-form";
import { getOrganizationPageContext } from "@/lib/organization-page";
import { getAgentRule, listSalesLeads, listStockItems, listReminders } from "@/lib/automation";
import { listOrganizationMembers } from "@/lib/organizations";

type PageProps = { params: Promise<{ organizationId: string }> };

export default async function AutomationPage({ params }: PageProps) {
  const { organizationId } = await params;
  const context = await getOrganizationPageContext(organizationId);

  if (!context) return null;

  const [rule, leads, stockItems, reminders, members] = await Promise.all([
    getAgentRule(organizationId),
    listSalesLeads(organizationId),
    listStockItems(organizationId),
    listReminders(organizationId),
    listOrganizationMembers(organizationId),
  ]);

  return (
    <main className="space-y-8 p-6 md:p-8">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/30 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Automation</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">Agent rules, stock, and reminders</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">
          Leads are routed by score queue, stock requests are checked against the sheet mirror, and reminders are stored for members.
        </p>
      </section>

      <OrganizationTabs organizationId={organizationId} isAdmin={context.isAdmin} currentPath={`/dashboard/organizations/${organizationId}/automation`} />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-white/10 bg-black/60 p-6 shadow-xl shadow-black/30">
          <h2 className="text-xl font-semibold text-white">Agent rule</h2>
          <p className="mt-3 text-sm text-zinc-400">{rule?.prompt ?? "No rules configured yet."}</p>
          <pre className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">{JSON.stringify(rule?.rules ?? [], null, 2)}</pre>
        </section>
        <section className="rounded-3xl border border-white/10 bg-black/60 p-6 shadow-xl shadow-black/30">
          <h2 className="text-xl font-semibold text-white">Sales queue</h2>
          <div className="mt-4 space-y-3">
            {leads.slice(0, 5).map((lead) => (
              <div key={lead._id.toString()} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">
                <p className="font-medium text-white">{lead.requesterEmail}</p>
                <p className="mt-1 text-zinc-400">{lead.status}</p>
              </div>
            ))}
            {leads.length === 0 ? <p className="text-sm text-zinc-400">No leads yet.</p> : null}
          </div>
        </section>
        <section className="rounded-3xl border border-white/10 bg-black/60 p-6 shadow-xl shadow-black/30">
          <h2 className="text-xl font-semibold text-white">Stock mirror</h2>
          <div className="mt-4 space-y-3">
            {stockItems.map((item) => (
              <div key={item._id.toString()} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">
                <p className="font-medium text-white">{item.name}</p>
                <p className="mt-1 text-zinc-400">SKU: {item.sku}</p>
                <p className="mt-1 text-zinc-500">Quantity: {item.quantity}</p>
              </div>
            ))}
            {stockItems.length === 0 ? <p className="text-sm text-zinc-400">No stock rows synced yet.</p> : null}
          </div>
        </section>
        <section className="rounded-3xl border border-white/10 bg-black/60 p-6 shadow-xl shadow-black/30">
          <h2 className="text-xl font-semibold text-white">Reminders</h2>
          <div className="mt-4 space-y-3">
            {reminders.map((reminder) => (
              <div key={reminder._id.toString()} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">
                <p className="font-medium text-white">{reminder.title}</p>
                <p className="mt-1 text-zinc-400">{reminder.email}</p>
              </div>
            ))}
            {reminders.length === 0 ? <p className="text-sm text-zinc-400">No reminders yet.</p> : null}
          </div>
        </section>
      </div>

      {context.isAdmin ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <AgentRuleForm
            organizationId={organizationId}
            initialPrompt={rule?.prompt}
            initialRules={rule?.rules}
            initialQueueStrategy={rule?.queueStrategy}
            initialStockMode={rule?.stockMode}
            initialEnabled={rule?.enabled}
          />
          <StockSyncForm organizationId={organizationId} />
          <ReminderForm organizationId={organizationId} />
          <section className="rounded-3xl border border-white/10 bg-black/60 p-6 shadow-xl shadow-black/30">
            <h2 className="text-xl font-semibold text-white">Member queue</h2>
            <div className="mt-4 space-y-3">
              {members.map((member) => (
                <div key={member.userId.toString()} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">
                  <p className="font-medium text-white">{member.userId.toString()}</p>
                  <p className="mt-1 text-zinc-400">Role: {member.role}</p>
                  <p className="mt-1 text-zinc-500">Score: {member.score}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}