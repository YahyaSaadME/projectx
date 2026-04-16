import Link from "next/link";
import PaginationControls from "@/components/pagination-controls";
import { getOrganizationPageContext } from "@/lib/organization-page";
import { listOrganizationMembers } from "@/lib/organizations";
import { flattenSearchParams, getSearchParamValue, paginateArray, parsePositiveInt } from "@/lib/pagination";
import { findUsersByIds } from "@/lib/users";

type PageProps = {
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type ProductRow = {
  id: string;
  userId: string;
  memberName: string;
  memberEmail: string;
  role: string;
  warehouseName: string;
  warehouseLocation: string;
  product: string;
  quantity: number;
};

function normalizeLocation(value: string) {
  return value.trim().toLowerCase();
}

export default async function WarehouseProductsPage({ params, searchParams }: PageProps) {
  const { organizationId } = await params;
  const rawSearchParams = await searchParams;
  const context = await getOrganizationPageContext(organizationId);

  if (!context) {
    return null;
  }

  const query = getSearchParamValue(rawSearchParams, "q").trim();
  const normalizedQuery = query.toLowerCase();
  const selectedMemberId = getSearchParamValue(rawSearchParams, "member").trim();
  const selectedLocation = normalizeLocation(getSearchParamValue(rawSearchParams, "location"));
  const minQuantityRaw = getSearchParamValue(rawSearchParams, "minQty").trim();
  const parsedMinQuantity = Number.parseInt(minQuantityRaw, 10);
  const minQuantity = Number.isFinite(parsedMinQuantity) && parsedMinQuantity > 0 ? parsedMinQuantity : 0;
  const page = parsePositiveInt(getSearchParamValue(rawSearchParams, "page"), 1, 500);

  const members = await listOrganizationMembers(organizationId);
  const users = await findUsersByIds(members.map((member) => member.userId.toString()));
  const usersById = new Map(users.map((user) => [user.id, user]));

  const locationOptionsMap = new Map<string, string>();

  const allProducts = members.flatMap((member) => {
    const memberUser = usersById.get(member.userId.toString());
    const warehouseLocation = member.warehouseLocation ?? "Common warehouse location";
    const locationKey = normalizeLocation(warehouseLocation);

    if (locationKey) {
      locationOptionsMap.set(locationKey, warehouseLocation);
    }

    return (member.warehouseStock ?? []).map((stockItem, index) => ({
      id: `${member._id.toString()}-${index}-${stockItem.product}`,
      userId: member.userId.toString(),
      memberName: memberUser?.name ?? member.userId.toString(),
      memberEmail: memberUser?.email ?? "Unknown email",
      role: member.role,
      warehouseName: member.warehouseName ?? "Main warehouse",
      warehouseLocation,
      product: stockItem.product,
      quantity: stockItem.quantity,
    } satisfies ProductRow));
  });

  allProducts.sort((left, right) => {
    if (left.quantity !== right.quantity) {
      return right.quantity - left.quantity;
    }

    return left.product.localeCompare(right.product);
  });

  const filteredProducts = allProducts.filter((productRow) => {
    if (selectedMemberId && productRow.userId !== selectedMemberId) {
      return false;
    }

    if (selectedLocation && normalizeLocation(productRow.warehouseLocation) !== selectedLocation) {
      return false;
    }

    if (minQuantity > 0 && productRow.quantity < minQuantity) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const content = `${productRow.product} ${productRow.memberName} ${productRow.memberEmail} ${productRow.warehouseName} ${productRow.warehouseLocation}`.toLowerCase();
    return content.includes(normalizedQuery);
  });

  const paginatedProducts = paginateArray(filteredProducts, page, 12);
  const basePath = `/dashboard/organizations/${organizationId}/warehouse/products`;
  const queryParams = flattenSearchParams(rawSearchParams);
  const hasFilters = Boolean(query || selectedMemberId || selectedLocation || minQuantityRaw);

  const memberOptions = members
    .map((member) => {
      const memberUser = usersById.get(member.userId.toString());
      return {
        userId: member.userId.toString(),
        label: memberUser?.name ?? member.userId.toString(),
      };
    })
    .sort((left, right) => left.label.localeCompare(right.label));

  const locationOptions = Array.from(locationOptionsMap.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((left, right) => left.label.localeCompare(right.label));

  return (
    <main className="space-y-8 p-6 md:p-8">
      <section className="rounded-3xl border border-white/10 bg-black/60 p-6 shadow-xl shadow-black/30">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Warehouse products</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">All products table</h1>
        <p className="mt-3 text-sm leading-7 text-zinc-400">
          View all products from member warehouses in a tabular format with search and filters.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/10" href={`/dashboard/organizations/${organizationId}/warehouse`}>
            Back to warehouse
          </Link>
          <Link className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/10" href={`/dashboard/organizations/${organizationId}`}>
            Back to overview
          </Link>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-black/60 p-6 shadow-xl shadow-black/30">
        <form action={basePath} className="grid gap-2 md:grid-cols-[minmax(220px,1fr)_200px_220px_120px_auto_auto] md:items-center" method="get">
          <input
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500"
            defaultValue={query}
            name="q"
            placeholder="Search product/member/location"
            type="search"
          />
          <select
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
            defaultValue={selectedMemberId}
            name="member"
          >
            <option value="">All members</option>
            {memberOptions.map((memberOption) => (
              <option key={memberOption.userId} value={memberOption.userId}>
                {memberOption.label}
              </option>
            ))}
          </select>
          <select
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
            defaultValue={selectedLocation}
            name="location"
          >
            <option value="">All locations</option>
            {locationOptions.map((locationOption) => (
              <option key={locationOption.value} value={locationOption.value}>
                {locationOption.label}
              </option>
            ))}
          </select>
          <input
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
            defaultValue={minQuantityRaw}
            min={0}
            name="minQty"
            placeholder="Min qty"
            step={1}
            type="number"
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

        <p className="mt-4 text-sm text-zinc-400">
          Showing {paginatedProducts.items.length} of {filteredProducts.length} matching product row{filteredProducts.length === 1 ? "" : "s"} (total {allProducts.length}).
        </p>

        <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
          <table className="min-w-full divide-y divide-white/10 text-left text-sm text-zinc-300">
            <thead className="bg-white/5 text-xs uppercase tracking-[0.15em] text-zinc-400">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Warehouse</th>
                <th className="px-4 py-3">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {paginatedProducts.items.map((productRow) => (
                <tr key={productRow.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 font-medium text-white">{productRow.product}</td>
                  <td className="px-4 py-3">{productRow.quantity}</td>
                  <td className="px-4 py-3">{productRow.memberName}</td>
                  <td className="px-4 py-3 text-zinc-400">{productRow.memberEmail}</td>
                  <td className="px-4 py-3">{productRow.warehouseName}</td>
                  <td className="px-4 py-3">{productRow.warehouseLocation}</td>
                </tr>
              ))}

              {paginatedProducts.items.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-zinc-400" colSpan={6}>
                    No products found for the selected filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <PaginationControls basePath={basePath} page={paginatedProducts.page} query={queryParams} totalPages={paginatedProducts.totalPages} />
      </section>
    </main>
  );
}
