import Link from "next/link";
import FormCardActions from "@/components/form-card-actions";
import PaginationControls from "@/components/pagination-controls";
import { getOrganizationPageContext } from "@/lib/organization-page";
import { listOrganizationForms } from "@/lib/organizations";
import { flattenSearchParams, getSearchParamValue, paginateArray, parsePositiveInt } from "@/lib/pagination";

type PageProps = {
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OrganizationFormsPage({ params, searchParams }: PageProps) {
  const { organizationId } = await params;
  const rawSearchParams = await searchParams;
  const context = await getOrganizationPageContext(organizationId);

  if (!context) {
    return null;
  }

  const query = getSearchParamValue(rawSearchParams, "q").trim();
  const normalizedQuery = query.toLowerCase();
  const page = parsePositiveInt(getSearchParamValue(rawSearchParams, "page"), 1, 500);
  const forms = await listOrganizationForms(organizationId);

  const filteredForms = normalizedQuery
    ? forms.filter((form) => {
        const searchText = `${form.name} ${form.title} ${form.slug}`.toLowerCase();
        return searchText.includes(normalizedQuery);
      })
    : forms;
  const paginatedForms = paginateArray(filteredForms, page, 9);
  const basePath = `/dashboard/organizations/${organizationId}/forms`;
  const queryParams = flattenSearchParams(rawSearchParams);

  return (
    <main className="space-y-8 p-6 md:p-8">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-zinc-300">
        Dynamic forms are listed here. Share any form slug publicly and review responses from the submissions page.

        {context.isAdmin ? (
          <div className="mt-4">
            <Link className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200" href={`/dashboard/organizations/${organizationId}/forms/new`}>
              Create contact form
            </Link>
          </div>
        ) : (
          <p className="mt-4 text-zinc-400">Only the organizer can create and edit forms.</p>
        )}
      </section>

      <section className="rounded-3xl border border-white/10 bg-black/60 p-6 shadow-xl shadow-black/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-white">Created forms</h2>
          <form action={basePath} className="flex flex-wrap items-center gap-2" method="get">
            <input
              className="w-52 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500"
              defaultValue={query}
              name="q"
              placeholder="Search forms"
              type="search"
            />
            <button className="rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-200 transition hover:bg-white/10" type="submit">
              Search
            </button>
            {query ? (
              <Link className="rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-200 transition hover:bg-white/10" href={basePath}>
                Clear
              </Link>
            ) : null}
          </form>
        </div>
        <p className="mt-3 text-sm text-zinc-400">
          Showing {paginatedForms.items.length} of {filteredForms.length} form{filteredForms.length === 1 ? "" : "s"}.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {paginatedForms.items.map((form) => (
            <article key={form._id.toString()} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <Link href={`${basePath}/${form._id.toString()}`} className="group">
                <p className="font-medium text-white group-hover:text-zinc-200">{form.title}</p>
              </Link>
              <p className="mt-1 text-sm text-zinc-400">/{form.slug}</p>
              <p className="mt-3 text-xs text-zinc-500">{form.isActive ? "Active" : "Disabled"}</p>
              {context.isAdmin ? <FormCardActions formId={form._id.toString()} initialActive={form.isActive} /> : null}
            </article>
          ))}

          {paginatedForms.items.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-400">
              {forms.length === 0
                ? "No forms have been created yet."
                : "No forms matched your search."}
            </div>
          ) : null}
        </div>

        <PaginationControls basePath={basePath} page={paginatedForms.page} query={queryParams} totalPages={paginatedForms.totalPages} />
      </section>
    </main>
  );
}