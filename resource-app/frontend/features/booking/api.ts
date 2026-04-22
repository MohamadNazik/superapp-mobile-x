import { httpClient } from '../../api/client';
import { ApiResponse } from '../../api/types';
import { Booking, BookingStatus } from './types';

const handle = async <T>(request: Promise<{ data: { data: T } }>): Promise<ApiResponse<T>> => {
  try {
    const res = await request;
    return { success: true, data: res.data.data };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: msg };
  }
};

export const bookingApi = {
  getBookings: () => handle<Booking[]>(httpClient.get('/bookings')),

  getApprovableBookings: () => 
    handle<Booking[]>(httpClient.get('/bookings', { params: { scope: 'approvable' } })),

  createBooking: (data: unknown) =>
    handle<Booking>(httpClient.post('/bookings', data)),

  processBooking: (id: string, status: BookingStatus, rejectionReason?: string) =>
    handle<void>(httpClient.patch(`/bookings/${id}/process`, { status, rejectionReason })),

  rescheduleBooking: (id: string, start: string, end: string) =>
    handle<void>(httpClient.patch(`/bookings/${id}/reschedule`, { start, end })),

  cancelBooking: (id: string) =>
    handle<boolean>(httpClient.delete(`/bookings/${id}`)),
};
