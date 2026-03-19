import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Resource, Booking, ApiResponse, ResourceUsageStats, BookingStatus } from '../types';
import { client as api } from '../api/client';

interface AppContextType {
  resources: Resource[];
  bookings: Booking[];
  stats: ResourceUsageStats[];
  isLoading: boolean;
  error: string | null;

  // Actions
  refreshData: () => Promise<void>;
  fetchStats: () => Promise<void>;
  createBooking: (data: Record<string, unknown>) => Promise<ApiResponse<Booking>>;
  cancelBooking: (id: string) => Promise<void>;
  dismissBooking: (id: string) => Promise<void>; // For rejecting proposals/clearing rejected status
  addResource: (data: Omit<Resource, 'id'>) => Promise<boolean>;
  updateResource: (data: Resource) => Promise<boolean>;
  deleteResource: (id: string) => Promise<void>;
  processBooking: (id: string, status: BookingStatus, reason?: string) => Promise<void>;
  rescheduleBooking: (id: string, start: string, end: string) => Promise<ApiResponse<Booking>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<ResourceUsageStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const [resRes, bookRes] = await Promise.all([
        api.getResources(),
        api.getBookings()
      ]);

      if (resRes.success && resRes.data) setResources(resRes.data);
      if (bookRes.success && bookRes.data) setBookings(bookRes.data);


    } catch (err: unknown) {
      console.error("Failed to load data", err);
      const msg = err instanceof Error ? err.message : "Failed to connect to backend";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchStats = useCallback(async () => {
    const statsRes = await api.getUtilizationStats();
    if (statsRes.success && statsRes.data) setStats(statsRes.data);
  }, []);

  const createBooking = useCallback(async (data: Record<string, unknown>) => {
    const res = await api.createBooking(data);
    if (res.success) await fetchData();
    return res;
  }, [fetchData]);

  const cancelBooking = useCallback(async (id: string) => {
    await api.cancelBooking(id);
    await fetchData();
  }, [fetchData]);

  const dismissBooking = useCallback(async (id: string) => {
    // Dismissing a rejection or proposal effectively removes it
    await api.cancelBooking(id);
    await fetchData();
  }, [fetchData]);

  const processBooking = useCallback(async (id: string, status: BookingStatus, reason?: string) => {
    await api.processBooking(id, status, reason);
    await fetchData();
  }, [fetchData]);

  const rescheduleBooking = useCallback(async (id: string, start: string, end: string) => {
    const res = await api.rescheduleBooking(id, start, end);
    if (res.success) await fetchData();
    return res;
  }, [fetchData]);

  const addResource = useCallback(async (resourceData: Omit<Resource, 'id'>) => {
    const res = await api.addResource(resourceData);
    if (res.success && res.data) {
      setResources(prev => [...prev, res.data!]);
      return true;
    }
    return false;
  }, []);

  const updateResource = useCallback(async (resourceData: Resource) => {
    const res = await api.updateResource(resourceData);
    if (res.success && res.data) {
      setResources(prev => prev.map(r => r.id === resourceData.id ? res.data! : r));
      return true;
    }
    return false;
  }, []);

  const deleteResource = useCallback(async (id: string) => {
    const res = await api.deleteResource(id);
    if (res.success) {
      setResources(prev => prev.filter(r => r.id !== id));
      return true;
    }
    return false;
  }, []);

  return (
    <AppContext.Provider value={{
      resources,
      bookings,
      stats,
      isLoading,
      error,
      refreshData: fetchData,
      createBooking,
      cancelBooking,
      dismissBooking,
      addResource,
      updateResource,
      deleteResource,
      processBooking,
      rescheduleBooking,
      fetchStats
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
