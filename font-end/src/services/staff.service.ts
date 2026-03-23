import { api } from "../lib/api";

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface Employee {
  employeeId: string;
  fullName: string;
  position: string;
  employeeType: string;
  maxWorkingHours: number | null;
  accountId: string | null;
  managerId: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Shift {
  shiftId: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  workingDate: string;
  status: string;
  createdByManagerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  shiftId: string;
  employeeId: string;
  assignedAt: string;
  assignedBy: string | null;
  assignmentStatus: string;
}

export interface Availability {
  employeeId: string;
  availableDays: string[];
  availableTimeRanges: { start: string; end: string }[];
}

export const staffService = {
  // ── Employees ──
  getEmployees: async (params: { page?: number; limit?: number; status?: string; position?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    if (params.status) qs.set("status", params.status);
    if (params.position) qs.set("position", params.position);
    return await api.getRaw<PaginatedResponse<Employee>>(`/api/staff/employees?${qs}`);
  },

  createEmployee: async (data: Partial<Employee>) => {
    return await api.post<Employee>("/api/staff/employees", data);
  },

  updateEmployee: async (id: string, data: Partial<Employee>) => {
    return await api.put<Employee>(`/api/staff/employees/${id}`, data);
  },

  deleteEmployee: async (id: string) => {
    return await api.delete(`/api/staff/employees/${id}`);
  },

  getAvailability: async (employeeId: string) => {
    return await api.get<Availability>(`/api/staff/employees/${employeeId}/availability`);
  },

  // ── Shifts ──
  getShifts: async (params: { page?: number; limit?: number; date?: string; status?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    if (params.date) qs.set("date", params.date);
    if (params.status) qs.set("status", params.status);
    return await api.getRaw<PaginatedResponse<Shift>>(`/api/staff/shifts?${qs}`);
  },

  createShift: async (data: Partial<Shift>) => {
    return await api.post<Shift>("/api/staff/shifts", data);
  },

  updateShift: async (id: string, data: Partial<Shift>) => {
    return await api.put<Shift>(`/api/staff/shifts/${id}`, data);
  },

  deleteShift: async (id: string) => {
    return await api.delete(`/api/staff/shifts/${id}`);
  },

  // ── Assignments ──
  getAssignments: async (shiftId: string) => {
    return await api.get<Assignment[]>(`/api/staff/shifts/${shiftId}/assignments`);
  },

  assignEmployee: async (shiftId: string, employeeId: string) => {
    return await api.post(`/api/staff/shifts/${shiftId}/assignments`, { employeeId });
  },

  removeAssignment: async (shiftId: string, employeeId: string) => {
    return await api.delete(`/api/staff/shifts/${shiftId}/assignments/${employeeId}`);
  },

  getEmployeeByAccountId: async (accountId: string) => {
    return await api.get<Employee>(`/api/staff/employees/account/${accountId}`);
  },

  getEmployeeShifts: async (employeeId: string, params: { page?: number; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    return await api.getRaw<PaginatedResponse<Shift>>(`/api/staff/employees/${employeeId}/shifts?${qs}`);
  },

  getShiftById: async (shiftId: string) => {
    return await api.get<Shift & { assignments?: Assignment[] }>(`/api/staff/shifts/${shiftId}`);
  },

  updateAvailability: async (employeeId: string, data: { availableDays: string[]; availableTimeRanges: { start: string; end: string }[] }) => {
    return await api.put<Availability>(`/api/staff/employees/${employeeId}/availability`, data);
  },
};
