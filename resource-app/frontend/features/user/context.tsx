import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, UserRole } from './types';
import { userApi } from './api';
import { bridge } from '../../infrastructure/bridge';

interface UserContextType {
  currentUser: User | null;
  allUsers: User[];
  isLoading: boolean;
  error: string | null;
  refreshUsers: () => Promise<void>;
  fetchAllUsers: () => Promise<void>;
  updateUserRole: (userId: string, role: UserRole) => Promise<void>;
  switchUser: (userId: string) => void;
  isAdmin: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch only the current user from the new /me endpoint
      const response = await userApi.getMe();

      if (response.success && response.data) {
        setCurrentUser(response.data);
      } else {
        throw new Error(response.error || "Failed to fetch current user");
      }
    } catch (err: unknown) {
      console.error("UserProvider fetchUsers error:", err);
      setError(err instanceof Error ? err.message : "Failed to identify current user");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAllUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await userApi.getUsers();
      if (response.success && response.data) {
        setAllUsers(response.data);
      } else {
        throw new Error(response.error || "Failed to fetch all users");
      }
    } catch (err: unknown) {
      console.error("UserProvider fetchAllUsers error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch user list");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateUserRole = useCallback(async (userId: string, role: UserRole) => {
    try {
      const res = await userApi.updateUserRole(userId, role);
      if (res.success) {
        await fetchUsers();
      } else {
        setError(res.error || "Failed to update user role");
      }
    } catch (err: unknown) {
      console.error("updateUserRole error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred while updating user role");
    }
  }, [fetchUsers]);

  const switchUser = useCallback((userId: string) => {
    const user = allUsers.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
    }
  }, [allUsers]);

  const isAdmin = currentUser?.role === UserRole.ADMIN;

  return (
    <UserContext.Provider value={{
      currentUser,
      allUsers,
      isLoading,
      error,
      refreshUsers: fetchUsers,
      fetchAllUsers,
      updateUserRole,
      switchUser,
      isAdmin
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
