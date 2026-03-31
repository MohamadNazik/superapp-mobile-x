import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Group, CreateAndUpdateGroupPayload, GroupMember, AddUsersToGroupResult, RemoveUserFromGroupResult } from './types';
import { groupApi } from './api';

interface GroupContextState {
  groups: Group[];
  isLoading: boolean;
  error: string | null;
  fetchGroups: () => Promise<void>;
  createGroup: (payload: CreateAndUpdateGroupPayload) => Promise<boolean>;
  updateGroup: (id: string, payload: CreateAndUpdateGroupPayload) => Promise<boolean>;
  deleteGroup: (id: string) => Promise<boolean>;
  getGroupMembers: (groupId: string) => Promise<GroupMember[]>;
  addUsersToGroup: (groupId: string, userIds: string[]) => Promise<AddUsersToGroupResult | null>;
  removeUserFromGroup: (groupId: string, userId: string) => Promise<RemoveUserFromGroupResult | null>;
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

  const getGroupMembers = useCallback(async (groupId: string): Promise<GroupMember[]> => {
    const response = await groupApi.getGroupMembers(groupId);
    if (response.success && response.data) {
      return response.data;
    }
    setError(response.error || 'Failed to fetch group members');
    return [];
  }, []);

  const addUsersToGroup = useCallback(async (groupId: string, userIds: string[]): Promise<AddUsersToGroupResult | null> => {
    setError(null);
    const response = await groupApi.addUsersToGroup(groupId, userIds);
    if (response.success && response.data) {
      return response.data;
    }
    setError(response.error || 'Failed to add users to group');
    return null;
  }, []);

  const removeUserFromGroup = useCallback(async (groupId: string, userId: string): Promise<RemoveUserFromGroupResult | null> => {
    setError(null);
    const response = await groupApi.removeUserFromGroup(groupId, userId);
    if (response.success && response.data) {
      return response.data;
    }
    setError(response.error || 'Failed to remove user from group');
    return null;
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
    getGroupMembers,
    addUsersToGroup,
    removeUserFromGroup,
  }), [groups, isLoading, error, fetchGroups, createGroup, updateGroup, deleteGroup, getGroupMembers, addUsersToGroup, removeUserFromGroup]);

  return <GroupContext.Provider value={value}>{children}</GroupContext.Provider>;
};

export const useGroup = (): GroupContextState => {
  const context = useContext(GroupContext);
  if (context === undefined) {
    throw new Error('useGroup must be used within a GroupProvider');
  }
  return context;
};
