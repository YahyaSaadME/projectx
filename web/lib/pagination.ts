export type SearchParamsInput = Record<string, string | string[] | undefined>;

export type PaginatedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export function getSearchParamValue(searchParams: SearchParamsInput, key: string) {
  const rawValue = searchParams[key];

  if (Array.isArray(rawValue)) {
    return rawValue[0] ?? "";
  }

  return rawValue ?? "";
}

export function flattenSearchParams(searchParams: SearchParamsInput): Record<string, string> {
  return Object.entries(searchParams).reduce<Record<string, string>>((accumulator, [key, value]) => {
    if (Array.isArray(value)) {
      if (value[0]) {
        accumulator[key] = value[0];
      }
      return accumulator;
    }

    if (value) {
      accumulator[key] = value;
    }

    return accumulator;
  }, {});
}

export function parsePositiveInt(rawValue: string, fallback: number, maximum = 100) {
  const parsed = Number.parseInt(rawValue, 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(parsed, maximum);
}

export function paginateArray<T>(items: T[], requestedPage: number, pageSize: number): PaginatedResult<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(requestedPage, 1), totalPages);
  const start = (page - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    page,
    pageSize,
    total,
    totalPages,
  };
}
