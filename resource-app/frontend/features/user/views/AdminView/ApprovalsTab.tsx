import React, { useState } from 'react';
import { useBookingContext } from '../../../../features/booking/context';
import { useResource } from '../../../resource/context';
import { useUser } from '../../context';
import { Card, Button, Badge, EmptyState, Modal, Input, Label } from '../../../../components/UI';
import { BookingStatus } from '../../../../features/booking/types';
import { format } from 'date-fns';
import { CheckCircle } from 'lucide-react';

export const ApprovalsTab = () => {
  const { bookings, processBooking, rescheduleBooking } = useBookingContext();
  const { resources } = useResource();
  const { allUsers } = useUser();

  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [processingBookingId, setProcessingBookingId] = useState<string | null>(null);

  const [rescheduleBookingId, setRescheduleBookingId] = useState<string | null>(null);
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');

  const pendingBookings = bookings.filter(b => b.status === BookingStatus.PENDING);

  const handleReject = async () => {
    if (!selectedBookingId || processingBookingId) return;
    setProcessingBookingId(selectedBookingId);
    try {
      await processBooking(selectedBookingId, BookingStatus.REJECTED, rejectReason);
      setIsRejectModalOpen(false);
      setRejectReason('');
      setSelectedBookingId(null);
    } finally {
      setProcessingBookingId(null);
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleBookingId || !newStartTime || !newEndTime || processingBookingId) return;
    setProcessingBookingId(rescheduleBookingId);
    try {
      await rescheduleBooking(
        rescheduleBookingId, 
        new Date(newStartTime).toISOString(), 
        new Date(newEndTime).toISOString()
      );
      setRescheduleBookingId(null);
    } finally {
      setProcessingBookingId(null);
    }
  };

  const getUserEmail = (id: string) => {
    const u = allUsers.find(u => u.id === id);
    return u ? u.email : 'Unknown';
  };

  return (
    <>
      <div className="space-y-4 animate-in fade-in">
        {pendingBookings.length === 0 ? (
          <EmptyState icon={CheckCircle} message="No pending requests." />
        ) : (
          pendingBookings.map(booking => {
            const res = resources.find(r => r.id === booking.resourceId);
            return (
              <Card key={booking.id} className="border-l-4 border-l-amber-400 relative">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{res?.name}</h4>
                    <p className="text-xs text-slate-500">{getUserEmail(booking.userId)}</p>
                  </div>
                  <Badge variant="warning">Pending</Badge>
                </div>

                <div className="bg-slate-50 p-2 rounded-lg text-xs text-slate-600 mb-3">
                  <p><strong>Date:</strong> {format(new Date(booking.start), 'MMM do, yyyy')}</p>
                  <p><strong>Time:</strong> {format(new Date(booking.start), 'HH:mm')} - {format(new Date(booking.end), 'HH:mm')}</p>
                  {booking.details.title && <p><strong>Topic:</strong> {booking.details.title}</p>}
                  {booking.details.purpose && <p><strong>Purpose:</strong> {booking.details.purpose}</p>}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    disabled={processingBookingId === booking.id}
                    isLoading={processingBookingId === booking.id}
                    onClick={async () => {
                      setProcessingBookingId(booking.id);
                      try {
                        await processBooking(booking.id, BookingStatus.CONFIRMED);
                      } finally {
                        setProcessingBookingId(null);
                      }
                    }}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1"
                    disabled={processingBookingId === booking.id}
                    onClick={() => {
                      setNewStartTime('');
                      setNewEndTime('');
                      setRescheduleBookingId(booking.id);
                    }}
                  >
                    Propose Time
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex-1 text-red-600 hover:bg-red-50"
                    disabled={processingBookingId === booking.id}
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

      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Reject Request"
      >
        <div className="space-y-4">
          <div>
            <Label>Reason for Rejection</Label>
            <Input
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Maintenance required..."
            />
          </div>
          <Button 
            variant="danger" 
            className="w-full" 
            onClick={handleReject}
            disabled={!rejectReason.trim()}
          >
            Confirm Rejection
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={!!rescheduleBookingId}
        onClose={() => {
          setRescheduleBookingId(null);
          setNewStartTime('');
          setNewEndTime('');
        }}
        title="Propose New Time"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">Select a new time slot to propose to the user.</p>
          <div>
            <Label>New Start Time</Label>
            <Input type="datetime-local" value={newStartTime} onChange={(e) => setNewStartTime(e.target.value)} />
          </div>
          <div>
            <Label>New End Time</Label>
            <Input type="datetime-local" value={newEndTime} onChange={(e) => setNewEndTime(e.target.value)} />
          </div>
          <Button className="w-full" onClick={handleReschedule}>Propose New Time</Button>
        </div>
      </Modal>
    </>
  );
};
