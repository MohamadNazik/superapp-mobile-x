import { httpClient } from '../../api/client';
import { ApiResponse } from '../../api/types';
import { User, UserRole } from './types';

/**
 * User-specific API calls.
 * These are moved from the global api/client.ts as part of DDD refactoring.
 */
export const userApi = {
  getUsers: async (): Promise<ApiResponse<User[]>> => {
    try {
      const response = await httpClient.get<{ data: User[] }>('/users');
      return { success: true, data: response.data.data };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to fetch users' };
    }
  },

  updateUserRole: async (userId: string, role: UserRole): Promise<ApiResponse<void>> => {
    try {
      await httpClient.patch(`/users/${userId}/role`, { role });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to update user role' };
    }
  },

  getMyGroups: async (): Promise<ApiResponse<Array<{ id: string; name: string }>>> => {
    try {
      const response = await httpClient.get<{ data: any }>('/me/groups');
      return { success: true, data: response.data.data };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to fetch my groups' };
    }
  },
};
