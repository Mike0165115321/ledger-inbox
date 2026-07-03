/**
 * API client for Ledger Inbox backend (FastAPI :8000)
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(body.detail || "เกิดข้อผิดพลาด", res.status);
  }

  return res.json();
}

export const api = {
  // ── Dashboard ──
  getDashboardSummary: (year?: number) =>
    request<DashboardSummary>(
      `/api/dashboard/summary${year ? `?year=${year}` : ""}`
    ),

  // ── Transactions ──
  getTransactions: (params?: {
    type?: string;
    project_id?: string;
    month?: string;
  }) => {
    const qs = new URLSearchParams();
    if (params?.type) qs.set("type", params.type);
    if (params?.project_id) qs.set("project_id", params.project_id);
    if (params?.month) qs.set("month", params.month);
    const query = qs.toString();
    return request<Transaction[]>(`/api/transactions${query ? `?${query}` : ""}`);
  },

  getTransaction: (id: string) => request<Transaction>(`/api/transactions/${id}`),

  createTransaction: (data: TransactionFormData) =>
    request<Transaction>("/api/transactions", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateTransaction: (id: string, data: Partial<TransactionFormData>) =>
    request<Transaction>(`/api/transactions/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteTransaction: (id: string) =>
    request<{ message: string }>(`/api/transactions/${id}`, {
      method: "DELETE",
    }),

  // ── Projects ──
  getProjects: () => request<ProjectWithStats[]>("/api/projects"),

  getProject: (id: string) => request<ProjectWithStats>(`/api/projects/${id}`),

  createProject: (data: ProjectFormData) =>
    request<Project>("/api/projects", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateProject: (id: string, data: Partial<ProjectFormData>) =>
    request<Project>(`/api/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteProject: (id: string) =>
    request<{ message: string }>(`/api/projects/${id}`, {
      method: "DELETE",
    }),

  // ── Documents ──
  getDocuments: () => request<Document[]>("/api/documents"),

  uploadDocument: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const url = `${API_BASE}/api/documents/upload`;
    const res = await fetch(url, { method: "POST", body: formData });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ detail: res.statusText }));
      throw new ApiError(body.detail || "อัปโหลดไม่สำเร็จ", res.status);
    }
    return res.json();
  },

  processDocument: (id: string) =>
    request<SlipProcessResponse>(`/api/documents/${id}/process`, {
      method: "POST",
    }),

  retryEasySlip: (id: string) =>
    request<SlipProcessResponse>(`/api/documents/${id}/retry-easyslip`, {
      method: "POST",
    }),

  // ── Review ──
  getReviewQueue: () =>
    request<Transaction[]>(
      "/api/transactions?review_status=pending"
    ),

  confirmTransaction: (id: string) =>
    request<Transaction>(`/api/transactions/${id}/confirm`, {
      method: "POST",
    }),

  rejectTransaction: (id: string) =>
    request<{ message: string }>(`/api/transactions/${id}/reject`, {
      method: "POST",
    }),

  // ── Health ──
  getModelHealth: () => request<ModelHealth>("/api/health/model"),

  // ── Tax & Export ──
  getTaxSummary: (year?: number) =>
    request<TaxSummary>(`/api/dashboard/tax-summary${year ? `?year=${year}` : ""}`),

  exportTransactions: (format: "csv" | "xlsx", projectId?: string, year?: number) => {
    const qs = new URLSearchParams({ format });
    if (projectId) qs.set("project_id", projectId);
    if (year) qs.set("year", String(year));
    return `${API_BASE}/api/export/transactions?${qs.toString()}`;
  },

  exportTaxSummary: (year?: number) => {
    const qs = year ? `?year=${year}` : "";
    return `${API_BASE}/api/export/tax-summary${qs}`;
  },

  // ── Categories ──
  getCategories: () => request<Category[]>("/api/categories"),
};

// ── Types ──

export interface DashboardSummary {
  total_income: number;
  total_expense: number;
  profit: number;
  transaction_count: number;
  monthly_breakdown: MonthlyBreakdown[];
  top_projects: TopProject[];
}

export interface MonthlyBreakdown {
  month: string;
  income: number;
  expense: number;
}

export interface TopProject {
  project_id: string;
  income: number;
  expense: number;
}

export interface Transaction {
  id: string;
  type: string;
  category: string | null;
  amount: number;
  currency: string;
  transaction_datetime: string | null;
  sender_name: string | null;
  receiver_name: string | null;
  bank_or_wallet: string | null;
  reference_no: string | null;
  note: string | null;
  confidence: number;
  review_status: string;
  duplicate_status: string;
  project_id: string | null;
  document_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionFormData {
  type: string;
  category?: string | null;
  amount: number;
  currency?: string;
  transaction_datetime?: string | null;
  sender_name?: string | null;
  receiver_name?: string | null;
  bank_or_wallet?: string | null;
  reference_no?: string | null;
  note?: string | null;
  project_id?: string | null;
  document_id?: string | null;
  review_status?: string | null;
}

export interface Project {
  id: string;
  name: string;
  client_name: string | null;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectWithStats extends Project {
  total_income: number;
  total_expense: number;
  profit: number;
  transaction_count: number;
}

export interface ProjectFormData {
  name: string;
  client_name?: string | null;
  status?: string;
  started_at?: string | null;
  ended_at?: string | null;
}

export interface Document {
  id: string;
  file_name: string;
  file_type: string;
  file_path: string;
  file_sha256: string | null;
  file_size: number | null;
  uploaded_at: string;
  processing_status: string;
  error_message: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  type: string;
  created_at: string;
}

export interface SlipProcessResponse {
  document_id: string;
  transaction_id?: string | null;
  processing_status: string;
  extraction?: SlipExtraction | null;
  review_status?: string | null;
  error_message?: string | null;
}

export interface SlipExtraction {
  amount: number | null;
  currency: string;
  transaction_datetime: string | null;
  sender_name: string | null;
  receiver_name: string | null;
  bank_or_wallet: string | null;
  reference_no: string | null;
  note: string | null;
  confidence: number;
  warnings: string[];
}

export interface ModelHealth {
  ollama_running: boolean;
  primary_model: string;
  primary_available: boolean;
  fallback_model: string;
  fallback_available: boolean;
  ready: boolean;
}

export interface TaxSummary {
  year: number;
  total_income: number;
  total_expense: number;
  estimated_profit: number;
  transaction_count: number;
  income_count: number;
  expense_count: number;
  expense_categories: { name: string; amount: number }[];
  monthly_breakdown: { month: string; income: number; expense: number }[];
  tax_bracket_note: string;
}
