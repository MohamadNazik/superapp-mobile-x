import React from "react";
import { useUser, userApi } from "../../../../features/user";
import { Card, Badge, PageLoader } from "../../../../components/UI";
import { Users, Shield, AlertCircle } from "lucide-react";

export const ManageGroupsTab = () => {
  const [groups, setGroups] = React.useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchMyGroups = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await userApi.getMyGroups();
        if (response.success && response.data) {
          setGroups(response.data);
        } else {
          setError(response.error || "Failed to fetch groups");
        }
      } catch (err) {
        setError("An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyGroups();
  }, []);

  if (isLoading) return <div className="py-20 text-center"><PageLoader /></div>;

  if (error) {
    return (
      <Card className="p-8 text-center bg-red-50 border-red-100 flex flex-col items-center gap-3">
        <AlertCircle className="text-red-500 w-8 h-8" />
        <p className="text-sm text-red-700 font-medium">{error}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="px-1">
        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
          <Users size={14} /> My Groups
        </h3>
        <p className="text-[10px] text-slate-500 font-medium mt-1">
          Groups you are currently a member of.
        </p>
      </div>

      <div className="grid gap-3">
        {groups.length === 0 ? (
          <Card className="p-8 text-center bg-white/50 border-dashed">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500">
              You are not assigned to any groups yet.
            </p>
          </Card>
        ) : (
          groups.map((group) => (
            <Card
              key={group.id}
              className="p-4 bg-white border-slate-100 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 border border-primary-100">
                  <span className="text-lg font-bold">
                    {group.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-primary-600 transition-colors tracking-tight">
                    {group.name}
                  </h4>
                  <Badge variant="primary" className="text-[9px] mt-1">
                    MEMBER
                  </Badge>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Card className="p-4 bg-amber-50 border-amber-100">
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <Shield size={16} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-amber-900 uppercase">
              Access Information
            </p>
            <p className="text-[10px] text-amber-700 leading-relaxed mt-0.5">
              Your group memberships determine which resources you can book and
              which team requests you can approve. Contact your administrator to
              join more groups.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
