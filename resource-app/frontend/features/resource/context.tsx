import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Resource, ResourceUsageStats } from './types';
import { resourceApi } from './api';

export interface MutationResult {
  success: boolean;
  error?: string;
}

interface ResourceContextType {
  resources: Resource[];
  stats: ResourceUsageStats[];
  isLoading: boolean;
  error: string | null;
  refreshResources: () => Promise<void>;
  fetchStats: () => Promise<void>;
  addResource: (data: Omit<Resource, 'id'>) => Promise<MutationResult>;
  updateResource: (data: Resource) => Promise<MutationResult>;
  deleteResource: (id: string) => Promise<void>;
}

const ResourceContext = createContext<ResourceContextType | undefined>(undefined);

export const ResourceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [stats, setStats] = useState<ResourceUsageStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResources = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await resourceApi.getResources();
      if (res.success && res.data) {
        setResources(res.data);
      } else {
        setError(res.error || 'Failed to fetch resources');
      }
    } catch (err: unknown) {
      console.error('ResourceProvider error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load resources');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await resourceApi.getUtilizationStats();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err: unknown) {
      console.error('fetchStats error:', err);
    }
  }, []);

  const addResource = useCallback(async (data: Omit<Resource, 'id'>) => {
    const res = await resourceApi.addResource(data);
    if (res.success && res.data) {
      setResources(prev => [...prev, res.data!]);
      return { success: true };
    }
    return { success: false, error: res.error || 'Failed to add resource' };
  }, []);

  const updateResource = useCallback(async (data: Resource) => {
    const res = await resourceApi.updateResource(data);
    if (res.success && res.data) {
      setResources(prev => prev.map(r => r.id === data.id ? res.data! : r));
      return { success: true };
    }
    return { success: false, error: res.error || 'Failed to update resource' };
  }, []);

  const deleteResource = useCallback(async (id: string) => {
    const res = await resourceApi.deleteResource(id);
    if (res.success) {
      setResources(prev => prev.filter(r => r.id !== id));
    }
  }, []);

  return (
    <ResourceContext.Provider value={{
      resources,
      stats,
      isLoading,
      error,
      refreshResources: fetchResources,
      fetchStats,
      addResource,
      updateResource,
      deleteResource,
    }}>
      {children}
    </ResourceContext.Provider>
  );
};

export const useResource = () => {
  const context = useContext(ResourceContext);
  if (context === undefined) {
    throw new Error('useResource must be used within a ResourceProvider');
  }
  return context;
};
