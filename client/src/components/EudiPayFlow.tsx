import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, ShieldCheck, X, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { QRCodeSVG } from "qrcode.react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

const EU_BLUE = "#003399";
const EU_YELLOW = "#FFCC00";

const DEMO_MERCHANT = {
  name: "Albert Heijn",
  location: "Den Haag Centrum · Kassa 4",
  amount: 2495,
  currency: "EUR",
  session: "ah-pay-7x4k9",
  iban: "NL91ABNA0417164300",
  kvk: "35012085",
};

const QR_DATA = `wespr://eudi-pay?merchant=Albert+Heijn&session=${DEMO_MERCHANT.session}&amount=2495&currency=EUR&version=eidas2`;

function EuStars({ size = 40, spinning = false }: { size?: number; spinning?: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      animate={spinning ? { rotate: 360 } : {}}
      transition={spinning ? { repeat: Infinity, duration: 8, ease: "linear" } : {}}
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

type Phase = "qr" | "detecting" | "eudi_auth" | "confirm" | "paying" | "success";

export default function EudiPayFlow({ onBack, user }: { onBack: () => void; user: any }) {
  const [phase, setPhase] = useState<Phase>("qr");
  const [eudiStep, setEudiStep] = useState(0);

  const eudiSteps = [
    "QR-code herkend",
    "Sessie beveiligen (TLS 1.3)",
    "Merchant authenticeren",
    "Identiteit verifiëren (eIDAS 2.0)",
  ];

  useEffect(() => {
    if (phase === "detecting") {
      const t = setTimeout(() => setPhase("eudi_auth"), 1800);
      return () => clearTimeout(t);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === "eudi_auth") {
      let step = 0;
      const interval = setInterval(() => {
        step++;
        setEudiStep(step);
        if (step >= eudiSteps.length) {
          clearInterval(interval);
          setTimeout(() => setPhase("confirm"), 600);
        }
      }, 700);
      return () => clearInterval(interval);
    }
  }, [phase]);

  const payMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/transactions", {
        type: "debit",
        amount: DEMO_MERCHANT.amount,
        description: `${DEMO_MERCHANT.name} · EUDI Pay`,
        receiptData: {
          merchant: DEMO_MERCHANT.name,
          location: DEMO_MERCHANT.location,
          total: DEMO_MERCHANT.amount,
          items: [
            { name: "Boodschappen", quantity: 1, price: 1850 },
            { name: "Kaas 500g", quantity: 1, price: 345 },
            { name: "Brood", quantity: 1, price: 175 },
            { name: "Melk 1L", quantity: 1, price: 125 },
          ],
          paidWith: "EUDI Wallet · eIDAS 2.0",
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      setPhase("success");
    },
    onError: () => {
      setPhase("confirm");
    },
  });

  const handleConfirm = () => {
    setPhase("paying");
    payMutation.mutate();
  };

  const fmtAmount = (cents: number) =>
    `€\u00A0${Math.floor(cents / 100).toLocaleString("nl-NL")},${(cents % 100).toString().padStart(2, "0")}`;

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="px-4 py-4 flex items-center gap-3 bg-emerald-600 text-white sticky top-0 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="text-white hover:bg-white/20 rounded-full -ml-2"
          data-testid="btn-eudi-pay-back"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold tracking-tight flex-1">W€spr Pay · EUDI</h1>
        <div className="h-7 w-7 rounded-full bg-[#003399] flex items-center justify-center">
          <EuStars size={28} />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto hide-scrollbar">
        <AnimatePresence mode="wait">

          {/* ── Fase 1: Kassa QR ── */}
          {phase === "qr" && (
            <motion.div
              key="qr"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center px-6 pt-8 pb-10"
            >
              <div
                className="w-full max-w-sm rounded-3xl p-6 text-white mb-6 shadow-xl"
                style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)" }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-white/60 uppercase tracking-widest">Betaalverzoek</p>
                    <p className="font-bold text-lg">{DEMO_MERCHANT.name}</p>
                    <p className="text-xs text-white/50">{DEMO_MERCHANT.location}</p>
                  </div>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: EU_BLUE }}
                  >
                    <EuStars size={36} />
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 flex items-center justify-center mb-4">
                  <QRCodeSVG
                    value={QR_DATA}
                    size={180}
                    fgColor={EU_BLUE}
                    bgColor="white"
                    level="M"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/50">Te betalen</p>
                    <p className="text-3xl font-bold tracking-tight">{fmtAmount(DEMO_MERCHANT.amount)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-white/40">Sessie</p>
                    <p className="text-xs font-mono text-white/60">{DEMO_MERCHANT.session}</p>
                  </div>
                </div>
              </div>

              <div className="w-full max-w-sm bg-[#003399]/8 rounded-2xl px-5 py-4 mb-6 border border-[#003399]/20">
                <div className="flex items-center gap-2 mb-1">
                  <EuStars size={20} />
                  <p className="text-[13px] font-semibold text-[#003399]">EUDI Wallet betaling</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Scan de QR-code met je W€spr EUDI Wallet. Je identiteit wordt geverifieerd via eIDAS 2.0 en de betaling wordt in één stap afgerond.
                </p>
              </div>

              <Button
                className="w-full max-w-sm h-14 rounded-2xl text-base font-bold gap-3 shadow-lg"
                style={{ background: EU_BLUE }}
                onClick={() => setPhase("detecting")}
                data-testid="btn-scan-qr"
              >
                <EuStars size={22} />
                QR-code scannen met EUDI Wallet
              </Button>

              <p className="text-xs text-muted-foreground mt-4 text-center">
                Beveiligd met OpenID4VP · eIDAS 2.0 · TLS 1.3
              </p>
            </motion.div>
          )}

          {/* ── Fase 2: Detecteren ── */}
          {phase === "detecting" && (
            <motion.div
              key="detecting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center px-6 pt-24 pb-10 gap-6"
            >
              <div className="relative flex items-center justify-center w-28 h-28">
                <div className="absolute inset-0 rounded-full bg-[#003399]/10 animate-ping" />
                <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background: EU_BLUE }}>
                  <EuStars size={72} spinning />
                </div>
              </div>
              <div className="text-center">
                <p className="font-bold text-lg">QR-code detecteren…</p>
                <p className="text-sm text-muted-foreground mt-1">Verbinding maken met {DEMO_MERCHANT.name}</p>
              </div>
            </motion.div>
          )}

          {/* ── Fase 3: EUDI Authenticatie ── */}
          {phase === "eudi_auth" && (
            <motion.div
              key="eudi_auth"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center px-6 pt-12 pb-10 gap-8"
            >
              <div className="relative flex items-center justify-center w-28 h-28">
                <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background: EU_BLUE }}>
                  <EuStars size={72} spinning />
                </div>
              </div>

              <div className="text-center">
                <p className="font-bold text-xl text-[#003399]">EUDI Wallet</p>
                <p className="text-sm text-muted-foreground">Identiteit verifiëren</p>
              </div>

              <div className="w-full max-w-sm space-y-3">
                {eudiSteps.map((step, i) => (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: i < eudiStep ? 1 : 0.3, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${i < eudiStep ? "bg-emerald-500" : "bg-muted border border-border"}`}
                    >
                      {i < eudiStep ? (
                        <Check className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <span className="text-[10px] text-muted-foreground font-bold">{i + 1}</span>
                      )}
                    </div>
                    <span className={`text-sm ${i < eudiStep ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                      {step}
                    </span>
                  </motion.div>
                ))}
              </div>

              <div className="text-[11px] text-muted-foreground text-center">
                Zero-knowledge proof genereren · Geen data opgeslagen
              </div>
            </motion.div>
          )}

          {/* ── Fase 4: Bevestigen ── */}
          {phase === "confirm" && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col px-4 pt-6 pb-10 gap-4"
            >
              <div className="text-center mb-2">
                <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold mb-3">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Identiteit geverifieerd via EUDI Wallet
                </div>
                <p className="text-2xl font-bold">Betaling bevestigen</p>
              </div>

              <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
                <div className="px-4 py-4 border-b border-border/40 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center">
                    <span className="text-white font-black text-sm">AH</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-[15px]">{DEMO_MERCHANT.name}</p>
                    <p className="text-xs text-muted-foreground">{DEMO_MERCHANT.location}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <EuStars size={18} />
                    <span className="text-[10px] font-bold text-[#003399]">Geverifieerd</span>
                  </div>
                </div>

                <div className="px-4 py-4 space-y-3">
                  {[
                    { label: "Naam", value: user?.displayName || "Gebruiker" },
                    { label: "W€spr ID", value: user?.auraId || "—" },
                    { label: "Methode", value: "EUDI Wallet · eIDAS 2.0" },
                    { label: "Datum", value: new Date().toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" }) },
                  ].map((item, i) => (
                    <div key={i}>
                      {i > 0 && <div className="border-t border-border/30 mb-3" />}
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                        <span className="text-sm font-medium">{item.value}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="px-4 py-4 bg-emerald-50 border-t border-emerald-100 flex items-center justify-between">
                  <span className="font-semibold text-[#1a1a1a]">Te betalen</span>
                  <span className="text-2xl font-black text-emerald-700">{fmtAmount(DEMO_MERCHANT.amount)}</span>
                </div>
              </div>

              <div className="bg-[#003399]/6 border border-[#003399]/15 rounded-2xl px-4 py-3 flex items-start gap-3">
                <EuStars size={28} />
                <div>
                  <p className="text-xs font-bold text-[#003399]">Zero-knowledge bewijs</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Alleen leeftijds­verificatie en nationaliteit worden gedeeld. Naam, adres en BSN blijven privé.
                  </p>
                </div>
              </div>

              <Button
                className="w-full h-14 rounded-2xl text-base font-bold bg-emerald-600 hover:bg-emerald-700 shadow-lg mt-2"
                onClick={handleConfirm}
                data-testid="btn-confirm-eudi-pay"
              >
                Betalen · {fmtAmount(DEMO_MERCHANT.amount)}
              </Button>

              <Button
                variant="ghost"
                className="w-full rounded-xl text-muted-foreground"
                onClick={onBack}
                data-testid="btn-cancel-eudi-pay"
              >
                <X className="w-4 h-4 mr-1.5" /> Annuleren
              </Button>
            </motion.div>
          )}

          {/* ── Fase 5: Betalen ── */}
          {phase === "paying" && (
            <motion.div
              key="paying"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center px-6 pt-24 pb-10 gap-6"
            >
              <div className="relative w-28 h-28 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-40" />
                <div className="w-24 h-24 rounded-full bg-emerald-600 flex items-center justify-center">
                  <EuStars size={72} spinning />
                </div>
              </div>
              <div className="text-center">
                <p className="font-bold text-lg">Betaling verwerken…</p>
                <p className="text-sm text-muted-foreground">Even geduld</p>
              </div>
            </motion.div>
          )}

          {/* ── Fase 6: Succes ── */}
          {phase === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center px-4 pt-10 pb-10 gap-5"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.1 }}
                className="w-24 h-24 rounded-full bg-emerald-600 flex items-center justify-center shadow-xl"
              >
                <Check className="w-12 h-12 text-white stroke-[3]" />
              </motion.div>

              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <p className="text-2xl font-black">Betaald!</p>
                <p className="text-3xl font-bold text-emerald-600 mt-1">{fmtAmount(DEMO_MERCHANT.amount)}</p>
                <p className="text-sm text-muted-foreground mt-1">{DEMO_MERCHANT.name} · {DEMO_MERCHANT.location}</p>
              </motion.div>

              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="w-full max-w-sm bg-card rounded-2xl shadow-sm overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-border/40 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#003399]" />
                  <p className="text-xs font-bold text-[#003399] uppercase tracking-wide">EUDI Verificatie Bewijs</p>
                </div>
                {[
                  { label: "Protocol", value: "OpenID4VP · eIDAS 2.0" },
                  { label: "Merchant", value: `${DEMO_MERCHANT.name} (KvK ${DEMO_MERCHANT.kvk})` },
                  { label: "Betaalmethode", value: "W€spr EUDI Wallet" },
                  { label: "Gedeelde data", value: "Leeftijd ≥18 · NL Nationaliteit" },
                  { label: "Verborgen data", value: "Naam · Adres · BSN · E-mail" },
                  { label: "Tijdstip", value: new Date().toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) },
                ].map((item, i) => (
                  <div key={i} className={`px-4 py-2.5 ${i < 5 ? "border-b border-border/30" : ""}`}>
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[11px] text-muted-foreground flex-shrink-0">{item.label}</span>
                      <span className="text-[11px] font-medium text-right">{item.value}</span>
                    </div>
                  </div>
                ))}
              </motion.div>

              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="w-full max-w-sm"
              >
                <Button
                  className="w-full h-13 rounded-2xl font-bold bg-emerald-600 hover:bg-emerald-700"
                  onClick={onBack}
                  data-testid="btn-eudi-pay-done"
                >
                  Klaar
                </Button>
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
