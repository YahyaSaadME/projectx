import OrganizationTabs from "@/components/organization-tabs";
import { getOrganizationPageContext } from "@/lib/organization-page";
import { listOrganizationMembers } from "@/lib/organizations";
import { findUsersByIds } from "@/lib/users";
import InviteMemberForm from "@/components/invite-member-form";
import RemoveMemberButton from "@/components/remove-member-button";
import MemberScoreAdjuster from "@/components/member-score-adjuster";

type PageProps = {
  params: Promise<{ organizationId: string }>;
};

export default async function OrganizationMembersPage({ params }: PageProps) {
  const { organizationId } = await params;
  const context = await getOrganizationPageContext(organizationId);

  if (!context) {
    return null;
  }

  const members = await listOrganizationMembers(organizationId);
  const users = await findUsersByIds(members.map((member) => member.userId.toString()));

  return (
    <main className="space-y-8 p-6 md:p-8">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/30 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Members</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">Invite and manage members</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">
          Invites are bound to one email. The invited user can only join with that same email after logging in.
        </p>
      </section>

      <OrganizationTabs organizationId={organizationId} isAdmin={context.isAdmin} currentPath={`/dashboard/organizations/${organizationId}/members`} />

      {context.isAdmin ? (
        <InviteMemberForm organizationId={organizationId} />
      ) : (
        <div className="rounded-3xl border border-white/10 bg-black/60 p-6 text-sm text-zinc-400">You can view members, but only the organizer can send invites.</div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {members.map((member) => (
          <article key={member.userId.toString()} className="rounded-3xl border border-white/10 bg-black/60 p-6">
            <p className="text-lg font-semibold text-white">{users.find((user) => user.id === member.userId.toString())?.name ?? member.userId.toString()}</p>
            <p className="mt-2 text-sm text-zinc-400">{users.find((user) => user.id === member.userId.toString())?.email ?? "No email"}</p>
            <p className="mt-2 text-sm text-zinc-500">{member.role}</p>
            <p className="mt-1 text-sm text-zinc-500">Score: {member.score}</p>
            <p className="text-sm text-zinc-500">Assigned: {member.assignedCount}</p>
            {context.isAdmin ? (
              <>
                <MemberScoreAdjuster organizationId={organizationId} userId={member.userId.toString()} />
                <RemoveMemberButton organizationId={organizationId} userId={member.userId.toString()} />
              </>
            ) : null}
          </article>
        ))}
      </section>
    </main>
  );
}
