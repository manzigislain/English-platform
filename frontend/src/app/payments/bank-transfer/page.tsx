"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, Upload, CheckCircle2, Copy, Loader2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";

const bankAccounts = [
  { bank: "Da Afghanistan Bank", accountName: "English Dari Learning Platform", accountNumber: "1234567890", branch: "Kabul Main Branch", swift: "DABAAFKA" },
  { bank: "Azizi Bank", accountName: "English Dari Learning Platform", accountNumber: "0987654321", branch: "Kabul Downtown", swift: "AZIZAFKA" },
];

function BankTransferForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("planId") || "";
  const amount = searchParams.get("amount") || "0";
  const [selectedBank, setSelectedBank] = useState(0);
  const [receiptUrl, setReceiptUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const [success, setSuccess] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (index: number) => {
    const acc = bankAccounts[index];
    const text = `Bank: ${acc.bank}\nAccount Name: ${acc.accountName}\nAccount No: ${acc.accountNumber}\nBranch: ${acc.branch}\nSWIFT: ${acc.swift}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

  const handleSubmit = async () => {
    if (!receiptUrl) { setStatus("Please provide a receipt URL"); return; }
    if (!planId) { setStatus("Invalid plan selected"); return; }
    setSubmitting(true);
    setStatus("Uploading receipt...");
    try {
      const res = await api.payments.bankTransfer(planId, receiptUrl, notes);
      setSuccess(true);
      setStatus("Receipt submitted! Awaiting admin approval.");
    } catch (err: any) {
      setStatus(err.message || "Upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {success ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-500" />
          <h2 className="mb-2 text-2xl font-bold text-green-700">Receipt Submitted!</h2>
          <p className="mb-6 text-green-600">Your receipt has been uploaded. An admin will review it shortly.</p>
          <Link href="/student/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-medium text-white">Go to Dashboard</Link>
        </div>
      ) : (
        <>
          <div className="mb-8 space-y-4">
            <h2 className="text-lg font-bold">Bank Account Details</h2>
            {bankAccounts.map((acc, idx) => (
              <div key={idx} className={`rounded-2xl border p-6 transition-all ${selectedBank === idx ? "border-primary bg-primary/5" : "border-border bg-white"}`}>
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input type="radio" checked={selectedBank === idx} onChange={() => setSelectedBank(idx)} className="h-4 w-4 accent-primary" />
                    <h3 className="font-bold">{acc.bank}</h3>
                  </div>
                  <button onClick={() => handleCopy(idx)} className="flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium">
                    {copiedIndex === idx ? "✓ Copied" : <><Copy className="h-3 w-3" /> Copy</>}
                  </button>
                </div>
                <div className="ml-6 mt-3 space-y-1 text-sm text-text-light">
                  <p><span className="font-medium text-text">Account Name:</span> {acc.accountName}</p>
                  <p><span className="font-medium text-text">Account Number:</span> {acc.accountNumber}</p>
                  <p><span className="font-medium text-text">Branch:</span> {acc.branch}</p>
                  <p><span className="font-medium text-text">SWIFT:</span> {acc.swift}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold">Upload Receipt</h2>
            {status && status.includes("fail") && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="h-4 w-4" /> {status}</div>
            )}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium">Receipt Image URL</label>
              <input type="url" value={receiptUrl} onChange={(e) => setReceiptUrl(e.target.value)} placeholder="https://example.com/receipt.jpg" className="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-primary" />
            </div>
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium">Notes (Optional)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add notes..." rows={3} className="w-full resize-none rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-primary" />
            </div>
            <button onClick={handleSubmit} disabled={submitting || !receiptUrl} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 font-medium text-white disabled:opacity-50">
              {submitting ? <><Loader2 className="h-5 w-5 animate-spin" /> Processing...</> : <><Upload className="h-5 w-5" /> Submit Receipt</>}
            </button>
          </div>
        </>
      )}
    </>
  );
}

export default function BankTransferPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/pricing" className="mb-6 flex items-center gap-2 text-sm text-text-light hover:text-text"><ArrowLeft className="h-4 w-4" /> Back to Plans</Link>
      <div className="mb-8 text-center">
        <Building2 className="mx-auto mb-4 h-12 w-12 text-primary" />
        <h1 className="text-3xl font-bold">Bank Transfer</h1>
      </div>
      <Suspense fallback={<div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}>
        <BankTransferForm />
      </Suspense>
    </div>
  );
}
