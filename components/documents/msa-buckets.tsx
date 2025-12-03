"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Calendar, FileText, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMsaBucketsQuery } from "@/lib/queries";
import type { ApiDocument } from "@/lib/api";

const currencyFormatter = (value: number, currency?: string | null) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 0
  }).format(value || 0);

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString() : "—";

interface BucketColumnProps {
  title: string;
  documents: ApiDocument[];
  emptyHelper: string;
  onDelete?: (doc: ApiDocument) => void;
  deletingId?: string | null;
}

function BucketColumn({ title, documents, emptyHelper, onDelete, deletingId }: BucketColumnProps) {
  return (
    <div className="rounded-2xl border border-slate-900/60 bg-slate-900/40 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-white">{title}</p>
        <span className="text-xs text-slate-400">{documents.length} doc(s)</span>
      </div>
      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
        {documents.length === 0 ? (
          <p className="text-xs text-slate-500">{emptyHelper}</p>
        ) : (
          documents.map((doc) => {
            const isDeleting = deletingId === doc.id;
            return (
              <div key={doc.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-800/70 bg-slate-900/70 p-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{doc.title || doc.client}</p>
                <p className="text-xs text-slate-400">
                  {doc.category} • {doc.po_number || doc.invoice_number || doc.msa_number || doc.id}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Doc date: {formatDate(doc.created_at)} • Due: {formatDate(doc.due_date)}
                </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right text-sm font-semibold text-emerald-300">
                    {currencyFormatter(doc.amount, doc.currency)}
                    {doc.pdf_url && (
                      <Link
                        href={doc.pdf_url}
                        target="_blank"
                        className="block text-xs text-brand-300 hover:text-brand-100"
                      >
                        View
                      </Link>
                    )}
                  </div>
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(doc)}
                      disabled={isDeleting}
                      className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-2 text-rose-200 transition hover:bg-rose-500/20 disabled:opacity-60"
                      title="Delete document"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export function MsaBuckets() {
  const { data, isLoading, isError } = useMsaBucketsQuery();
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [msaInput, setMsaInput] = useState("");
  const [savingMsa, setSavingMsa] = useState(false);

  const handleDelete = async (doc: ApiDocument) => {
    if (deletingId) return;
    if (!window.confirm(`Delete document "${doc.title || doc.id}"?`)) {
      return;
    }
    setDeletingId(doc.id);
    try {
      const response = await fetch(`/api/documents/${doc.id}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || "Failed to delete document");
      }
      await queryClient.invalidateQueries({ queryKey: ["msa-buckets"] });
    } catch (error) {
      console.error("Failed to delete document:", error);
      alert("Failed to delete document. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleStartTagging = (doc: ApiDocument) => {
    setEditingId(doc.id);
    setMsaInput(doc.msa_number || doc.po_number || doc.invoice_number || "");
  };

  const handleSaveMsa = async (doc: ApiDocument) => {
    if (!msaInput.trim()) {
      alert("Please enter an MSA number (e.g., MSA-2025-001).");
      return;
    }
    setSavingMsa(true);
    try {
      const response = await fetch(`/api/documents/${doc.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ msa_number: msaInput.trim() })
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || "Failed to tag MSA number");
      }
      await queryClient.invalidateQueries({ queryKey: ["msa-buckets"] });
      setEditingId(null);
      setMsaInput("");
    } catch (error) {
      console.error("Failed to update MSA number:", error);
      alert("Failed to update MSA number. Please try again.");
    } finally {
      setSavingMsa(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setMsaInput("");
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-900/60 bg-slate-900/70 p-6 text-sm text-slate-300 flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-brand-300" />
        Loading MSA buckets…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-6 text-sm text-rose-200">
        Unable to load MSA buckets. Please try again after refreshing.
      </div>
    );
  }

  const buckets = data?.buckets ?? [];

  return (
    <section className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <p className="text-xs uppercase text-slate-500">Portfolio coverage</p>
          <h2 className="text-2xl font-semibold text-white">MSA Buckets</h2>
        </div>
        <p className="text-xs text-slate-500">
          Buckets group POs and invoices that reference the same Master Service Agreement number.
        </p>
      </div>

      {buckets.length === 0 ? (
        <div className="rounded-2xl border border-slate-900/60 bg-slate-900/40 p-12 text-center text-slate-400">
          No MSA references detected in processed documents yet.
        </div>
      ) : (
        <div className="space-y-6">
          {buckets.map((bucket) => {
            const msaCurrency = bucket.msa_documents[0]?.currency || bucket.po_documents[0]?.currency || "USD";
            return (
              <div key={bucket.msa_number} className="space-y-4 rounded-2xl border border-slate-900/80 bg-slate-950/60 p-6 shadow-xl shadow-slate-950/40">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs uppercase text-slate-500">MSA Number</p>
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold text-white">{bucket.msa_number}</h3>
                      {bucket.expiring_soon && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-3 py-1 text-xs text-amber-200">
                          <AlertTriangle className="h-3 w-3" />
                          Expiring in {bucket.days_until_expiry} days
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3" />
                      End date: {formatDate(bucket.expires_on)} | Start from first upload timeline
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-right">
                    <div>
                      <p className="text-xs text-slate-500">MSA Value</p>
                      <p className="text-base font-semibold text-emerald-300">
                        {currencyFormatter(bucket.total_msa_value, msaCurrency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">PO Value</p>
                      <p className="text-base font-semibold text-blue-300">
                        {currencyFormatter(bucket.total_po_value, msaCurrency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Invoice Value</p>
                      <p className="text-base font-semibold text-slate-200">
                        {currencyFormatter(bucket.total_invoice_value, msaCurrency)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <BucketColumn title="Service Agreements" documents={bucket.msa_documents} emptyHelper="No agreements matched this number yet." onDelete={handleDelete} deletingId={deletingId} />
                  <BucketColumn title="Purchase Orders" documents={bucket.po_documents} emptyHelper="No purchase orders reference this MSA." onDelete={handleDelete} deletingId={deletingId} />
                  <BucketColumn title="Invoices" documents={bucket.invoice_documents} emptyHelper="No invoices reference this MSA." onDelete={handleDelete} deletingId={deletingId} />
                </div>

                {bucket.other_documents.length > 0 && (
                  <div className="rounded-2xl border border-slate-900/60 bg-slate-900/40 p-4">
                    <p className="text-xs uppercase text-slate-500 mb-2">Other linked documents</p>
                    <div className="flex flex-wrap gap-2">
                      {bucket.other_documents.map((doc) => (
                        <span key={doc.id} className="inline-flex items-center gap-1 rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-300">
                          <FileText className="h-3 w-3" />
                          {doc.title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {data?.unlinked_documents?.length ? (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-100">
            <AlertTriangle className="h-4 w-4" />
            Documents without detectable MSA number ({data.unlinked_documents.length})
          </div>
          <p className="mt-1 text-xs text-amber-200">
            Upload cleaner copies or tag the MSA number manually so they can be bucketed automatically.
          </p>
          <div className="mt-4 space-y-3">
            {data.unlinked_documents.map((doc) => (
              <div key={doc.id} className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-50">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{doc.title}</p>
                    <p className="text-xs text-amber-200">{doc.category}</p>
                  </div>
                  {editingId !== doc.id ? (
                    <button
                      type="button"
                      onClick={() => handleStartTagging(doc)}
                      className="rounded-full border border-amber-400 px-3 py-1 text-xs uppercase tracking-wide text-amber-200 hover:bg-amber-500/10"
                    >
                      Tag MSA
                    </button>
                  ) : null}
                </div>
                {editingId === doc.id && (
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      className="flex-1 rounded-lg border border-amber-500/40 bg-transparent px-3 py-2 text-sm text-white placeholder:text-amber-200/60 focus:border-amber-300 focus:outline-none"
                      placeholder="MSA-2025-001"
                      value={msaInput}
                      onChange={(event) => setMsaInput(event.target.value)}
                      disabled={savingMsa}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveMsa(doc)}
                        disabled={savingMsa}
                        className="rounded-lg bg-amber-400/90 px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-amber-300 disabled:opacity-60"
                      >
                        {savingMsa ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        disabled={savingMsa}
                        className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs text-amber-200 hover:bg-amber-500/10 disabled:opacity-60"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

