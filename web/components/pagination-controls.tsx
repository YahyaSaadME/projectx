import Link from "next/link";

type PaginationControlsProps = {
  basePath: string;
  page: number;
  totalPages: number;
  pageParam?: string;
  query?: Record<string, string | undefined>;
};

function buildPageHref(
  basePath: string,
  page: number,
  pageParam: string,
  query: Record<string, string | undefined>,
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (!value || key === pageParam) {
      continue;
    }

    params.set(key, value);
  }

  if (page > 1) {
    params.set(pageParam, String(page));
  }

  const queryString = params.toString();
  return queryString.length > 0 ? `${basePath}?${queryString}` : basePath;
}

export default function PaginationControls({
  basePath,
  page,
  totalPages,
  pageParam = "page",
  query = {},
}: PaginationControlsProps) {
  if (totalPages <= 1) {
    return null;
  }

  const previousPage = Math.max(1, page - 1);
  const nextPage = Math.min(totalPages, page + 1);

  return (
    <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300">
      {page > 1 ? (
        <Link className="rounded-xl border border-white/10 px-3 py-2 transition hover:bg-white/10" href={buildPageHref(basePath, previousPage, pageParam, query)}>
          Previous
        </Link>
      ) : (
        <span className="rounded-xl border border-white/10 px-3 py-2 text-zinc-600">Previous</span>
      )}

      <span>
        Page {page} of {totalPages}
      </span>

      {page < totalPages ? (
        <Link className="rounded-xl border border-white/10 px-3 py-2 transition hover:bg-white/10" href={buildPageHref(basePath, nextPage, pageParam, query)}>
          Next
        </Link>
      ) : (
        <span className="rounded-xl border border-white/10 px-3 py-2 text-zinc-600">Next</span>
      )}
    </div>
  );
}
