import axios from 'axios';
import { bridge } from '../bridge';
import { APP_CONFIG } from '../config';
import { ApiResponse, Booking, BookingStatus, PublicHoliday, Resource, ResourceUsageStats, User, UserRole } from '../types';

const API_URL = APP_CONFIG.API_BASE_URL;

const httpClient = axios.create({
    baseURL: API_URL,
});

export { httpClient };

// Token management
let activeToken: string | null = null;
let isRefreshing = false;

// Request interceptor to inject auth token
httpClient.interceptors.request.use(async (config) => {
    // If we don't have a token, get one
    if (!activeToken) {
        try {
            const tokenData = await bridge.getToken();
            if (tokenData.token) {
                activeToken = tokenData.token;
            }
        } catch (error) {
            console.error('Failed to get initial token:', error);
            // We don't throw here, we let the request fail without token or let the 401 interceptor handle it
            // But strictly speaking, if we can't get a token, we probably shouldn't send the request.
            // However, the user wants "don't send req before getting token".
            // So we should retry getting the token here if it failed? 
            // The previous logic had retries. Let's keep a simple retry here for initial fetch.
        }
    }

    if (activeToken) {
        config.headers['Authorization'] = `Bearer ${activeToken}`;
    } else {
        // If still no token, try one last time with retries (legacy logic adapted)
        const maxRetries = 3;
        let retries = 0;
        while (retries < maxRetries && !activeToken) {
            try {
                const tokenData = await bridge.getToken();
                if (tokenData.token) {
                    activeToken = tokenData.token;
                    config.headers['Authorization'] = `Bearer ${activeToken}`;
                    return config;
                }
            } catch { retries++; await new Promise(r => setTimeout(r, 500)); }
        }
        if (!activeToken) {
            throw new Error('Authentication token not available');
        }
    }
    return config;
});

// Response interceptor to handle 401s and errors
httpClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // If already refreshing, wait for the new token
                try {
                    await new Promise((resolve, reject) => {
                        const interval = setInterval(() => {
                            if (!isRefreshing) {
                                clearInterval(interval);
                                if (activeToken) resolve(activeToken);
                                else reject(new Error('Token refresh failed'));
                            }
                        }, 100);
                    });
                    originalRequest.headers['Authorization'] = `Bearer ${activeToken}`;
                    return httpClient(originalRequest);
                } catch {
                    return Promise.reject(error);
                }
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Force fetch new token from bridge
                const tokenData = await bridge.getToken();
                if (tokenData.token) {
                    activeToken = tokenData.token;
                    originalRequest.headers['Authorization'] = `Bearer ${activeToken}`;
                    isRefreshing = false;
                    return httpClient(originalRequest);
                }
            } catch (refreshError) {
                console.error('Failed to refresh token:', refreshError);
                isRefreshing = false;
                // Optionally redirect to login or show error
            }
            isRefreshing = false;
        }

        console.error('API Error:', error);
        const errorMessage = error.response?.data?.error || error.message || 'Network request failed';
        return Promise.reject(new Error(errorMessage));
    }
);

// Helper to handle API responses
const handleResponse = async <T>(request: Promise<{ data: { data: T } }>): Promise<ApiResponse<T>> => {
    try {
        const response = await request;
        return { success: true, data: response.data.data }; // Backend returns { success: true, data: ... }
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: msg };
    }
};

export const client = {
    // --- Users ---
    getUsers: () => handleResponse<User[]>(httpClient.get('/users')),

    updateUserRole: (userId: string, role: UserRole) =>
        handleResponse<void>(httpClient.patch(`/users/${userId}/role`, { role })),

    // --- Resources ---
    getResources: () => handleResponse<Resource[]>(httpClient.get('/resources')),

    addResource: (resource: unknown) =>
        handleResponse<Resource>(httpClient.post('/resources', resource)),

    updateResource: (resource: Resource) =>
        handleResponse<Resource>(httpClient.put(`/resources/${resource.id}`, resource)),

    deleteResource: (id: string) =>
        handleResponse<boolean>(httpClient.delete(`/resources/${id}`)),

    // --- Bookings ---
    getBookings: () => handleResponse<Booking[]>(httpClient.get('/bookings')),

    createBooking: (data: unknown) =>
        handleResponse<Booking>(httpClient.post('/bookings', data)),

    processBooking: (id: string, status: BookingStatus, rejectionReason?: string) =>
        handleResponse<void>(httpClient.post(`/bookings/${id}/process`, { status, rejectionReason })),

    rescheduleBooking: (id: string, start: string, end: string) =>
        handleResponse<void>(httpClient.post(`/bookings/${id}/reschedule`, { start, end })),

    cancelBooking: (id: string) =>
        handleResponse<boolean>(httpClient.delete(`/bookings/${id}`)),

    // --- Stats ---
    getUtilizationStats: () => handleResponse<ResourceUsageStats[]>(httpClient.get('/stats')),

    // --- Holidays ---
    getHolidays: () => handleResponse<PublicHoliday[]>(httpClient.get('/holidays')),
};

