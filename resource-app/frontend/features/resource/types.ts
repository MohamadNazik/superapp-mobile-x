export enum ResourceType {
  MEETING_ROOM = 'Conference Hall',
  DESK = 'Hot Desk',
  DEVICE = 'Device',
  VEHICLE = 'Vehicle',
  PARKING = 'Parking Spot',
}

export const RESOURCE_TYPES = Object.values(ResourceType);

// Dynamic Field Definitions for extensibility
export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select';
  options?: string[]; // For select type
  required: boolean;
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
  specs: Record<string, unknown>;

  // Dynamic Booking Questions
  formFields: FormField[];

  // Access control
  canBook?: boolean;
}

export enum PermissionType {
  REQUEST = 'REQUEST',
  APPROVE = 'APPROVE',
}

export interface ResourcePermission {
  id: string;
  resourceId: string;
  groupId: string;
  groupName?: string;
  permissionType: PermissionType;
}

export interface ResourceUsageStats {
  resourceId: string;
  resourceName: string;
  resourceType: string;
  bookingCount: number;
  totalHours: number;
  utilizationRate: number;
}
