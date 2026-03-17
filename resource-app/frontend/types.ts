export type { ApiResponse } from './api/types';

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum ResourceType {
  MEETING_ROOM = 'Conference Hall',
  DESK = 'Hot Desk',
  DEVICE = 'Device',
  VEHICLE = 'Vehicle',
  PARKING = 'Parking Spot',
}

export const RESOURCE_TYPES = Object.values(ResourceType);

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  CHECKED_IN = 'checked_in',
  PROPOSED = 'proposed'
}

// Dynamic Field Definitions for extensibility
export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select';
  options?: string[]; // For select type
  required: boolean;
}

export interface User {
  id: string;
  email: string; // Primary identifier
  role: UserRole;
  avatar?: string;
  department?: string;
}

export interface Resource {
  id: string;
  name: string;
  type: string;
  description: string;
  isActive: boolean;
  minLeadTimeHours: number;

  // Visuals
  icon: string;
  color?: string;

  // Generic Specs
  specs: Record<string, string>;

  // Dynamic Booking Questions
  formFields: FormField[];
}

export interface Booking {
  id: string;
  resourceId: string;
  userId: string;
  start: string; // ISO String
  end: string;   // ISO String
  status: BookingStatus;
  createdAt: string;
  rejectionReason?: string;

  // Dynamic Answers
  details: Record<string, unknown>;
}

export interface ResourceUsageStats {
  resourceId: string;
  resourceName: string;
  resourceType: string;
  bookingCount: number;
  totalHours: number;
  utilizationRate: number;
}

export interface PublicHoliday {
  date: string; // yyyy-MM-dd
  localName: string;
  name: string;
  description?: string;
  countryCode: string;
  fixed: boolean;
  global: boolean;
  types: string[];
}

