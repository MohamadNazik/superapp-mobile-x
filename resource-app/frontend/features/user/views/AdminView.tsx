
import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { useUser } from '../context';
import { Plus, Trash2, CheckCircle, Edit2, User, Shield } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Card, Button, Badge, PageLoader, EmptyState, Modal, Input, Label } from '../../../components/UI';
import { BookingStatus, UserRole, Resource } from '../../../types';
import { format } from 'date-fns';
import { CreateResourceView } from '../../../views/CreateResourceView';
import { DynamicIcon } from '../../../components/Icons';

export const AdminView = () => {
  const { resources, bookings, stats, isLoading, deleteResource, processBooking, rescheduleBooking, fetchStats } = useApp();
  const { allUsers, currentUser, updateUserRole } = useUser();
  const [tab, setTab] = useState<'approvals' | 'users' | 'manage' | 'analytics'>('approvals');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Fetch stats only when Analytics tab is visited
  useEffect(() => {
    let cancelled = false;

    if (tab === 'analytics') {
      fetchStats().then(() => {
        if (!cancelled) {
          // Stats loaded successfully
        }
      }).catch(err => {
        if (!cancelled) {
          console.error('Failed to fetch stats:', err);
        }
      });
    }

    return () => {
      cancelled = true; // Prevent state updates after unmount
    };
  }, [tab, fetchStats]);

  // --- Approval State ---
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [processingBookingId, setProcessingBookingId] = useState<string | null>(null);

  // --- Reschedule State ---
  const [rescheduleBookingId, setRescheduleBookingId] = useState<string | null>(null);
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');

  // --- Resource Creation/Editing State ---
  const [isCreatingResource, setIsCreatingResource] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | undefined>(undefined);

  if (isLoading) return <PageLoader />;

  // If creating or editing, show the full screen overlay
  if (isCreatingResource || editingResource) {
    return (
      <CreateResourceView
        onClose={() => {
          setIsCreatingResource(false);
          setEditingResource(undefined);
        }}
        initialData={editingResource}
      />
    );
  }

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
      await rescheduleBooking(rescheduleBookingId, newStartTime, newEndTime);
      setRescheduleBookingId(null);
    } finally {
      setProcessingBookingId(null);
    }
  };

  const getUserEmail = (id: string) => {
    const u = allUsers.find(u => u.id === id);
    return u ? u.email : 'Unknown';
  }

  return (
    <div className="space-y-4">
      {/* Tab Control */}
      <div className="flex p-1 bg-slate-100 rounded-xl overflow-x-auto no-scrollbar">
        {['approvals', 'users', 'manage', 'analytics'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t as 'approvals' | 'users' | 'manage' | 'analytics')}
            className={cn(
              "flex-1 py-1.5 px-3 text-xs font-bold rounded-lg transition-all whitespace-nowrap capitalize",
              tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
            )}
          >
            {t}
            {t === 'approvals' && pendingBookings.length > 0 && (
              <span className="ml-1.5 bg-amber-500 text-white px-1.5 py-0.5 rounded-full text-[9px]">{pendingBookings.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* --- APPROVALS TAB --- */}
      {tab === 'approvals' && (
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
      )}

      {/* --- USERS TAB --- */}
      {tab === 'users' && (
        <div className="space-y-3 animate-in fade-in">
          {allUsers.map(user => {
            const isSelf = user.id === currentUser?.id;
            return (
              <Card key={user.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    user.role === UserRole.ADMIN ? "bg-primary-100 text-primary-600" : "bg-slate-100 text-slate-500"
                  )}>
                    {user.role === UserRole.ADMIN ? <Shield size={20} /> : <User size={20} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{user.email}</h4>
                    <p className="text-xs text-slate-500">{user.department || 'No Dept'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={user.role === UserRole.ADMIN ? 'primary' : 'neutral'}>{user.role}</Badge>
                  {user.role === UserRole.USER ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updatingUserId === user.id}
                      isLoading={updatingUserId === user.id}
                      onClick={async () => {
                        setUpdatingUserId(user.id);
                        try {
                          await updateUserRole(user.id, UserRole.ADMIN);
                        } finally {
                          setUpdatingUserId(null);
                        }
                      }}
                    >
                      Make Admin
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className={cn("text-red-500 hover:bg-red-50", isSelf && "opacity-50 cursor-not-allowed")}
                      disabled={isSelf || updatingUserId === user.id}
                      isLoading={updatingUserId === user.id}
                      onClick={async () => {
                        setUpdatingUserId(user.id);
                        try {
                          await updateUserRole(user.id, UserRole.USER);
                        } finally {
                          setUpdatingUserId(null);
                        }
                      }}
                      title={isSelf ? "Cannot revoke your own access" : "Revoke Admin Access"}
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* --- MANAGE TAB --- */}
      {tab === 'manage' && (
        <div className="space-y-3 animate-in fade-in">
          {resources.map(res => (
            <Card key={res.id} className="flex flex-col gap-2 py-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                    <DynamicIcon name={res.icon} className="w-5 h-5 text-slate-700" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{res.name}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 uppercase">{res.type}</span>
                      <span className="text-[10px] text-slate-400">• Lead: {res.minLeadTimeHours}h</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingResource(res)}
                    className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => deleteResource(res.id)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Specs Preview */}
              <div className="flex flex-wrap gap-1 pl-11">
                {Object.entries(res.specs).slice(0, 3).map(([key, val]) => (
                  <span key={key} className="text-[9px] text-slate-500 bg-slate-50 px-1 py-0.5 rounded border border-slate-100">
                    <strong>{key}:</strong> {val}
                  </span>
                ))}
              </div>
            </Card>
          ))}

          {/* Add Resource Button */}
          <Button
            variant="outline"
            className="w-full border-dashed border-2 text-slate-400 hover:text-primary-600 hover:border-primary-300 h-12"
            onClick={() => setIsCreatingResource(true)}
          >
            <Plus size={16} className="mr-2" />
            Add New Resource
          </Button>
        </div>
      )}

      {/* --- ANALYTICS TAB --- */}
      {tab === 'analytics' && (
        <div className="space-y-4 animate-in fade-in">
          {stats.map(stat => (
            <Card key={stat.resourceId} className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{stat.resourceName}</h4>
                  <span className="text-[10px] text-slate-500">{stat.resourceType}</span>
                </div>
                <Badge variant={stat.utilizationRate > 70 ? 'success' : stat.utilizationRate > 30 ? 'primary' : 'neutral'}>
                  {stat.utilizationRate}% Utilized
                </Badge>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full", stat.utilizationRate > 70 ? "bg-emerald-500" : "bg-primary-500")}
                  style={{ width: `${stat.utilizationRate}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Bookings</span>
                  <span className="text-lg font-semibold text-slate-900">{stat.bookingCount}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Hours Booked</span>
                  <span className="text-lg font-semibold text-slate-900">{stat.totalHours}h</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* --- MODALS --- */}
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
          <Button variant="danger" className="w-full" onClick={handleReject}>Confirm Rejection</Button>
        </div>
      </Modal>

      <Modal
        isOpen={!!rescheduleBookingId}
        onClose={() => setRescheduleBookingId(null)}
        title="Propose New Time"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">Select a new time slot to propose to the user.</p>
          <div>
            <Label>New Start Time</Label>
            <Input type="datetime-local" onChange={(e) => setNewStartTime(e.target.value)} />
          </div>
          <div>
            <Label>New End Time</Label>
            <Input type="datetime-local" onChange={(e) => setNewEndTime(e.target.value)} />
          </div>
          <Button className="w-full" onClick={handleReschedule}>Propose New Time</Button>
        </div>
      </Modal>
    </div>
  );
};
