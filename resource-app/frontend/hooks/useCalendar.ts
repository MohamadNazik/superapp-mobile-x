
import { useState, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useHoliday } from '../features/holiday/context';
import { useUser } from '../features/user';
import { useResource } from '../features/resource/context';
import { BookingStatus, UserRole } from '../types';
import { endOfMonth, eachDayOfInterval, isSameDay, getDay, format } from 'date-fns';

export const useCalendar = () => {
  const { bookings } = useApp();
  const { resources } = useResource();
  const { currentUser, allUsers } = useUser();
  const { holidays } = useHoliday();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'mine' | 'all'>('mine');

  const changeMonth = (delta: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  };

  // Calendar Grid Calculation
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startDayIndex = getDay(monthStart);
  const paddingDays = Array(startDayIndex).fill(null);

  const isAdmin = currentUser?.role === UserRole.ADMIN;

  // Filter Bookings
  const displayBookings = useMemo(() => {
    if (!currentUser) return [];
    return bookings.filter(b => {
      const isActive = b.status !== BookingStatus.CANCELLED && b.status !== BookingStatus.REJECTED;
      const isMine = b.userId === currentUser.id;

      if (!isActive) return false;

      // Non-admins always see only their own
      if (!isAdmin) return isMine;

      // Admins see based on toggle
      return viewMode === 'all' ? true : isMine;
    });
  }, [bookings, currentUser, viewMode, isAdmin]);

  const dayEvents = useCallback((date: Date) => displayBookings.filter(b => isSameDay(new Date(b.start), date)), [displayBookings]);

  const selectedDayEvents = useMemo(() => dayEvents(selectedDate), [dayEvents, selectedDate]);

  // Get Holiday for specific date
  const getHolidayForDate = useCallback((date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return holidays.find(h => h.date === dateStr);
  }, [holidays]);

  const selectedDayHoliday = useMemo(() => getHolidayForDate(selectedDate), [getHolidayForDate, selectedDate]);

  const getResourceDetails = (resId: string) => resources.find(r => r.id === resId);
  const getUserDetails = (userId: string) => allUsers.find(u => u.id === userId);

  return {
    currentDate,
    selectedDate,
    setSelectedDate,
    viewMode,
    setViewMode,
    changeMonth,
    goToToday,
    daysInMonth,
    paddingDays,
    isAdmin,
    currentUser,
    selectedDayEvents,
    selectedDayHoliday,
    dayEvents,
    getHolidayForDate,
    getResourceDetails,
    getUserDetails
  };
};
