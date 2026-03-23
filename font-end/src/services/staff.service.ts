import { api } from "../lib/api";

export interface Employee {
  _id: string;
  employeeId: string;
  fullName: string;
  position: string;
  employeeType: "FULL_TIME" | "PART_TIME";
  maxWorkingHours: number | null;
  accountId: string | null;
  managerId: string | null;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
}

export interface Shift {
  _id: string;
  shiftId: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  workingDate: string;
  status: "PLANNED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  createdByManagerId: string;
  createdAt: string;
  updatedAt: string;
  assignments?: Assignment[];
}

export interface Assignment {
  _id: string;
  shiftId: string;
  employeeId: string;
  assignedAt: string;
  assignedBy: string;
  assignmentStatus: "ASSIGNED" | "CONFIRMED" | "CANCELLED";
}

export interface Availability {
  employeeId: string;
  availableDays: string[];
  availableTimeRanges: { start: string; end: string }[];
}

interface Paginated<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export const staffService = {
  // Employees
  createEmployee: (data: {
    fullName: string;
    position: string;
    employeeType: string;
    maxWorkingHours?: number;
    accountId?: string;
  }) => api.post<Employee>("/api/staff/employees", data),

  getEmployees: (params?: { page?: number; limit?: number; status?: string; position?: string }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.status) qs.set("status", params.status);
    if (params?.position) qs.set("position", params.position);
    return api.get<Paginated<Employee>>(`/api/staff/employees?${qs}`);
  },

  getEmployeeById: (id: string) => api.get<Employee>(`/api/staff/employees/${id}`),

  getEmployeeByAccountId: (accountId: string) =>
    api.get<Employee>(`/api/staff/employees/by-account/${accountId}`),

  updateEmployee: (id: string, data: Partial<Employee>) =>
    api.put<Employee>(`/api/staff/employees/${id}`, data),

  deleteEmployee: (id: string) => api.delete<Employee>(`/api/staff/employees/${id}`),

  getAvailability: (id: string) =>
    api.get<Availability>(`/api/staff/employees/${id}/availability`),

  updateAvailability: (id: string, data: { availableDays: string[]; availableTimeRanges: { start: string; end: string }[] }) =>
    api.put<Availability>(`/api/staff/employees/${id}/availability`, data),

  // Shifts
  createShift: (data: { shiftName: string; startTime: string; endTime: string; workingDate: string }) =>
    api.post<Shift>("/api/staff/shifts", data),

  getShifts: (params?: { page?: number; limit?: number; date?: string; status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.date) qs.set("date", params.date);
    if (params?.status) qs.set("status", params.status);
    return api.get<Paginated<Shift>>(`/api/staff/shifts?${qs}`);
  },

  getShiftById: (id: string) => api.get<Shift>(`/api/staff/shifts/${id}`),

  updateShift: (id: string, data: Partial<Shift>) =>
    api.put<Shift>(`/api/staff/shifts/${id}`, data),

  deleteShift: (id: string) => api.delete<Shift>(`/api/staff/shifts/${id}`),

  // Assignments
  assignEmployee: (shiftId: string, employeeId: string) =>
    api.post<Assignment>(`/api/staff/shifts/${shiftId}/assignments`, { employeeId }),

  removeAssignment: (shiftId: string, employeeId: string) =>
    api.delete<void>(`/api/staff/shifts/${shiftId}/assignments/${employeeId}`),

  getAssignments: (shiftId: string) =>
    api.get<Assignment[]>(`/api/staff/shifts/${shiftId}/assignments`),

  getEmployeeShifts: (employeeId: string, params?: { date?: string; status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.date) qs.set("date", params.date);
    if (params?.status) qs.set("status", params.status);
    return api.get<{ shifts: Shift[]; pagination: object }>(`/api/staff/employees/${employeeId}/shifts?${qs}`);
  },
};
