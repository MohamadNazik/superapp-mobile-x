import React, { useState, useEffect, useMemo } from "react";
import { bookingApi } from "../../../../features/booking/api";
import { Booking, BookingStatus } from "../../../../features/booking/types";
import {
  Card,
  PageLoader,
  Button,
  Badge,
  Modal,
  Input,
  Label,
  EmptyState,
} from "../../../../components/UI";
import { ClipboardCheck, AlertCircle, CheckCircle } from "lucide-react";
import { useResource } from "../../../resource/context";
import { format } from "date-fns";

export const ManageApprovalsTab = () => {
  const { resources } = useResource();
  const [approvals, setApprovals] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action States
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    null,
  );
  const [rejectReason, setRejectReason] = useState("");
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  const [rescheduleBookingId, setRescheduleBookingId] = useState<string | null>(
    null,
  );
  const [newStartTime, setNewStartTime] = useState("");
  const [newEndTime, setNewEndTime] = useState("");

  const pendingApprovals = useMemo(
    () => approvals.filter((b) => b.status === BookingStatus.PENDING),
    [approvals],
  );

  const fetchApprovals = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await bookingApi.getApprovableBookings();
      if (response.success && response.data) {
        setApprovals(response.data);
      } else {
        setError(response.error || "Failed to fetch approvals");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      const res = await bookingApi.processBooking(id, BookingStatus.CONFIRMED);
      if (res.success) {
        await fetchApprovals();
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedBookingId || !rejectReason.trim()) return;
    setProcessingId(selectedBookingId);
    try {
      const res = await bookingApi.processBooking(
        selectedBookingId,
        BookingStatus.REJECTED,
        rejectReason,
      );
      if (res.success) {
        setIsRejectModalOpen(false);
        setRejectReason("");
        setSelectedBookingId(null);
        await fetchApprovals();
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleBookingId || !newStartTime || !newEndTime) return;

    if (new Date(newStartTime) >= new Date(newEndTime)) {
      setError("The proposed end time must be after the start time.");
      return;
    }

    setProcessingId(rescheduleBookingId);
    try {
      const res = await bookingApi.rescheduleBooking(
        rescheduleBookingId,
        new Date(newStartTime).toISOString(),
        new Date(newEndTime).toISOString(),
      );
      if (res.success) {
        setRescheduleBookingId(null);
        setNewStartTime("");
        setNewEndTime("");
        await fetchApprovals();
      }
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading && approvals.length === 0)
    return (
      <div className="py-20 text-center">
        <PageLoader />
      </div>
    );

  if (error) {
    return (
      <Card className="p-8 text-center bg-red-50 border-red-100 flex flex-col items-center gap-3">
        <AlertCircle className="text-red-500 w-8 h-8" />
        <p className="text-sm text-red-700 font-medium">{error}</p>
        <Button size="sm" variant="secondary" onClick={fetchApprovals}>
          Try Again
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in">
      <div className="px-1 flex justify-between items-end">
        <div>
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
            <ClipboardCheck size={14} /> Pending Requests
          </h3>
        </div>
        <span className="text-[10px] font-black text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-100 uppercase tracking-tighter">
          {pendingApprovals.length} Pending
        </span>
      </div>

      <div className="grid gap-4 pt-2">
        {pendingApprovals.length === 0 ? (
          <EmptyState
            icon={CheckCircle}
            message="You are all caught up! No pending requests."
          />
        ) : (
          pendingApprovals.map((booking) => {
              const res = resources.find((r) => r.id === booking.resourceId);
              // In the enriched mock response, we have userEmail directly
              const requesterEmail =
                (booking as Booking & { userEmail?: string }).userEmail ||
                "Unknown";

              return (
                <Card
                  key={booking.id}
                  className="border-l-4 border-l-amber-400 relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">
                        {res?.name || "Unknown Resource"}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {requesterEmail}
                      </p>
                    </div>
                    <Badge variant="warning">Awaiting Approval</Badge>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl text-[11px] text-slate-600 mb-4 border border-slate-100/50">
                    <div className="flex justify-between mb-1.5">
                      <span className="font-bold text-slate-400 uppercase tracking-tighter">
                        Schedule
                      </span>
                      <span className="font-medium text-slate-900">
                        {format(new Date(booking.start), "MMM do")} •{" "}
                        {format(new Date(booking.start), "HH:mm")} -{" "}
                        {format(new Date(booking.end), "HH:mm")}
                      </span>
                    </div>
                    {booking.details.title && (
                      <div className="flex justify-between">
                        <span className="font-bold text-slate-400 uppercase tracking-tighter">
                          Topic
                        </span>
                        <span className="font-medium text-slate-900 truncate max-w-[150px]">
                          {booking.details.title}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      disabled={!!processingId}
                      isLoading={processingId === booking.id}
                      onClick={() => handleApprove(booking.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex-1"
                      disabled={!!processingId}
                      onClick={() => {
                        setNewStartTime("");
                        setNewEndTime("");
                        setRescheduleBookingId(booking.id);
                      }}
                    >
                      Propose
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="px-3 text-red-500 hover:bg-red-50"
                      disabled={!!processingId}
                      onClick={() => {
                        setSelectedBookingId(booking.id);
                        setIsRejectModalOpen(true);
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                </Card>
              );
            })
        )}
      </div>

      {/* Reject Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => {
          setIsRejectModalOpen(false);
          setRejectReason("");
          setSelectedBookingId(null);
        }}
        title="Reject Booking Request"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Please provide a reason for rejecting this request. This will be
            visible to the requester.
          </p>
          <div>
            <Label required>Rejection Reason</Label>
            <Input
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Resource unavailable during this period..."
              autoFocus
            />
          </div>
          <div className="pt-2 flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setIsRejectModalOpen(false);
                setRejectReason("");
                setSelectedBookingId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              disabled={!rejectReason.trim() || !!processingId}
              isLoading={!!processingId}
              onClick={handleReject}
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        isOpen={!!rescheduleBookingId}
        onClose={() => setRescheduleBookingId(null)}
        title="Propose Alternative Time"
      >
        <div className="space-y-4 pt-1">
          <p className="text-xs text-slate-500 leading-relaxed">
            Suggest a new time slot to the requester. They will need to accept
            the proposal.
          </p>
          <div className="grid gap-4">
            <div>
              <Label required>New Start Time</Label>
              <Input
                type="datetime-local"
                value={newStartTime}
                onChange={(e) => setNewStartTime(e.target.value)}
              />
            </div>
            <div>
              <Label required>New End Time</Label>
              <Input
                type="datetime-local"
                value={newEndTime}
                onChange={(e) => setNewEndTime(e.target.value)}
              />
            </div>
          </div>
          <div className="pt-2 flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setRescheduleBookingId(null)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              disabled={!newStartTime || !newEndTime || !!processingId}
              isLoading={!!processingId}
              onClick={handleReschedule}
            >
              Send Proposal
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
