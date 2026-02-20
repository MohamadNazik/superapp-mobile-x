import React, { useState } from "react";
import { Leave } from "../types";
import { Card, Badge, Button, Modal } from "../components/UI";
import { formatDate } from "../utils/formatters";
import { CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

interface ApprovalsProps {
  leaves: Leave[];
  onApprove: (id: string, comment?: string) => void;
  onReject: (id: string, comment?: string) => void;
}

export const Approvals: React.FC<ApprovalsProps> = ({
  leaves,
  onApprove,
  onReject,
}) => {
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const { user } = useAuth();
  const pendingLeaves = leaves.filter(
    (l) => l.status === "pending" && l.userEmail !== user?.email,
  );

  const handleRejectClick = (id: string) => {
    setSelectedLeaveId(id);
    setRejectReason("");
    setRejectModalOpen(true);
  };

  const confirmReject = () => {
    if (selectedLeaveId) {
      onReject(selectedLeaveId, rejectReason);
      setRejectModalOpen(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <p>Loading...</p>
      </div>
    );
  }

  if (pendingLeaves.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <CheckCircle className="w-12 h-12 mb-4 opacity-20" />
        <p>All caught up! No pending approvals.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 pb-24">
        {pendingLeaves.map((leave) => (
          <Card key={leave.id}>
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold uppercase">
                {leave.userEmail.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {leave.userEmail}
                </p>
                <p className="text-xs text-slate-500">
                  {formatDate(leave.createdAt)}
                </p>
              </div>
              <div className="ml-auto">
                <Badge status={leave.type} />
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 mb-4 border border-slate-100 space-y-1.5">
              <p className="text-sm font-medium text-slate-800">
                {leave.reason}
              </p>

              {/* One day — single date */}
              {leave.startDate === leave.endDate ? (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-600">Date:</span>
                  {formatDate(leave.startDate)}
                </div>
              ) : (
                /* Sequence days — from/to range */
                <>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-slate-600">From:</span>
                    {formatDate(leave.startDate)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-slate-600">To:</span>
                    {formatDate(leave.endDate)}
                  </div>
                </>
              )}

              {/* Half day or Full day — only for one day */}
              {leave.startDate === leave.endDate && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-600">
                    Duration:
                  </span>
                  {leave.isHalfDay ? "Half Day" : "Full Day"}
                </div>
              )}

              {/* Morning or Evening — only for half day */}
              {leave.startDate === leave.endDate &&
                leave.isHalfDay &&
                leave.halfDayPeriod && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-slate-600">
                      Period:
                    </span>
                    <span className="capitalize">{leave.halfDayPeriod}</span>
                  </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                className="w-full border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => handleRejectClick(leave.id)}
              >
                <XCircle size={16} className="mr-2" />
                Reject
              </Button>
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30"
                onClick={() => onApprove(leave.id)}
              >
                <CheckCircle size={16} className="mr-2" />
                Approve
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Request"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Are you sure you want to reject this leave request? You can
            optionally provide a reason below.
          </p>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">
              Reason (Optional)
            </label>
            <textarea
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 min-h-[100px] resize-none"
              placeholder="Why is this request being rejected?"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <div className="pt-2 flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setRejectModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="danger" className="flex-1" onClick={confirmReject}>
              Reject
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
