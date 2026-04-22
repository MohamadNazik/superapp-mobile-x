import React, { useState } from "react";
import { useResource } from "../../../resource/context";
import { cn } from "../../../../utils/cn";
import { PageLoader } from "../../../../components/UI";
import { ManageGroupsTab } from "./ManageGroupsTab";
import { ManageApprovalsTab } from "./ManageApprovalsTab";
import { ClipboardCheck, Users } from "lucide-react";

type ManageTab = "groups" | "approvals";
const MANAGE_TABS: readonly ManageTab[] = ["groups", "approvals"];

export const ManageView = () => {
  const { isLoading } = useResource();
  const [tab, setTab] = useState<ManageTab>("groups");

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-4 pt-[24px]">
      {/* Tab Control - Simplified version of Admin segment control */}
      <div className="fixed top-[68px] left-0 right-0 z-40 px-4 py-2 bg-slate-50/95 backdrop-blur-md max-w-md mx-auto">
        <div className="flex p-1 bg-slate-100 rounded-xl shadow-inner">
          {MANAGE_TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 py-1.5 px-3 text-xs font-bold rounded-lg transition-all capitalize flex items-center justify-center gap-2",
                tab === t
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500",
              )}
            >
              {t === "groups" ? (
                <Users size={14} />
              ) : (
                <ClipboardCheck size={14} />
              )}
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Contents */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {tab === "groups" && <ManageGroupsTab />}
        {tab === "approvals" && <ManageApprovalsTab />}
      </div>
    </div>
  );
};
