import Link from "next/link";
import PaginationControls from "@/components/pagination-controls";
import { getOrganizationPageContext } from "@/lib/organization-page";
import { listOrganizationForms, listOrganizationSubmissions } from "@/lib/organizations";
import { flattenSearchParams, getSearchParamValue, paginateArray, parsePositiveInt } from "@/lib/pagination";

type PageProps = {
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function parseDateBoundary(rawValue: string, isEndBoundary: boolean) {
  if (!rawValue) {
    return null;
  }

  const normalized = isEndBoundary
    ? `${rawValue}T23:59:59.999`
    : `${rawValue}T00:00:00.000`;
  const parsedTime = Date.parse(normalized);

  if (Number.isNaN(parsedTime)) {
    return null;
  }

  return new Date(parsedTime);
}

export default async function OrganizationSubmissionsPage({ params, searchParams }: PageProps) {
  const { organizationId } = await params;
  const rawSearchParams = await searchParams;
  const context = await getOrganizationPageContext(organizationId);

  if (!context) {
    return null;
  }

  const query = getSearchParamValue(rawSearchParams, "q").trim();
  const normalizedQuery = query.toLowerCase();
  const selectedFormSlug = getSearchParamValue(rawSearchParams, "form").trim().toLowerCase();
  const fromDate = getSearchParamValue(rawSearchParams, "from").trim();
  const toDate = getSearchParamValue(rawSearchParams, "to").trim();
  const fromDateBoundary = parseDateBoundary(fromDate, false);
  const toDateBoundary = parseDateBoundary(toDate, true);
  const page = parsePositiveInt(getSearchParamValue(rawSearchParams, "page"), 1, 500);
  const [submissions, forms] = await Promise.all([
    listOrganizationSubmissions(organizationId),
    listOrganizationForms(organizationId),
  ]);
  const formTitleBySlug = new Map(forms.map((form) => [form.slug, form.title]));
  const formOptions = forms
    .map((form) => ({ slug: form.slug, title: form.title }))
    .sort((left, right) => left.title.localeCompare(right.title));

  const filteredSubmissions = submissions.filter((submission) => {
    if (selectedFormSlug && submission.formSlug !== selectedFormSlug) {
      return false;
    }

    const submittedAt = new Date(submission.submittedAt);

    if (fromDateBoundary && submittedAt < fromDateBoundary) {
      return false;
    }

    if (toDateBoundary && submittedAt > toDateBoundary) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const formTitle = formTitleBySlug.get(submission.formSlug) ?? "";
    const content = `${submission.email} ${submission.formSlug} ${formTitle} ${JSON.stringify(submission.answers)}`.toLowerCase();
    return content.includes(normalizedQuery);
  });

  const paginatedSubmissions = paginateArray(filteredSubmissions, page, 8);
  const basePath = `/dashboard/organizations/${organizationId}/submissions`;
  const queryParams = flattenSearchParams(rawSearchParams);
  const hasFilters = Boolean(query || selectedFormSlug || fromDate || toDate);

  return (
    <main className="space-y-8 p-6 md:p-8">
      <section className="rounded-3xl border border-white/10 bg-black/60 p-6 shadow-xl shadow-black/30">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Form responses</h2>
          <form action={basePath} className="grid gap-2 md:grid-cols-[minmax(220px,1fr)_180px_160px_160px_auto_auto] md:items-center" method="get">
            <input
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500"
              defaultValue={query}
              name="q"
              placeholder="Search email, form, answers"
              type="search"
            />
            <select
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
              defaultValue={selectedFormSlug}
              name="form"
            >
              <option value="">All forms</option>
              {formOptions.map((formOption) => (
                <option key={formOption.slug} value={formOption.slug}>
                  {formOption.title}
                </option>
              ))}
            </select>
            <input
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
              defaultValue={fromDate}
              name="from"
              title="From date"
              type="date"
            />
            <input
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
              defaultValue={toDate}
              name="to"
              title="To date"
              type="date"
            />
            <button className="rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-200 transition hover:bg-white/10" type="submit">
              Apply
            </button>
            {hasFilters ? (
              <Link className="rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-200 transition hover:bg-white/10" href={basePath}>
                Clear
              </Link>
            ) : null}
          </form>
          <p className="text-sm text-zinc-400">
            Showing {paginatedSubmissions.items.length} of {filteredSubmissions.length} matching submission{filteredSubmissions.length === 1 ? "" : "s"} (total {submissions.length}).
          </p>
        </div>
      </section>

      <section className="space-y-4">
        {paginatedSubmissions.items.map((submission) => (
          <article key={submission._id.toString()} className="rounded-3xl border border-white/10 bg-black/60 p-6 shadow-xl shadow-black/30">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-white">{submission.email}</p>
                <p className="text-sm text-zinc-400">{formTitleBySlug.get(submission.formSlug) ?? submission.formSlug}</p>
                <p className="text-xs text-zinc-500">/{submission.formSlug}</p>
              </div>
              <p className="text-sm text-zinc-400">{new Date(submission.submittedAt).toLocaleString()}</p>
            </div>
            <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">{JSON.stringify(submission.answers, null, 2)}</pre>
          </article>
        ))}
        {paginatedSubmissions.items.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-black/60 p-6 text-sm text-zinc-400">No submissions found.</div>
        ) : null}

        <PaginationControls basePath={basePath} page={paginatedSubmissions.page} query={queryParams} totalPages={paginatedSubmissions.totalPages} />
      </section>
    </main>
  );
}