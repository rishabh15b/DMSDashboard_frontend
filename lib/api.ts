const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface ApiDocument {
  id: string;
  title: string;
  category: string;
  client: string;
  vendor?: string | null;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  due_date?: string | null;
  confidence: number;
  linked_to?: string | null;
  pdf_url?: string | null;
  po_number?: string | null;
  invoice_number?: string | null;
  msa_number?: string | null;
}

export interface MsaBucket {
  msa_number: string;
  msa_documents: ApiDocument[];
  po_documents: ApiDocument[];
  invoice_documents: ApiDocument[];
  other_documents: ApiDocument[];
  total_msa_value: number;
  total_po_value: number;
  total_invoice_value: number;
  expires_on?: string | null;
  days_until_expiry?: number | null;
  expiring_soon: boolean;
}

export interface MsaBucketResponse {
  buckets: MsaBucket[];
  unlinked_documents: ApiDocument[];
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  // Use Next.js API routes as proxy (they now forward to backend)
  // This allows for better error handling and CORS management
  const url = path.startsWith('/api/') ? path : `${baseUrl}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers
    },
    credentials: "include",
    cache: "no-store" // Always fetch fresh data
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request to ${path} failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function fetchDashboardInsights() {
  return apiFetch<import("@/lib/data/sample-data").DashboardInsights>("/api/dashboard/");
}

export function fetchDocuments() {
  return apiFetch<{ documents: import("@/lib/data/sample-data").DocumentRecord[] }>(
    "/api/documents/"
  );
}

export function fetchDocumentById(id: string) {
  return apiFetch<{
    document: import("@/lib/data/sample-data").DocumentRecord;
    relatedExceptions: import("@/lib/data/sample-data").ExceptionRecord[];
    relatedAlerts: import("@/lib/data/sample-data").AlertRecord[];
  }>(`/api/documents/${id}`);
}

export function fetchExceptions() {
  return apiFetch<{ exceptions: import("@/lib/data/sample-data").ExceptionRecord[] }>(
    "/api/exceptions/"
  );
}

export function fetchAlerts() {
  return apiFetch<{ alerts: import("@/lib/data/sample-data").AlertRecord[] }>("/api/alerts/");
}

export function fetchMsaBuckets() {
  return apiFetch<MsaBucketResponse>("/api/documents/msa-buckets");
}

export function sendChatMessage(
  message: string,
  context?: Array<{ role: "user" | "assistant"; content: string }>
) {
  return apiFetch<{ reply: string }>("/api/chat/", {
    method: "POST",
    body: JSON.stringify({ message, context })
  });
}
