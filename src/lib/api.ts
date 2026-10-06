const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

export class ApiError extends Error {
  status: string;
  httpStatus: number;
  constructor(message: string, status: string, httpStatus: number) {
    super(message);
    this.status = status;
    this.httpStatus = httpStatus;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new ApiError(
      "Couldn't reach the server. Make sure the backend is running.",
      "network_error",
      0
    );
  }

  let data: Record<string, unknown> | null = null;
  try { data = await response.json(); } catch { /* no body */ }

  if (!response.ok) {
    throw new ApiError(
      (data?.message as string) ?? "Something went wrong.",
      (data?.status as string) ?? "error",
      response.status
    );
  }

  return data as T;
}

const get  = <T>(path: string) => request<T>(path, { method: "GET" });
const post = <T>(path: string, body: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(body) });
const patch = <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined });

// ── Admin ─────────────────────────────────────────────────
export const loginAdmin = (body: { email: string; password: string }) =>
  post<{ status: string; adminId: number; fullName: string }>("/admin/login", body);

export const getDashboardOverview = () =>
  get<{
    ordersToday: number;
    pendingDeliveries: number;
    lowStockCount: number;
    lowStockItems: unknown[];
    salesToday: number;
    unresolvedComplaints: number;
    complaints: unknown[];
    staffStats: unknown[];
  }>("/admin/dashboard");

export const changeAdminPassword = (body: { adminId: number; currentPassword: string; newPassword: string }) =>
  post<{ status: string; message: string }>("/admin/change-password", body);

// ── Staff ─────────────────────────────────────────────────
export const loginStaff = (body: { email: string; password: string }) =>
  post<{ status: string; staffId: number; fullName: string }>("/staff/login", body);

export const listStaff = () =>
  get<{ status: string; staff: unknown[] }>("/staff");

export const addStaff = (body: { fullName: string; email: string; phone: string; password: string }) =>
  post<{ status: string; staffId: number }>("/staff", body);

export const toggleStaff = (id: number, isActive: boolean) =>
  patch<{ status: string }>(`/staff/${id}/toggle`, { isActive });

export const getStaffDeliveries = (id: number) =>
  get<{ status: string; deliveries: unknown[]; stats: unknown }>(`/staff/${id}/deliveries`);

export const getAllStaffStats = () =>
  get<{ status: string; stats: unknown[] }>("/staff/stats");

// ── Orders ───────────────────────────────────────────────
export const placeOrder = (body: unknown) =>
  post<{ status: string; orderId: number; assignedStaff?: { id: number; fullName: string } }>("/orders", body);

export const listOrders = () =>
  get<{ status: string; orders: unknown[] }>("/orders");

export const getOrder = (id: number) =>
  get<{ status: string; order: unknown; items: unknown[] }>(`/orders/${id}`);

export const cancelOrder = (id: number) =>
  patch<{ status: string }>(`/orders/${id}/cancel`);

// ── Deliveries ────────────────────────────────────────────
export const listDeliveries = () =>
  get<{ status: string; deliveries: unknown[] }>("/deliveries");

export const listComplaints = () =>
  get<{ status: string; complaints: unknown[] }>("/deliveries/complaints");

export const dispatchDelivery = (id: number, staffId: number) =>
  patch<{ status: string; message: string }>(
    `/deliveries/${id}/dispatch`,
    { staffId }
  );

export const confirmDelivery = (id: number) =>
  patch<{ status: string }>(`/deliveries/${id}/confirm`);

export const fileComplaint = (id: number, body: { complaintType: string; note?: string }) =>
  post<{ status: string }>(`/deliveries/${id}/complaint`, body);

export const resolveComplaint = (id: number) =>
  patch<{ status: string }>(`/deliveries/${id}/resolve`);

// ── Stocks ────────────────────────────────────────────────
export const listStocks = () =>
  get<{ status: string; stocks: unknown[] }>("/stocks");

export const adjustStock = (body: { productId: string; type: "add" | "subtract"; quantity: number; adminId: number }) =>
  post<{ status: string }>("/stocks/adjust", body);

export const updateThreshold = (body: { productId: string; threshold: number }) =>
  post<{ status: string }>("/stocks/threshold", body);

// ── Sales ─────────────────────────────────────────────────
export const listSales = (from?: string, to?: string) => {
  const params = from && to ? `?from=${from}&to=${to}` : "";
  return get<{ status: string; sales: unknown[] }>(`/sales${params}`);
};

export const getSalesSummary = (from?: string, to?: string) => {
  const params = from && to ? `?from=${from}&to=${to}` : "";

  return get<{ status: string; summary: unknown[] }>(
    `/sales/summary${params}`
  );
};
// ── Public stocks (for landing page) ─────────────────────
export const getPublicStocks = () =>
  get<{ status: string; stocks: unknown[] }>("/stocks");
