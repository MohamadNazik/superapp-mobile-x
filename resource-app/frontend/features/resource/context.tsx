import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Resource, ResourceUsageStats, ResourcePermission, PermissionType } from './types';
import { resourceApi } from './api';

export interface MutationResult {
  success: boolean;
  error?: string;
  status?: number;
}

interface ResourceContextType {
  resources: Resource[];
  stats: ResourceUsageStats[];
  permissions: ResourcePermission[];
  isLoading: boolean;
  isPermissionsLoading: boolean;
  error: string | null;
  refreshResources: () => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchPermissions: (resourceId: string) => Promise<void>;
  addResource: (data: Omit<Resource, 'id'>) => Promise<MutationResult>;
  updateResource: (data: Resource) => Promise<MutationResult>;
  deleteResource: (id: string) => Promise<void>;
  addPermissionsToResource: (resourceId: string, groupId: string, types: PermissionType[]) => Promise<MutationResult>;
  deletePermission: (permissionId: string) => Promise<MutationResult>;
}

const ResourceContext = createContext<ResourceContextType | undefined>(undefined);

export const ResourceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [stats, setStats] = useState<ResourceUsageStats[]>([]);
  const [permissions, setPermissions] = useState<ResourcePermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPermissionsLoading, setIsPermissionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResources = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await resourceApi.getResources();
      if (res.success) {
        setResources(res.data || []);
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

  const fetchPermissions = useCallback(async (resourceId: string) => {
    setIsPermissionsLoading(true);
    setError(null);
    const res = await resourceApi.getResourcePermissions(resourceId);
    if (res.success) {
      setPermissions(res.data || []);
    } else {
      setError(res.error || 'Failed to fetch permissions');
    }
    setIsPermissionsLoading(false);
  }, []);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await resourceApi.getUtilizationStats();
      if (res.success) {
        setStats(res.data || []);
      }
    } catch (err: unknown) {
      console.error('fetchStats error:', err);
    }
  }, []);

  const addResource = useCallback(async (data: Omit<Resource, 'id'>) => {
    const res = await resourceApi.addResource(data);
    if (res.success) {
      const newResource = res.data!;
      setResources(prev => [...prev, newResource]);
      return { success: true, status: res.status };
    }
    return { success: false, error: res.error || 'Failed to add resource', status: res.status };
  }, []);

  const updateResource = useCallback(async (data: Resource) => {
    const res = await resourceApi.updateResource(data);
    if (res.success) {
      const updatedResource = res.data!;
      setResources(prev => prev.map(r => r.id === data.id ? updatedResource : r));
      return { success: true, status: res.status };
    }
    return { success: false, error: res.error || 'Failed to update resource', status: res.status };
  }, []);

  const deleteResource = useCallback(async (id: string) => {
    const res = await resourceApi.deleteResource(id);
    if (res.success) {
      setResources(prev => prev.filter(r => r.id !== id));
    }
  }, []);

  const addPermissionsToResource = useCallback(async (resourceId: string, groupId: string, types: PermissionType[]) => {
    setError(null);
    const results = await Promise.all(types.map(type => resourceApi.addPermission(resourceId, groupId, type)));
    
    // Always fetch latest state even if some failed to ensure UI is in sync
    await fetchPermissions(resourceId);
    
    const failure = results.find(res => !res.success);
    if (failure) {
      // More robust check for conflict (409) to avoid global error screen
      const isConflict = Number(failure.status) === 409 || 
                        failure.error?.toLowerCase().includes('already exists');
      
      if (!isConflict) {
        setError(failure.error || 'Failed to add some permissions');
      }
      
      const err = new Error(failure.error || 'Failed to add some permissions');
      (err as any).status = failure.status;
      (err as any).error = failure.error;
      throw err;
    }
    return { success: true };
  }, [fetchPermissions]);

  const deletePermission = useCallback(async (permissionId: string) => {
    const res = await resourceApi.deletePermission(permissionId);
    if (res.success) {
      setPermissions(prev => prev.filter(p => p.id !== permissionId));
      return { success: true, status: res.status };
    }
    return { success: false, error: res.error || 'Failed to delete permission', status: res.status };
  }, []);

  const value = useMemo(() => ({
    resources,
    stats,
    permissions,
    isLoading,
    isPermissionsLoading,
    error,
    refreshResources: fetchResources,
    fetchStats,
    fetchPermissions,
    addResource,
    updateResource,
    deleteResource,
    addPermissionsToResource,
    deletePermission,
  }), [resources, stats, permissions, isLoading, isPermissionsLoading, error, fetchResources, fetchStats, fetchPermissions, addResource, updateResource, deleteResource, addPermissionsToResource, deletePermission]);

  return (
    <ResourceContext.Provider value={value}>
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
