
import React from 'react';
import { format, isToday, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Card, EmptyState, Button, Badge } from '../../../components/UI';
import { BookingStatus } from '../../booking/types';
import { useUser } from '../../user';
import { UserRole } from '../../../types';
import { useCalendar } from '../hooks/useCalendar';
import { DynamicIcon } from '../../../components/Icons';
import { useBookingContext } from '../../booking/context';

export const CalendarView = () => {
  const {
    currentDate, selectedDate, setSelectedDate,
    viewMode, setViewMode,
    changeMonth, goToToday,
    daysInMonth, paddingDays,
    selectedDayEvents, selectedDayHoliday, dayEvents,
    getHolidayForDate,
    getResourceDetails, getUserDetails
  } = useCalendar();

  const { bookings, processBooking, dismissBooking } = useBookingContext();
  const { currentUser } = useUser();
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  // Filter Actionable Items (Proposed or Rejected for current user)
  const actionableBookings = React.useMemo(() => bookings.filter(b =>
    b.userId === currentUser?.id &&
    (b.status === BookingStatus.PROPOSED || b.status === BookingStatus.REJECTED)
  ), [bookings, currentUser?.id]);

  return (
    <div className="space-y-4">
      {/* --- ACTION CENTER (Notifications) --- */}
      {actionableBookings.length > 0 && (
        <div className="space-y-2 animate-in slide-in-from-top-4">
          <h3 className="text-xs font-bold uppercase text-slate-400 px-1 tracking-wide flex items-center gap-1">
            <AlertCircle size={12} className="text-primary-600" /> Action Required
          </h3>
          {actionableBookings.map(booking => {
            const resource = getResourceDetails(booking.resourceId);
            const isProposed = booking.status === BookingStatus.PROPOSED;

            return (
              <div key={booking.id} className={cn(
                "p-3 rounded-xl border shadow-sm flex flex-col gap-2",
                isProposed ? "bg-blue-50 border-blue-100" : "bg-red-50 border-red-100"
              )}>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className={cn("font-bold text-sm", isProposed ? "text-blue-900" : "text-red-900")}>
                      {isProposed ? 'New Time Proposed' : 'Booking Rejected'}
                    </h4>
                    <p className="text-xs text-slate-600">{resource?.name}</p>
                  </div>

                </div>

                {!isProposed && booking.rejectionReason && (
                  <div className="bg-white/50 p-2 rounded text-xs text-red-800 italic">
                    &quot;{booking.rejectionReason}&quot;
                  </div>
                )}

                <div className="flex gap-2 mt-1">
                  {isProposed ? (
                    <>
                      <Button
                        size="sm"
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs"
                        onClick={() => processBooking(booking.id, BookingStatus.CONFIRMED)}
                      >
                        <CheckCircle size={12} className="mr-1" /> Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-1 bg-white hover:bg-slate-50 h-8 text-xs text-red-600"
                        onClick={() => dismissBooking(booking.id)}
                      >
                        <XCircle size={12} className="mr-1" /> Decline
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full bg-white hover:bg-slate-50 h-8 text-xs text-slate-600"
                      onClick={() => dismissBooking(booking.id)}
                    >
                      Dismiss Notification
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View Mode Toggle (Admins Only) */}
      {isAdmin && (
        <div className="flex p-1 bg-slate-200/50 rounded-xl mb-2">
          <button
            onClick={() => setViewMode('mine')}
            className={cn(
              "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all duration-200",
              viewMode === 'mine' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            My Schedule
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={cn(
              "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all duration-200",
              viewMode === 'all' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Organization
          </button>
        </div>
      )}

      {/* Modern Calendar Card */}
      <div className="bg-white rounded-3xl shadow-sm shadow-slate-200 border border-slate-100 overflow-hidden">

        {/* Header */}
        <div className="bg-slate-50/50 p-4 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => changeMonth(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-sm"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => changeMonth(1)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-sm"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <h2 className="text-base font-bold text-slate-800 tracking-tight">
            {format(currentDate, 'MMMM yyyy')}
          </h2>

          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-3 text-xs font-bold bg-white border border-slate-200 shadow-sm text-primary-600 hover:bg-primary-50"
            onClick={goToToday}
          >
            Today
          </Button>
        </div>

        <div className="p-4">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 mb-3">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wide py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-y-3 gap-x-1 justify-items-center">
            {paddingDays.map((_, i) => <div key={`pad-${i}`} className="w-9 h-9" />)}

            {daysInMonth.map((day) => {
              const events = dayEvents(day);
              const holiday = getHolidayForDate(day);
              const isSelected = isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);
              const hasPending = events.some(e => e.status === BookingStatus.PENDING);

              return (
                <button
                  key={day.toString()}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "w-9 h-10 flex flex-col items-center justify-center rounded-xl text-sm font-medium transition-all duration-200 relative touch-manipulation",
                    isSelected
                      ? "bg-primary-600 text-white shadow-md shadow-primary-500/30 scale-105 z-10"
                      : "text-slate-700 hover:bg-slate-50",
                    !isSelected && isTodayDate && "text-primary-600 bg-primary-50 ring-1 ring-inset ring-primary-100 font-bold",
                    !isSelected && holiday && "bg-purple-50 text-purple-700 font-bold" // Holiday styling
                  )}
                >
                  <span>{format(day, 'd')}</span>

                  {/* Dots */}
                  <div className="flex gap-0.5 mt-0.5 h-1 items-center">
                    {/* Holiday Dot */}
                    {holiday && (
                      <span className={cn(
                        "w-1 h-1 rounded-full",
                        isSelected ? "bg-white" : "bg-purple-500"
                      )} />
                    )}

                    {/* Event Dot */}
                    {events.length > 0 && (
                      <span className={cn(
                        "w-1 h-1 rounded-full",
                        isSelected ? "bg-white" : hasPending ? "bg-amber-400" : "bg-primary-500"
                      )} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Agenda Section */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 pb-4">
        <div className="flex items-baseline justify-between px-1 mb-3">
          <h2 className="text-sm font-bold text-slate-800">
            {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEEE')}
          </h2>
          <span className="text-xs text-slate-500">{format(selectedDate, 'MMM do')}</span>
        </div>

        {/* Holiday Card */}
        {selectedDayHoliday && (
          <Card className="flex gap-4 p-4 items-start mb-3 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 border-l-4 border-l-orange-600 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white to-white flex items-center justify-center shrink-0 text-white shadow-md text-lg">
              🇱🇰
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-orange-900 text-sm">{selectedDayHoliday.localName}</h3>
              {selectedDayHoliday.description && (
                <p className="text-xs text-orange-700 mt-1 leading-relaxed">{selectedDayHoliday.description}</p>
              )}
              <Badge className="mt-2 bg-white text-orange-700 border-orange-300">Public Holiday</Badge>
            </div>
          </Card>
        )}



        {selectedDayEvents.length === 0 && !selectedDayHoliday ? (
          <EmptyState icon={CalendarIcon} message="No bookings for this day." />
        ) : (
          <div className="space-y-3">
            {selectedDayEvents.map(event => {
              const isPending = event.status === BookingStatus.PENDING;
              const isProposed = event.status === BookingStatus.PROPOSED;
              const isRejected = event.status === BookingStatus.REJECTED;

              if (isRejected) return null; // Handled in Action Center

              const resource = getResourceDetails(event.resourceId);
              const booker = getUserDetails(event.userId);
              const isOwn = event.userId === currentUser?.id;

              return (
                <Card key={event.id} className={cn(
                  "flex gap-4 p-4 items-center relative overflow-hidden border-l-[3px] shadow-sm transition-all active:scale-[0.99]",
                  isPending ? "border-l-amber-400" : isProposed ? "border-l-blue-500" : "border-l-emerald-500"
                )}>
                  {/* Status Badge */}
                  {isPending && (
                    <div className="absolute top-2 right-2">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wide">
                        Pending
                      </span>
                    </div>
                  )}
                  {isProposed && (
                    <div className="absolute top-2 right-2">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wide">
                        Proposed
                      </span>
                    </div>
                  )}

                  {/* Icon */}
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-white shadow-sm",
                    isPending ? "bg-amber-500" : isProposed ? "bg-blue-500" : "bg-primary-600"
                  )}>
                    <DynamicIcon name={resource?.icon || 'DEFAULT'} className="w-6 h-6" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 text-sm truncate leading-tight mb-1">{resource?.name}</h3>

                    {/* Description / User Info */}
                    <div className="text-xs text-slate-500 truncate mb-2">
                      {/* Show user info if Admin viewing Org schedule (and not own booking) */}
                      {isAdmin && !isOwn ? (
                        <span className="flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-600 shrink-0 uppercase">
                            {(booker?.email?.[0] || '?').toUpperCase()}
                          </span>
                          <span className="text-slate-700 font-medium">{booker?.email}</span>
                        </span>
                      ) : (
                        event.details['title'] || event.details['purpose'] || 'No title provided'
                      )}
                    </div>

                    <div className="inline-flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      <span className="text-[10px] font-semibold text-slate-600">
                        {format(new Date(event.start), 'h:mm a')} - {format(new Date(event.end), 'h:mm a')}
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
