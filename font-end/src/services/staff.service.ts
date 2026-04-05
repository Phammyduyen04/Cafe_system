import { api } from "../lib/api";

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface Employee {
  _id?: string;
  employeeId: string;
  fullName: string;
  position: string;
  employeeType: string;
  maxWorkingHours: number | null;
  accountId: string | null;
  managerId: string | null;
  status: string;
  inactiveReason: string | null;
  reactivateReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Shift {
  _id?: string;
  shiftId: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  workingDate: string;
  status: string;
  cancelReason: string | null;
  createdByManagerId: string | null;
  createdAt: string;
  updatedAt: string;
  assignments?: Assignment[];
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

export interface Attendance {
  _id?: string;
  attendanceId: string;
  shiftId: string;
  employeeId: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: string;
  actualHours: number | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export const staffService = {
  // ── Employees ──
  getEmployees: async (params: {
    page?: number;
    limit?: number;
    status?: string;
    position?: string;
    employeeType?: string;
    hasAccount?: boolean;
  } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    if (params.status) qs.set("status", params.status);
    if (params.position) qs.set("position", params.position);
    if (params.employeeType) qs.set("employeeType", params.employeeType);
    if (params.hasAccount !== undefined) qs.set("hasAccount", String(params.hasAccount));
    return await api.getRaw<PaginatedResponse<Employee>>(`/api/staff/employees?${qs}`);
  },

  createEmployee: async (data: Partial<Employee>) => {
    return await api.post<Employee>("/api/staff/employees", data);
  },

  updateEmployee: async (id: string, data: Partial<Employee>) => {
    return await api.put<Employee>(`/api/staff/employees/${id}`, data);
  },

  deactivateEmployee: async (id: string, reason: string) => {
    return await api.put<Employee>(`/api/staff/employees/${id}/deactivate`, { reason });
  },

  reactivateEmployee: async (id: string, reason: string) => {
    return await api.put<Employee>(`/api/staff/employees/${id}/activate`, { reason });
  },

  getAvailability: async (employeeId: string) => {
    return await api.get<Availability>(`/api/staff/employees/${employeeId}/availability`);
  },

  updateAvailability: async (
    employeeId: string,
    data: { availableDays: string[]; availableTimeRanges: { start: string; end: string }[] }
  ) => {
    return await api.put<Availability>(`/api/staff/employees/${employeeId}/availability`, data);
  },

  getEmployeeByAccountId: async (accountId: string) => {
    return await api.get<Employee>(`/api/staff/employees/by-account/${accountId}`);
  },

  getEmployeeShifts: async (employeeId: string, params: { page?: number; limit?: number; date?: string; status?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    if (params.date) qs.set("date", params.date);
    if (params.status) qs.set("status", params.status);
    return await api.getRaw<PaginatedResponse<Shift>>(`/api/staff/employees/${employeeId}/shifts?${qs}`);
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

  cancelShift: async (id: string, reason: string) => {
    return await api.deleteWithBody<Shift>(`/api/staff/shifts/${id}`, { reason });
  },

  getShiftById: async (shiftId: string) => {
    return await api.get<Shift & { assignments?: Assignment[] }>(`/api/staff/shifts/${shiftId}`);
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

  // ── Attendance ──
  checkIn: async (shiftId: string, employeeId: string) => {
    return await api.post<Attendance>("/api/staff/attendance/check-in", { shiftId, employeeId });
  },

  checkOut: async (shiftId: string, employeeId: string) => {
    return await api.post<Attendance>("/api/staff/attendance/check-out", { shiftId, employeeId });
  },

  getAttendanceByEmployee: async (employeeId: string, params: { page?: number; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    return await api.getRaw<PaginatedResponse<Attendance>>(`/api/staff/attendance/employee/${employeeId}?${qs}`);
  },

  getAttendanceSummary: async (employeeId: string, month: string) => {
    return await api.get(`/api/staff/attendance/summary/${employeeId}?month=${month}`);
  },

  getAllAttendance: async (params: { page?: number; limit?: number; date?: string; shiftId?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    if (params.date) qs.set("date", params.date);
    if (params.shiftId) qs.set("shiftId", params.shiftId);
    return await api.getRaw<PaginatedResponse<Attendance>>(`/api/staff/attendance?${qs}`);
  },
};
