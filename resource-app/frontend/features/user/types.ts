import { PermissionType } from '../resource/types';

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  email: string; // Primary identifier
  role: UserRole;
  avatar?: string;
  department?: string;
}

export interface MyPermissions {
  groups: Array<{ id: string; name: string }>;
  resourcePermissions: Record<string, PermissionType[]>;
}
