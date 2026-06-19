"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { XCircle, Home, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

function PaymentCancelContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const sessionIdParam = searchParams.get("session_id");
    setSessionId(sessionIdParam);
  }, [searchParams]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        <XCircle className="mx-auto h-16 w-16 text-red-500" />
        
        <h1 className="mt-6 text-3xl font-bold text-gray-900">Payment Cancelled</h1>
        
        <p className="mt-4 text-lg text-text-light">
          Your payment was cancelled. Your card was not charged.
        </p>

        {sessionId && (
          <p className="mt-2 break-all text-sm text-gray-500">
            Session ID: <code className="font-mono">{sessionId}</code>
          </p>
        )}

        <div className="mt-8 space-y-3">
          <p className="text-sm text-text-light">
            You can try again anytime to complete your subscription. We offer multiple payment methods for your convenience.
          </p>

          <div className="rounded-lg bg-amber-50 p-4 text-left">
            <h3 className="font-semibold text-amber-900">Why cancel?</h3>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-amber-800">
              <li>No charges were made to your account</li>
              <li>You can return to try again later</li>
              <li>We offer multiple payment methods</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <button
            onClick={() => router.push("/pricing")}
            className="block w-full rounded-lg bg-primary py-3 font-semibold text-white hover:bg-primary-dark transition-colors"
          >
            Try Again
          </button>
          
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-lg border-2 border-border py-3 font-semibold text-text hover:border-primary transition-colors"
          >
            <Home className="h-5 w-5" />
            Back to Home
          </Link>
        </div>

        <p className="mt-6 text-xs text-text-light">
          Need help? <a href="mailto:support@example.com" className="text-primary hover:underline">Contact support</a>
        </p>
      </div>
    </div>
  );
}

export default function PaymentCancelPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
          <Loader2 className="mx-auto h-16 w-16 animate-spin text-primary" />
          <h1 className="mt-6 text-3xl font-bold text-gray-900">Loading...</h1>
        </div>
      </div>
    }>
      <PaymentCancelContent />
    </Suspense>
  );
}
