import { httpClient } from '../../api/client';
import { ApiResponse } from '../../api/types';
import { Resource, ResourceUsageStats, ResourcePermission, PermissionType } from './types';

// Helper to wrap axios calls in ApiResponse
const handle = async <T>(request: Promise<{ data: { data: T } }>): Promise<ApiResponse<T>> => {
  try {
    const res = await request;
    return { success: true, data: res.data.data, status: 200 };
  } catch (error: any) {
    const status = error?.response?.status || error?.status;
    const msg = error?.response?.data?.error || error?.message || 'Unknown error';
    return { success: false, error: msg, status };
  }
};

export const resourceApi = {
  getResources: () => handle<Resource[]>(httpClient.get('/resources')),

  addResource: (resource: unknown) =>
    handle<Resource>(httpClient.post('/resources', resource)),

  updateResource: (resource: Resource) =>
    handle<Resource>(httpClient.put(`/resources/${resource.id}`, resource)),

  deleteResource: (id: string) =>
    handle<boolean>(httpClient.delete(`/resources/${id}`)),

  getUtilizationStats: () =>
    handle<ResourceUsageStats[]>(httpClient.get('/stats')),

  // Permissions (Mock Server Support)
  getResourcePermissions: (id: string) =>
    handle<ResourcePermission[]>(httpClient.get(`/resources/${id}/permissions`)),

  addPermission: (resourceId: string, groupId: string, permissionType: PermissionType) =>
    handle<ResourcePermission>(httpClient.post('/resource-permissions', { resourceId, groupId, permissionType })),

  deletePermission: (id: string) =>
    handle<boolean>(httpClient.delete(`/resource-permissions/${id}`)),
};
