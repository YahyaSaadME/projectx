import Link from "next/link";

type OrganizationTabsProps = {
  organizationId: string;
  isAdmin: boolean;
  currentPath: string;
};

const tabClass = (active: boolean) =>
  `rounded-full px-4 py-2 text-sm transition ${active ? "bg-white text-black" : "border border-white/10 text-zinc-300 hover:bg-white/5 hover:text-white"}`;

export default function OrganizationTabs({ organizationId, isAdmin, currentPath }: OrganizationTabsProps) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
      <Link className={tabClass(currentPath.endsWith(`/dashboard/organizations/${organizationId}`))} href={`/dashboard/organizations/${organizationId}`}>
        Overview
      </Link>
      <Link className={tabClass(currentPath.endsWith(`/members`))} href={`/dashboard/organizations/${organizationId}/members`}>
        Members
      </Link>
      <Link className={tabClass(currentPath.endsWith(`/forms`))} href={`/dashboard/organizations/${organizationId}/forms`}>
        Forms
      </Link>
      <Link className={tabClass(currentPath.endsWith(`/submissions`))} href={`/dashboard/organizations/${organizationId}/submissions`}>
        Submissions
      </Link>
      <Link className={tabClass(currentPath.endsWith(`/automation`))} href={`/dashboard/organizations/${organizationId}/automation`}>
        Automation
      </Link>
      {isAdmin ? (
        <Link className={tabClass(currentPath.endsWith(`/settings`))} href={`/dashboard/organizations/${organizationId}/settings`}>
          Settings
        </Link>
      ) : null}
    </div>
  );
}