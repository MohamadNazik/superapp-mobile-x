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
  updateUserRole: (userId: string, role: UserRole) => Promise<void>;
  switchUser: (userId: string) => void;
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
      // 1. Get identity from bridge
      const tokenData = await bridge.getToken();
      const userEmail = tokenData.email;

      if (!userEmail) {
        throw new Error("Could not identify user from token");
      }

      // 2. Fetch all users from API
      const response = await userApi.getUsers();

      if (response.success && response.data) {
        setAllUsers(response.data);
        
        // 3. Find matching current user
        const me = response.data.find(u => u.email === userEmail);
        if (me) {
          setCurrentUser(me);
        } else {
          console.warn("User not found in user list despite valid token");
        }
      } else {
        throw new Error(response.error || "Failed to fetch users");
      }
  } catch (err: unknown) {
    console.error("UserProvider error:", err);
    setError(err instanceof Error ? err.message : "Failed to initialize user context");
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

  return (
    <UserContext.Provider value={{
      currentUser,
      allUsers,
      isLoading,
      error,
      refreshUsers: fetchUsers,
      updateUserRole,
      switchUser
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
