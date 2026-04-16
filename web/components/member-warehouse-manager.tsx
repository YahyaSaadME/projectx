"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { WarehouseStockItem } from "@/lib/organizations";

type MemberWarehouse = {
  userId: string;
  role: string;
  name: string;
  email: string;
  warehouseName: string;
  warehouseStock: WarehouseStockItem[];
};

type MemberWarehouseManagerProps = {
  organizationId: string;
  members: MemberWarehouse[];
};

type MemberStatus = {
  isSaving: boolean;
  error: string;
  message: string;
};

function emptyStatus(): MemberStatus {
  return { isSaving: false, error: "", message: "" };
}

export default function MemberWarehouseManager({ organizationId, members }: MemberWarehouseManagerProps) {
  const router = useRouter();
  const [memberState, setMemberState] = useState<MemberWarehouse[]>(members);
  const [statusByMemberId, setStatusByMemberId] = useState<Record<string, MemberStatus>>({});

  const totalWarehouseUnits = useMemo(
    () =>
      memberState.reduce((sum, member) => {
        return sum + member.warehouseStock.reduce((memberSum, stockItem) => memberSum + stockItem.quantity, 0);
      }, 0),
    [memberState],
  );

  function getStatus(userId: string) {
    return statusByMemberId[userId] ?? emptyStatus();
  }

  function setStatus(userId: string, updates: Partial<MemberStatus>) {
    setStatusByMemberId((current) => ({
      ...current,
      [userId]: {
        ...(current[userId] ?? emptyStatus()),
        ...updates,
      },
    }));
  }

  function updateWarehouseName(userId: string, warehouseName: string) {
    setMemberState((current) =>
      current.map((member) => (member.userId === userId ? { ...member, warehouseName } : member)),
    );
  }

  function addStockItem(userId: string) {
    setMemberState((current) =>
      current.map((member) =>
        member.userId === userId
          ? {
              ...member,
              warehouseStock: [...member.warehouseStock, { product: "", quantity: 0 }],
            }
          : member,
      ),
    );
  }

  function updateStockItem(userId: string, stockIndex: number, updates: Partial<WarehouseStockItem>) {
    setMemberState((current) =>
      current.map((member) => {
        if (member.userId !== userId) {
          return member;
        }

        return {
          ...member,
          warehouseStock: member.warehouseStock.map((item, index) =>
            index === stockIndex ? { ...item, ...updates } : item,
          ),
        };
      }),
    );
  }

  function removeStockItem(userId: string, stockIndex: number) {
    setMemberState((current) =>
      current.map((member) => {
        if (member.userId !== userId) {
          return member;
        }

        return {
          ...member,
          warehouseStock: member.warehouseStock.filter((_, index) => index !== stockIndex),
        };
      }),
    );
  }

  async function saveMemberWarehouse(userId: string) {
    const member = memberState.find((candidate) => candidate.userId === userId);

    if (!member) {
      return;
    }

    setStatus(userId, { isSaving: true, error: "", message: "" });

    try {
      const payload = {
        userId: member.userId,
        warehouseName: member.warehouseName,
        warehouseStock: member.warehouseStock,
      };

      const response = await fetch(`/api/organizations/${organizationId}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setStatus(userId, {
          isSaving: false,
          error: data.error ?? "Could not save warehouse.",
          message: "",
        });
        return;
      }

      setStatus(userId, {
        isSaving: false,
        error: "",
        message: "Warehouse updated.",
      });
      router.refresh();
    } catch {
      setStatus(userId, {
        isSaving: false,
        error: "Warehouse update failed.",
        message: "",
      });
    }
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-black/60 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">Member warehouses</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Admin can add and manage products/quantities for each member warehouse.
          </p>
        </div>
        <p className="text-sm text-zinc-400">Total stock units: <span className="font-semibold text-white">{totalWarehouseUnits}</span></p>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {memberState.map((member) => {
          const status = getStatus(member.userId);

          return (
            <article key={member.userId} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">{member.name}</p>
              <p className="mt-1 text-xs text-zinc-400">{member.email}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">{member.role}</p>

              <label className="mt-3 block text-xs font-medium text-zinc-400" htmlFor={`warehouse-${member.userId}`}>
                Warehouse name
              </label>
              <input
                id={`warehouse-${member.userId}`}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                value={member.warehouseName}
                onChange={(event) => updateWarehouseName(member.userId, event.target.value)}
                placeholder="Main warehouse"
              />

              <div className="mt-3 space-y-2">
                {member.warehouseStock.map((stockItem, index) => (
                  <div key={`${member.userId}-stock-${index}`} className="grid gap-2 rounded-xl border border-white/10 bg-black/40 p-3">
                    <input
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
                      value={stockItem.product}
                      onChange={(event) => updateStockItem(member.userId, index, { product: event.target.value })}
                      placeholder="Product name"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
                        type="number"
                        min={0}
                        step={1}
                        value={stockItem.quantity}
                        onChange={(event) =>
                          updateStockItem(member.userId, index, {
                            quantity: Math.max(0, Number(event.target.value) || 0),
                          })
                        }
                        placeholder="Quantity"
                      />
                      <button
                        className="rounded-lg border border-red-500/30 px-3 py-2 text-xs text-red-200 transition hover:bg-red-500/10"
                        type="button"
                        onClick={() => removeStockItem(member.userId, index)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                {member.warehouseStock.length === 0 ? (
                  <p className="text-xs text-zinc-500">No products yet.</p>
                ) : null}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  className="rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-200 transition hover:bg-white/10"
                  type="button"
                  onClick={() => addStockItem(member.userId)}
                >
                  Add product
                </button>
                <button
                  className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
                  type="button"
                  disabled={status.isSaving}
                  onClick={() => saveMemberWarehouse(member.userId)}
                >
                  {status.isSaving ? "Saving..." : "Save warehouse"}
                </button>
              </div>

              {status.error ? <p className="mt-2 text-xs text-red-300">{status.error}</p> : null}
              {status.message ? <p className="mt-2 text-xs text-emerald-300">{status.message}</p> : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
