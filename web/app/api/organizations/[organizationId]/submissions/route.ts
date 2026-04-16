import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getUserMembership, listOrganizationForms, listOrganizationSubmissions } from "@/lib/organizations";
import { paginateArray, parsePositiveInt } from "@/lib/pagination";

type RouteParams = {
  params: Promise<{ organizationId: string }>;
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

export async function GET(request: Request, { params }: RouteParams) {
  const { organizationId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await getUserMembership(organizationId, user.id);

  if (!membership) {
    return NextResponse.json({ error: "Organization not found." }, { status: 404 });
  }

  const submissions = await listOrganizationSubmissions(organizationId);
  const forms = await listOrganizationForms(organizationId);
  const formTitleBySlug = new Map(forms.map((form) => [form.slug, form.title]));
  const requestUrl = new URL(request.url);
  const query = (requestUrl.searchParams.get("q") ?? "").trim().toLowerCase();
  const selectedFormSlug = (requestUrl.searchParams.get("form") ?? "").trim().toLowerCase();
  const fromDateBoundary = parseDateBoundary((requestUrl.searchParams.get("from") ?? "").trim(), false);
  const toDateBoundary = parseDateBoundary((requestUrl.searchParams.get("to") ?? "").trim(), true);
  const page = parsePositiveInt(requestUrl.searchParams.get("page") ?? "", 1, 500);
  const requestedPageSize = requestUrl.searchParams.get("pageSize");

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

    if (!query) {
      return true;
    }

    const formTitle = formTitleBySlug.get(submission.formSlug) ?? "";
    const content = `${submission.email} ${submission.formSlug} ${formTitle} ${JSON.stringify(submission.answers)}`.toLowerCase();
    return content.includes(query);
  });

  const pageSize = requestedPageSize ? parsePositiveInt(requestedPageSize, 20, 100) : Math.max(filteredSubmissions.length, 1);
  const paginatedSubmissions = paginateArray(filteredSubmissions, page, pageSize);

  return NextResponse.json({
    submissions: paginatedSubmissions.items,
    pagination: {
      page: paginatedSubmissions.page,
      pageSize: paginatedSubmissions.pageSize,
      total: paginatedSubmissions.total,
      totalPages: paginatedSubmissions.totalPages,
    },
  });
}