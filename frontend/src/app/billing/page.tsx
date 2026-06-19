"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BadgeCheck, CreditCard, Download, ExternalLink, Loader2, RefreshCcw, XCircle } from "lucide-react";
import { api } from "@/lib/api";

export default function BillingPage() {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");

  const loadBilling = async () => {
    setError("");
    try {
      const [subs, pays, invs] = await Promise.all([
        api.subscriptions.getMy(),
        api.payments.getMyPayments(),
        api.payments.getMyInvoices(),
      ]);
      setSubscriptions(subs);
      setPayments(pays);
      setInvoices(invs);
    } catch (err: any) {
      setError(err.message || "Failed to load billing details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem("accessToken")) {
      router.push("/auth/login?redirect=billing");
      return;
    }

    loadBilling();
    const interval = window.setInterval(loadBilling, 30000);
    return () => window.clearInterval(interval);
  }, [router]);

  const activeSubscription = subscriptions.find((sub) => sub.status === "ACTIVE") || subscriptions[0];

  const openPortal = async () => {
    setActionLoading("portal");
    try {
      const { url } = await api.payments.createCustomerPortal(window.location.href);
      window.location.href = url;
    } catch (err: any) {
      setError(err.message || "Could not open Stripe portal");
      setActionLoading("");
    }
  };

  const cancelSubscription = async (id: string) => {
    setActionLoading(`cancel-${id}`);
    try {
      await api.subscriptions.cancelAtStripe(id, true);
      await loadBilling();
    } catch (err: any) {
      setError(err.message || "Could not cancel subscription");
    } finally {
      setActionLoading("");
    }
  };

  const resumeSubscription = async (id: string) => {
    setActionLoading(`resume-${id}`);
    try {
      await api.subscriptions.resume(id);
      await loadBilling();
    } catch (err: any) {
      setError(err.message || "Could not resume subscription");
    } finally {
      setActionLoading("");
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link href="/student/dashboard" className="mb-6 flex items-center gap-2 text-sm text-text-light hover:text-text">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Billing</h1>
          <p className="mt-2 text-text-light">Manage your subscription, invoices, and payment history.</p>
        </div>
        <button
          onClick={openPortal}
          disabled={actionLoading === "portal"}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-medium text-white hover:bg-primary-dark disabled:opacity-50"
        >
          {actionLoading === "portal" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
          Stripe Portal
        </button>
      </div>

      {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <section className="mb-8 rounded-lg border border-border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <BadgeCheck className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold">Premium Status</h2>
        </div>
        {activeSubscription ? (
          <div className="grid gap-4 md:grid-cols-4">
            <BillingMetric label="Current Plan" value={activeSubscription.plan?.name || "Unknown"} />
            <BillingMetric label="Status" value={activeSubscription.status} />
            <BillingMetric
              label={activeSubscription.cancelAtPeriodEnd ? "Access Until" : "Renewal Date"}
              value={activeSubscription.currentPeriodEnd || activeSubscription.endDate ? new Date(activeSubscription.currentPeriodEnd || activeSubscription.endDate).toLocaleDateString() : "N/A"}
            />
            <BillingMetric label="Auto Renew" value={activeSubscription.autoRenew && !activeSubscription.cancelAtPeriodEnd ? "On" : "Off"} />
          </div>
        ) : (
          <div className="rounded-lg bg-gray-50 p-6 text-center">
            <p className="text-text-light">No active subscription found.</p>
            <Link href="/pricing" className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 font-medium text-white">
              Upgrade Plan
            </Link>
          </div>
        )}

        {activeSubscription?.stripeSubscriptionId && (
          <div className="mt-6 flex flex-wrap gap-3">
            {activeSubscription.cancelAtPeriodEnd ? (
              <button
                onClick={() => resumeSubscription(activeSubscription.id)}
                disabled={actionLoading === `resume-${activeSubscription.id}`}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 font-medium hover:border-primary disabled:opacity-50"
              >
                {actionLoading === `resume-${activeSubscription.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                Resume Subscription
              </button>
            ) : (
              <button
                onClick={() => cancelSubscription(activeSubscription.id)}
                disabled={actionLoading === `cancel-${activeSubscription.id}`}
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                {actionLoading === `cancel-${activeSubscription.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                Cancel at Period End
              </button>
            )}
            <Link href="/pricing" className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 font-medium hover:border-primary">
              <CreditCard className="h-4 w-4" />
              Upgrade Plan
            </Link>
          </div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-bold">Invoices</h2>
        <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
          <BillingTable
            empty="No invoices yet."
            rows={invoices.map((invoice) => ({
              id: invoice.id,
              cells: [
                invoice.stripeInvoiceId,
                invoice.status,
                formatMoney(invoice.amountPaid || invoice.amountDue, invoice.currency),
                new Date(invoice.createdAt).toLocaleDateString(),
                invoice.hostedInvoiceUrl ? (
                  <a className="inline-flex items-center gap-1 text-primary hover:underline" href={invoice.hostedInvoiceUrl} target="_blank" rel="noreferrer">
                    <Download className="h-4 w-4" /> Open
                  </a>
                ) : "N/A",
              ],
            }))}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">Payment History</h2>
        <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
          <BillingTable
            empty="No payments yet."
            rows={payments.map((payment) => ({
              id: payment.id,
              cells: [
                payment.plan?.name || "Subscription",
                payment.status,
                payment.paymentMethod || "N/A",
                formatMoney(payment.amount, payment.currency),
                new Date(payment.createdAt).toLocaleDateString(),
              ],
            }))}
          />
        </div>
      </section>
    </div>
  );
}

function BillingMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-4">
      <div className="text-xs uppercase text-text-light">{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}

function BillingTable({ rows, empty }: { rows: { id: string; cells: ReactNode[] }[]; empty: string }) {
  if (!rows.length) return <div className="p-6 text-center text-sm text-text-light">{empty}</div>;
  return (
    <div className="divide-y divide-border">
      {rows.map((row) => (
        <div key={row.id} className="grid gap-3 p-4 text-sm md:grid-cols-5">
          {row.cells.map((cell, index) => (
            <div key={index} className={index === 0 ? "font-medium" : "text-text-light"}>
              {cell}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function formatMoney(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount || 0);
}
