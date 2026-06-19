"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Clock, Loader2, Home, Receipt } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"checking" | "active" | "pending" | "error">("checking");
  const [message, setMessage] = useState("Confirming your Stripe payment...");
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      setMessage("Missing Stripe checkout session id.");
      return;
    }

    let attempts = 0;
    let cancelled = false;

    const poll = async () => {
      try {
        const result = await api.payments.getStripeCheckoutStatus(sessionId);
        if (cancelled) return;

        setSubscription(result.subscription);
        if (result.payment?.status === "COMPLETED" && result.subscription?.status === "ACTIVE") {
          setStatus("active");
          setMessage("Your subscription is active and premium content is unlocked.");
          return;
        }

        attempts += 1;
        setStatus("pending");
        setMessage("Payment received. Waiting for subscription activation...");
        if (attempts < 12) window.setTimeout(poll, 5000);
      } catch (err: any) {
        if (cancelled) return;
        attempts += 1;
        setStatus(attempts < 3 ? "pending" : "error");
        setMessage(err.message || "Could not confirm payment yet.");
        if (attempts < 12) window.setTimeout(poll, 5000);
      }
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const Icon = status === "active" ? CheckCircle2 : status === "error" ? Clock : Loader2;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-green-50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
        <Icon className={`mx-auto h-16 w-16 ${status === "active" ? "text-green-500" : "text-primary"} ${status !== "active" ? "animate-spin" : ""}`} />

        <h1 className="mt-6 text-3xl font-bold text-gray-900">
          {status === "active" ? "Payment Successful" : "Confirming Payment"}
        </h1>

        <p className="mt-4 text-lg text-text-light">{message}</p>

        {subscription?.plan && (
          <div className="mt-6 rounded-lg bg-blue-50 p-4 text-left text-sm text-blue-900">
            <div className="font-semibold">{subscription.plan.name} plan</div>
            <div>Status: {subscription.status}</div>
            {subscription.currentPeriodEnd && (
              <div>Renews: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</div>
            )}
          </div>
        )}

        {sessionId && (
          <p className="mt-4 break-all text-xs text-gray-500">
            Session ID: <code className="font-mono">{sessionId}</code>
          </p>
        )}

        <div className="mt-8 space-y-3">
          <button
            onClick={() => router.push("/student/dashboard")}
            className="block w-full rounded-lg bg-primary py-3 font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            Go to Dashboard
          </button>

          <Link
            href="/billing"
            className="flex items-center justify-center gap-2 rounded-lg border-2 border-border py-3 font-semibold text-text transition-colors hover:border-primary"
          >
            <Receipt className="h-5 w-5" />
            View Billing
          </Link>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-lg border-2 border-border py-3 font-semibold text-text transition-colors hover:border-primary"
          >
            <Home className="h-5 w-5" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center bg-green-50 px-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
          <Loader2 className="mx-auto h-16 w-16 animate-spin text-primary" />
          <h1 className="mt-6 text-3xl font-bold text-gray-900">Loading...</h1>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
