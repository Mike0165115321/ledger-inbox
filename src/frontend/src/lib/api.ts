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
    account_id?: string;
    party_id?: string;
    month?: string;
  }) => {
    const qs = new URLSearchParams();
    if (params?.type) qs.set("type", params.type);
    if (params?.project_id) qs.set("project_id", params.project_id);
    if (params?.account_id) qs.set("account_id", params.account_id);
    if (params?.party_id) qs.set("party_id", params.party_id);
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

  // ── Accounts ──
  getAccounts: (isActive?: boolean) => {
    const qs = isActive !== undefined ? `?is_active=${isActive}` : "";
    return request<Account[]>(`/api/accounts${qs}`);
  },

  createAccount: (data: AccountFormData) =>
    request<Account>("/api/accounts", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateAccount: (id: string, data: Partial<AccountFormData>) =>
    request<Account>(`/api/accounts/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteAccount: (id: string) =>
    request<{ message: string }>(`/api/accounts/${id}`, {
      method: "DELETE",
    }),

  // ── Parties ──
  getParties: (type?: string) => {
    const qs = type ? `?type=${type}` : "";
    return request<Party[]>(`/api/parties${qs}`);
  },

  createParty: (data: PartyFormData) =>
    request<Party>("/api/parties", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateParty: (id: string, data: Partial<PartyFormData>) =>
    request<Party>(`/api/parties/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteParty: (id: string) =>
    request<{ message: string }>(`/api/parties/${id}`, {
      method: "DELETE",
    }),

  // ── Owner Profile ──
  getOwnerProfile: () => request<OwnerProfile>("/api/owner-profile"),

  updateOwnerProfile: (data: OwnerProfileFormData) =>
    request<OwnerProfile>("/api/owner-profile", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // ── Documents ──
  getDocuments: () => request<Document[]>("/api/documents"),

  updateDocument: (id: string, data: { document_type?: string; project_id?: string | null }) =>
    request<Document>(`/api/documents/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteDocument: (id: string) =>
    request<{ message: string }>(`/api/documents/${id}`, {
      method: "DELETE",
    }),

  getDocumentFileUrl: (docId: string) =>
    `${API_BASE}/api/documents/${docId}/file`,

  uploadDocument: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const url = `${API_BASE}/api/documents/upload`;
    const res = await fetch(url, { method: "POST", body: formData });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ detail: res.statusText }));
      throw new ApiError(body.detail || "อัปโหลดไม่สำเร็จ", res.status);
    }
    return res.json() as Promise<QueuedUploadResponse>;
  },

  uploadDocumentsBatch: async (files: File[]) => {
    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    const url = `${API_BASE}/api/documents/upload/batch`;
    const res = await fetch(url, { method: "POST", body: formData });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ detail: res.statusText }));
      throw new ApiError(body.detail || "อัปโหลดไม่สำเร็จ", res.status);
    }
    return res.json() as Promise<{ queued: number; items: QueuedUploadResponse[] }>;
  },

  // ── Statement Import ──
  importStatement: async (file: File, accountId: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("account_id", accountId);
    const res = await fetch(`${API_BASE}/api/statements/import`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ detail: res.statusText }));
      throw new ApiError(body.detail || "นำเข้าไม่สำเร็จ", res.status);
    }
    return res.json() as Promise<StatementImportResult>;
  },

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
  getServiceHealth: () => request<ServiceHealth>("/api/health/model"),
  getQueueStatus: () => request<QueueStatus>("/api/health/queue"),

  // ── Timeline ──
  getTimeline: (params?: { granularity?: "day" | "week" | "month" | "year"; year?: number }) => {
    const qs = new URLSearchParams();
    if (params?.granularity) qs.set("granularity", params.granularity);
    if (params?.year) qs.set("year", String(params.year));
    const query = qs.toString();
    return request<TimelineResponse>(`/api/dashboard/timeline${query ? `?${query}` : ""}`);
  },

  // ── Tax & Export ──
  getTaxCalculation: (year?: number) =>
    request<TaxCalculationResponse>(`/api/dashboard/tax-calculation${year ? `?year=${year}` : ""}`),

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
  account_id: string | null;
  party_id: string | null;
  tax_relevant: boolean;
  withholding_tax_amount: number | null;
  vat_amount: number | null;
  source: string;
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
  account_id?: string | null;
  party_id?: string | null;
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
  document_type: string;
  project_id: string | null;
  created_at: string;
}

export interface Account {
  id: string;
  name: string;
  type: string;
  bank_name: string | null;
  owner_name: string | null;
  account_number_masked: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccountFormData {
  name: string;
  type?: string;
  bank_name?: string | null;
  owner_name?: string | null;
  account_number_masked?: string | null;
  is_active?: boolean;
}

export interface Party {
  id: string;
  name: string;
  type: string;
  tax_id: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  default_category: string | null;
  default_project_id: string | null;
  withholding_rate: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PartyFormData {
  name: string;
  type?: string;
  tax_id?: string | null;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  default_category?: string | null;
  default_project_id?: string | null;
  withholding_rate?: number | null;
  notes?: string | null;
}

export interface OwnerProfile {
  id: string;
  name: string | null;
  tax_id: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  updated_at: string;
}

export interface OwnerProfileFormData {
  name?: string | null;
  tax_id?: string | null;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
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

export interface ServiceHealth {
  gemini_configured: boolean;
  service: string;
  model: string;
  limits: { rpm: number; rpd: number };
}

export interface QueueStatus {
  queue_size: number;
  is_processing: boolean;
  rate_limited: boolean;
  rate_limit_reset_at: string | null;
  // Usage (of real)
  requests_today: number;
  rpm_used: number;
  tpm_used: number;
  // Limits (from .env)
  rpm_limit: number;
  tpm_limit: number;
  rpd_limit: number;
  // Misc
  last_processed_at: string | null;
  last_error: string | null;
}

export interface StatementImportResult {
  document_id: string;
  account: string;
  total_rows: number;
  created: number;
  skipped_duplicates: number;
  suspected_duplicates: number;
  parse_errors: string[];
  message: string;
}

export interface QueuedUploadResponse {
  document_id?: string;
  file_name: string;
  processing_status: string;  // "queued" | "error"
  queue_position?: number;
  error?: string;
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

export interface TimelineResponse {
  granularity: string;
  year: number;
  data: TimelinePoint[];
}

export interface TimelinePoint {
  period: string;
  income: number;
  expense: number;
  count: number;
}

export interface TaxCalculationResponse {
  year: number;
  gross_income: number;
  total_expenses: number;
  expense_deduction: number;
  income_after_expenses: number;
  allowances: { label: string; amount: number }[];
  total_allowances: number;
  net_taxable_income: number;
  brackets: TaxBracketLine[];
  total_tax: number;
  effective_rate: number;
  note: string;
}

export interface TaxBracketLine {
  label: string;
  rate: number;
  rate_pct: string;
  taxable: number;
  tax: number;
}
