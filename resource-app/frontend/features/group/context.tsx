import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Group, CreateAndUpdateGroupPayload } from './types';
import { groupApi } from './api';

interface GroupContextState {
  groups: Group[];
  isLoading: boolean;
  error: string | null;
  fetchGroups: () => Promise<void>;
  createGroup: (payload: CreateAndUpdateGroupPayload) => Promise<boolean>;
  updateGroup: (id: string, payload: CreateAndUpdateGroupPayload) => Promise<boolean>;
  deleteGroup: (id: string) => Promise<boolean>;
}

const GroupContext = createContext<GroupContextState | undefined>(undefined);

export const GroupProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const response = await groupApi.getGroups();
    if (response.success && response.data) {
      setGroups(response.data);
    } else {
      setError(response.error || 'Failed to initialize groups');
    }
    setIsLoading(false);
  }, []);

  const createGroup = useCallback(async (payload: CreateAndUpdateGroupPayload) => {
    setError(null);
    const response = await groupApi.createGroup(payload);
    if (response.success && response.data) {
      setGroups(prev => [...prev, response.data!]);
      return true;
    }
    setError(response.error || 'Failed to create group');
    return false;
  }, []);

  const updateGroup = useCallback(async (id: string, payload: CreateAndUpdateGroupPayload) => {
    setError(null);
    const response = await groupApi.updateGroup(id, payload);
    if (response.success && response.data) {
      setGroups(prev => prev.map(g => (g.id === id ? response.data! : g)));
      return true;
    }
    setError(response.error || 'Failed to update group');
    return false;
  }, []);

  const deleteGroup = useCallback(async (id: string) => {
    setError(null);
    const response = await groupApi.deleteGroup(id);
    if (response.success) {
      setGroups(prev => prev.filter(g => g.id !== id));
      return true;
    }
    setError(response.error || 'Failed to delete group');
    return false;
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const value = useMemo(() => ({
    groups,
    isLoading,
    error,
    fetchGroups,
    createGroup,
    updateGroup,
    deleteGroup,
  }), [groups, isLoading, error, fetchGroups, createGroup, updateGroup, deleteGroup]);

  return <GroupContext.Provider value={value}>{children}</GroupContext.Provider>;
};

export const useGroup = (): GroupContextState => {
  const context = useContext(GroupContext);
  if (context === undefined) {
    throw new Error('useGroup must be used within a GroupProvider');
  }
  return context;
};
