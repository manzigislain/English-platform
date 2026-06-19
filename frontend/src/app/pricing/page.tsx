"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ArrowLeft, Zap, Shield, CreditCard, Building2, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

const planColors: Record<string, string> = {
  SEED: "from-green-400 to-emerald-600",
  GROWTH: "from-blue-400 to-indigo-600",
  SUCCESS: "from-amber-400 to-yellow-600",
};

const planIcons: Record<string, string> = { SEED: "🌱", GROWTH: "🌿", SUCCESS: "🌳" };

export default function PricingPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "paypal" | "bank" | null>(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);

  useEffect(() => {
    api.subscriptions.getPlans()
      .then(setPlans)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSelectPlan = async (plan: any) => {
    setSelectedPlan(plan);
    const token = localStorage.getItem("accessToken");
    if (!token) { router.push(`/auth/login?redirect=pricing`); return; }

    if (plan.type === "SEED") {
      setActivating(true);
      setStatusMsg("Activating free plan...");
      try {
        await api.subscriptions.activateFree();
        setStatusMsg("Free plan activated! Redirecting...");
        setTimeout(() => router.push("/student/dashboard"), 1000);
      } catch (err: any) {
        setStatusMsg(err.message || "Activation failed");
        setActivating(false);
      }
    } else {
      setShowPaymentOptions(true);
    }
  };

  const handleStripe = async () => {
    if (!selectedPlan) return;
    setActivating(true);
    setPaymentMethod("stripe");
    setStatusMsg("Redirecting to Stripe Checkout...");
    try {
      const successUrl = `${window.location.origin}/payments/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${window.location.origin}/payments/cancel?session_id={CHECKOUT_SESSION_ID}`;
      
      const { sessionId, url } = await api.payments.createStripeCheckout(
        selectedPlan.id,
        successUrl,
        cancelUrl,
      );

      if (url) {
        window.location.href = url;
      } else {
        setStatusMsg("Failed to create checkout session");
        setActivating(false);
      }
    } catch (err: any) {
      setStatusMsg(err.message || "Payment failed");
      setActivating(false);
    }
  };

  const handlePayPal = async () => {
    if (!selectedPlan) return;
    setActivating(true);
    setPaymentMethod("paypal");
    setStatusMsg("Creating PayPal order...");
    try {
      const order = await api.payments.createPayPalOrder(selectedPlan.id);
      setStatusMsg("PayPal order created! Redirecting to PayPal...");
      window.open(`https://www.paypal.com/checkout?token=${order.paypalOrderId}`, "_blank");
      await api.payments.capturePayPalOrder(order.paymentId, order.paypalOrderId);
      setStatusMsg("Payment successful! Activating subscription...");
      setTimeout(() => router.push("/dashboard"), 1000);
    } catch (err: any) {
      setStatusMsg(err.message || "Payment failed");
      setActivating(false);
    }
  };

  const handleBankTransfer = () => {
    if (!selectedPlan) return;
    router.push(`/payments/bank-transfer?planId=${selectedPlan.id}&amount=${selectedPlan.price}`);
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link href="/" className="mb-6 flex items-center gap-2 text-sm text-text-light hover:text-text">
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </Link>

      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold">Choose Your Plan</h1>
        <p className="mt-4 text-lg text-text-light">Pick the plan that fits your learning journey</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {plans.map((plan) => {
          const features = (plan.features as Record<string, any>) || {};
          return (
            <div
              key={plan.id}
              className={`group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:shadow-xl ${
                selectedPlan?.id === plan.id ? "ring-2 ring-primary" : "border-border"
              } ${plan.type === "GROWTH" ? "md:scale-105" : ""}`}
            >
              {plan.type === "GROWTH" && (
                <div className="absolute right-0 top-0 rounded-bl-xl bg-primary px-4 py-1 text-xs font-medium text-white">
                  Most Popular
                </div>
              )}
              <div className={`bg-gradient-to-r ${planColors[plan.type]} p-6 text-white`}>
                <div className="mb-1 text-sm font-semibold opacity-80">{plan.type === "SEED" ? "Free" : plan.type === "GROWTH" ? "Paid" : "Premium"}</div>
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{planIcons[plan.type]}</span>
                  <h3 className="text-2xl font-bold">{plan.name}</h3>
                </div>
                <div className="mt-2 text-3xl font-bold">
                  {plan.price === 0 ? "Free" : `$${plan.price.toFixed(2)}`}
                  {plan.price > 0 && <span className="text-lg font-normal opacity-80">/mo</span>}
                </div>
              </div>
              <div className="p-6">
                <ul className="mb-6 space-y-3">
                  {Object.entries(features).map(([key, val]) => (
                    <li key={key} className="flex items-center gap-3 text-sm">
                      {val ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                      ) : (
                        <div className="h-4 w-4 shrink-0 rounded-full border-2 border-gray-200" />
                      )}
                      <span className={val ? "" : "text-text-light"}>{key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={activating && selectedPlan?.id === plan.id}
                  className={`w-full rounded-xl py-3 font-medium transition-all ${
                    plan.type === "SEED"
                      ? "border-2 border-primary text-primary hover:bg-primary hover:text-white"
                      : "bg-primary text-white hover:bg-primary-dark"
                  } disabled:opacity-50`}
                >
                  {activating && selectedPlan?.id === plan.id ? (
                    <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Processing...</span>
                  ) : plan.price === 0 ? "Get Started Free" : "Subscribe Now"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment Method Selection */}
      {showPaymentOptions && selectedPlan && selectedPlan.price > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
            <h2 className="mb-2 text-2xl font-bold">Complete Payment</h2>
            <p className="mb-6 text-text-light">
              {planIcons[selectedPlan.type]} <strong>{selectedPlan.name}</strong> — ${selectedPlan.price.toFixed(2)}/mo
            </p>

            {statusMsg && (
              <div className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">{statusMsg}</div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleStripe}
                disabled={activating}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 py-4 font-medium text-white transition-all hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
              >
                {activating && paymentMethod === "stripe" ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <CreditCard className="h-5 w-5" />
                )}
                Pay with Card (Stripe)
              </button>

              <button
                onClick={handlePayPal}
                disabled={activating}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#0070BA] py-4 font-medium text-white transition-all hover:bg-[#003087] disabled:opacity-50"
              >
                {activating && paymentMethod === "paypal" ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <CreditCard className="h-5 w-5" />
                )}
                Pay with PayPal
              </button>

              <button
                onClick={handleBankTransfer}
                disabled={activating}
                className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-border py-4 font-medium text-text transition-all hover:border-primary disabled:opacity-50"
              >
                <Building2 className="h-5 w-5" />
                Bank Transfer (Offline)
              </button>
            </div>

            <button onClick={() => { setShowPaymentOptions(false); setPaymentMethod(null); setStatusMsg(""); }} className="mt-4 w-full text-center text-sm text-text-light hover:text-text">
              Cancel
            </button>
          </div>
        </div>
      )}

      {!showPaymentOptions && (
        <div className="mt-12 rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
          <h3 className="mb-4 text-lg font-bold">Need Help Deciding?</h3>
          <p className="mx-auto max-w-md text-text-light">
            Start with the free Seed plan. You can upgrade to Growth or Success anytime as you progress.
          </p>
        </div>
      )}
    </div>
  );
}
