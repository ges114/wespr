import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ShieldCheck, Bell } from "lucide-react";
import { Button } from "./ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";

const EU_BLUE = "#003399";
const EU_YELLOW = "#FFCC00";

function EuStars({ size = 32, spinning = false }: { size?: number; spinning?: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      animate={spinning ? { rotate: 360 } : {}}
      transition={spinning ? { repeat: Infinity, duration: 6, ease: "linear" } : {}}
    >
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i * 30 - 90) * (Math.PI / 180);
        const r = 38;
        const x = 50 + r * Math.cos(angle);
        const y = 50 + r * Math.sin(angle);
        return (
          <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="14" fill={EU_YELLOW}>
            ★
          </text>
        );
      })}
    </motion.svg>
  );
}

interface PayRequest {
  session: string;
  merchantName: string;
  merchantLocation: string;
  merchantKvk: string;
  amount: number;
  items: { name: string; quantity: number; price: number }[];
}

type Phase = "incoming" | "eudi_auth" | "approving" | "success" | "rejected";

export default function IncomingPaymentModal({
  onDismiss,
  initialRequest,
}: {
  onDismiss: () => void;
  initialRequest?: PayRequest;
}) {
  const [payRequest, setPayRequest] = useState<PayRequest | null>(initialRequest || null);
  const [phase, setPhase] = useState<Phase>("incoming");
  const [eudiProgress, setEudiProgress] = useState(0);
  const [polling, setPolling] = useState(!initialRequest);

  const fmtAmount = (cents: number) =>
    `€\u00A0${Math.floor(cents / 100).toLocaleString("nl-NL")},${(cents % 100).toString().padStart(2, "0")}`;

  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/pay-request/incoming", { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.session && data.status === "pending") {
          setPayRequest(data);
          setPolling(false);
        }
      } catch {}
    }, 2500);
    return () => clearInterval(interval);
  }, [polling]);

  const handleApprove = async () => {
    if (!payRequest) return;
    setPhase("eudi_auth");
    let step = 0;
    const steps = 4;
    const interval = setInterval(() => {
      step++;
      setEudiProgress(step);
      if (step >= steps) {
        clearInterval(interval);
        setTimeout(async () => {
          setPhase("approving");
          try {
            await apiRequest("POST", `/api/pay-request/${payRequest.session}/approve`, {});
            queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
            queryClient.invalidateQueries({ queryKey: ["/api/me"] });
            setPhase("success");
          } catch {
            setPhase("incoming");
          }
        }, 400);
      }
    }, 600);
  };

  const handleReject = async () => {
    if (!payRequest) return;
    try {
      await fetch(`/api/pay-request/${payRequest.session}/reject`, { method: "POST", credentials: "include" });
    } catch {}
    setPhase("rejected");
    setTimeout(onDismiss, 1800);
  };

  if (!payRequest) {
    return (
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-sm">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-card rounded-2xl shadow-xl border border-border/40 px-4 py-3 flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-full bg-[#003399] flex items-center justify-center flex-shrink-0">
            <EuStars size={28} spinning />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Wachten op betaalverzoek…</p>
            <p className="text-xs text-muted-foreground">EUDI Wallet luistert</p>
          </div>
          <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={phase === "incoming" ? handleReject : undefined}
      />

      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative w-full max-w-sm bg-card rounded-t-3xl shadow-2xl overflow-hidden pb-8"
      >
        <AnimatePresence mode="wait">

          {phase === "incoming" && (
            <motion.div key="incoming" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="px-5 pt-5 pb-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#003399] flex items-center justify-center">
                    <EuStars size={28} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#003399] uppercase tracking-wide">Inkomend betaalverzoek</p>
                    <p className="text-[10px] text-muted-foreground">EUDI Wallet · eIDAS 2.0</p>
                  </div>
                  <div className="ml-auto">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    </span>
                  </div>
                </div>

                <div className="bg-muted/40 rounded-2xl p-4 mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-black text-xs">
                        {payRequest.merchantName.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-[15px]">{payRequest.merchantName}</p>
                      <p className="text-xs text-muted-foreground">{payRequest.merchantLocation}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#003399]" />
                      <span className="text-[10px] font-bold text-[#003399]">KvK {payRequest.merchantKvk}</span>
                    </div>
                  </div>

                  {payRequest.items.length > 0 && (
                    <div className="space-y-1 mb-3 border-t border-border/30 pt-2">
                      {payRequest.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{item.quantity}× {item.name}</span>
                          <span className="font-medium">€ {(item.price / 100).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between items-center border-t border-border/40 pt-2">
                    <span className="text-sm font-semibold">Totaal</span>
                    <span className="text-2xl font-black text-foreground">{fmtAmount(payRequest.amount)}</span>
                  </div>
                </div>

                <div className="bg-[#003399]/6 border border-[#003399]/15 rounded-xl px-3 py-2 flex items-center gap-2 mb-5">
                  <EuStars size={20} />
                  <p className="text-[11px] text-muted-foreground">
                    Identiteit via EUDI Wallet · Alleen leeftijd & nationaliteit gedeeld
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-2xl h-12 border-red-200 text-red-500 hover:bg-red-50"
                    onClick={handleReject}
                    data-testid="btn-reject-payment"
                  >
                    <X className="w-4 h-4 mr-1.5" /> Weigeren
                  </Button>
                  <Button
                    className="flex-1 rounded-2xl h-12 font-bold bg-emerald-600 hover:bg-emerald-700"
                    onClick={handleApprove}
                    data-testid="btn-approve-payment"
                  >
                    <Check className="w-4 h-4 mr-1.5" /> Betalen
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {phase === "eudi_auth" && (
            <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-5 pt-8 pb-6 flex flex-col items-center gap-5">
              <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: EU_BLUE }}>
                <EuStars size={60} spinning />
              </div>
              <div className="text-center">
                <p className="font-bold text-lg text-[#003399]">EUDI verificatie</p>
                <p className="text-sm text-muted-foreground">Identiteit controleren…</p>
              </div>
              <div className="w-full space-y-2">
                {["QR herkend", "Sessie beveiligd", "Merchant geverifieerd", "Identiteit bevestigd"].map((s, i) => (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${i < eudiProgress ? "bg-emerald-500" : "bg-muted border border-border"}`}>
                      {i < eudiProgress && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className={`text-sm ${i < eudiProgress ? "font-medium" : "text-muted-foreground"}`}>{s}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {phase === "approving" && (
            <motion.div key="approving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-5 pt-10 pb-8 flex flex-col items-center gap-4">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-50" />
                <div className="w-20 h-20 rounded-full bg-emerald-600 flex items-center justify-center">
                  <EuStars size={56} spinning />
                </div>
              </div>
              <p className="font-bold text-lg">Betaling verwerken…</p>
            </motion.div>
          )}

          {phase === "success" && (
            <motion.div key="success" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="px-5 pt-8 pb-6 flex flex-col items-center gap-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 14 }}
                className="w-20 h-20 rounded-full bg-emerald-600 flex items-center justify-center"
              >
                <Check className="w-10 h-10 text-white stroke-[3]" />
              </motion.div>
              <div className="text-center">
                <p className="text-2xl font-black">Betaald!</p>
                <p className="text-3xl font-bold text-emerald-600">{fmtAmount(payRequest.amount)}</p>
                <p className="text-sm text-muted-foreground mt-1">{payRequest.merchantName}</p>
              </div>
              <div className="w-full bg-[#003399]/6 border border-[#003399]/15 rounded-xl px-4 py-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#003399] flex-shrink-0" />
                <p className="text-[11px] text-muted-foreground">Geverifieerd via EUDI Wallet · OpenID4VP · eIDAS 2.0</p>
              </div>
              <Button className="w-full rounded-2xl h-12 bg-emerald-600 hover:bg-emerald-700 font-bold" onClick={onDismiss} data-testid="btn-payment-done">
                Klaar
              </Button>
            </motion.div>
          )}

          {phase === "rejected" && (
            <motion.div key="rejected" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pt-8 pb-6 flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <X className="w-8 h-8 text-red-500" />
              </div>
              <p className="font-bold text-lg">Betaling geweigerd</p>
              <p className="text-sm text-muted-foreground">Het betaalverzoek is afgewezen</p>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  );
}
