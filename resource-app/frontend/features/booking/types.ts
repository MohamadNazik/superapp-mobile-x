export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  CHECKED_IN = 'checked_in',
  PROPOSED = 'proposed'
}

export interface Booking {
  id: string;
  resourceId: string;
  userId: string;
  start: string; // ISO String
  end: string;   // ISO String
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  rejectionReason?: string;

  // Dynamic Answers
  details: Record<string, unknown>;
}
