export type Role = "user" | "admin";

export type LeaveType = "sick" | "annual" | "casual";

export type LeaveStatus = "pending" | "approved" | "rejected";

export interface Allowances {
  sick: number;
  annual: number;
  casual: number;
}

export interface UserInfo {
  id: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  allowances: Allowances;
}

export interface Leave {
  id: string;
  userId: string;
  userEmail: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  createdAt: string;
  approverComment?: string;
  isHalfDay?: boolean;
  halfDayPeriod?: "morning" | "evening" | null;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface LeaveSummary {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  byType: Record<LeaveType, number>;
}

export interface Holiday {
  id: string;
  name: string;
  date: string; // "YYYY-MM-DD"
}
