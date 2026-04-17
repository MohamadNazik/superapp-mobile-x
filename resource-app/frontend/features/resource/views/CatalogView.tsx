import React, { useState, useMemo } from "react";
import { useResource } from "../context";
import { useBookingContext } from "../../booking/context";
import { BookingStatus } from "../../booking/types";
import { Resource } from "../types";
import { Search, Lock } from "lucide-react";
import { cn } from "../../../utils/cn";
import { Badge, Input } from "../../../components/UI";
import { DynamicIcon } from "../../../components/Icons";

export const CatalogView = ({
  onSelect,
}: {
  onSelect: (r: Resource) => void;
}) => {
  const { resources } = useResource();
  const { bookings } = useBookingContext();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  // Dynamic Categories based on actual data
  const categories = useMemo(() => {
    const types = new Set(resources.map((r) => r.type));
    return ["All", ...Array.from(types)];
  }, [resources]);

  // Pre-calculate currently booked resource IDs for O(1) availability lookups
  const bookedResourceIds = useMemo(() => {
    const now = Date.now();
    const booked = new Set<string>();
    
    for (const b of bookings) {
      if (
        b.status === BookingStatus.CONFIRMED &&
        now >= new Date(b.start).getTime() &&
        now < new Date(b.end).getTime()
      ) {
        booked.add(b.resourceId);
      }
    }
    return booked;
  }, [bookings]);

  const isAvailable = (resId: string) => !bookedResourceIds.has(resId);

  const filtered = resources.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = activeFilter === "All" || r.type === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-4">
      {/* Clean Search Bar */}
      <div className="sticky top-0 bg-slate-50 pt-1 pb-2 z-20 space-y-3">
        <div className="relative shadow-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Search resources..."
            className="pl-9 bg-white border-slate-200 h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Dynamic Filter Tags */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border",
                activeFilter === cat
                  ? "bg-slate-800 text-white border-slate-800 shadow-md"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-3 pb-2">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">
            No resources found.
          </div>
        ) : (
          filtered.map((res) => {
            const available = isAvailable(res.id);
            const colorMap: Record<string, string> = {
              blue: "bg-blue-50 text-blue-600",
              violet: "bg-violet-50 text-violet-600",
              emerald: "bg-emerald-50 text-emerald-600",
            };
            const colorClass =
              colorMap[res.color || ""] || "bg-slate-100 text-slate-600";

            return (
              <div
                key={res.id}
                role="button"
                tabIndex={res.canBook !== false ? 0 : -1}
                onClick={() => res.canBook !== false && onSelect(res)}
                onKeyDown={(e) => {
                  if (res.canBook !== false && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onSelect(res);
                  }
                }}
                className={cn(
                  "bg-white p-4 rounded-2xl border border-slate-100 shadow-sm transition-all flex gap-4 items-start touch-manipulation",
                  res.canBook !== false
                    ? "active:scale-[0.98] cursor-pointer"
                    : "opacity-60 cursor-not-allowed grayscale-[0.5]",
                )}
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 mt-1",
                    colorClass,
                  )}
                >
                  <DynamicIcon name={res.icon} className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <h3 className="font-bold text-slate-900 truncate text-sm">
                        {res.name}
                      </h3>
                      <span className="text-[10px] font-bold text-primary-600 uppercase tracking-wide block mt-0.5">
                        {res.type}
                      </span>
                    </div>
                    <Badge
                      variant={available ? "success" : "neutral"}
                      className="shrink-0"
                    >
                      {available ? "Available" : "Busy"}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 truncate mb-2">
                    {res.description}
                  </p>


                  {res.canBook === false && (
                    <div className="mt-3 text-[11px] text-rose-600 bg-rose-50 px-2.5 py-2 rounded-lg border border-rose-100 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 shrink-0" />
                      Permission required to book this resource
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
