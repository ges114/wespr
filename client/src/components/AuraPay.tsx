import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, QrCode, ScanLine, Wallet, TrendingUp, Landmark, Bitcoin, ChevronRight, Settings as SettingsIcon, X, Send, User, CreditCard, Smartphone, Shield, ShieldCheck, AlertCircle, RotateCcw, Camera, Check, Copy, Lock, Eye, EyeOff, Power, Globe, Bell, Plus, Building2, Pencil, Trash2, ShoppingBag, HeartPulse, GraduationCap, Train, Plane, Bike, Car, Coffee, Ticket, Music, Film, Tv, Trophy, Puzzle, Gamepad2, Home, Star, Target, MapPin, Zap, PiggyBank, Receipt, Banknote, HandCoins, CircleDollarSign, BadgePercent, FileDown, Loader2, Fingerprint } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "./ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import jsQR from "jsqr";
import jsPDF from "jspdf";
import ReceiptScanner from "./ReceiptScanner";
import EudiPayFlow from "./EudiPayFlow";
import IncomingPaymentModal from "./IncomingPaymentModal";
import KassaTerminalScreen from "./KassaTerminalScreen";
import { QRCodeSVG } from "qrcode.react";

type PayAction = null | "scan" | "receive" | "transfer" | "cards" | "transactions" | "transaction_detail" | "scan_receipt";

const PAY_ICON_MAP: Record<string, LucideIcon> = {
  Wallet, Building2, Landmark, CreditCard, Shield, TrendingUp, Bitcoin,
  PiggyBank, Receipt, Banknote, HandCoins, CircleDollarSign, BadgePercent,
  ShoppingBag, HeartPulse, GraduationCap, Train, Plane, Bike, Car, Coffee,
  Ticket, Music, Film, Tv, Trophy, Puzzle, Gamepad2, Home, Star, Target,
  MapPin, Zap, Globe,
};

const PAY_AVAILABLE_ICONS = [
  { name: "Wallet", icon: Wallet }, { name: "PiggyBank", icon: PiggyBank },
  { name: "Banknote", icon: Banknote }, { name: "CreditCard", icon: CreditCard },
  { name: "HandCoins", icon: HandCoins }, { name: "CircleDollarSign", icon: CircleDollarSign },
  { name: "BadgePercent", icon: BadgePercent }, { name: "Receipt", icon: Receipt },
  { name: "TrendingUp", icon: TrendingUp }, { name: "Building2", icon: Building2 },
  { name: "Landmark", icon: Landmark }, { name: "Shield", icon: Shield },
  { name: "ShoppingBag", icon: ShoppingBag }, { name: "HeartPulse", icon: HeartPulse },
  { name: "GraduationCap", icon: GraduationCap }, { name: "Home", icon: Home },
  { name: "Car", icon: Car }, { name: "Globe", icon: Globe },
  { name: "Star", icon: Star }, { name: "Zap", icon: Zap },
  { name: "MapPin", icon: MapPin }, { name: "Coffee", icon: Coffee },
  { name: "Music", icon: Music }, { name: "Trophy", icon: Trophy },
];

function getPayIcon(name: string): LucideIcon {
  return PAY_ICON_MAP[name] || Wallet;
}

function usePayLongPress(onLongPress: () => void, onClick?: () => void, delay = 500) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);
  const start = useCallback(() => {
    longPressTriggered.current = false;
    timerRef.current = setTimeout(() => { longPressTriggered.current = true; onLongPress(); }, delay);
  }, [onLongPress, delay]);
  const clear = useCallback(() => { if (timerRef.current) clearTimeout(timerRef.current); }, []);
  const handleClick = useCallback(() => { if (!longPressTriggered.current && onClick) onClick(); }, [onClick]);
  return { onMouseDown: start, onTouchStart: start, onMouseUp: clear, onMouseLeave: clear, onTouchEnd: clear, onClick: handleClick };
}

// ─── Rabobank Pay Flow ────────────────────────────────────────────────────────

async function eudiTriggerWebAuthn(onStateChange: (s: "scanning" | "idle") => void): Promise<"success" | "cancelled" | "fallback"> {
  const isInIframe = window !== window.parent;
  if (!isInIframe && typeof window !== "undefined" && (window as any).PublicKeyCredential) {
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const storedCredId = localStorage.getItem("wespr_biometric_cred_id");
      let didSucceed = false;
      if (storedCredId) {
        try {
          const credBytes = Uint8Array.from(atob(storedCredId), c => c.charCodeAt(0));
          const assertion = await navigator.credentials.get({
            publicKey: { challenge, rpId: window.location.hostname, allowCredentials: [{ type: "public-key", id: credBytes, transports: ["internal"] as AuthenticatorTransport[] }], userVerification: "required", timeout: 60000 },
          });
          if (assertion) didSucceed = true;
        } catch { localStorage.removeItem("wespr_biometric_cred_id"); }
      }
      if (!didSucceed) {
        const credential = await navigator.credentials.create({
          publicKey: { challenge, rp: { name: "W\u20acspr EUDI", id: window.location.hostname }, user: { id: new Uint8Array([4, 5, 6]), name: "ges@w\u20acspr.eu", displayName: "Ges" }, pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }], authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" }, timeout: 60000 },
        });
        if (credential) {
          const credId = btoa(String.fromCharCode(...new Uint8Array((credential as any).rawId)));
          localStorage.setItem("wespr_biometric_cred_id", credId);
          didSucceed = true;
        }
      }
      return didSucceed ? "success" : "fallback";
    } catch (e: any) {
      if (e?.name === "NotAllowedError" || e?.name === "AbortError") { onStateChange("idle"); return "cancelled"; }
      return "fallback";
    }
  }
  return "fallback";
}

async function raboTriggerWebAuthn(): Promise<boolean> {
  try {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    const stored = localStorage.getItem("wespr_biometric_cred_id");
    if (stored) {
      try {
        const rawId = Uint8Array.from(atob(stored), c => c.charCodeAt(0));
        const result = await navigator.credentials.get({
          publicKey: { challenge, allowCredentials: [{ type: "public-key", id: rawId }], userVerification: "required", timeout: 60000 },
        });
        if (result) return true;
      } catch { localStorage.removeItem("wespr_biometric_cred_id"); }
    }
    const credential = await navigator.credentials.create({
      publicKey: { challenge, rp: { name: "W€spr", id: window.location.hostname }, user: { id: new Uint8Array([1, 2, 3]), name: "gebruiker@wespr.eu", displayName: "W€spr Gebruiker" }, pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }], authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" }, timeout: 60000 },
    });
    if (credential) {
      const rawNew = new Uint8Array((credential as any).rawId);
      localStorage.setItem("wespr_biometric_cred_id", btoa(Array.from(rawNew, b => String.fromCharCode(b)).join("")));
      return true;
    }
    return false;
  } catch { return false; }
}

const RABO_ORANGE = "#FF6200";

function RabobankPayFlow({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<"login" | "biometric" | "banking">("login");
  const [bioState, setBioState] = useState<"idle" | "scanning" | "success">("idle");

  const goToBanking = () => {
    setPhase("banking");
    setTimeout(() => window.open("https://bankieren.rabobank.nl/welcome", "_blank"), 300);
  };

  const handleLogin = async () => {
    if (bioState !== "idle") return;
    setPhase("biometric");
    setBioState("scanning");
    const ok = await raboTriggerWebAuthn();
    if (ok) {
      setBioState("success");
      setTimeout(goToBanking, 700);
    } else {
      setTimeout(() => {
        setBioState("success");
        setTimeout(goToBanking, 700);
      }, 1500);
    }
  };

  // ── Inlogscherm ──
  if (phase === "login") {
    return (
      <div className="min-h-full flex flex-col bg-white" style={{ fontFamily: "system-ui, sans-serif" }}>
        {/* Header */}
        <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-100">
          <button onClick={onBack} className="text-gray-500 hover:text-gray-800 p-1 -ml-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          {/* Rabobank logo */}
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: RABO_ORANGE }}>
            <span className="text-white font-black text-[15px]">R</span>
          </div>
          <span className="font-bold text-gray-900 text-[15px]">Rabobank</span>
        </div>

        <div className="flex-1 px-6 py-8 flex flex-col">
          <div className="mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg" style={{ background: RABO_ORANGE }}>
              <span className="text-white font-black text-[32px]">R</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Inloggen bij Rabobank</h1>
            <p className="text-sm text-gray-500">Internet Bankieren · Identifier</p>
          </div>

          {/* W€spr inlog-knop */}
          <button
            onClick={handleLogin}
            className="w-full rounded-2xl py-4 px-5 flex items-center gap-4 mb-4 shadow-lg active:scale-[0.98] transition-all"
            style={{ background: "linear-gradient(135deg, #003399 0%, #0050CC 100%)" }}
            data-testid="rabo-wespr-login"
          >
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0 text-lg">
              ★
            </div>
            <div className="flex-1 text-left">
              <p className="text-white font-bold text-[15px] leading-tight">Inloggen met W€spr</p>
              <p className="text-white/70 text-[12px] mt-0.5">EUDI Wallet · eIDAS 2.0 gecertificeerd</p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/60 shrink-0" />
          </button>

          {/* Veiligheidsinfo */}
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" style={{ color: RABO_ORANGE }} />
              <div>
                <p className="text-[13px] font-semibold text-gray-900">Veilig inloggen</p>
                <p className="text-[11px] text-gray-600 mt-0.5 leading-snug">W€spr bevestigt uw identiteit via biometrie. Geen Identifier-app of wachtwoord nodig.</p>
              </div>
            </div>
          </div>

          <div className="mt-auto text-center">
            <p className="text-[11px] text-gray-400">Rabobank Identifier · Beveiligd via W€spr EUDI Wallet</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Biometrie ──
  if (phase === "biometric") {
    return (
      <div className="min-h-full flex flex-col bg-white" style={{ fontFamily: "system-ui, sans-serif" }}>
        <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-100">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: RABO_ORANGE }}>
            <span className="text-white font-black text-[15px]">R</span>
          </div>
          <span className="font-bold text-gray-900 text-[15px]">Rabobank · Inloggen</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
          <div className="flex flex-col items-center gap-1 text-center">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[#003399] font-bold text-sm">★ EUDI Wallet · W€spr</span>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {bioState === "success" ? "Identiteit bevestigd" : "Bevestig uw identiteit"}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {bioState === "success" ? "U wordt ingelogd bij Rabobank…" : "Gebruik uw vingerafdruk of gezichtsherkenning"}
            </p>
          </div>

          <div
            className="w-28 h-28 rounded-full flex items-center justify-center cursor-pointer transition-all"
            style={{
              background: bioState === "success" ? "#22c55e" : bioState === "scanning" ? "#fff7ed" : "#fff7ed",
              border: `3px solid ${bioState === "success" ? "#22c55e" : RABO_ORANGE}`,
              boxShadow: bioState === "scanning" ? `0 0 0 12px ${RABO_ORANGE}22` : undefined,
            }}
            onClick={() => { if (bioState === "idle") { setBioState("scanning"); raboTriggerWebAuthn().then(ok => { if (ok) { setBioState("success"); setTimeout(goToBanking, 700); } else { setTimeout(() => { setBioState("success"); setTimeout(goToBanking, 700); }, 1500); } }); } }}
          >
            {bioState === "success"
              ? <Check className="text-white" style={{ width: 48, height: 48 }} />
              : <Fingerprint className={`transition-colors duration-500 ${bioState === "scanning" ? "" : "text-gray-300"}`} style={{ width: 56, height: 56, color: bioState === "scanning" ? RABO_ORANGE : undefined }} />
            }
          </div>

          <p className="text-xs text-gray-400 text-center max-w-[200px]">
            {bioState === "success" ? "✓ Biometrie bevestigd" : bioState === "scanning" ? "Wacht op apparaat..." : "Tik om te verifiëren"}
          </p>
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-gray-400" />
            <p className="text-[10px] text-gray-400">Beveiligd · eIDAS 2.0 · W€spr EUDI Wallet</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Verbonden — opent in browser ──
  return (
    <div className="min-h-full flex flex-col bg-white" style={{ fontFamily: "system-ui, sans-serif" }}>
      <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-100">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-700 p-1 -ml-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: RABO_ORANGE }}>
          <span className="text-white font-black text-[15px]">R</span>
        </div>
        <span className="font-bold text-gray-900 text-[15px]">Rabobank</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-5">
        {/* Groot succes-icoon */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background: "#fff3ec" }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: RABO_ORANGE }}>
              <span className="text-white font-black text-[32px]">R</span>
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center border-2 border-white">
            <Check className="w-4 h-4 text-white" />
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Verbonden met Rabobank</h2>
          <p className="text-sm text-gray-500">Uw identiteit is geverifieerd via W€spr.<br />Internet Bankieren is geopend in uw browser.</p>
        </div>

        {/* Opnieuw openen */}
        <button
          onClick={() => window.open("https://bankieren.rabobank.nl/welcome", "_blank")}
          className="w-full rounded-2xl py-4 px-5 flex items-center gap-4 shadow-md active:scale-[0.98] transition-all"
          style={{ background: RABO_ORANGE }}
          data-testid="rabo-open-browser"
        >
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-white font-bold text-[15px]">Internet Bankieren openen</p>
            <p className="text-white/70 text-[12px]">bankieren.rabobank.nl/welcome</p>
          </div>
          <ChevronRight className="w-5 h-5 text-white/60" />
        </button>

        {/* EUDI badge */}
        <div className="w-full bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#003399] shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] font-semibold text-[#003399]">Ingelogd via W€spr EUDI Wallet</p>
            <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">Rabobank heeft uw geverifieerde identiteit ontvangen via eIDAS 2.0. Internet Bankieren opent beveiligd in uw eigen browser.</p>
          </div>
        </div>

        <button onClick={onBack} className="text-sm text-gray-400 underline-offset-2 underline mt-1" data-testid="rabo-terug">
          Terug naar W€spr Pay
        </button>
      </div>
    </div>
  );
}

export function AuraPay({ onBack, onOpenMarket }: { onBack: () => void; onOpenMarket?: (type: string) => void }) {
  const [action, setAction] = useState<PayAction>(null);
  const [showEudiPay, setShowEudiPay] = useState(false);
  const [showRabobank, setShowRabobank] = useState(false);
  const [kassaPhase, setKassaPhase] = useState<null | "terminal" | "incoming">(null);
  const [kassaData, setKassaData] = useState<any>(null);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [transferPrefill, setTransferPrefill] = useState<{ recipient?: string; amount?: string; description?: string } | null>(null);
  const [showAddDomain, setShowAddDomain] = useState(false);
  const [editingDomain, setEditingDomain] = useState<any | null>(null);
  const [contextMenuDomain, setContextMenuDomain] = useState<any | null>(null);
  const [viewingDomain, setViewingDomain] = useState<any | null>(null);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["/api/me"],
    queryFn: () => apiRequest("/api/me"),
  });

  const { data: txs } = useQuery({
    queryKey: ["/api/transactions"],
    queryFn: () => apiRequest("/api/transactions"),
  });

  const { data: payDomains } = useQuery({
    queryKey: ["/api/pay-categories"],
    queryFn: () => apiRequest("/api/pay-categories"),
  });

  const deleteDomainMutation = useMutation({
    mutationFn: (id: string) => {
      queryClient.setQueryData(["/api/pay-categories"], (old: any[] | undefined) => (old || []).filter((c: any) => c.id !== id));
      return apiRequest(`/api/pay-categories/${id}`, { method: "DELETE" });
    },
  });

  const updateDomainMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest(`/api/pay-categories/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pay-categories"] });
      setEditingDomain(null);
    },
  });

  const balanceEuro = user ? Math.floor(user.walletBalance / 100) : 0;
  const balanceCents = user ? (user.walletBalance % 100).toString().padStart(2, "0") : "00";

  const handleSimuleerKassa = async () => {
    setKassaData({ loading: true });
    try {
      const res = await fetch("/api/mock-merchant/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          merchantName: "Albert Heijn",
          merchantLocation: "Den Haag Centrum · Kassa 4",
          merchantKvk: "35012085",
          amount: 2495,
          items: [
            { name: "Boodschappen", quantity: 1, price: 1850 },
            { name: "Kaas 500g", quantity: 1, price: 345 },
            { name: "Brood", quantity: 1, price: 175 },
            { name: "Melk 1L", quantity: 1, price: 125 },
          ],
        }),
      });
      const data = await res.json();
      setKassaData({
        session: data.session,
        qrData: data.qrData,
        merchantName: "Albert Heijn",
        merchantLocation: "Den Haag Centrum · Kassa 4",
        merchantKvk: "35012085",
        amount: 2495,
        items: [
          { name: "Boodschappen", quantity: 1, price: 1850 },
          { name: "Kaas 500g", quantity: 1, price: 345 },
          { name: "Brood", quantity: 1, price: 175 },
          { name: "Melk 1L", quantity: 1, price: 125 },
        ],
      });
      setKassaPhase("terminal");
    } catch {
      setKassaData(null);
    }
  };

  if (viewingDomain) return <PayDomainDetail domain={viewingDomain} onBack={() => setViewingDomain(null)} />;
  if (showEudiPay) return <EudiPayFlow onBack={() => setShowEudiPay(false)} user={user} />;
  if (showRabobank) return <RabobankPayFlow onBack={() => setShowRabobank(false)} />;

  if (action === "scan_receipt") return <ReceiptScanAndMatch txs={txs || []} onBack={() => setAction(null)} onViewTx={(tx: any) => { setSelectedTx(tx); setAction("transaction_detail"); }} />;
  if (action === "transaction_detail" && selectedTx) return <TransactionDetailScreen tx={selectedTx} onBack={() => { setAction(null); setSelectedTx(null); }} onRepeat={(tx: any) => { setSelectedTx(null); setTransferPrefill({ recipient: tx.description, amount: (tx.amount / 100).toFixed(2), description: tx.description }); setAction("transfer"); }} />;
  if (action === "transactions") return <AllTransactionsScreen txs={txs || []} onBack={() => setAction(null)} onSelectTx={(tx: any) => { setSelectedTx(tx); setAction("transaction_detail"); }} />;

  if (action) return <PayActionScreen action={action} onBack={() => { setAction(null); setTransferPrefill(null); }} user={user} transferPrefill={transferPrefill} />;

  return (
    <motion.div 
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      className="flex flex-col h-full bg-muted/20 relative"
    >
      <header className="px-4 py-4 flex items-center gap-3 sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/40">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full -ml-2">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold tracking-tight flex-1">W€spr Pay</h1>
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setAction("cards")}>
          <SettingsIcon className="w-5 h-5" />
        </Button>
      </header>

      <main className="flex-1 overflow-y-auto pb-8 hide-scrollbar">
        <div className="mx-4 mt-3 bg-emerald-600 text-white rounded-2xl shadow-md
                        p-5 flex flex-col justify-between
                        aspect-[85.6/54] sm:max-w-[320px]">
          <div>
            <p className="text-emerald-200 text-sm mb-1">Beschikbaar saldo</p>
            {userLoading ? (
              <Skeleton className="h-10 w-40 bg-white/20 rounded-lg" />
            ) : (
              <div className="flex items-baseline gap-0.5">
                <span className="text-xl font-semibold opacity-70">€</span>
                <span className="text-4xl font-bold tracking-tight">{balanceEuro.toLocaleString("nl-NL")}</span>
                <span className="text-xl font-semibold opacity-70">,{balanceCents}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-5 gap-2">
            <div onClick={() => setAction("scan")} className="flex flex-col items-center gap-1.5 cursor-pointer group" data-testid="pay-action-scannen">
              <div className="w-10 h-10 bg-white/15 rounded-2xl flex items-center justify-center group-hover:bg-white/25 transition-colors">
                <ScanLine className="w-[18px] h-[18px]" />
              </div>
              <span className="text-[10px] font-medium opacity-90">Scannen</span>
            </div>
            {[
              { icon: QrCode, label: "Ontvangen", act: "receive" as PayAction },
              { icon: ArrowUpRight, label: "Overmaken", act: "transfer" as PayAction },
              { icon: Receipt, label: "Bon", act: "scan_receipt" as PayAction },
              { icon: Wallet, label: "Kaarten", act: "cards" as PayAction },
            ].map(item => (
              <div key={item.label} onClick={() => setAction(item.act)} className="flex flex-col items-center gap-1.5 cursor-pointer group" data-testid={`pay-action-${item.label.toLowerCase()}`}>
                <div className="w-10 h-10 bg-white/15 rounded-2xl flex items-center justify-center group-hover:bg-white/25 transition-colors">
                  <item.icon className="w-[18px] h-[18px]" />
                </div>
                <span className="text-[10px] font-medium opacity-90">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {txs && txs.length > 0 && (
          <div className="px-4 mt-5">
            <div className="flex items-center justify-between mb-3 cursor-pointer" onClick={() => setAction("transactions")} data-testid="link-all-transactions">
              <h2 className="text-[15px] font-bold">Transacties</h2>
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-0.5">Alle <ChevronRight className="w-3.5 h-3.5" /></span>
            </div>
            <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
              {txs.slice(0, 4).map((tx: any, i: number) => (
                <div key={tx.id} onClick={() => { setSelectedTx(tx); setAction("transaction_detail"); }} className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors ${i < Math.min(txs.length, 4) - 1 ? 'border-b border-border/30' : ''}`} data-testid={`transaction-item-${tx.id}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${tx.type === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-400'}`}>
                    {tx.type === 'credit' ? '+' : '-'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{tx.description}</h3>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {tx.receiptData && <Receipt className="w-3 h-3 text-emerald-500 opacity-50" />}
                    <span className={`text-sm font-semibold ${tx.type === 'credit' ? 'text-emerald-600' : 'text-foreground'}`}>
                      {tx.type === 'credit' ? '+' : '-'}€{(tx.amount / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="px-4 mt-5">
          <h2 className="text-[15px] font-bold mb-3">Rekeningen & Beleggen</h2>
          <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
            <button onClick={() => setShowRabobank(true)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border/30" data-testid="betaal-rabobank">
              <div className="w-9 h-9 rounded-xl bg-[#CC0000] flex items-center justify-center text-white font-bold text-[8px] tracking-tight">RABO</div>
              <div className="flex-1 text-left">
                <h3 className="font-medium text-sm">Rabobank</h3>
                <p className="text-[11px] text-muted-foreground">Betaalrekening</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
            </button>
            <a href="https://www.santander.nl" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors border-b border-border/30" data-testid="spaar-santander">
              <div className="w-9 h-9 rounded-xl bg-[#EC0000] flex items-center justify-center text-white font-bold text-[8px] tracking-tight">
                SAN
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-sm">Santander</h3>
                <p className="text-[11px] text-muted-foreground">Spaarrekening</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
            </a>
            <a href="https://www.home.saxo/platforms/saxoinvestor" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors border-b border-border/30" data-testid="portfolio-saxo-investor">
              <div className="w-9 h-9 rounded-xl bg-[#0033A0] flex items-center justify-center text-white font-bold text-[8px] tracking-tight">
                SAXO
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-sm">Saxo Investor</h3>
                <p className="text-[11px] text-muted-foreground">Aandelen & ETF's</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
            </a>
            <a href="https://www.coinbase.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors border-b border-border/30" data-testid="portfolio-coinbase">
              <div className="w-9 h-9 rounded-xl bg-[#0052FF] flex items-center justify-center">
                <svg viewBox="0 0 32 32" className="w-5 h-5" fill="none"><circle cx="16" cy="16" r="16" fill="white"/><path d="M16 6C10.48 6 6 10.48 6 16s4.48 10 10 10 10-4.48 10-10S21.52 6 16 6zm-1.5 14.5h3c.55 0 1-.45 1-1v-3c0-.55-.45-1-1-1h-3c-.55 0-1 .45-1 1v3c0 .55.45 1 1 1z" fill="#0052FF"/></svg>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-sm">Coinbase</h3>
                <p className="text-[11px] text-muted-foreground">Crypto</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
            </a>
            <a href="https://base.org" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors" data-testid="portfolio-base">
              <div className="w-9 h-9 rounded-xl bg-[#0052FF] flex items-center justify-center">
                <svg viewBox="0 0 32 32" className="w-5 h-5" fill="none"><circle cx="16" cy="16" r="16" fill="white"/><path d="M16 27C22.075 27 27 22.075 27 16S22.075 5 16 5C10.158 5 5.378 9.565 5.02 15.3H20.2v1.4H5.02C5.378 22.435 10.158 27 16 27z" fill="#0052FF"/></svg>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-sm">Base</h3>
                <p className="text-[11px] text-muted-foreground">Layer 2 blockchain</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
            </a>
          </div>
        </div>


        {(payDomains || []).filter((cat: any) => !cat.title?.toLowerCase().includes('verzekering')).length > 0 && (
          <div className="px-4 mt-5">
            <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
              {(payDomains || []).filter((cat: any) => !cat.title?.toLowerCase().includes('verzekering')).map((cat: any, i: number, arr: any[]) => (
                <PayCategoryListItem
                  key={cat.id}
                  cat={cat}
                  onTap={() => setViewingDomain(cat)}
                  onLongPress={() => setContextMenuDomain(cat)}
                  hideBorder={i === arr.length - 1}
                />
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {showAddDomain && (
            <AddPayDomainForm
              onSubmit={() => setShowAddDomain(false)}
              onCancel={() => setShowAddDomain(false)}
            />
          )}
          {editingDomain && (
            <EditPayDomainForm
              category={editingDomain}
              onSubmit={(data) => updateDomainMutation.mutate({ id: editingDomain.id, data })}
              onCancel={() => setEditingDomain(null)}
              onDelete={() => { deleteDomainMutation.mutate(editingDomain.id); setEditingDomain(null); }}
              isPending={updateDomainMutation.isPending}
            />
          )}
          {contextMenuDomain && (
            <PayLongPressMenu
              onClose={() => setContextMenuDomain(null)}
              actions={[
                { label: "Openen", icon: Eye, onClick: () => setViewingDomain(contextMenuDomain) },
                { label: "Bewerken", icon: Pencil, onClick: () => setEditingDomain(contextMenuDomain) },
                { label: "Verwijderen", icon: Trash2, onClick: () => deleteDomainMutation.mutate(contextMenuDomain.id), destructive: true },
              ]}
            />
          )}
        </AnimatePresence>

      </main>

      {kassaPhase === "terminal" && kassaData && (
        <KassaTerminalScreen
          kassaData={kassaData}
          onScan={() => setKassaPhase("incoming")}
          onClose={() => { setKassaPhase(null); setKassaData(null); }}
        />
      )}

      {kassaPhase === "incoming" && kassaData && (
        <IncomingPaymentModal
          initialRequest={kassaData}
          onDismiss={() => {
            setKassaPhase(null);
            setKassaData(null);
            queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
            queryClient.invalidateQueries({ queryKey: ["/api/me"] });
          }}
        />
      )}
    </motion.div>
  );
}

function PayCategoryListItem({ cat, onTap, onLongPress, hideBorder }: { cat: any; onTap: () => void; onLongPress: () => void; hideBorder: boolean }) {
  const CatIcon = getPayIcon(cat.menuIcon);
  const longPressHandlers = usePayLongPress(onLongPress, onTap);

  return (
    <div
      {...longPressHandlers}
      className={`flex items-center gap-4 px-4 py-3.5 cursor-pointer select-none active:bg-muted/50 transition-colors ${!hideBorder ? 'border-b border-border/30' : ''}`}
      data-testid={`pay-category-${cat.id}`}
    >
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${cat.menuColor} bg-muted`}>
        <CatIcon className="w-5 h-5" />
      </div>
      <div className="flex-1 flex flex-col">
        <span className="font-medium text-[15px]">{cat.title}</span>
        {cat.menuSubtitle && <span className="text-xs text-muted-foreground">{cat.menuSubtitle}</span>}
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground" />
    </div>
  );
}

function PayLongPressMenu({ actions, onClose }: { actions: { label: string; icon: any; onClick: () => void; destructive?: boolean }[]; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: "spring", duration: 0.3 }}
        className="bg-card rounded-2xl shadow-2xl w-[240px] overflow-hidden border border-border/50"
        onClick={(e) => e.stopPropagation()}
      >
        {actions.map((action, i) => {
          const Icon = action.icon;
          return (
            <button
              key={i}
              onClick={() => { action.onClick(); onClose(); }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-left text-[14px] font-medium transition-colors ${
                action.destructive ? 'text-destructive hover:bg-destructive/10' : 'text-foreground hover:bg-muted/50'
              } ${i < actions.length - 1 ? 'border-b border-border/30' : ''}`}
              data-testid={`pay-context-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <Icon className="w-4.5 h-4.5 shrink-0" />
              {action.label}
            </button>
          );
        })}
      </motion.div>
    </motion.div>
  );
}

function AddPayDomainForm({ onSubmit, onCancel }: { onSubmit: () => void; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("Wallet");
  const [selectedColor, setSelectedColor] = useState(2);

  const HEADER_COLORS = [
    { colorClass: "bg-blue-600 text-white", preview: "bg-blue-600" },
    { colorClass: "bg-rose-600 text-white", preview: "bg-rose-600" },
    { colorClass: "bg-emerald-600 text-white", preview: "bg-emerald-600" },
    { colorClass: "bg-purple-600 text-white", preview: "bg-purple-600" },
    { colorClass: "bg-amber-500 text-white", preview: "bg-amber-500" },
    { colorClass: "bg-teal-600 text-white", preview: "bg-teal-600" },
    { colorClass: "bg-indigo-600 text-white", preview: "bg-indigo-600" },
    { colorClass: "bg-orange-600 text-white", preview: "bg-orange-600" },
  ];

  const MENU_COLORS = [
    "text-blue-500", "text-rose-500", "text-emerald-500", "text-purple-500",
    "text-amber-500", "text-teal-500", "text-indigo-500", "text-orange-500",
  ];

  const addMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/pay-categories", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: (newCat: any) => {
      queryClient.setQueryData(["/api/pay-categories"], (old: any[] | undefined) => [...(old || []), newCat]);
      onSubmit();
    },
  });

  const handleSubmit = () => {
    if (!title.trim()) return;
    const key = "pay_" + title.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    addMutation.mutate({
      key,
      title: title.trim(),
      headerTitle: title.trim(),
      headerSubtitle: subtitle.trim() || `Beheer ${title.trim()}`,
      icon: selectedIcon,
      colorClass: HEADER_COLORS[selectedColor].colorClass,
      menuIcon: selectedIcon,
      menuColor: MENU_COLORS[selectedColor] || "text-emerald-500",
      menuSubtitle: subtitle.trim() || undefined,
      isDefault: false,
      sortOrder: 99,
    });
  };

  const SelectedIconComp = getPayIcon(selectedIcon);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="px-4 mt-4 overflow-hidden"
    >
      <div className="bg-card rounded-2xl p-5 shadow-sm border border-emerald-500/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[15px]">Nieuw domein</h3>
          <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8 rounded-full">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex justify-center mb-5">
          <div className="flex flex-col items-center gap-2">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${HEADER_COLORS[selectedColor].preview} text-white`}>
              <SelectedIconComp className="w-7 h-7" />
            </div>
            <span className="text-xs font-medium">{title || "Naam..."}</span>
          </div>
        </div>

        <div className="mb-4">
          <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Naam</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="bijv. Verzekeringen, Sparen, Pensioen..."
            className="w-full bg-muted/50 rounded-xl px-4 py-2.5 text-[15px] outline-none border border-border/50 focus:border-emerald-500/50 transition-colors"
            data-testid="input-pay-domain-name"
          />
        </div>

        <div className="mb-4">
          <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Beschrijving (optioneel)</label>
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="bijv. Alle polissen & claims"
            className="w-full bg-muted/50 rounded-xl px-4 py-2.5 text-[15px] outline-none border border-border/50 focus:border-emerald-500/50 transition-colors"
            data-testid="input-pay-domain-subtitle"
          />
        </div>

        <div className="mb-4">
          <label className="text-xs font-bold text-muted-foreground mb-2 block">Icoon</label>
          <div className="grid grid-cols-8 gap-2">
            {PAY_AVAILABLE_ICONS.map(({ name, icon: IC }) => (
              <button
                key={name}
                onClick={() => setSelectedIcon(name)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                  selectedIcon === name ? 'bg-emerald-600 text-white scale-110 shadow-md' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
                data-testid={`pay-icon-${name}`}
              >
                <IC className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <label className="text-xs font-bold text-muted-foreground mb-2 block">Kleur</label>
          <div className="flex gap-2 flex-wrap">
            {HEADER_COLORS.map((c, i) => (
              <button
                key={i}
                onClick={() => setSelectedColor(i)}
                className={`w-8 h-8 rounded-full ${c.preview} transition-all ${
                  selectedColor === i ? 'ring-2 ring-offset-2 ring-emerald-500 scale-110' : 'hover:scale-105'
                }`}
              />
            ))}
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!title.trim() || addMutation.isPending}
          className="w-full rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700"
          data-testid="submit-pay-domain"
        >
          <Check className="w-4 h-4" /> Domein toevoegen
        </Button>
      </div>
    </motion.div>
  );
}

function EditPayDomainForm({ category, onSubmit, onCancel, onDelete, isPending }: {
  category: any; onSubmit: (data: any) => void; onCancel: () => void; onDelete: () => void; isPending: boolean;
}) {
  const [title, setTitle] = useState(category.title);
  const [subtitle, setSubtitle] = useState(category.menuSubtitle || "");
  const [selectedIcon, setSelectedIcon] = useState(category.menuIcon || "Wallet");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const HEADER_COLORS = [
    { colorClass: "bg-blue-600 text-white", preview: "bg-blue-600" },
    { colorClass: "bg-rose-600 text-white", preview: "bg-rose-600" },
    { colorClass: "bg-emerald-600 text-white", preview: "bg-emerald-600" },
    { colorClass: "bg-purple-600 text-white", preview: "bg-purple-600" },
    { colorClass: "bg-amber-500 text-white", preview: "bg-amber-500" },
    { colorClass: "bg-teal-600 text-white", preview: "bg-teal-600" },
    { colorClass: "bg-indigo-600 text-white", preview: "bg-indigo-600" },
    { colorClass: "bg-orange-600 text-white", preview: "bg-orange-600" },
  ];
  const MENU_COLORS = [
    "text-blue-500", "text-rose-500", "text-emerald-500", "text-purple-500",
    "text-amber-500", "text-teal-500", "text-indigo-500", "text-orange-500",
  ];
  const colorIdx = HEADER_COLORS.findIndex(c => c.colorClass === category.colorClass);
  const [selectedColor, setSelectedColor] = useState(colorIdx >= 0 ? colorIdx : 2);

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      headerTitle: title.trim(),
      headerSubtitle: subtitle.trim() || `Beheer ${title.trim()}`,
      icon: selectedIcon,
      colorClass: HEADER_COLORS[selectedColor].colorClass,
      menuIcon: selectedIcon,
      menuColor: MENU_COLORS[selectedColor] || "text-emerald-500",
      menuSubtitle: subtitle.trim() || undefined,
    });
  };

  const SelectedIconComp = getPayIcon(selectedIcon);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="px-4 mt-4 overflow-hidden"
    >
      <div className="bg-card rounded-2xl p-5 shadow-sm border border-emerald-500/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[15px]">Domein bewerken</h3>
          <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8 rounded-full">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex justify-center mb-5">
          <div className="flex flex-col items-center gap-2">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${HEADER_COLORS[selectedColor].preview} text-white`}>
              <SelectedIconComp className="w-7 h-7" />
            </div>
            <span className="text-xs font-medium">{title || "Naam..."}</span>
          </div>
        </div>

        <div className="mb-4">
          <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Naam</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-muted/50 rounded-xl px-4 py-2.5 text-[15px] outline-none border border-border/50 focus:border-emerald-500/50 transition-colors"
            data-testid="edit-pay-domain-name" />
        </div>

        <div className="mb-4">
          <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Beschrijving</label>
          <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)}
            className="w-full bg-muted/50 rounded-xl px-4 py-2.5 text-[15px] outline-none border border-border/50 focus:border-emerald-500/50 transition-colors"
            data-testid="edit-pay-domain-subtitle" />
        </div>

        <div className="mb-4">
          <label className="text-xs font-bold text-muted-foreground mb-2 block">Icoon</label>
          <div className="grid grid-cols-8 gap-2">
            {PAY_AVAILABLE_ICONS.map(({ name, icon: IC }) => (
              <button key={name} onClick={() => setSelectedIcon(name)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                  selectedIcon === name ? 'bg-emerald-600 text-white scale-110 shadow-md' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}>
                <IC className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <label className="text-xs font-bold text-muted-foreground mb-2 block">Kleur</label>
          <div className="flex gap-2 flex-wrap">
            {HEADER_COLORS.map((c, i) => (
              <button key={i} onClick={() => setSelectedColor(i)}
                className={`w-8 h-8 rounded-full ${c.preview} transition-all ${
                  selectedColor === i ? 'ring-2 ring-offset-2 ring-emerald-500 scale-110' : 'hover:scale-105'
                }`} />
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          {!showDeleteConfirm ? (
            <>
              <Button variant="outline" onClick={() => setShowDeleteConfirm(true)} className="rounded-xl gap-1 text-destructive border-destructive/30 hover:bg-destructive/10">
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button onClick={handleSubmit} disabled={!title.trim() || isPending}
                className="flex-1 rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700" data-testid="save-pay-domain">
                <Check className="w-4 h-4" /> Opslaan
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="flex-1 rounded-xl">Annuleer</Button>
              <Button variant="destructive" onClick={onDelete} className="flex-1 rounded-xl gap-1" data-testid="confirm-delete-pay-domain">
                <Trash2 className="w-4 h-4" /> Verwijder
              </Button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

const PAY_COLOR_OPTIONS = [
  { bg: "bg-blue-100", text: "text-blue-600", preview: "bg-blue-500" },
  { bg: "bg-rose-100", text: "text-rose-600", preview: "bg-rose-500" },
  { bg: "bg-emerald-100", text: "text-emerald-600", preview: "bg-emerald-500" },
  { bg: "bg-purple-100", text: "text-purple-600", preview: "bg-purple-500" },
  { bg: "bg-amber-100", text: "text-amber-600", preview: "bg-amber-500" },
  { bg: "bg-orange-100", text: "text-orange-600", preview: "bg-orange-500" },
  { bg: "bg-teal-100", text: "text-teal-600", preview: "bg-teal-500" },
  { bg: "bg-indigo-100", text: "text-indigo-600", preview: "bg-indigo-500" },
];

function PayServiceGridItem({ item, onTap, onLongPress }: { item: any; onTap: () => void; onLongPress: () => void }) {
  const longPressHandlers = usePayLongPress(onLongPress, onTap);
  const Icon = getPayIcon(item.icon);
  return (
    <div {...longPressHandlers} className="flex flex-col items-center gap-2 cursor-pointer select-none active:scale-95 transition-transform" data-testid={`pay-service-item-${item.id}`}>
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${item.colorBg || "bg-emerald-100"} ${item.colorText || "text-emerald-600"}`}>
        <Icon className="w-7 h-7" />
      </div>
      <span className="text-[11px] font-medium text-center leading-tight">{item.label}</span>
    </div>
  );
}

function PayServiceDetail({ item, domain, onBack }: { item: any; domain: any; onBack: () => void }) {
  const Icon = getPayIcon(item.icon);
  return (
    <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="flex flex-col h-full bg-muted/20 relative">
      <header className={`px-4 py-4 flex items-center gap-3 ${domain.colorClass || "bg-emerald-600 text-white"} sticky top-0 z-50`}>
        <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-white/20 rounded-full -ml-2">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold tracking-tight flex-1">{item.label}</h1>
      </header>
      <main className="flex-1 overflow-y-auto pb-8 hide-scrollbar p-4">
        <div className="bg-card rounded-2xl p-6 shadow-sm text-center">
          <div className={`w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center ${item.colorBg || "bg-emerald-100"} ${item.colorText || "text-emerald-600"}`}>
            <Icon className="w-10 h-10" />
          </div>
          <h3 className="font-bold text-xl mb-1">{item.label}</h3>
          <p className="text-muted-foreground text-sm mb-4">{item.subcategory}</p>
          <div className="bg-muted/50 rounded-xl p-4 text-left space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Domein</span>
              <span className="font-medium">{domain.title}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Categorie</span>
              <span className="font-medium">{item.subcategory}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium text-emerald-600">Actief</span>
            </div>
          </div>
        </div>
      </main>
    </motion.div>
  );
}

function AddPayServiceForm({ category, existingSubcategories, onSubmit, onCancel, isPending }: {
  category: string; existingSubcategories: string[]; onSubmit: (data: any) => void; onCancel: () => void; isPending: boolean;
}) {
  const hasExisting = existingSubcategories.length > 0;
  const [label, setLabel] = useState("");
  const [subcategory, setSubcategory] = useState(existingSubcategories[0] || "");
  const [newSubcategory, setNewSubcategory] = useState("");
  const [useNewSubcategory, setUseNewSubcategory] = useState(!hasExisting);
  const [selectedIcon, setSelectedIcon] = useState("Wallet");
  const [selectedColor, setSelectedColor] = useState(0);

  const handleSubmit = () => {
    if (!label.trim()) return;
    const finalSubcategory = useNewSubcategory ? newSubcategory : subcategory;
    if (!finalSubcategory.trim()) return;
    onSubmit({
      category,
      subcategory: finalSubcategory,
      label: label.trim(),
      icon: selectedIcon,
      colorBg: PAY_COLOR_OPTIONS[selectedColor].bg,
      colorText: PAY_COLOR_OPTIONS[selectedColor].text,
      isDefault: false,
    });
  };

  const SelectedIconComp = getPayIcon(selectedIcon);

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden">
      <div className="bg-card rounded-2xl p-5 shadow-sm border border-emerald-500/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[15px]">Nieuw item toevoegen</h3>
          <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8 rounded-full">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex justify-center mb-5">
          <div className="flex flex-col items-center gap-2">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${PAY_COLOR_OPTIONS[selectedColor].bg} ${PAY_COLOR_OPTIONS[selectedColor].text}`}>
              <SelectedIconComp className="w-7 h-7" />
            </div>
            <span className="text-xs font-medium">{label || "Naam..."}</span>
          </div>
        </div>

        <div className="mb-4">
          <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Naam</label>
          <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="bijv. Hypotheek, Spaarrekening..."
            className="w-full bg-muted/50 rounded-xl px-4 py-2.5 text-[15px] outline-none border border-border/50 focus:border-emerald-500/50 transition-colors"
            data-testid="input-pay-service-name" />
        </div>

        <div className="mb-4">
          <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Subcategorie</label>
          {!useNewSubcategory && hasExisting ? (
            <div className="space-y-2">
              <select value={subcategory} onChange={(e) => setSubcategory(e.target.value)}
                className="w-full bg-muted/50 rounded-xl px-4 py-2.5 text-[15px] outline-none border border-border/50 appearance-none">
                {existingSubcategories.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={() => setUseNewSubcategory(true)} className="text-xs text-emerald-600 font-medium">+ Nieuwe subcategorie</button>
            </div>
          ) : (
            <div className="space-y-2">
              <input type="text" value={newSubcategory} onChange={(e) => setNewSubcategory(e.target.value)} placeholder="bijv. Rekeningen, Verzekeringen..."
                className="w-full bg-muted/50 rounded-xl px-4 py-2.5 text-[15px] outline-none border border-border/50 focus:border-emerald-500/50 transition-colors"
                data-testid="input-pay-service-subcategory" />
              {hasExisting && (
                <button onClick={() => setUseNewSubcategory(false)} className="text-xs text-emerald-600 font-medium">Bestaande subcategorie kiezen</button>
              )}
            </div>
          )}
        </div>

        <div className="mb-4">
          <label className="text-xs font-bold text-muted-foreground mb-2 block">Icoon</label>
          <div className="grid grid-cols-8 gap-2">
            {PAY_AVAILABLE_ICONS.map(({ name, icon: IC }) => (
              <button key={name} onClick={() => setSelectedIcon(name)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                  selectedIcon === name ? 'bg-emerald-600 text-white scale-110 shadow-md' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}>
                <IC className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <label className="text-xs font-bold text-muted-foreground mb-2 block">Kleur</label>
          <div className="flex gap-2 flex-wrap">
            {PAY_COLOR_OPTIONS.map((c, i) => (
              <button key={i} onClick={() => setSelectedColor(i)}
                className={`w-8 h-8 rounded-full ${c.preview} transition-all ${
                  selectedColor === i ? 'ring-2 ring-offset-2 ring-emerald-500 scale-110' : 'hover:scale-105'
                }`} />
            ))}
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={!label.trim() || isPending}
          className="w-full rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700" data-testid="submit-pay-service">
          <Check className="w-4 h-4" /> Item toevoegen
        </Button>
      </div>
    </motion.div>
  );
}

function EditPayServiceForm({ item, existingSubcategories, onSubmit, onCancel, onDelete, isPending }: {
  item: any; existingSubcategories: string[]; onSubmit: (data: any) => void; onCancel: () => void; onDelete: () => void; isPending: boolean;
}) {
  const [label, setLabel] = useState(item.label);
  const [subcategory, setSubcategory] = useState(item.subcategory);
  const [selectedIcon, setSelectedIcon] = useState(item.icon || "Wallet");
  const colorIdx = PAY_COLOR_OPTIONS.findIndex(c => c.bg === item.colorBg);
  const [selectedColor, setSelectedColor] = useState(colorIdx >= 0 ? colorIdx : 0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSubmit = () => {
    if (!label.trim() || !subcategory.trim()) return;
    onSubmit({
      label: label.trim(),
      subcategory: subcategory.trim(),
      icon: selectedIcon,
      colorBg: PAY_COLOR_OPTIONS[selectedColor].bg,
      colorText: PAY_COLOR_OPTIONS[selectedColor].text,
    });
  };

  const SelectedIconComp = getPayIcon(selectedIcon);

  return (
    <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="flex flex-col h-full bg-muted/20 relative">
      <header className="px-4 py-4 flex items-center gap-3 bg-background/80 backdrop-blur-xl sticky top-0 z-50 border-b border-border/50">
        <Button variant="ghost" size="icon" onClick={onCancel} className="-ml-2">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold tracking-tight flex-1">Item bewerken</h1>
      </header>
      <main className="flex-1 overflow-y-auto pb-8 hide-scrollbar p-4">
        <div className="bg-card rounded-2xl p-5 shadow-sm">
          <div className="flex justify-center mb-5">
            <div className="flex flex-col items-center gap-2">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${PAY_COLOR_OPTIONS[selectedColor].bg} ${PAY_COLOR_OPTIONS[selectedColor].text}`}>
                <SelectedIconComp className="w-7 h-7" />
              </div>
              <span className="text-xs font-medium">{label || "Naam..."}</span>
            </div>
          </div>

          <div className="mb-4">
            <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Naam</label>
            <input type="text" value={label} onChange={(e) => setLabel(e.target.value)}
              className="w-full bg-muted/50 rounded-xl px-4 py-2.5 text-[15px] outline-none border border-border/50 focus:border-emerald-500/50 transition-colors"
              data-testid="edit-pay-service-name" />
          </div>

          <div className="mb-4">
            <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Subcategorie</label>
            <input type="text" value={subcategory} onChange={(e) => setSubcategory(e.target.value)}
              className="w-full bg-muted/50 rounded-xl px-4 py-2.5 text-[15px] outline-none border border-border/50 focus:border-emerald-500/50 transition-colors"
              data-testid="edit-pay-service-subcategory" />
          </div>

          <div className="mb-4">
            <label className="text-xs font-bold text-muted-foreground mb-2 block">Icoon</label>
            <div className="grid grid-cols-8 gap-2">
              {PAY_AVAILABLE_ICONS.map(({ name, icon: IC }) => (
                <button key={name} onClick={() => setSelectedIcon(name)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                    selectedIcon === name ? 'bg-emerald-600 text-white scale-110 shadow-md' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  }`}>
                  <IC className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5">
            <label className="text-xs font-bold text-muted-foreground mb-2 block">Kleur</label>
            <div className="flex gap-2 flex-wrap">
              {PAY_COLOR_OPTIONS.map((c, i) => (
                <button key={i} onClick={() => setSelectedColor(i)}
                  className={`w-8 h-8 rounded-full ${c.preview} transition-all ${
                    selectedColor === i ? 'ring-2 ring-offset-2 ring-emerald-500 scale-110' : 'hover:scale-105'
                  }`} />
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            {!showDeleteConfirm ? (
              <>
                <Button variant="outline" onClick={() => setShowDeleteConfirm(true)} className="rounded-xl gap-1 text-destructive border-destructive/30 hover:bg-destructive/10">
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button onClick={handleSubmit} disabled={!label.trim() || !subcategory.trim() || isPending}
                  className="flex-1 rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700" data-testid="save-pay-service">
                  <Check className="w-4 h-4" /> Opslaan
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="flex-1 rounded-xl">Annuleer</Button>
                <Button variant="destructive" onClick={onDelete} className="flex-1 rounded-xl gap-1" data-testid="confirm-delete-pay-service">
                  <Trash2 className="w-4 h-4" /> Verwijder
                </Button>
              </>
            )}
          </div>
        </div>
      </main>
    </motion.div>
  );
}

function PayDomainDetail({ domain, onBack }: { domain: any; onBack: () => void }) {
  const DomainIcon = getPayIcon(domain.icon || domain.menuIcon);
  const categoryKey = domain.key;

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [contextMenuItem, setContextMenuItem] = useState<any | null>(null);

  const { data: items, isLoading } = useQuery({
    queryKey: ["/api/services", categoryKey],
    queryFn: () => apiRequest(`/api/services/${categoryKey}`),
  });

  const addMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/services", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services", categoryKey] });
      setShowAddForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest(`/api/services/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services", categoryKey] });
      setEditingItem(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/services/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/services", categoryKey] }),
  });

  if (editingItem) {
    const existingSubs = Object.keys((items || []).reduce((acc: Record<string, any[]>, i: any) => { if (!acc[i.subcategory]) acc[i.subcategory] = []; acc[i.subcategory].push(i); return acc; }, {}));
    return <EditPayServiceForm
      item={editingItem}
      existingSubcategories={existingSubs}
      onSubmit={(data) => updateMutation.mutate({ id: editingItem.id, data })}
      onCancel={() => setEditingItem(null)}
      onDelete={() => { deleteMutation.mutate(editingItem.id); setEditingItem(null); }}
      isPending={updateMutation.isPending}
    />;
  }

  if (selectedItem) {
    return <PayServiceDetail item={selectedItem} domain={domain} onBack={() => setSelectedItem(null)} />;
  }

  const grouped = (items || []).reduce((acc: Record<string, any[]>, item: any) => {
    if (!acc[item.subcategory]) acc[item.subcategory] = [];
    acc[item.subcategory].push(item);
    return acc;
  }, {});

  const hasItems = Object.keys(grouped).length > 0;
  const itemCount = (items || []).length;

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      className="flex flex-col h-full bg-muted/20 relative"
    >
      <header className={`px-4 py-4 flex items-center gap-3 ${domain.colorClass || "bg-emerald-600 text-white"} sticky top-0 z-50`}>
        <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-white/20 rounded-full -ml-2">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold tracking-tight flex-1">{domain.headerTitle || domain.title}</h1>
        <Button variant="ghost" size="icon" onClick={() => setShowAddForm(!showAddForm)} className="text-white hover:bg-white/20 rounded-full" data-testid="add-pay-service-header-btn">
          <Plus className="w-5 h-5" />
        </Button>
      </header>

      <div className={`${domain.colorClass || "bg-emerald-600 text-white"} px-6 pb-6 pt-3 rounded-b-[2rem] shadow-md`}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
            <DomainIcon className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{domain.title}</h2>
            <p className="text-white/70 text-sm mt-0.5">{domain.headerSubtitle || domain.menuSubtitle}</p>
          </div>
          <div className="bg-white/20 rounded-xl px-3 py-1.5 backdrop-blur-md">
            <span className="text-sm font-bold">{itemCount}</span>
            <span className="text-xs opacity-80 ml-1">items</span>
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto pb-8 hide-scrollbar p-4">
        <AnimatePresence>
          {showAddForm && (
            <AddPayServiceForm
              category={categoryKey}
              existingSubcategories={Object.keys(grouped)}
              onSubmit={(data) => addMutation.mutate(data)}
              onCancel={() => setShowAddForm(false)}
              isPending={addMutation.isPending}
            />
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        ) : !hasItems ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${domain.menuColor || "text-emerald-500"} bg-muted`}>
              <DomainIcon className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-[15px] mb-1">Nog geen items</h3>
            <p className="text-sm text-muted-foreground mb-5 max-w-[240px]">
              Voeg je eerste service of koppeling toe aan dit domein
            </p>
            <Button onClick={() => setShowAddForm(true)} className="rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700" data-testid="add-first-pay-service-btn">
              <Plus className="w-4 h-4" /> Item toevoegen
            </Button>
          </div>
        ) : (
          <>
            {Object.entries(grouped).map(([subcategory, subItems]) => (
              <div key={subcategory} className="mb-6">
                <h3 className="text-sm font-bold text-muted-foreground mb-3 px-1">{subcategory}</h3>
                <div className="bg-card rounded-2xl p-4 shadow-sm">
                  <div className="grid grid-cols-3 gap-y-6 gap-x-2">
                    {(subItems as any[]).map((item: any) => (
                      <PayServiceGridItem
                        key={item.id}
                        item={item}
                        onTap={() => setSelectedItem(item)}
                        onLongPress={() => setContextMenuItem(item)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
            <Button onClick={() => setShowAddForm(true)} variant="outline"
              className="w-full rounded-2xl h-12 gap-2 border-dashed border-2 text-muted-foreground hover:text-emerald-600 hover:border-emerald-500/50"
              data-testid="add-pay-service-btn">
              <Plus className="w-5 h-5" />
              <span className="font-medium">Service toevoegen</span>
            </Button>
          </>
        )}
      </main>

      <AnimatePresence>
        {contextMenuItem && (
          <PayLongPressMenu
            onClose={() => setContextMenuItem(null)}
            actions={[
              { label: "Openen", icon: Eye, onClick: () => setSelectedItem(contextMenuItem) },
              { label: "Bewerken", icon: Pencil, onClick: () => setEditingItem(contextMenuItem) },
              { label: "Verwijderen", icon: Trash2, onClick: () => { deleteMutation.mutate(contextMenuItem.id); setContextMenuItem(null); }, destructive: true },
            ]}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SuccessOverlay({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-emerald-600 flex flex-col items-center justify-center z-50 text-white"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
        className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-6"
      >
        <Check className="w-10 h-10" />
      </motion.div>
      <motion.p
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-xl font-bold text-center px-8"
      >
        {message}
      </motion.p>
    </motion.div>
  );
}

function ToastFeedback({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-foreground text-background px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 z-[100]"
    >
      <Check className="w-4 h-4 text-emerald-400" />
      <span className="text-sm font-medium">{message}</span>
    </motion.div>
  );
}

function DynamicPayQR({ user, onBack }: { user: any; onBack: () => void }) {
  const generateToken = () => Math.random().toString(36).substring(2, 10).toUpperCase();
  const [token, setToken] = useState(generateToken);
  const [countdown, setCountdown] = useState(5);
  const [refreshing, setRefreshing] = useState(false);
  const [phase, setPhase] = useState<"showing" | "simulating" | "biometric" | "received">("showing");

  useEffect(() => {
    if (phase !== "showing") return;
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          setRefreshing(true);
          setTimeout(() => { setToken(generateToken()); setRefreshing(false); }, 400);
          return 5;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const qrValue = `wespr://pay/${user?.auraId || "WPY"}/${token}`;

  useEffect(() => {
    if (phase !== "simulating") return;
    const t = setTimeout(() => setPhase("biometric"), 2200);
    return () => clearTimeout(t);
  }, [phase]);

  if (phase === "simulating") {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
          className="w-20 h-20 rounded-3xl bg-emerald-50 flex items-center justify-center mb-5 border-2 border-emerald-200"
        >
          <QrCode className="w-10 h-10 text-emerald-600" />
        </motion.div>
        <p className="font-semibold text-base mb-1">QR wordt gescand...</p>
        <p className="text-xs text-muted-foreground">Albert Heijn verwerkt de betaling</p>
        <div className="flex gap-1 mt-4">
          {[0, 1, 2].map(i => (
            <motion.div key={i} className="w-2 h-2 rounded-full bg-emerald-500"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.4 }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (phase === "biometric") {
    return (
      <div className="flex flex-col items-center justify-center py-4 px-4">
        <div className="bg-muted/40 rounded-2xl px-5 py-2.5 mb-5 text-center">
          <p className="text-[11px] text-muted-foreground mb-0.5">Betaalverzoek van</p>
          <p className="text-sm font-bold">Albert Heijn</p>
        </div>
        <BiometricConfirmStep
          amount="23,50"
          onComplete={() => setPhase("received")}
        />
      </div>
    );
  }

  if (phase === "received") {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
          <Check className="w-10 h-10 text-emerald-600" />
        </motion.div>
        <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}
          className="text-3xl font-bold mb-1">+€ 23,50</motion.p>
        <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}
          className="text-sm text-muted-foreground mb-1">Betaling ontvangen</motion.p>
        <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }}
          className="text-xs text-muted-foreground mb-8">van Albert Heijn · zojuist</motion.p>
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
          <Button onClick={onBack} className="rounded-xl px-8">Sluiten</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center px-4 pt-1 pb-5">
      <p className="text-sm text-muted-foreground text-center mb-4">
        Laat de winkelier jouw code scannen om te betalen
      </p>

      <div className={`relative w-56 h-56 bg-white rounded-3xl shadow-md p-4 flex items-center justify-center border border-border/20 mb-3 transition-all duration-500 ${refreshing ? "opacity-25 scale-95" : "opacity-100 scale-100"}`}>
        <QRCodeSVG value={qrValue} size={192} level="M" includeMargin={false} />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-11 h-11 rounded-xl bg-white shadow border border-border/30 flex items-center justify-center">
            <span className="text-[11px] font-black" style={{ color: "#00a86b" }}>W€</span>
          </div>
        </div>
        {refreshing && (
          <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-white/60">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mb-1">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${countdown <= 2 ? "bg-orange-400 animate-pulse" : "bg-emerald-500 animate-pulse"}`} />
        <p className="text-xs text-muted-foreground">
          Code verloopt over{" "}
          <span className={`font-bold tabular-nums ${countdown <= 2 ? "text-orange-500" : "text-emerald-600"}`}>
            {countdown}s
          </span>
        </p>
      </div>

      <div className="bg-muted/50 rounded-xl px-4 py-1.5 text-xs font-mono text-muted-foreground mb-4 tracking-wider">
        {user?.auraId || "WPY-XXXX"} · {token}
      </div>

      <div className="flex items-center gap-1.5 mb-5">
        <Shield className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
        <p className="text-[10px] text-muted-foreground">Eenmalig gebruik · Versleuteld · Automatisch vernieuwd</p>
      </div>

      <button
        onClick={() => setPhase("simulating")}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-dashed border-border bg-muted/20 hover:bg-muted/40 transition-colors"
        data-testid="btn-simulate-merchant-scan"
      >
        <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <ScanLine className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-xs font-semibold">Demo: Simuleer scan door winkelier</p>
          <p className="text-[10px] text-muted-foreground">Albert Heijn scant jouw W€spr QR-code</p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      </button>
    </div>
  );
}

function BiometricConfirmStep({ amount, recipient, onComplete }: { amount?: string; recipient?: string; onComplete: () => void }) {
  const [state, setState] = useState<"idle" | "scanning" | "success">("idle");
  const isInIframe = (() => { try { return window.self !== window.top; } catch { return true; } })();

  const handleTap = async () => {
    if (state !== "idle") return;
    setState("scanning");

    let didSucceed = false;

    if (!isInIframe && typeof window !== "undefined" && (window as any).PublicKeyCredential) {
      try {
        const challenge = crypto.getRandomValues(new Uint8Array(32));
        const storedCredId = localStorage.getItem("wespr_biometric_cred_id");

        if (storedCredId) {
          try {
            const credBytes = Uint8Array.from(atob(storedCredId), c => c.charCodeAt(0));
            const assertion = await navigator.credentials.get({
              publicKey: {
                challenge,
                rpId: window.location.hostname,
                allowCredentials: [{ type: "public-key", id: credBytes, transports: ["internal"] as AuthenticatorTransport[] }],
                userVerification: "required",
                timeout: 60000,
              },
            });
            if (assertion) didSucceed = true;
          } catch {
            // Any error (domain mismatch, no passkey on device, etc.) — clear and re-register
            localStorage.removeItem("wespr_biometric_cred_id");
          }
        }

        if (!didSucceed) {
          const credential = await navigator.credentials.create({
            publicKey: {
              challenge,
              rp: { name: "W€spr", id: window.location.hostname },
              user: { id: new Uint8Array([1, 2, 3]), name: "ges@w\u20acspr.eu", displayName: "Ges" },
              pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
              authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
              timeout: 60000,
            },
          });
          if (credential) {
            const credId = btoa(String.fromCharCode(...new Uint8Array((credential as any).rawId)));
            localStorage.setItem("wespr_biometric_cred_id", credId);
            didSucceed = true;
          }
        }
      } catch (e: any) {
        if (e?.name === "NotAllowedError" || e?.name === "AbortError") {
          setState("idle");
          return;
        }
        didSucceed = false;
      }
    }

    if (didSucceed) {
      setState("success");
      setTimeout(onComplete, 700);
    } else {
      setTimeout(() => {
        setState("success");
        setTimeout(onComplete, 700);
      }, 1400);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      {(amount || recipient) && (
        <div className="bg-muted/50 rounded-2xl px-5 py-3 mb-6 text-center">
          {amount && <p className="text-2xl font-bold">€ {amount}</p>}
          {recipient && <p className="text-sm text-muted-foreground mt-0.5">naar {recipient}</p>}
        </div>
      )}
      <p className="text-base font-semibold mb-5 text-center">
        {state === "success" ? "Geverifieerd" : state === "scanning" ? "Verifiëren..." : "Bevestig met biometrie"}
      </p>
      <motion.button
        onClick={handleTap}
        disabled={state !== "idle"}
        animate={state === "scanning" ? {
          boxShadow: ["0 0 0 0px rgba(16,185,129,0.3)", "0 0 0 22px rgba(16,185,129,0)"]
        } : {}}
        transition={{ repeat: Infinity, duration: 1.4 }}
        className={`w-32 h-32 rounded-full border-4 flex items-center justify-center transition-all duration-500 cursor-pointer ${
          state === "success" ? "border-emerald-400 bg-emerald-50" :
          state === "scanning" ? "border-emerald-600 bg-emerald-50/50" :
          "border-gray-200 bg-gray-50 hover:border-emerald-400 hover:bg-emerald-50/40 active:scale-95"
        }`}
        data-testid="biometric-confirm-btn"
      >
        {state === "success" ? (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
            <Check className="w-16 h-16 text-emerald-500" />
          </motion.div>
        ) : (
          <Fingerprint className={`w-16 h-16 transition-colors duration-500 ${state === "scanning" ? "text-emerald-600" : "text-gray-300"}`} />
        )}
      </motion.button>
      <p className="text-xs text-muted-foreground mt-5 text-center max-w-[200px]">
        {state === "success"
          ? "✓ Biometrie bevestigd"
          : state === "scanning"
          ? "Biometrie verifiëren..."
          : "Tik om te betalen met vingerafdruk of Face ID"}
      </p>
      <div className="flex items-center gap-1.5 mt-3">
        <Shield className="w-3 h-3 text-emerald-500" />
        <p className="text-[10px] text-muted-foreground">Beveiligd met W€spr biometrie</p>
      </div>
    </div>
  );
}

function PayCameraScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [paymentStep, setPaymentStep] = useState<"idle" | "biometric" | "confirming" | "success">("idle");

  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = 0;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } }
        });
        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          await videoRef.current.play();
          scanLoop();
        }
      } catch (err: any) {
        if (!mounted) return;
        if (err.name === "NotAllowedError") {
          setError("Camera toegang geweigerd. Sta camera toegang toe in je browser.");
        } else if (err.name === "NotFoundError") {
          setError("Geen camera gevonden op dit apparaat.");
        } else if (err.name === "NotReadableError" || err.name === "AbortError") {
          setError("Camera is bezet door een andere app. Sluit andere apps die de camera gebruiken.");
        } else {
          setError("Kan de camera niet openen. Controleer je browser instellingen.");
        }
      }
    }

    function scanLoop() {
      if (!mounted) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
        animFrameRef.current = requestAnimationFrame(scanLoop);
        return;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) { animFrameRef.current = requestAnimationFrame(scanLoop); return; }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      try {
        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
        if (code && code.data) {
          setScannedData(code.data);
          stopCamera();
          return;
        }
      } catch {}
      animFrameRef.current = requestAnimationFrame(scanLoop);
    }

    startCamera();
    return () => { mounted = false; stopCamera(); };
  }, [stopCamera, retryKey]);

  const handleConfirmPayment = () => {
    setPaymentStep("biometric");
  };

  const handleBiometricComplete = useCallback(() => {
    setPaymentStep("confirming");
    setTimeout(() => setPaymentStep("success"), 1500);
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4">
        <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mb-4">
          <AlertCircle className="w-7 h-7 text-red-500" />
        </div>
        <p className="text-sm text-muted-foreground text-center mb-4">{error}</p>
        <Button
          onClick={() => { setError(null); setRetryKey(k => k + 1); }}
          variant="outline"
          className="rounded-xl gap-2"
          data-testid="pay-scanner-retry"
        >
          <RotateCcw className="w-4 h-4" /> Opnieuw proberen
        </Button>
      </div>
    );
  }

  if (scannedData) {
    if (paymentStep === "biometric") {
      const isKassaBio = scannedData?.startsWith("wespr://kassa/");
      const bioAmount = isKassaBio ? scannedData.split("/").pop() : "12,50";
      const bioRecipient = isKassaBio ? "Albert Heijn" : undefined;
      return <BiometricConfirmStep amount={bioAmount} recipient={bioRecipient} onComplete={handleBiometricComplete} />;
    }

    if (paymentStep === "success") {
      return (
        <div className="flex flex-col items-center justify-center py-8 px-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4"
          >
            <Check className="w-8 h-8 text-emerald-600" />
          </motion.div>
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="font-bold text-lg mb-1"
          >
            Betaling verzonden!
          </motion.p>
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-muted-foreground text-center"
          >
            Je betaling wordt verwerkt
          </motion.p>
        </div>
      );
    }

    if (paymentStep === "confirming") {
      return (
        <div className="flex flex-col items-center justify-center py-8 px-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4 animate-pulse">
            <Send className="w-7 h-7 text-emerald-600" />
          </div>
          <p className="font-semibold mb-2">Betaling verwerken...</p>
          <p className="text-xs text-muted-foreground">Even geduld alsjeblieft</p>
        </div>
      );
    }

    const isKassa = scannedData?.startsWith("wespr://kassa/");
    const kassaAmount = isKassa ? scannedData.split("/").pop() : null;

    return (
      <div className="flex flex-col items-center justify-center py-8 px-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4">
          <ScanLine className="w-7 h-7 text-emerald-600" />
        </div>
        <p className="font-semibold mb-4">QR-code gescand</p>
        {isKassa ? (
          <div className="bg-card rounded-2xl shadow-sm border border-border/40 px-5 py-4 mb-5 w-full max-w-[260px] text-center">
            <p className="text-[11px] text-muted-foreground mb-1">Betaling aan</p>
            <p className="font-bold text-base mb-2">Albert Heijn</p>
            <div className="border-t border-border/30 pt-3">
              <p className="text-[11px] text-muted-foreground mb-0.5">Bedrag</p>
              <p className="text-2xl font-bold">€ {kassaAmount}</p>
            </div>
          </div>
        ) : (
          <div className="bg-muted/50 rounded-xl px-4 py-3 mb-4 max-w-full">
            <p className="text-xs text-muted-foreground break-all font-mono">{scannedData}</p>
          </div>
        )}
        <Button onClick={handleConfirmPayment} className="rounded-xl gap-2 w-full max-w-[260px] h-12" data-testid="pay-scanner-confirm">
          <Fingerprint className="w-5 h-5" /> Betaal met vingerafdruk
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-4">
      <div className="relative w-56 h-56 rounded-3xl overflow-hidden bg-black mb-6">
        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted autoPlay />
        <canvas ref={canvasRef} className="hidden" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-3xl" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-3xl" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-3xl" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-3xl" />
          <div className="absolute left-0 right-0 h-0.5 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] animate-scan-line" />
        </div>
      </div>
      <p className="text-sm text-muted-foreground text-center">Richt je camera op een QR-code om te betalen</p>
      <p className="text-xs text-muted-foreground text-center mt-2 flex items-center gap-1">
        <Shield className="w-3.5 h-3.5 text-emerald-500" /> Beveiligd met end-to-end versleuteling
      </p>

      <div className="mt-5 w-full px-4">
        <div className="relative flex items-center justify-center mb-3">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/30" /></div>
          <span className="relative bg-background px-3 text-[10px] text-muted-foreground">of gebruik de demo</span>
        </div>
        <button
          onClick={() => setScannedData("wespr://kassa/albert-heijn/EUR/23.50")}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-dashed border-border bg-muted/20 hover:bg-muted/40 transition-colors"
          data-testid="btn-demo-kassa-scan"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <QrCode className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-xs font-semibold">Demo: Scan kassa QR</p>
            <p className="text-[10px] text-muted-foreground">Albert Heijn toont QR · jij scant en betaalt</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        </button>
      </div>
    </div>
  );
}

const DEUR_BALANCE_KEY = "wespr_deur_balance";
const DEUR_TX_KEY = "wespr_deur_txs";

function useDeurBalance() {
  const [balance, setBalanceState] = useState<number>(() => {
    const stored = localStorage.getItem(DEUR_BALANCE_KEY);
    return stored ? parseFloat(stored) : 1184.50;
  });
  const setBalance = (v: number) => { localStorage.setItem(DEUR_BALANCE_KEY, String(v)); setBalanceState(v); };
  return [balance, setBalance] as const;
}

const DEFAULT_DEUR_TXS = [
  { desc: "W€spr Pay ontvangen", amount: "+€ 25,00", date: "Vandaag, 09:41", credit: true, icon: "↗" },
  { desc: "Markt betaling", amount: "-€ 8,50", date: "Gisteren, 14:12", credit: false, icon: "↙" },
  { desc: "ECB stortingsbonus", amount: "+€ 10,00", date: "3 dagen geleden", credit: true, icon: "↗" },
  { desc: "Supermarkt", amount: "-€ 34,20", date: "4 dagen geleden", credit: false, icon: "↙" },
  { desc: "Online aankoop", amount: "-€ 12,99", date: "1 week geleden", credit: false, icon: "↙" },
  { desc: "Overgemaakt van Rabo", amount: "+€ 200,00", date: "2 weken geleden", credit: true, icon: "↗" },
];

function useDeurTxs() {
  const [txs, setTxsState] = useState<Array<{ desc: string; amount: string; date: string; credit: boolean; icon: string }>>(() => {
    try {
      const s = localStorage.getItem(DEUR_TX_KEY);
      return s ? JSON.parse(s) : DEFAULT_DEUR_TXS;
    } catch {
      return DEFAULT_DEUR_TXS;
    }
  });
  const addTx = (tx: typeof txs[0]) => {
    const updated = [tx, ...txs];
    localStorage.setItem(DEUR_TX_KEY, JSON.stringify(updated));
    setTxsState(updated);
  };
  return [txs, addTx] as const;
}

function fmtEur(v: number) {
  return v.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const TOPUP_SOURCES = [
  { id: "rabo", label: "Rabo Betaalrekening", sub: "**** 8291", color: "#003082", tag: "RABO" },
  { id: "visa", label: "Rabo Goldcard Visa", sub: "**** 4521", color: "linear-gradient(to right,#003082,#001a4d)", tag: "VISA" },
];

function QrCameraScanner({ onScan, onClose }: { onScan: (text: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const jsQRRef = useRef<any>(null);
  const activeRef = useRef(true);
  const [ready, setReady] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);

  useEffect(() => {
    activeRef.current = true;
    import("jsqr").then(mod => { jsQRRef.current = mod.default; });
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: "environment" } })
      .then(stream => {
        if (!activeRef.current) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => { videoRef.current?.play(); setReady(true); };
        }
      })
      .catch(err => {
        if (!activeRef.current) return;
        setCamError(err.name === "NotAllowedError"
          ? "Camera toegang geweigerd. Sta camera toe in browserinstellingen."
          : "Camera kon niet worden gestart: " + err.message);
      });
    return () => {
      activeRef.current = false;
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const iv = setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const jsQR = jsQRRef.current;
      if (!jsQR || !video || !canvas || video.readyState < 3 || !activeRef.current) return;
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 240;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
      if (code?.data) {
        activeRef.current = false;
        streamRef.current?.getTracks().forEach(t => t.stop());
        onScan(code.data);
      }
    }, 250);
    return () => clearInterval(iv);
  }, [ready, onScan]);

  return (
    <div className="relative w-full aspect-square max-w-[280px] mx-auto rounded-3xl overflow-hidden bg-black shadow-xl">
      {camError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <p className="text-white/70 text-sm">{camError}</p>
          <Button variant="outline" size="sm" onClick={onClose} className="border-white/30 text-white hover:bg-white/10">Sluiten</Button>
        </div>
      ) : (
        <>
          <video ref={videoRef} muted playsInline className="absolute inset-0 w-full h-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-emerald-400 rounded-tl-3xl" />
            <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-emerald-400 rounded-tr-3xl" />
            <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-emerald-400 rounded-bl-3xl" />
            <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-emerald-400 rounded-br-3xl" />
            {ready && (
              <motion.div className="absolute left-8 right-8 h-0.5 bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.6)]"
                animate={{ top: ["15%", "85%", "15%"] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }} />
            )}
          </div>
          {!ready && <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="w-8 h-8 text-emerald-400 animate-spin" /></div>}
          <button onClick={onClose} className="absolute top-3 right-3 bg-black/50 rounded-full p-1.5 text-white pointer-events-auto">
            <X className="w-4 h-4" />
          </button>
          {ready && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center">
              <span className="text-xs text-emerald-300 font-medium bg-black/40 px-3 py-1 rounded-full">Richt op QR-code…</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DigitaleEuroWallet({ onBack, user }: { onBack: () => void; user: any }) {
  const [tab, setTab] = useState<"home" | "transacties" | "kaart">("home");
  const [actionToast, setActionToast] = useState<string | null>(null);
  const [walletScreen, setWalletScreen] = useState<null | "betalen" | "ontvangen" | "opwaarderen">(null);
  const [payAmount, setPayAmount] = useState("");
  const [payIban, setPayIban] = useState("");
  const [payName, setPayName] = useState("");
  const [payMode, setPayMode] = useState<"form" | "scan">("form");
  const [showCamera, setShowCamera] = useState(false);
  const [topupAmount, setTopupAmount] = useState("");
  const [topupSource, setTopupSource] = useState(TOPUP_SOURCES[0].id);
  const [actionPhase, setActionPhase] = useState<"form" | "bio" | "confirm" | "success">("form");
  const [walletBioState, setWalletBioState] = useState<"idle" | "scanning" | "success">("idle");
  const [balance, setBalance] = useDeurBalance();
  const [transactions, addTx] = useDeurTxs();
  // Rotating QR token for ontvangen
  const [qrToken, setQrToken] = useState(() => Math.random().toString(36).slice(2, 10).toUpperCase());
  const [qrCountdown, setQrCountdown] = useState(5);
  const [receiveAmount, setReceiveAmount] = useState("");
  const [receivePending, setReceivePending] = useState(false);
  const [receiveSuccess, setReceiveSuccess] = useState<{ amount: string; newBalance: number } | null>(null);

  useEffect(() => {
    if (walletScreen !== "ontvangen") return;
    setQrCountdown(5);
    const tick = setInterval(() => {
      setQrCountdown(prev => {
        if (prev <= 1) {
          setQrToken(Math.random().toString(36).slice(2, 10).toUpperCase());
          return 5;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [walletScreen]);

  const resetAction = () => {
    setWalletScreen(null); setActionPhase("form");
    setPayAmount(""); setPayIban(""); setPayName(""); setTopupAmount("");
    setPayMode("form"); setShowCamera(false);
    setWalletBioState("idle"); setReceivePending(false); setReceiveSuccess(null); setReceiveAmount("");
  };

  const doConfirm = useCallback(() => {
    setActionPhase("confirm");
    setTimeout(() => {
      if (walletScreen === "betalen" && payAmount) {
        const amt = parseFloat(payAmount.replace(",", "."));
        if (!isNaN(amt)) {
          setBalance(Math.max(0, balance - amt));
          addTx({ desc: `Betaling aan ${payName || payIban || "ontvanger"}`, amount: `-€ ${fmtEur(amt)}`, date: "Zojuist", credit: false, icon: "↙" });
        }
      }
      if (walletScreen === "opwaarderen" && topupAmount) {
        const amt = parseFloat(topupAmount.replace(",", "."));
        const src = TOPUP_SOURCES.find(s => s.id === topupSource);
        if (!isNaN(amt)) {
          setBalance(balance + amt);
          addTx({ desc: `Opwaardering van ${src?.label || "Rabo"}`, amount: `+€ ${fmtEur(amt)}`, date: "Zojuist", credit: true, icon: "↗" });
        }
      }
      setActionPhase("success");
    }, 1400);
  }, [walletScreen, payAmount, payName, payIban, topupAmount, topupSource, balance]);

  const doBioThenConfirm = useCallback(async () => {
    setActionPhase("bio");
    setWalletBioState("idle");
  }, []);

  const triggerWalletBio = useCallback(async () => {
    if (walletBioState !== "idle") return;
    setWalletBioState("scanning");
    const result = await eudiTriggerWebAuthn(s => {});
    if (result === "cancelled") {
      setWalletBioState("idle");
      return;
    }
    setWalletBioState("success");
    setTimeout(doConfirm, 700);
  }, [walletBioState, doConfirm]);

  if (walletScreen === "betalen") return (
    <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} className="flex flex-col h-full bg-muted/20">
      <header className="px-4 py-4 flex items-center gap-3 bg-emerald-600 text-white sticky top-0 z-50">
        <Button variant="ghost" size="icon" onClick={actionPhase === "bio" ? () => { setActionPhase("form"); setWalletBioState("idle"); } : resetAction}
          className="text-white hover:bg-white/20 rounded-full -ml-2">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold tracking-tight flex-1">Betalen</h1>
        {actionPhase === "form" && (
          <div className="flex gap-1 bg-white/10 rounded-xl p-0.5">
            <button onClick={() => { setPayMode("form"); setShowCamera(false); }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${payMode === "form" ? "bg-white text-emerald-700" : "text-white/70"}`}>
              IBAN
            </button>
            <button onClick={() => { setPayMode("scan"); setShowCamera(true); }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${payMode === "scan" ? "bg-white text-emerald-700" : "text-white/70"}`}>
              <QrCode className="w-3 h-3" /> Scan
            </button>
          </div>
        )}
      </header>
      <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4">
        <AnimatePresence mode="wait">
          {actionPhase === "success" ? (
            <motion.div key="ok" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="flex flex-col items-center justify-center pt-16 gap-4">
              <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-100">
                <Check className="w-10 h-10 text-white" strokeWidth={3} />
              </div>
              <p className="text-xl font-bold text-emerald-600">Betaling verzonden!</p>
              <p className="text-sm text-muted-foreground">€ {payAmount || "0,00"} naar {payName || payIban || "ontvanger"}</p>
              <Button className="mt-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-8" onClick={resetAction}>Terug naar wallet</Button>
            </motion.div>
          ) : actionPhase === "confirm" ? (
            <motion.div key="confirming" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center pt-20 gap-4">
              <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
              <p className="text-base font-semibold text-gray-700">Betaling verwerken…</p>
            </motion.div>
          ) : actionPhase === "bio" ? (
            <motion.div key="bio" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center pt-10 gap-5 px-2">
              <div className="text-center space-y-1">
                <p className="text-base font-bold text-gray-800">Biometrische verificatie</p>
                <p className="text-sm text-muted-foreground">Bevestig uw identiteit om € {payAmount} te betalen</p>
                <p className="text-xs text-muted-foreground font-mono mt-1">aan {payName || payIban}</p>
              </div>
              <motion.button
                onClick={triggerWalletBio}
                disabled={walletBioState !== "idle"}
                animate={walletBioState === "scanning" ? { boxShadow: ["0 0 0 0px rgba(16,185,129,0.3)", "0 0 0 28px rgba(16,185,129,0)"] } : {}}
                transition={{ duration: 1.2, repeat: Infinity }}
                className={`w-32 h-32 rounded-full border-4 flex items-center justify-center transition-all duration-500 ${walletBioState === "success" ? "border-emerald-500 bg-emerald-500" : walletBioState === "scanning" ? "border-emerald-500 bg-emerald-50" : "border-gray-200 bg-gray-50 hover:border-emerald-400 hover:bg-emerald-50/50"}`}>
                {walletBioState === "success"
                  ? <Check className="w-16 h-16 text-white" strokeWidth={3} />
                  : <Fingerprint className={`w-16 h-16 transition-colors duration-500 ${walletBioState === "scanning" ? "text-emerald-600" : "text-gray-300"}`} />}
              </motion.button>
              <p className="text-sm font-medium text-gray-600">
                {walletBioState === "success" ? "✓ Biometrie bevestigd — verwerken…" : walletBioState === "scanning" ? "Vingerafdruk of Face ID…" : "Tik om te bevestigen"}
              </p>
              <div className="w-full bg-card rounded-2xl p-4 border border-border/40 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Bedrag</span>
                  <span className="font-bold text-gray-800">€ {payAmount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ontvanger</span>
                  <span className="font-semibold">{payName || payIban}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rekening</span>
                  <span className="font-semibold text-emerald-600">Digitale Euro</span>
                </div>
              </div>
            </motion.div>
          ) : payMode === "scan" ? (
            <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4 pt-1">
              <p className="text-sm text-muted-foreground text-center">Richt uw camera op de Digitale Euro betaal-QR</p>
              {showCamera ? (
                <QrCameraScanner
                  onScan={(text) => {
                    const parts = text.split(":");
                    if (parts[0] === "DEUR" && parts.length >= 4) {
                      const rawIban = parts[1];
                      const iban = rawIban.replace(/(.{4})/g, "$1 ").trim();
                      const name = parts[2] || "";
                      const amt = parts[3] && parts[3] !== "0" ? parts[3] : "";
                      setPayIban(iban);
                      setPayName(name);
                      if (amt) setPayAmount(amt);
                    } else {
                      setPayIban(text);
                    }
                    setShowCamera(false);
                    setPayMode("form");
                  }}
                  onClose={() => { setShowCamera(false); setPayMode("form"); }}
                />
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-full aspect-square max-w-[280px] mx-auto rounded-3xl bg-black flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <Camera className="w-10 h-10 text-white/30" />
                      <p className="text-white/40 text-xs text-center px-6">Camera klaar om te starten</p>
                    </div>
                  </div>
                  <Button className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-2 px-8"
                    onClick={() => setShowCamera(true)}>
                    <Camera className="w-4 h-4" /> Camera activeren
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground text-center px-4">
                Scan een Digitale Euro betaal-QR van een andere gebruiker of kassa-terminal
              </p>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="bg-card rounded-2xl shadow-sm p-4 space-y-3">
                <h3 className="text-xs font-bold text-muted-foreground">BETAAL GEGEVENS</h3>
                <div>
                  <label className="text-xs text-muted-foreground">IBAN ontvanger</label>
                  <input value={payIban} onChange={e => setPayIban(e.target.value)} placeholder="NL00 BANK 0000 0000 00"
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-muted/30 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    data-testid="eurowallet-betalen-iban" />
                </div>
                <div className="border-t border-border/40 pt-3">
                  <label className="text-xs text-muted-foreground">Naam (optioneel)</label>
                  <input value={payName} onChange={e => setPayName(e.target.value)} placeholder="Naam ontvanger"
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    data-testid="eurowallet-betalen-naam" />
                </div>
                <div className="border-t border-border/40 pt-3">
                  <label className="text-xs text-muted-foreground">Bedrag (€)</label>
                  <input value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="0,00" type="number"
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-muted/30 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    data-testid="eurowallet-betalen-bedrag" />
                </div>
              </div>
              <div className="bg-card rounded-2xl shadow-sm p-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Beschikbaar saldo</span>
                  <span className="font-bold">€ {fmtEur(balance)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Te betalen</span>
                  <span className="font-bold text-blue-600">€ {payAmount || "0,00"}</span>
                </div>
              </div>
              <Button className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-2" onClick={doBioThenConfirm}
                disabled={!payAmount || !payIban} data-testid="eurowallet-betalen-confirm">
                <Fingerprint className="w-4 h-4" /> Bevestig met biometrie
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );

  if (walletScreen === "ontvangen") {
    const qrData = `DEUR:NL91DEUR00004300:${user?.displayName || "Ges"}:${receiveAmount || "0"}:${qrToken}`;
    return (
      <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} className="flex flex-col h-full bg-muted/20">
        <header className="px-4 py-4 flex items-center gap-3 bg-emerald-600 text-white sticky top-0 z-50">
          <Button variant="ghost" size="icon" onClick={resetAction} className="text-white hover:bg-white/20 rounded-full -ml-2">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold tracking-tight flex-1">Ontvangen</h1>
        </header>
        <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4">

          {/* ✅ Ontvangst succesvol */}
          {receiveSuccess && (
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 18 }}
              className="flex flex-col items-center gap-5 pt-6">
              <div className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-100">
                <Check className="w-12 h-12 text-white" strokeWidth={3} />
              </div>
              <div className="text-center space-y-1">
                <p className="text-2xl font-extrabold text-emerald-600">+€ {receiveSuccess.amount}</p>
                <p className="text-base font-semibold text-gray-800">Ontvangen!</p>
                <p className="text-sm text-muted-foreground">Bijgeschreven op uw Digitale Euro rekening</p>
              </div>

              {/* Updated balance */}
              <div className="w-full bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2">
                <p className="text-xs font-bold text-emerald-700">NIEUW SALDO</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Digitale Euro Wallet</span>
                  <span className="text-xl font-extrabold text-emerald-700">€ {fmtEur(receiveSuccess.newBalance)}</span>
                </div>
              </div>

              {/* Transaction line */}
              <div className="w-full bg-card rounded-2xl shadow-sm p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Ontvangen via QR-code</p>
                  <p className="text-xs text-muted-foreground">Zojuist bijgeschreven</p>
                </div>
                <span className="text-sm font-bold text-emerald-600">+€ {receiveSuccess.amount}</span>
              </div>

              <div className="flex gap-3 w-full">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setReceiveSuccess(null)}>
                  Nieuwe ontvangst
                </Button>
                <Button className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                  onClick={() => { setReceiveSuccess(null); setWalletScreen(null); setTab("transacties"); }}>
                  <Receipt className="w-4 h-4" /> Transacties
                </Button>
              </div>
            </motion.div>
          )}

          {!receiveSuccess && (<>
          {/* QR code card */}
          <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 px-4 pt-5 pb-4">
              <p className="text-white/80 text-xs font-bold mb-1">DIGITALE EURO BETAAL-QR</p>
              <p className="text-white text-lg font-bold">{user?.displayName || "Ges"}</p>
              <p className="text-white/60 text-xs font-mono mt-0.5">NL91 DEUR 0000 4300</p>
            </div>
            <div className="flex flex-col items-center py-5 gap-3 bg-white">
              <AnimatePresence mode="wait">
                <motion.div key={qrToken}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.3 }}
                  className="p-3 bg-white rounded-xl shadow-inner border border-gray-100">
                  <QRCodeSVG value={qrData} size={180} level="M" />
                </motion.div>
              </AnimatePresence>
              {/* Countdown */}
              <div className="flex items-center gap-2">
                <div className="relative w-5 h-5">
                  <svg viewBox="0 0 20 20" className="w-5 h-5 -rotate-90">
                    <circle cx="10" cy="10" r="8" fill="none" stroke="#e5e7eb" strokeWidth="2.5" />
                    <circle cx="10" cy="10" r="8" fill="none" stroke="#059669" strokeWidth="2.5"
                      strokeDasharray={`${2 * Math.PI * 8}`}
                      strokeDashoffset={`${2 * Math.PI * 8 * (1 - qrCountdown / 5)}`}
                      style={{ transition: "stroke-dashoffset 1s linear" }} />
                  </svg>
                </div>
                <span className="text-xs text-gray-500">Verloopt over <span className="font-bold text-emerald-600">{qrCountdown}s</span> — code wisselt automatisch</span>
              </div>
            </div>
          </div>

          {/* Instruction under QR */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-800">Laat de QR code zien aan de betaler</p>
              <p className="text-xs text-emerald-600 mt-0.5">De betaler scant uw code met zijn W€spr app of betaalapp</p>
            </div>
          </div>

          {/* Amount — volgt uit scan of vul in */}
          <div className="bg-card rounded-2xl shadow-sm p-4">
            <label className="text-xs font-bold text-muted-foreground">BEDRAG — VOLGT UIT SCAN OF VUL IN</label>
            <p className="text-xs text-muted-foreground mb-2 mt-0.5">Zit het bedrag in de QR? Dan vult de betaler niets meer in</p>
            <div className="flex gap-2 items-center">
              <span className="text-lg font-bold text-gray-500">€</span>
              <input value={receiveAmount} onChange={e => setReceiveAmount(e.target.value)} placeholder="0,00" type="number"
                className="flex-1 px-3 py-2 rounded-xl border border-border bg-muted/30 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400"
                data-testid="eurowallet-ontvangen-bedrag" />
            </div>
            {receiveAmount && (
              <p className="text-xs text-emerald-600 font-medium mt-2">QR code bevat: € {receiveAmount}</p>
            )}
          </div>

          {/* Demo: simulate incoming payment */}
          {receiveAmount && !receivePending && !receiveSuccess && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <p className="text-xs font-bold text-blue-700 mb-1">DEMO — BETALING SIMULEREN</p>
              <p className="text-xs text-blue-600 mb-3">Simuleer dat iemand uw QR-code scant en € {receiveAmount} betaalt</p>
              <Button className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-2" size="sm"
                data-testid="eurowallet-ontvangen-simuleer"
                onClick={() => {
                  setReceivePending(true);
                  setTimeout(() => {
                    const amt = parseFloat(receiveAmount.replace(",", "."));
                    if (!isNaN(amt) && amt > 0) {
                      const newBal = balance + amt;
                      setBalance(newBal);
                      addTx({ desc: "Ontvangen via QR-code", amount: `+€ ${fmtEur(amt)}`, date: "Zojuist", credit: true, icon: "↗" });
                      setReceivePending(false);
                      setReceiveSuccess({ amount: receiveAmount, newBalance: newBal });
                    } else {
                      setReceivePending(false);
                    }
                  }, 1500);
                }}>
                <ArrowDownLeft className="w-4 h-4" /> Simuleer ontvangst van € {receiveAmount}
              </Button>
            </div>
          )}
          {receivePending && (
            <div className="flex items-center gap-3 bg-blue-50 rounded-2xl p-4">
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin shrink-0" />
              <p className="text-sm font-medium text-blue-700">Betaling ontvangen… bijschrijven</p>
            </div>
          )}

          {/* Account info + copy */}
          <div className="bg-card rounded-2xl shadow-sm p-4 space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground">REKENINGGEGEVENS</h3>
            {[
              { label: "Naam", value: user?.displayName || "Ges" },
              { label: "IBAN", value: "NL91 DEUR 0000 4300" },
              { label: "Type", value: "Digitale Euro · ECB" },
            ].map((item, i) => (
              <div key={i}>
                {i > 0 && <div className="border-t border-border/40 mb-3" />}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="text-sm font-semibold">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
          </>)}
        </div>
        <AnimatePresence>{actionToast && <ToastFeedback message={actionToast} onDone={() => setActionToast(null)} />}</AnimatePresence>
      </motion.div>
    );
  }

  if (walletScreen === "opwaarderen") return (
    <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} className="flex flex-col h-full bg-muted/20">
      <header className="px-4 py-4 flex items-center gap-3 bg-emerald-600 text-white sticky top-0 z-50">
        <Button variant="ghost" size="icon" onClick={actionPhase === "bio" ? () => { setActionPhase("form"); setWalletBioState("idle"); } : resetAction}
          className="text-white hover:bg-white/20 rounded-full -ml-2">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold tracking-tight flex-1">Opwaarderen</h1>
      </header>
      <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4">
        <AnimatePresence mode="wait">
          {actionPhase === "success" ? (
            <motion.div key="ok" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="flex flex-col items-center justify-center pt-20 gap-4">
              <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-100">
                <Check className="w-10 h-10 text-white" strokeWidth={3} />
              </div>
              <p className="text-xl font-bold text-emerald-600">Opgewaardeerd!</p>
              <p className="text-sm text-muted-foreground">€ {topupAmount || "0,00"} toegevoegd aan je Digitale Euro</p>
              <Button className="mt-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-8" onClick={resetAction}>Terug naar wallet</Button>
            </motion.div>
          ) : actionPhase === "confirm" ? (
            <motion.div key="confirming" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center pt-20 gap-4">
              <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
              <p className="text-base font-semibold text-gray-700">Storting verwerken…</p>
            </motion.div>
          ) : actionPhase === "bio" ? (
            <motion.div key="bio-topup" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center pt-10 gap-5 px-2">
              <div className="text-center space-y-1">
                <p className="text-base font-bold text-gray-800">Biometrische verificatie</p>
                <p className="text-sm text-muted-foreground">Bevestig uw identiteit om € {topupAmount} op te waarderen</p>
                <p className="text-xs text-muted-foreground mt-1">van {TOPUP_SOURCES.find(s => s.id === topupSource)?.label}</p>
              </div>
              <motion.button onClick={triggerWalletBio} disabled={walletBioState !== "idle"}
                animate={walletBioState === "scanning" ? { boxShadow: ["0 0 0 0px rgba(16,185,129,0.3)", "0 0 0 28px rgba(16,185,129,0)"] } : {}}
                transition={{ duration: 1.2, repeat: Infinity }}
                className={`w-32 h-32 rounded-full border-4 flex items-center justify-center transition-all duration-500 ${walletBioState === "success" ? "border-emerald-500 bg-emerald-500" : walletBioState === "scanning" ? "border-emerald-500 bg-emerald-50" : "border-gray-200 bg-gray-50 hover:border-emerald-400 hover:bg-emerald-50/50"}`}>
                {walletBioState === "success"
                  ? <Check className="w-16 h-16 text-white" strokeWidth={3} />
                  : <Fingerprint className={`w-16 h-16 transition-colors duration-500 ${walletBioState === "scanning" ? "text-emerald-600" : "text-gray-300"}`} />}
              </motion.button>
              <p className="text-sm font-medium text-gray-600">
                {walletBioState === "success" ? "✓ Bevestigd — verwerken…" : walletBioState === "scanning" ? "Vingerafdruk of Face ID…" : "Tik om te bevestigen"}
              </p>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {/* Interactive source selector */}
              <div className="bg-card rounded-2xl shadow-sm p-4 space-y-2">
                <h3 className="text-xs font-bold text-muted-foreground mb-3">BRONREKENING</h3>
                {TOPUP_SOURCES.map(src => (
                  <button key={src.id} onClick={() => setTopupSource(src.id)}
                    data-testid={`eurowallet-source-${src.id}`}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${topupSource === src.id ? "border-emerald-500 bg-emerald-50/60" : "border-border bg-muted/20 hover:bg-muted/40"}`}>
                    <div className="w-10 h-7 rounded flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                      style={{ background: src.color }}>
                      {src.tag}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold">{src.label}</p>
                      <p className="text-xs text-muted-foreground">{src.sub}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${topupSource === src.id ? "border-emerald-500" : "border-gray-300"}`}>
                      {topupSource === src.id && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                    </div>
                  </button>
                ))}
              </div>
              <div className="bg-card rounded-2xl shadow-sm p-4">
                <label className="text-xs text-muted-foreground">Bedrag om op te waarderen (€)</label>
                <input value={topupAmount} onChange={e => setTopupAmount(e.target.value)} placeholder="0,00" type="number"
                  className="w-full mt-2 px-3 py-3 rounded-xl border border-border bg-muted/30 text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400 text-center"
                  data-testid="eurowallet-opwaarderen-bedrag" />
                <div className="flex gap-2 mt-3">
                  {["25", "50", "100", "200"].map(v => (
                    <button key={v} onClick={() => setTopupAmount(v)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${topupAmount === v ? "bg-emerald-600 text-white border-emerald-600" : "border-border text-muted-foreground hover:bg-muted"}`}>
                      € {v}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-card rounded-2xl shadow-sm p-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Huidig D€ saldo</span>
                  <span className="font-bold">€ {fmtEur(balance)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Na opwaarderen</span>
                  <span className="font-bold text-emerald-600">
                    € {topupAmount ? fmtEur(balance + parseFloat(topupAmount.replace(",", "."))) : fmtEur(balance)}
                  </span>
                </div>
              </div>
              <Button className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-2" onClick={doBioThenConfirm}
                disabled={!topupAmount} data-testid="eurowallet-opwaarderen-confirm">
                <Fingerprint className="w-4 h-4" /> Bevestig met biometrie
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full bg-muted/20">
      <header className="px-4 py-4 flex items-center gap-3 bg-emerald-600 text-white sticky top-0 z-50">
        <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-white/20 rounded-full -ml-2">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold tracking-tight flex-1">Digitale Euro Wallet</h1>
        <span className="text-xs text-white/70 flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> EUDI</span>
      </header>

      <div className="flex-1 overflow-y-auto hide-scrollbar">

        {tab === "home" && (
          <div className="p-4 space-y-4">
            {/* Greeting */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <p className="text-sm text-muted-foreground">Welkom terug,</p>
                <p className="text-2xl font-bold">{user?.displayName || "Ges"}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg">
                {(user?.displayName || "G")[0].toUpperCase()}
              </div>
            </div>

            {/* Balance card */}
            <div className="bg-card rounded-2xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-bold text-muted-foreground">DIGITALE EURO REKENING</p>
                <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">ECB</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">NL91 •••• •••• 4300</p>
              <p className="text-xs text-muted-foreground mb-1">Beschikbaar saldo</p>
              <motion.p key={balance} initial={{ scale: 1.04 }} animate={{ scale: 1 }} className="text-3xl font-bold text-gray-900 mb-3">
                € {fmtEur(balance)}
              </motion.p>
              <div className="border-t border-border/40 pt-3 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Rente: <span className="font-semibold text-gray-700">0,00%</span> — digitale euro's renderen niet</p>
              </div>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Betalen", icon: <ArrowUpRight className="w-5 h-5" />, color: "text-blue-600 bg-blue-50", screen: "betalen" as const },
                { label: "Ontvangen", icon: <ArrowDownLeft className="w-5 h-5" />, color: "text-emerald-600 bg-emerald-50", screen: "ontvangen" as const },
                { label: "Opwaarderen", icon: <Plus className="w-5 h-5" />, color: "text-violet-600 bg-violet-50", screen: "opwaarderen" as const },
              ].map(({ label, icon, color, screen }) => (
                <button key={label} onClick={() => { setActionPhase("form"); setWalletScreen(screen); }}
                  className="flex flex-col items-center gap-2 bg-card rounded-2xl p-4 shadow-sm active:scale-95 transition-transform"
                  data-testid={`eurowallet-action-${label.toLowerCase()}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color}`}>{icon}</div>
                  <span className="text-xs font-semibold text-gray-700">{label}</span>
                </button>
              ))}
            </div>

            {/* Recent transactions */}
            <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <p className="text-xs font-bold text-muted-foreground">RECENTE TRANSACTIES</p>
                <button onClick={() => setTab("transacties")} className="text-xs text-emerald-600 font-semibold">Alles</button>
              </div>
              {transactions.slice(0, 3).map((tx, i) => (
                <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i < 2 ? "border-b border-border/40" : ""}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${tx.credit ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                    {tx.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{tx.desc}</p>
                    <p className="text-xs text-muted-foreground">{tx.date}</p>
                  </div>
                  <span className={`text-sm font-bold ${tx.credit ? "text-emerald-600" : "text-gray-800"}`}>{tx.amount}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "transacties" && (
          <div className="p-4 space-y-3">
            <p className="text-xs font-bold text-muted-foreground px-1">ALLE TRANSACTIES</p>
            <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
              {transactions.map((tx, i) => (
                <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i < transactions.length - 1 ? "border-b border-border/40" : ""}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${tx.credit ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                    {tx.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{tx.desc}</p>
                    <p className="text-xs text-muted-foreground">{tx.date}</p>
                  </div>
                  <span className={`text-sm font-bold ${tx.credit ? "text-emerald-600" : "text-gray-800"}`}>{tx.amount}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "kaart" && (
          <div className="p-4 space-y-4">
            <div className="rounded-2xl p-6 text-white shadow-lg" style={{ background: "linear-gradient(135deg, #003399 0%, #0057b7 100%)" }}>
              <div className="flex justify-between items-start mb-8">
                <span className="text-sm font-bold tracking-widest">DIGITALE EURO</span>
                <span className="text-2xl font-black opacity-90">€</span>
              </div>
              <p className="text-lg tracking-[0.2em] font-mono mb-4">NL91 •••• •••• 4300</p>
              <div className="flex justify-between text-sm opacity-80">
                <span>{user?.displayName || "Ges"}</span>
                <span>CBDC · ECB</span>
              </div>
            </div>
            <div className="bg-card rounded-2xl shadow-sm p-4 space-y-3">
              <h3 className="text-xs font-bold text-muted-foreground">KAARTGEGEVENS</h3>
              {[
                { label: "Type", value: "CBDC (Digitale Euro)" },
                { label: "Uitgever", value: "Europese Centrale Bank" },
                { label: "Status", value: "Actief", green: true },
                { label: "Verificatie", value: "EUDI · Geverifieerd", green: true },
                { label: "Aangemaakt", value: "1 jan. 2026" },
              ].map((item, i) => (
                <div key={i}>
                  {i > 0 && <div className="border-t border-border/40 mb-3" />}
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className={`text-sm font-medium ${item.green ? "text-emerald-600" : ""}`}>{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom tab bar */}
      <div className="flex border-t border-border/40 bg-card">
        {([
          { id: "home", label: "Home", icon: <Home className="w-5 h-5" /> },
          { id: "transacties", label: "Transacties", icon: <Receipt className="w-5 h-5" /> },
          { id: "kaart", label: "Kaart", icon: <CreditCard className="w-5 h-5" /> },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${tab === t.id ? "text-emerald-600" : "text-muted-foreground"}`}
            data-testid={`eurowallet-tab-${t.id}`}>
            {t.icon}
            <span className="text-[10px] font-semibold">{t.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {actionToast && <ToastFeedback message={actionToast} onDone={() => setActionToast(null)} />}
      </AnimatePresence>
    </motion.div>
  );
}

function DigitaleEuroCardScreen({ onBack, user }: { onBack: () => void; user: any }) {
  const [phase, setPhase] = useState<"card" | "eudi" | "biometric" | "wallet">("card");
  const [cardFlipped, setCardFlipped] = useState(false);
  const [cvvVisible, setCvvVisible] = useState(false);
  const [bioState, setBioState] = useState<"idle" | "scanning" | "success">("idle");
  const [balance] = useDeurBalance();
  const [transactions] = useDeurTxs();

  const handleBioTap = async () => {
    if (bioState !== "idle") return;
    setBioState("scanning");
    const result = await eudiTriggerWebAuthn(setBioState as any);
    if (result === "cancelled") return;
    if (result === "success") {
      setBioState("success");
      setTimeout(() => setPhase("wallet"), 700);
    } else {
      // fallback: simulate
      let p = 0;
      const iv = setInterval(() => {
        p += 8;
        if (p >= 100) { clearInterval(iv); setBioState("success"); setTimeout(() => setPhase("wallet"), 700); }
      }, 80);
    }
  };

  if (phase === "wallet") return <DigitaleEuroWallet onBack={() => setPhase("card")} user={user} />;

  if (phase === "biometric") return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full bg-muted/20">
      <header className="px-4 py-4 flex items-center gap-3 bg-emerald-600 text-white sticky top-0 z-50">
        <Button variant="ghost" size="icon" onClick={() => { setBioState("idle"); setPhase("eudi"); }}
          className="text-white hover:bg-white/20 rounded-full -ml-2" disabled={bioState === "scanning"}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold tracking-tight flex-1">Verificatie</h1>
      </header>
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
        <AnimatePresence mode="wait">
          {bioState === "success" ? (
            <motion.div key="done" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-200">
                <Check className="w-12 h-12 text-white" strokeWidth={3} />
              </div>
              <p className="text-xl font-bold text-emerald-600">Geverifieerd!</p>
              <p className="text-sm text-muted-foreground">Identiteit bevestigd via EUDI</p>
            </motion.div>
          ) : (
            <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-6">
              <p className="text-base font-semibold text-gray-800 text-center">
                {bioState === "scanning" ? "Verifiëren…" : "Bevestig met biometrie"}
              </p>
              <motion.button
                onClick={handleBioTap}
                disabled={bioState !== "idle"}
                data-testid="btn-bio-tap"
                animate={bioState === "scanning" ? { boxShadow: ["0 0 0 0px rgba(16,185,129,0.3)", "0 0 0 22px rgba(16,185,129,0)"] } : {}}
                transition={{ repeat: Infinity, duration: 1.4 }}
                className={`w-32 h-32 rounded-full border-4 flex items-center justify-center transition-colors duration-500 ${bioState === "scanning" ? "border-emerald-500 bg-emerald-50" : "border-gray-200 bg-gray-50 hover:border-emerald-400 hover:bg-emerald-50/50"}`}>
                <Fingerprint className={`w-16 h-16 transition-colors duration-500 ${bioState === "scanning" ? "text-emerald-600" : "text-gray-300"}`} />
              </motion.button>
              <p className="text-sm text-muted-foreground text-center">
                {bioState === "scanning" ? "Gebruik vingerafdruk of Face ID…" : "Tik op de sensor"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );

  if (phase === "eudi") return (
    <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} className="flex flex-col h-full bg-muted/20">
      <header className="px-4 py-4 flex items-center gap-3 bg-emerald-600 text-white sticky top-0 z-50">
        <Button variant="ghost" size="icon" onClick={() => setPhase("card")} className="text-white hover:bg-white/20 rounded-full -ml-2">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold tracking-tight flex-1">EUDI Verificatie</h1>
      </header>
      <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4">
        <div className="flex flex-col items-center py-6 gap-3">
          <div className="w-16 h-16 rounded-2xl bg-[#003399]/10 flex items-center justify-center text-3xl font-black text-[#003399]">€</div>
          <h2 className="text-xl font-bold text-gray-900 text-center">Digitale Euro Wallet</h2>
          <p className="text-sm text-muted-foreground text-center">Bevestig je identiteit via de Europese Digitale Identiteit (EUDI)</p>
        </div>
        <div className="bg-card rounded-2xl shadow-sm p-4 space-y-3">
          <h3 className="text-xs font-bold text-muted-foreground">GEGEVENS DIE WORDEN GEDEELD</h3>
          {[
            { label: "Naam", value: user?.displayName || "Ges", shared: true },
            { label: "Nationaliteit", value: "NL", shared: true },
            { label: "BSN", value: "Verborgen", shared: false },
            { label: "Adres", value: "Verborgen", shared: false },
          ].map((item, i) => (
            <div key={i}>
              {i > 0 && <div className="border-t border-border/40 mb-3" />}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className={`text-sm font-medium flex items-center gap-1 ${item.shared ? "text-gray-800" : "text-muted-foreground"}`}>
                  {!item.shared && <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />}
                  {item.value}
                </span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center px-4">
          Alleen naam en nationaliteit worden gedeeld. BSN en adres blijven privé.
        </p>
        <Button className="w-full rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={() => { setBioState("idle"); setPhase("biometric"); }}
          data-testid="btn-eudi-confirm">
          <Fingerprint className="w-4 h-4" /> Bevestigen met biometrie
        </Button>
      </div>
    </motion.div>
  );

  return (
    <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} className="flex flex-col h-full bg-muted/20">
      <header className="px-4 py-4 flex items-center gap-3 bg-emerald-600 text-white sticky top-0 z-50">
        <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-white/20 rounded-full -ml-2">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold tracking-tight flex-1">Digitale Euro</h1>
      </header>
      <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4">

        {/* Flippable card */}
        <div className="flex flex-col items-start gap-1">
          <div
            onClick={() => setCardFlipped(f => !f)}
            data-testid="digitale-euro-card-flip"
            className="w-full sm:max-w-[320px] cursor-pointer select-none"
            style={{ perspective: 1000 }}>
            <motion.div
              animate={{ rotateY: cardFlipped ? 180 : 0 }}
              transition={{ duration: 0.55, ease: "easeInOut" }}
              style={{ transformStyle: "preserve-3d", position: "relative", aspectRatio: "85.6/54" }}>
              {/* Front */}
              <div style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", background: "linear-gradient(135deg, #003399 0%, #0057b7 100%)" } as any}
                className="rounded-2xl p-5 text-white shadow-lg absolute inset-0 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold tracking-widest opacity-80">DIGITALE EURO</span>
                  <span className="text-xl font-black opacity-90">€</span>
                </div>
                <p className="text-sm tracking-[0.18em] font-mono">NL91 •••• •••• 4300</p>
                <div className="flex justify-between text-xs opacity-80">
                  <span>{user?.displayName || "Ges"}</span>
                  <span className="font-semibold">CBDC · ECB</span>
                </div>
              </div>
              {/* Back */}
              <div style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)", background: "linear-gradient(135deg, #001f6b 0%, #003399 100%)" } as any}
                className="rounded-2xl text-white shadow-lg absolute inset-0 overflow-hidden flex flex-col justify-between">
                <div className="h-9 bg-black/40 mt-5" />
                <div className="px-5 pb-4">
                  <div className="bg-white/20 rounded px-3 py-2 flex justify-between items-center mb-2">
                    <span className="text-xs opacity-60">CVV</span>
                    <span className="font-mono font-bold text-sm tracking-widest">
                      {cvvVisible ? "742" : "•••"}
                    </span>
                    <button onClick={e => { e.stopPropagation(); setCvvVisible(v => !v); }}
                      className="ml-2 opacity-70 hover:opacity-100">
                      {cvvVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[10px] opacity-50 text-center">Tik op de kaart om terug te draaien</p>
                </div>
              </div>
            </motion.div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Tik op de kaart om te draaien</p>
        </div>

        {/* Details */}
        <div className="bg-card rounded-2xl shadow-sm p-4 space-y-3">
          <h3 className="text-xs font-bold text-muted-foreground">KAARTGEGEVENS</h3>
          {[
            { label: "Type", value: "CBDC (Digitale Euro)" },
            { label: "Status", value: "Actief", isGreen: true },
            { label: "Valuta", value: "EUR · Europese Centrale Bank" },
            { label: "Verificatie", value: "EUDI vereist", isGreen: true },
          ].map((item, i) => (
            <div key={i}>
              {i > 0 && <div className="border-t border-border/40 mb-3" />}
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className={`text-sm font-medium ${item.isGreen ? "text-emerald-600" : ""}`}>{item.value}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Recent transactions */}
        <div className="bg-card rounded-2xl shadow-sm p-4 space-y-3">
          <h3 className="text-xs font-bold text-muted-foreground">RECENTE TRANSACTIES</h3>
          {transactions.slice(0, 3).map((item, i) => (
            <div key={i}>
              {i > 0 && <div className="border-t border-border/40 mb-3" />}
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">{item.desc}</p>
                  <p className="text-xs text-muted-foreground">{item.date}</p>
                </div>
                <span className={`text-sm font-bold ${item.credit ? "text-emerald-600" : ""}`}>{item.amount}</span>
              </div>
            </div>
          ))}
        </div>

        <Button className="w-full rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={() => setPhase("eudi")} data-testid="btn-open-euro-wallet">
          <span className="font-bold">€</span> Open Digitale Euro Wallet
        </Button>
      </div>
    </motion.div>
  );
}

function ApplePayScreen({ onBack, user, onToast }: { onBack: () => void; user: any; onToast: (msg: string) => void }) {
  const [payPhase, setPayPhase] = useState<"amount" | "bio" | "nfc" | "success">("amount");
  const [selectedCard, setSelectedCard] = useState<"debit" | "visa">("debit");
  const [contactless, setContactless] = useState(true);
  const [payAmount, setPayAmount] = useState("");
  const [apBioState, setApBioState] = useState<"idle" | "scanning" | "success">("idle");

  const cards = {
    debit: { label: "RABO", number: "**** 8291", name: "Rabo Betaalrekening", color: "#003082" },
    visa:  { label: "VISA", number: "**** 4521", name: "Rabo Goldcard Visa",  color: "linear-gradient(to right, #003082, #001a4d)" },
  };
  const card = cards[selectedCard];
  const quickAmounts = ["4,50", "8,95", "12,95", "22,00"];

  const handleBio = async () => {
    if (apBioState !== "idle") return;
    if (!contactless) { onToast("Contactloos betalen is uitgeschakeld"); return; }
    setApBioState("scanning");
    const result = await eudiTriggerWebAuthn(() => {});
    if (result === "cancelled") { setApBioState("idle"); return; }
    setApBioState("success");
    setTimeout(() => { setPayPhase("nfc"); setApBioState("idle"); }, 600);
  };

  const handleNfcTap = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
    setRecentTx(prev => [
      { desc: card.name, amount: `€ ${payAmount}`, date: `Vandaag, ${timeStr}`, emoji: "💳" },
      ...prev,
    ]);
    setPayPhase("success");
  };

  const resetPay = () => { setPayPhase("amount"); setPayAmount(""); setApBioState("idle"); };

  const [recentTx, setRecentTx] = useState([
    { desc: "Starbucks", amount: "€ 5,40", date: "Vandaag, 09:15", emoji: "☕" },
    { desc: "Albert Heijn", amount: "€ 18,30", date: "Gisteren, 16:48", emoji: "🛒" },
    { desc: "Action", amount: "€ 8,95", date: "Gisteren, 14:22", emoji: "🛍" },
    { desc: "Shell", amount: "€ 62,10", date: "Ma, 11:05", emoji: "⛽" },
  ]);

  return (
    <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} className="flex flex-col h-full bg-black">
      <header className="px-4 py-4 flex items-center gap-3 bg-black text-white sticky top-0 z-50">
        <Button variant="ghost" size="icon"
          onClick={payPhase === "bio" ? () => { setPayPhase("amount"); setApBioState("idle"); } : payPhase === "nfc" ? () => setPayPhase("bio") : payPhase === "success" ? resetPay : onBack}
          className="text-white hover:bg-white/10 rounded-full -ml-2">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold tracking-tight flex-1 text-white">Apple Pay</h1>
        <span className="text-xs text-white/50 font-medium">iPhone 15 Pro</span>
      </header>

      <div className="flex-1 overflow-y-auto hide-scrollbar bg-black">
        {/* Card selector — alleen zichtbaar in amount fase */}
        {payPhase === "amount" && (
          <div className="px-4 pt-4 pb-2 flex gap-2">
            {(Object.keys(cards) as Array<"debit" | "visa">).map(k => (
              <button key={k} onClick={() => setSelectedCard(k)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${selectedCard === k ? "bg-white text-black" : "bg-white/10 text-white/60"}`}
                data-testid={`applepay-card-${k}`}>
                {cards[k].name}
              </button>
            ))}
          </div>
        )}

        {/* Card visual */}
        <div className="px-4 pt-3 pb-4">
          <div className="w-full sm:max-w-[320px] rounded-2xl p-5 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between" style={{ background: card.color, aspectRatio: "85.6/54" }}>
            <div className="flex justify-between items-start">
              <span className="text-sm font-bold tracking-widest opacity-90">{card.label}</span>
              <div className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-white/70" />
                <span className="text-[10px] text-white/80 font-medium">NFC</span>
              </div>
            </div>
            <p className="text-sm tracking-[0.18em] font-mono opacity-80">{card.number}</p>
            <div className="flex justify-between text-xs opacity-70">
              <span>{user?.displayName || "Kaarthouder"}</span>
              <span className="font-semibold">Apple Pay</span>
            </div>
          </div>
        </div>

        {/* STAP 1: Bedrag invoeren */}
        <div className="flex flex-col items-center px-4">
          <AnimatePresence mode="wait">

            {payPhase === "amount" && (
              <motion.div key="amount" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                className="w-full flex flex-col items-center gap-4">
                <p className="text-white/50 text-xs font-semibold tracking-widest">BEDRAG</p>
                <div className="flex items-center gap-2">
                  <span className="text-white/50 text-3xl font-bold">€</span>
                  <input value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="0,00" type="number"
                    className="bg-transparent text-white text-5xl font-black text-center outline-none w-48 placeholder:text-white/20"
                    data-testid="applepay-amount-input" />
                </div>
                <div className="flex gap-2">
                  {quickAmounts.map(a => (
                    <button key={a} onClick={() => setPayAmount(a)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${payAmount === a ? "bg-white text-black" : "bg-white/10 text-white/60 hover:bg-white/20"}`}>
                      € {a}
                    </button>
                  ))}
                </div>
                <Button className="w-full rounded-2xl bg-white text-black font-bold text-base h-14 mt-2 flex items-center gap-2 hover:bg-white/90"
                  disabled={!payAmount || payAmount === "0" || payAmount === "0,00"}
                  onClick={() => setPayPhase("bio")} data-testid="applepay-to-bio-btn">
                  <Fingerprint className="w-5 h-5" /> Bevestig met biometrie
                </Button>
              </motion.div>
            )}

            {/* STAP 2: Biometrie */}
            {payPhase === "bio" && (
              <motion.div key="bio" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                className="w-full flex flex-col items-center gap-5 pt-2">
                <div className="text-center">
                  <p className="text-white/50 text-xs font-semibold tracking-widest mb-1">TE BETALEN</p>
                  <p className="text-white font-black text-4xl">€ {payAmount}</p>
                  <p className="text-white/40 text-xs mt-1">{card.name}</p>
                </div>
                <motion.button onClick={handleBio} disabled={apBioState !== "idle"}
                  animate={apBioState === "scanning" ? { boxShadow: ["0 0 0 0px rgba(255,255,255,0.2)", "0 0 0 24px rgba(255,255,255,0)"] } : {}}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className={`w-28 h-28 rounded-full border-4 flex items-center justify-center transition-all duration-500 ${apBioState === "success" ? "border-emerald-500 bg-emerald-500" : apBioState === "scanning" ? "border-white bg-white/10" : "border-white/30 bg-white/5 hover:border-white/60 hover:bg-white/10"}`}
                  data-testid="applepay-bio-btn">
                  {apBioState === "success"
                    ? <Check className="w-14 h-14 text-white" strokeWidth={3} />
                    : <Fingerprint className={`w-14 h-14 transition-colors duration-500 ${apBioState === "scanning" ? "text-white" : "text-white/30"}`} />}
                </motion.button>
                <p className="text-white/50 text-sm">
                  {apBioState === "success" ? "✓ Bevestigd — klaar voor betalen" : apBioState === "scanning" ? "Vingerafdruk of Face ID…" : "Tik om te bevestigen"}
                </p>
              </motion.div>
            )}

            {/* STAP 3: NFC tikken */}
            {payPhase === "nfc" && (
              <motion.div key="nfc" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="w-full flex flex-col items-center gap-4">
                <div className="text-center mb-2">
                  <p className="text-white/50 text-xs font-semibold tracking-widest mb-1">BEDRAG BEVESTIGD</p>
                  <p className="text-white font-black text-4xl">€ {payAmount}</p>
                </div>
                <motion.button onClick={handleNfcTap} data-testid="applepay-tap-btn"
                  className="relative flex flex-col items-center gap-3 w-full active:scale-95 transition-transform">
                  <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
                    {[1, 1.4, 1.8].map((scale, i) => (
                      <motion.div key={i}
                        animate={{ scale: [scale, scale * 1.1, scale], opacity: [0.18, 0.05, 0.18] }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.45, ease: "easeInOut" }}
                        className="absolute rounded-full border border-white"
                        style={{ width: 72, height: 72, top: "50%", left: "50%", transform: `translate(-50%,-50%) scale(${scale})` }} />
                    ))}
                    <div className="w-[72px] h-[72px] rounded-full bg-white/10 border border-white/30 flex items-center justify-center z-10">
                      <Smartphone className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-bold text-lg">Tik om te betalen</p>
                    <p className="text-white/50 text-xs mt-0.5">Hou iPhone bij de betaallezer</p>
                  </div>
                </motion.button>
              </motion.div>
            )}

            {/* STAP 4: Succes */}
            {payPhase === "success" && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="flex flex-col items-center gap-4 pt-2">
                <div className="w-[80px] h-[80px] rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/40">
                  <Check className="w-10 h-10 text-white" strokeWidth={3} />
                </div>
                <div className="text-center">
                  <p className="text-white font-black text-4xl">€ {payAmount}</p>
                  <p className="text-emerald-400 font-semibold text-base mt-1">Betaling geslaagd</p>
                  <p className="text-white/40 text-xs mt-1">{card.name}</p>
                </div>
                <Button variant="outline" className="mt-4 border-white/20 text-white hover:bg-white/10 rounded-2xl px-8"
                  onClick={resetPay} data-testid="applepay-reset-btn">
                  Nieuwe betaling
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Contactless toggle — alleen in amount fase */}
        {payPhase === "amount" && (
        <div className="mx-4 mb-4 mt-6 bg-white/5 rounded-2xl p-4 flex items-center justify-between" data-testid="applepay-contactless-row">
          <div>
            <p className="text-white text-sm font-medium">Contactloos betalen</p>
            <p className="text-white/40 text-xs mt-0.5">{contactless ? "Ingeschakeld" : "Uitgeschakeld"}</p>
          </div>
          <button onClick={() => { setContactless(c => !c); onToast(contactless ? "Contactloos uitgeschakeld" : "Contactloos ingeschakeld"); }}
            className={`w-12 h-6 rounded-full transition-colors relative ${contactless ? "bg-emerald-500" : "bg-white/20"}`}
            data-testid="applepay-contactless-toggle">
            <motion.div animate={{ x: contactless ? 24 : 2 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="absolute top-1 w-4 h-4 bg-white rounded-full shadow" />
          </button>
        </div>
        )}

        {/* Recent transactions */}
        <div className="mx-4 mb-6 bg-white/5 rounded-2xl overflow-hidden">
          <p className="text-white/40 text-xs font-bold px-4 pt-4 pb-2">RECENTE BETALINGEN</p>
          {recentTx.map((tx, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i < recentTx.length - 1 ? "border-b border-white/5" : ""}`}>
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-lg">{tx.emoji}</div>
              <div className="flex-1">
                <p className="text-white text-sm font-medium">{tx.desc}</p>
                <p className="text-white/40 text-xs">{tx.date}</p>
              </div>
              <span className="text-white text-sm font-semibold">-{tx.amount}</span>
            </div>
          ))}
        </div>

        {/* Disconnect */}
        <div className="px-4 pb-8">
          <Button variant="ghost" className="w-full rounded-xl gap-2 text-red-400 hover:bg-red-500/10 border border-red-500/20"
            onClick={() => { onToast("Apple Pay is ontkoppeld"); setTimeout(onBack, 1500); }} data-testid="applepay-disconnect">
            <Power className="w-4 h-4" /> Apple Pay ontkoppelen
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function PayActionScreen({ action, onBack, user, transferPrefill }: { action: PayAction; onBack: () => void; user: any; transferPrefill?: { recipient?: string; amount?: string; description?: string } | null }) {
  const [subScreen, setSubScreen] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [transferStep, setTransferStep] = useState<"form" | "confirm" | "biometric" | "success">("form");
  const [transferData, setTransferData] = useState({ recipient: transferPrefill?.recipient || "", amount: transferPrefill?.amount || "", description: transferPrefill?.description || "" });
  const [googlePayLinked, setGooglePayLinked] = useState(false);
  const [showNewCardForm, setShowNewCardForm] = useState(false);
  const [newCardData, setNewCardData] = useState({ name: "", number: "", expiry: "", type: "debit" });

  const renderCardDetail = (cardType: string) => {
    const isING = cardType === "ing";
    const cardInfo = isING
      ? { title: "Rabo Betaalrekening", number: "**** **** **** 8291", type: "Debitcard", status: "Actief", limit: "€ 2.500/dag", color: "#003082", label: "RABO" }
      : { title: "Rabo Goldcard Visa", number: "**** **** **** 4521", type: "Creditcard", status: "Actief", limit: "€ 5.000", color: "linear-gradient(to right, #003082, #001a4d)", label: "" };

    return (
      <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} className="flex flex-col h-full bg-muted/20">
        <header className="px-4 py-4 flex items-center gap-3 bg-emerald-600 text-white sticky top-0 z-50">
          <Button variant="ghost" size="icon" onClick={() => setSubScreen(null)} className="text-white hover:bg-white/20 rounded-full -ml-2">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold tracking-tight flex-1">{cardInfo.title}</h1>
        </header>
        <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4">
          <div className="w-full sm:max-w-[320px] rounded-2xl p-5 text-white shadow-lg flex flex-col justify-between" style={{ background: cardInfo.color, aspectRatio: "85.6/54" }}>
            <div className="flex justify-between items-start">
              <span className="text-base font-bold tracking-widest">{isING ? "RABO" : "VISA"}</span>
              <CreditCard className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-base tracking-[0.2em] font-mono">{cardInfo.number}</p>
            <div className="flex justify-between text-sm opacity-80">
              <span>{user?.displayName || "Kaarthouder"}</span>
              <span>{isING ? "12/27" : "09/26"}</span>
            </div>
          </div>

          <div className="bg-card rounded-2xl shadow-sm p-4 space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground">KAARTGEGEVENS</h3>
            {[
              { label: "Type", value: cardInfo.type },
              { label: "Status", value: cardInfo.status, isGreen: true },
              { label: "Limiet", value: cardInfo.limit },
              { label: "Contactloos", value: "Ingeschakeld", isGreen: true },
            ].map((item, i) => (
              <div key={i}>
                {i > 0 && <div className="border-t border-border/40 mb-3" />}
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className={`text-sm font-medium ${item.isGreen ? "text-emerald-600" : ""}`}>{item.value}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-card rounded-2xl shadow-sm p-4 space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground">RECENTE TRANSACTIES</h3>
            {[
              { desc: "Albert Heijn", amount: "-€ 34,50", date: "Vandaag" },
              { desc: "Salaris", amount: "+€ 2.850,00", date: "Gisteren", credit: true },
              { desc: "NS Reizen", amount: "-€ 12,80", date: "2 dagen geleden" },
            ].map((item, i) => (
              <div key={i}>
                {i > 0 && <div className="border-t border-border/40 mb-3" />}
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">{item.desc}</p>
                    <p className="text-xs text-muted-foreground">{item.date}</p>
                  </div>
                  <span className={`text-sm font-bold ${item.credit ? "text-emerald-600" : ""}`}>{item.amount}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-card rounded-2xl shadow-sm p-4 space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground">INSTELLINGEN</h3>
            {[
              { icon: Lock, label: "Kaart blokkeren", desc: "Tijdelijk of permanent" },
              { icon: Globe, label: "Buitenland gebruik", desc: "Sta betalingen toe in het buitenland" },
              { icon: Bell, label: "Notificaties", desc: "Meldingen bij transacties" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-1 cursor-pointer" onClick={() => setToast(`${item.label} bijgewerkt`)}>
                {i > 0 && <div className="border-t border-border/40 mb-3 -mx-4 absolute" />}
                <div className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center">
                  <item.icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            ))}
          </div>
          <a href="https://bankieren.rabobank.nl" target="_blank" rel="noopener noreferrer" className="block">
            <Button className="w-full rounded-xl gap-2" style={{ backgroundColor: "#003082" }} data-testid="btn-open-rabobank">
              <Globe className="w-4 h-4" /> Open Rabobank
            </Button>
          </a>
        </div>
        <AnimatePresence>
          {toast && <ToastFeedback message={toast} onDone={() => setToast(null)} />}
        </AnimatePresence>
      </motion.div>
    );
  };

  const renderApplePayScreen = () => <ApplePayScreen onBack={() => setSubScreen(null)} user={user} onToast={setToast} />;

  const renderGooglePayLinking = () => (
    <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} className="flex flex-col h-full bg-muted/20">
      <header className="px-4 py-4 flex items-center gap-3 bg-emerald-600 text-white sticky top-0 z-50">
        <Button variant="ghost" size="icon" onClick={() => setSubScreen(null)} className="text-white hover:bg-white/20 rounded-full -ml-2">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold tracking-tight flex-1">Google Pay koppelen</h1>
      </header>
      <div className="flex-1 overflow-y-auto hide-scrollbar p-4">
        {googlePayLinked ? (
          <div className="flex flex-col items-center py-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4"
            >
              <Check className="w-8 h-8 text-emerald-600" />
            </motion.div>
            <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="font-bold text-lg mb-1">Google Pay gekoppeld!</motion.p>
            <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="text-sm text-muted-foreground text-center">Je kunt nu betalen met Google Pay</motion.p>
            <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
              <Button className="mt-6 rounded-xl" onClick={() => setSubScreen(null)}>Terug naar overzicht</Button>
            </motion.div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col items-center py-6">
              <div className="w-16 h-16 bg-white border-2 border-border/50 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-blue-600">G</span>
              </div>
              <h3 className="font-bold text-lg">Google Pay instellen</h3>
              <p className="text-sm text-muted-foreground text-center mt-1 px-4">Koppel je rekening aan Google Pay om contactloos te betalen met je Android telefoon</p>
            </div>
            <div className="bg-card rounded-2xl shadow-sm p-4 space-y-3">
              <h3 className="text-xs font-bold text-muted-foreground">KIES EEN KAART</h3>
              <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-emerald-500 bg-emerald-50/50 cursor-pointer">
                <div className="w-10 h-7 bg-[#003082] rounded flex items-center justify-center text-white font-bold text-[9px]">RABO</div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Rabo Betaalrekening</p>
                  <p className="text-xs text-muted-foreground">**** 8291</p>
                </div>
                <Check className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border/50 cursor-pointer hover:bg-muted/50" onClick={() => setToast("Visa geselecteerd")}>
                <div className="w-10 h-7 bg-gradient-to-r from-blue-600 to-blue-800 rounded flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Rabo Goldcard Visa</p>
                  <p className="text-xs text-muted-foreground">**** 4521</p>
                </div>
              </div>
            </div>
            <div className="px-2 space-y-2">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">Je kaartgegevens worden veilig opgeslagen door Google en zijn beschermd met encryptie</p>
              </div>
            </div>
            <Button className="w-full rounded-xl gap-2 h-12 text-base" onClick={() => setGooglePayLinked(true)}>
              <Smartphone className="w-5 h-5" /> Google Pay activeren
            </Button>
          </div>
        )}
      </div>
      <AnimatePresence>
        {toast && <ToastFeedback message={toast} onDone={() => setToast(null)} />}
      </AnimatePresence>
    </motion.div>
  );

  const renderNewCardForm = () => (
    <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} className="flex flex-col h-full bg-muted/20">
      <header className="px-4 py-4 flex items-center gap-3 bg-emerald-600 text-white sticky top-0 z-50">
        <Button variant="ghost" size="icon" onClick={() => { setShowNewCardForm(false); setSubScreen(null); }} className="text-white hover:bg-white/20 rounded-full -ml-2">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold tracking-tight flex-1">Kaart toevoegen</h1>
      </header>
      <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-6">
        <div className="flex flex-col items-center py-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mb-3">
            <CreditCard className="w-7 h-7 text-emerald-600" />
          </div>
          <p className="text-sm text-muted-foreground text-center">Voer je kaartgegevens in om een nieuwe kaart toe te voegen</p>
        </div>
        <div>
          <label className="text-xs font-bold text-muted-foreground mb-2 block">NAAM OP KAART</label>
          <input
            value={newCardData.name}
            onChange={(e) => setNewCardData({ ...newCardData, name: e.target.value })}
            placeholder="J. de Vries"
            className="w-full bg-muted/50 rounded-xl px-4 py-3 text-[15px] outline-none border border-border/50"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-muted-foreground mb-2 block">KAARTNUMMER</label>
          <input
            value={newCardData.number}
            onChange={(e) => setNewCardData({ ...newCardData, number: e.target.value })}
            placeholder="0000 0000 0000 0000"
            className="w-full bg-muted/50 rounded-xl px-4 py-3 text-[15px] outline-none border border-border/50 font-mono"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-2 block">VERVALDATUM</label>
            <input
              value={newCardData.expiry}
              onChange={(e) => setNewCardData({ ...newCardData, expiry: e.target.value })}
              placeholder="MM/JJ"
              className="w-full bg-muted/50 rounded-xl px-4 py-3 text-[15px] outline-none border border-border/50"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-2 block">TYPE</label>
            <div className="flex gap-2">
              {["debit", "credit"].map(t => (
                <button key={t} onClick={() => setNewCardData({ ...newCardData, type: t })} className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-colors ${newCardData.type === t ? "bg-emerald-600 text-white border-emerald-600" : "bg-muted/50 border-border/50"}`}>
                  {t === "debit" ? "Debit" : "Credit"}
                </button>
              ))}
            </div>
          </div>
        </div>
        <Button className="w-full rounded-xl gap-2 h-12 text-base" onClick={() => {
          setToast("Kaart succesvol toegevoegd!");
          setTimeout(() => { setShowNewCardForm(false); setSubScreen(null); }, 1500);
        }}>
          <Plus className="w-5 h-5" /> Kaart toevoegen
        </Button>
        <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
          <Shield className="w-3.5 h-3.5 text-emerald-500" /> Je gegevens worden veilig versleuteld
        </p>
      </div>
      <AnimatePresence>
        {toast && <ToastFeedback message={toast} onDone={() => setToast(null)} />}
      </AnimatePresence>
    </motion.div>
  );

  if (subScreen === "card_ing" || subScreen === "card_visa") return renderCardDetail(subScreen === "card_ing" ? "ing" : "visa");
  if (subScreen === "card_euro") return <DigitaleEuroCardScreen onBack={() => setSubScreen(null)} user={user} />;
  if (subScreen === "card_revolut") return (
    <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} className="flex flex-col h-full bg-muted/20">
      <header className="px-4 py-4 flex items-center gap-3 bg-[#191C1F] text-white sticky top-0 z-50">
        <Button variant="ghost" size="icon" onClick={() => setSubScreen(null)} className="text-white hover:bg-white/10 rounded-full -ml-2">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold tracking-tight flex-1">Revolut</h1>
      </header>
      <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4">
        <div className="w-full sm:max-w-[320px] rounded-2xl p-5 text-white shadow-lg bg-[#191C1F] flex flex-col justify-between" style={{ aspectRatio: "85.6/54" }}>
          <div className="flex justify-between items-start">
            <span className="text-base font-bold tracking-widest">REVOLUT</span>
            <CreditCard className="w-5 h-5 opacity-60" />
          </div>
          <p className="text-base tracking-[0.2em] font-mono">**** **** **** 7734</p>
          <div className="flex justify-between text-sm opacity-70">
            <span>{user?.displayName || "Kaarthouder"}</span>
            <span>03/28</span>
          </div>
        </div>
        <div className="bg-card rounded-2xl shadow-sm p-4 space-y-3">
          <h3 className="text-xs font-bold text-muted-foreground">KAARTGEGEVENS</h3>
          {[
            { label: "Type", value: "Visa Debitcard" },
            { label: "Status", value: "Actief", isGreen: true },
            { label: "Valuta", value: "EUR / Multi-currency" },
            { label: "Contactloos", value: "Ingeschakeld", isGreen: true },
          ].map((item, i) => (
            <div key={i}>
              {i > 0 && <div className="border-t border-border/40 mb-3" />}
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className={`text-sm font-medium ${item.isGreen ? "text-emerald-600" : ""}`}>{item.value}</span>
              </div>
            </div>
          ))}
        </div>
        <a href="https://app.revolut.com" target="_blank" rel="noopener noreferrer" className="block">
          <Button className="w-full rounded-xl bg-[#191C1F] hover:bg-[#2c2f33] text-white gap-2" data-testid="btn-open-revolut">
            <Globe className="w-4 h-4" /> Open Revolut
          </Button>
        </a>
      </div>
    </motion.div>
  );
  if (subScreen === "apple_pay") return renderApplePayScreen();
  if (subScreen === "google_pay") return renderGooglePayLinking();
  if (subScreen === "new_card" || showNewCardForm) return renderNewCardForm();

  const handleShare = () => {
    const link = `https://w€spr.pay/${user?.auraId || "user"}/betaal`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).then(() => setToast("Betaallink gekopieerd!")).catch(() => setToast("Betaallink gekopieerd!"));
    } else {
      setToast("Betaallink gekopieerd!");
    }
  };

  const handleTransferSubmit = () => {
    setTransferStep("confirm");
  };

  const handleTransferConfirm = () => {
    setTransferStep("biometric");
  };

  const configs: Record<string, { title: string; content: React.ReactNode }> = {
    scan: {
      title: "Scannen om te betalen",
      content: <PayCameraScanner />,
    },
    receive: {
      title: "Toon mijn betaalcode",
      content: <DynamicPayQR user={user} onBack={onBack} />,
    },
    transfer: {
      title: "Geld overmaken",
      content: transferStep === "biometric" ? (
        <BiometricConfirmStep
          amount={transferData.amount}
          recipient={transferData.recipient}
          onComplete={() => setTransferStep("success")}
        />
      ) : transferStep === "success" ? (
        <div className="flex flex-col items-center justify-center px-6 py-16 relative">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6"
          >
            <Check className="w-10 h-10 text-emerald-600" />
          </motion.div>
          <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-xl font-bold mb-1">Betaling verstuurd!</motion.p>
          <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="text-sm text-muted-foreground text-center mb-2">
            €{transferData.amount || "0,00"} naar {transferData.recipient || "ontvanger"}
          </motion.p>
          <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="text-xs text-muted-foreground">
            {transferData.description && `"${transferData.description}"`}
          </motion.p>
          <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}>
            <Button className="mt-8 rounded-xl" onClick={onBack}>Sluiten</Button>
          </motion.div>
        </div>
      ) : transferStep === "confirm" ? (
        <div className="px-4 py-6">
          <div className="flex flex-col items-center py-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mb-3">
              <Send className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="font-bold text-lg">Bevestig je betaling</h3>
          </div>
          <div className="bg-card rounded-2xl shadow-sm p-4 space-y-4 mb-6">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Ontvanger</span>
              <span className="text-sm font-semibold">{transferData.recipient || "—"}</span>
            </div>
            <div className="border-t border-border/40" />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Bedrag</span>
              <span className="text-lg font-bold">€ {transferData.amount || "0,00"}</span>
            </div>
            {transferData.description && (
              <>
                <div className="border-t border-border/40" />
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Omschrijving</span>
                  <span className="text-sm font-medium">{transferData.description}</span>
                </div>
              </>
            )}
            <div className="border-t border-border/40" />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Van rekening</span>
              <span className="text-sm font-medium">Rabo **** 8291</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 rounded-xl h-12" onClick={() => setTransferStep("form")}>Annuleren</Button>
            <Button className="flex-1 rounded-xl h-12 gap-2" onClick={handleTransferConfirm}>
              <Fingerprint className="w-5 h-5" /> Betaal met vingerafdruk
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-3 flex items-center justify-center gap-1">
            <Shield className="w-3.5 h-3.5 text-emerald-500" /> Transacties zijn beveiligd en versleuteld
          </p>
        </div>
      ) : (
        <div className="px-4 py-6">
          <div className="mb-6">
            <label className="text-xs font-bold text-muted-foreground mb-2 block">ONTVANGER</label>
            <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-4 py-3 border border-border/50">
              <User className="w-5 h-5 text-muted-foreground" />
              <input
                value={transferData.recipient}
                onChange={(e) => setTransferData({ ...transferData, recipient: e.target.value })}
                placeholder="Zoek contact of voer W€spr ID in..."
                className="bg-transparent border-none outline-none flex-1 text-[15px] placeholder:text-muted-foreground/70"
              />
            </div>
          </div>
          <div className="mb-6">
            <label className="text-xs font-bold text-muted-foreground mb-2 block">BEDRAG</label>
            <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-4 py-4 border border-border/50">
              <span className="text-2xl font-bold text-muted-foreground">€</span>
              <input
                type="number"
                value={transferData.amount}
                onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                placeholder="0,00"
                className="bg-transparent border-none outline-none flex-1 text-3xl font-bold placeholder:text-muted-foreground/40"
              />
            </div>
          </div>
          <div className="mb-6">
            <label className="text-xs font-bold text-muted-foreground mb-2 block">OMSCHRIJVING</label>
            <input
              value={transferData.description}
              onChange={(e) => setTransferData({ ...transferData, description: e.target.value })}
              placeholder="Waarvoor is het? (optioneel)"
              className="w-full bg-muted/50 rounded-xl px-4 py-3 text-[15px] outline-none border border-border/50"
            />
          </div>
          <Button className="w-full rounded-xl gap-2 h-12 text-base" onClick={handleTransferSubmit} data-testid="btn-transfer-submit">
            <Send className="w-5 h-5" /> Overmaken
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-3 flex items-center justify-center gap-1">
            <Shield className="w-3.5 h-3.5 text-emerald-500" /> Transacties zijn beveiligd en versleuteld
          </p>
        </div>
      ),
    },
    cards: {
      title: "Kaarten & Rekeningen",
      content: (
        <div className="px-4 py-6">
          <h3 className="text-xs font-bold text-muted-foreground mb-3">BETAALKAARTEN</h3>
          <div className="bg-card rounded-2xl shadow-sm overflow-hidden mb-6">
            <div className="flex items-center gap-4 px-4 py-3 border-b border-border/30 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setSubScreen("card_ing")} data-testid="card-ing-row">
              <div className="w-12 h-8 bg-[#003082] rounded-md flex items-center justify-center text-white font-bold text-[10px]">RABO</div>
              <div className="flex-1">
                <h4 className="font-medium text-[15px]">Rabo Betaalrekening</h4>
                <p className="text-xs text-muted-foreground">**** 8291 · Hoofdrekening</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-4 px-4 py-3 border-b border-border/30 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setSubScreen("card_visa")} data-testid="card-visa-row">
              <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded-md flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-[15px]">Rabo Goldcard Visa</h4>
                <p className="text-xs text-muted-foreground">**** 4521 · Limiet €5.000</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-4 px-4 py-3 border-b border-border/30 cursor-pointer hover:bg-muted/50 transition-colors" onDoubleClick={() => setSubScreen("card_euro")} onClick={() => setSubScreen("card_euro")} data-testid="card-euro-row">
              <div className="w-12 h-8 rounded-md flex items-center justify-center text-white font-bold text-[15px]" style={{ background: "linear-gradient(135deg, #003399 0%, #0057b7 100%)" }}>€</div>
              <div className="flex-1">
                <h4 className="font-medium text-[15px]">Digitale Euro</h4>
                <p className="text-xs text-muted-foreground">Ges · W€spr Eurowallet</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-4 px-4 py-3 border-b border-border/30 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setSubScreen("apple_pay")} data-testid="card-apple-pay-row">
              <div className="w-12 h-8 bg-black rounded-md flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-[15px]">Apple Pay</h4>
                <p className="text-xs text-muted-foreground">Gekoppeld aan Rabo</p>
              </div>
              <span className="text-xs text-emerald-600 font-medium">Actief</span>
            </div>
            <div className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setSubScreen("card_revolut")} data-testid="card-revolut-row">
              <div className="w-12 h-8 bg-[#191C1F] rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-[11px] tracking-tight">REV</span>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-[15px]">Revolut</h4>
                <p className="text-xs text-muted-foreground">Digitale bankrekening</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          <Button variant="outline" className="w-full rounded-xl gap-2" onClick={() => setSubScreen("new_card")} data-testid="btn-add-new-card">
            <CreditCard className="w-4 h-4" /> Nieuwe kaart toevoegen
          </Button>
        </div>
      ),
    },
  };

  const config = configs[action!];

  return (
    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col h-full bg-muted/20 relative">
      <header className="px-4 py-4 flex items-center gap-3 bg-emerald-600 text-white sticky top-0 z-50">
        <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-white/20 rounded-full -ml-2">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold tracking-tight flex-1">{config.title}</h1>
      </header>
      <div className="flex-1 overflow-y-auto hide-scrollbar">{config.content}</div>
      <AnimatePresence>
        {toast && <ToastFeedback message={toast} onDone={() => setToast(null)} />}
      </AnimatePresence>
    </motion.div>
  );
}

function parseReceipt(tx: any) {
  if (!tx.receiptData) return null;
  try { return typeof tx.receiptData === "string" ? JSON.parse(tx.receiptData) : tx.receiptData; } catch { return null; }
}

function fmtCents(c: number) {
  const neg = c < 0;
  const abs = Math.abs(c);
  return `${neg ? "-" : ""}€${(abs / 100).toFixed(2)}`;
}

function generateReceiptPDF(tx: any) {
  const w = 210;
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const ref = `TX-${tx.id?.toString().padStart(6, '0')}`;
  const date = new Date(tx.createdAt);
  const dateStr = !isNaN(date.getTime()) ? date.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" }) : "Onbekend";
  const timeStr = !isNaN(date.getTime()) ? date.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "Onbekend";
  const amountStr = `${tx.type === 'credit' ? '+' : '-'} €${(tx.amount / 100).toFixed(2)}`;
  const typeStr = tx.type === 'credit' ? 'Ontvangen' : 'Betaling';
  const receipt = parseReceipt(tx);

  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, w, 50, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("W€spr Pay", w / 2, 22, { align: "center" });
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Betalingsbewijs", w / 2, 32, { align: "center" });
  doc.setFontSize(9);
  doc.text(ref, w / 2, 42, { align: "center" });

  let y = 60;

  if (receipt?.merchant) {
    const m = receipt.merchant;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 40);
    doc.text(m.name, w / 2, y, { align: "center" });
    y += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    if (m.address) { doc.text(`${m.address}, ${m.city || ""}`, w / 2, y, { align: "center" }); y += 5; }
    if (m.kvk) { doc.text(`KvK: ${m.kvk}  |  BTW: ${m.btw || "-"}`, w / 2, y, { align: "center" }); y += 5; }
  }

  y += 4;
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(amountStr, w / 2, y, { align: "center" });
  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text(tx.description || "Betaling", w / 2, y, { align: "center" });

  y += 10;
  doc.setDrawColor(220, 220, 220);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(25, y, w - 25, y);
  y += 8;

  if (receipt?.items && receipt.items.length > 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 40);
    doc.text("Omschrijving", 30, y);
    doc.text("Aantal", 120, y, { align: "center" });
    doc.text("Prijs", w - 30, y, { align: "right" });
    y += 3;
    doc.setDrawColor(200, 200, 200);
    doc.setLineDashPattern([], 0);
    doc.line(30, y, w - 30, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    receipt.items.forEach((item: any) => {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setTextColor(50, 50, 50);
      const descLines = doc.splitTextToSize(item.description, 80);
      doc.text(descLines, 30, y);
      doc.setTextColor(100, 100, 100);
      doc.text(String(item.qty), 120, y, { align: "center" });
      doc.setTextColor(50, 50, 50);
      doc.setFont("helvetica", "bold");
      doc.text(fmtCents(item.total), w - 30, y, { align: "right" });
      doc.setFont("helvetica", "normal");
      y += Math.max(descLines.length * 4.5, 6);
    });

    y += 4;
    doc.setDrawColor(200, 200, 200);
    doc.line(30, y, w - 30, y);
    y += 7;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text("Subtotaal", 30, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(50, 50, 50);
    doc.text(fmtCents(receipt.subtotal || 0), w - 30, y, { align: "right" });
    y += 6;

    if ((receipt.vatAmount || 0) > 0) {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120, 120, 120);
      doc.text(`BTW (${receipt.vatRate}%)`, 30, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(50, 50, 50);
      doc.text(fmtCents(receipt.vatAmount), w - 30, y, { align: "right" });
      y += 6;
    }

    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.5);
    doc.line(30, y, w - 30, y);
    y += 7;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(16, 185, 129);
    doc.text("Totaal", 30, y);
    doc.text(fmtCents(receipt.total), w - 30, y, { align: "right" });
    y += 10;
  }

  if (receipt?.travelDetails) {
    const td = receipt.travelDetails;
    doc.setDrawColor(220, 220, 220);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(30, y, w - 30, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 40);
    doc.text("Reisgegevens", 30, y);
    y += 7;
    doc.setFontSize(9);
    const travelRows: [string, string][] = [
      ["Van", td.from], ["Naar", td.to], ["Datum", td.date],
      ["Vertrek", td.departure], ["Aankomst", td.arrival], ["Klasse", td.class],
    ];
    travelRows.forEach(([l, v]) => {
      doc.setFont("helvetica", "normal"); doc.setTextColor(120, 120, 120); doc.text(l, 35, y);
      doc.setFont("helvetica", "bold"); doc.setTextColor(50, 50, 50); doc.text(v, w - 35, y, { align: "right" });
      y += 6;
    });
    y += 4;
  }

  doc.setDrawColor(220, 220, 220);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(25, y, w - 25, y);
  y += 8;

  const txDetails: [string, string][] = [
    ["Status", "Voltooid"], ["Type", typeStr], ["Datum", dateStr], ["Tijd", timeStr],
    ["Referentie", ref], ["Betaalmethode", "W€spr Pay"],
  ];
  doc.setFontSize(9);
  txDetails.forEach(([label, value]) => {
    doc.setFont("helvetica", "normal"); doc.setTextColor(150, 150, 150); doc.text(label, 35, y);
    doc.setFont("helvetica", "bold"); doc.setTextColor(80, 80, 80); doc.text(value, w - 35, y, { align: "right" });
    y += 7;
  });

  if (receipt?.note) {
    y += 4;
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(130, 130, 130);
    const noteLines = doc.splitTextToSize(receipt.note, w - 60);
    doc.text(noteLines, w / 2, y, { align: "center" });
    y += noteLines.length * 4 + 4;
  }

  y += 6;
  doc.setFillColor(16, 185, 129);
  doc.roundedRect(55, y - 2, w - 110, 14, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("BETALING VOLTOOID", w / 2, y + 7, { align: "center" });

  y += 24;
  doc.setTextColor(180, 180, 180);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Dit is een automatisch gegenereerd betalingsbewijs van W€spr Pay.", w / 2, y, { align: "center" });
  y += 5;
  doc.text(`Gegenereerd op ${new Date().toLocaleDateString("nl-NL")} om ${new Date().toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}`, w / 2, y, { align: "center" });
  y += 5;
  doc.text("W€spr Pay \u2022 Veilig betalen \u2022 w€spr-app.eu", w / 2, y, { align: "center" });

  return doc;
}

function ReceiptPreview({ tx, onClose }: { tx: any; onClose: () => void }) {
  const ref = `TX-${tx.id?.toString().padStart(6, '0')}`;
  const date = new Date(tx.createdAt);
  const dateStr = date.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
  const timeStr = date.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const amountStr = `${tx.type === 'credit' ? '+' : '-'} €${(tx.amount / 100).toFixed(2)}`;
  const typeStr = tx.type === 'credit' ? 'Ontvangen' : 'Betaling';
  const receipt = parseReceipt(tx);

  const handleSavePDF = async () => {
    try {
      const doc = generateReceiptPDF(tx);
      const safeDate = !isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
      const filename = `W€spr_Bon_${ref}_${safeDate}.pdf`;
      const blob = doc.output("blob");
      const file = new File([blob], filename, { type: "application/pdf" });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Bon ${tx.description}`,
          text: `W€spr Pay betalingsbewijs - ${amountStr}`,
          files: [file],
        });
        onClose();
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        onClose();
      }
    } catch {}
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.85, y: 30 }}
        transition={{ type: "spring", duration: 0.4 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-[340px] max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-emerald-600 px-5 py-4 text-white text-center shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-widest font-semibold opacity-80">Betalingsbewijs</span>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 text-white hover:bg-white/20 rounded-full -mr-1">
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-lg font-bold tracking-tight">W€spr Pay</p>
          <p className="text-xs opacity-70 mt-0.5">{ref}</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {receipt?.merchant && (
            <div className="px-5 pt-4 pb-2 text-center border-b border-gray-100">
              <p className="text-sm font-bold text-gray-800">{receipt.merchant.name}</p>
              {receipt.merchant.address && <p className="text-[11px] text-gray-400">{receipt.merchant.address}, {receipt.merchant.city}</p>}
              {receipt.merchant.kvk && <p className="text-[10px] text-gray-300 mt-0.5">KvK: {receipt.merchant.kvk} | BTW: {receipt.merchant.btw}</p>}
            </div>
          )}

          <div className="px-5 py-4 text-center border-b border-dashed border-gray-200">
            <p className={`text-3xl font-bold ${tx.type === 'credit' ? 'text-emerald-600' : 'text-gray-900'}`}>{amountStr}</p>
            <p className="text-sm text-gray-500 mt-1">{tx.description}</p>
          </div>

          {receipt?.items && receipt.items.length > 0 && (
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-1.5 mb-2.5">
                <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Specificatie</span>
              </div>
              <div className="space-y-0">
                {receipt.items.map((item: any, i: number) => (
                  <div key={i} className={`flex items-start gap-2 py-1.5 ${i < receipt.items.length - 1 ? 'border-b border-gray-50' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-gray-700 leading-tight">{item.description}</p>
                      {item.qty > 1 && <p className="text-[10px] text-gray-400">{item.qty}x {fmtCents(item.unitPrice)}</p>}
                    </div>
                    <span className={`text-[12px] font-semibold whitespace-nowrap ${item.total < 0 ? 'text-emerald-600' : 'text-gray-800'}`}>{fmtCents(item.total)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2.5 pt-2 border-t border-dashed border-gray-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-[11px] text-gray-400">Subtotaal</span>
                  <span className="text-[11px] font-medium text-gray-600">{fmtCents(receipt.subtotal || 0)}</span>
                </div>
                {(receipt.vatAmount || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[11px] text-gray-400">BTW ({receipt.vatRate || 0}%)</span>
                    <span className="text-[11px] font-medium text-gray-600">{fmtCents(receipt.vatAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-emerald-200">
                  <span className="text-[12px] font-bold text-emerald-700">Totaal</span>
                  <span className="text-[12px] font-bold text-emerald-700">{fmtCents(receipt.total)}</span>
                </div>
              </div>
            </div>
          )}

          {receipt?.travelDetails && (
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-1.5 mb-2">
                <MapPin className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Reisgegevens</span>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 space-y-1.5">
                {([
                  ["Van", receipt.travelDetails.from],
                  ["Naar", receipt.travelDetails.to],
                  ["Datum", receipt.travelDetails.date],
                  ["Vertrek", receipt.travelDetails.departure],
                  ["Aankomst", receipt.travelDetails.arrival],
                  ["Klasse", receipt.travelDetails.class],
                ] as [string, string][]).map(([l, v], i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-[11px] text-blue-400">{l}</span>
                    <span className="text-[11px] font-semibold text-blue-700">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="px-5 py-3 space-y-2">
            {([
              ["Status", "Voltooid", "text-emerald-600"],
              ["Type", typeStr, ""],
              ["Datum", dateStr, ""],
              ["Tijd", timeStr, ""],
              ["Referentie", ref, "text-gray-400"],
              ["Betaalmethode", "W€spr Pay", ""],
            ] as [string, string, string][]).map(([label, value, extra], i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-[11px] text-gray-400">{label}</span>
                <span className={`text-[11px] font-semibold ${extra || 'text-gray-700'}`}>{value}</span>
              </div>
            ))}
          </div>

          {receipt?.note && (
            <div className="px-5 py-2">
              <div className="bg-amber-50 rounded-xl p-3">
                <p className="text-[11px] text-amber-700 italic leading-relaxed">{receipt.note}</p>
              </div>
            </div>
          )}

          <div className="px-5 py-2">
            <div className="bg-emerald-50 rounded-xl py-2 text-center">
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Betaling voltooid</span>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 space-y-2 shrink-0 border-t border-gray-100">
          <Button
            className="w-full h-11 rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold active:scale-[0.98] transition-transform"
            onClick={handleSavePDF}
            data-testid="btn-save-receipt-pdf"
          >
            <FileDown className="w-4 h-4" />
            Deel of bewaar bon (PDF)
          </Button>
          <Button
            variant="outline"
            className="w-full h-10 rounded-xl gap-2 text-gray-600"
            onClick={onClose}
            data-testid="btn-close-receipt"
          >
            Sluiten
          </Button>
        </div>

        <div className="px-5 pb-3 text-center shrink-0">
          <p className="text-[10px] text-gray-300">Automatisch gegenereerd door W€spr Pay</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ReceiptScanAndMatch({ txs, onBack, onViewTx }: { txs: any[]; onBack: () => void; onViewTx: (tx: any) => void }) {
  type MatchPhase = "scanning" | "matching" | "matched" | "choose" | "saved" | "no_match";
  const [phase, setPhase] = useState<MatchPhase>("scanning");
  const [parsedReceipt, setParsedReceipt] = useState<any>(null);
  const [matchedTx, setMatchedTx] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const findMatch = (receipt: any) => {
    setParsedReceipt(receipt);
    setPhase("matching");
    const receiptTotal = receipt.total;
    const matches = txs.filter((tx: any) => {
      if (tx.type === "credit") return false;
      return tx.amount === receiptTotal;
    });
    if (matches.length === 1) {
      setMatchedTx(matches[0]);
      setPhase("matched");
    } else if (matches.length > 1) {
      setCandidates(matches);
      setPhase("choose");
    } else {
      const closeMatches = txs.filter((tx: any) => {
        if (tx.type === "credit") return false;
        const diff = Math.abs(tx.amount - receiptTotal);
        return diff <= 100 && diff > 0;
      });
      if (closeMatches.length > 0) {
        setCandidates(closeMatches);
        setPhase("choose");
      } else {
        setPhase("no_match");
      }
    }
  };

  const saveToTransaction = async (tx: any) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/transactions/${tx.id}/receipt`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptData: parsedReceipt }),
      });
      if (res.ok) {
        const updated = await res.json();
        setMatchedTx(updated);
        queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
        setPhase("saved");
      } else {
        setToast("Fout bij opslaan");
      }
    } catch {
      setToast("Fout bij opslaan");
    }
    setSaving(false);
  };

  if (phase === "scanning") {
    return (
      <ReceiptScanner
        tx={null}
        onBack={onBack}
        onSave={(receipt: any) => findMatch(receipt)}
      />
    );
  }

  return (
    <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="flex flex-col h-full bg-muted/20 relative">
      <header className="px-4 py-4 flex items-center gap-3 bg-emerald-600 text-white sticky top-0 z-50">
        <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-white/20 rounded-full -ml-2">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold tracking-tight flex-1">Bon koppelen</h1>
      </header>

      <div className="flex-1 overflow-y-auto hide-scrollbar p-4">
        {phase === "matching" && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4 animate-pulse">
              <ScanLine className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold mb-1">Transactie zoeken...</h2>
            <p className="text-sm text-muted-foreground">Bedrag: {fmtCents(parsedReceipt?.total || 0)}</p>
          </div>
        )}

        {phase === "matched" && matchedTx && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex flex-col items-center py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-lg font-bold">Transactie gevonden!</h2>
              <p className="text-sm text-muted-foreground mt-1">De bon matcht met onderstaande betaling</p>
            </div>

            <div className="bg-card rounded-2xl shadow-sm p-4 border border-emerald-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-100 text-red-500 flex items-center justify-center font-bold text-lg">-</div>
                <div className="flex-1">
                  <p className="font-semibold">{matchedTx.description}</p>
                  <p className="text-xs text-muted-foreground">{new Date(matchedTx.createdAt).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}</p>
                </div>
                <span className="text-lg font-bold">-{fmtCents(matchedTx.amount)}</span>
              </div>
            </div>

            {parsedReceipt && (
              <div className="bg-card rounded-2xl shadow-sm border border-border/40 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-bold">Bon details</span>
                </div>
                <p className="text-sm font-semibold">{parsedReceipt.merchant?.name || "Winkel"}</p>
                {parsedReceipt.items?.slice(0, 3).map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-xs mt-1">
                    <span className="text-muted-foreground">{item.qty > 1 ? `${item.qty}x ` : ""}{item.description}</span>
                    <span className="font-medium">{fmtCents(item.total)}</span>
                  </div>
                ))}
                {parsedReceipt.items?.length > 3 && <p className="text-[10px] text-muted-foreground mt-1">+ {parsedReceipt.items.length - 3} meer</p>}
                <div className="flex justify-between mt-2 pt-2 border-t border-emerald-200">
                  <span className="text-sm font-bold text-emerald-700">Totaal</span>
                  <span className="text-sm font-bold text-emerald-700">{fmtCents(parsedReceipt.total)}</span>
                </div>
              </div>
            )}

            <Button
              className="w-full h-13 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[15px] shadow-lg active:scale-[0.98] transition-transform gap-2"
              onClick={() => saveToTransaction(matchedTx)}
              disabled={saving}
              data-testid="btn-confirm-match"
            >
              {saving ? <><Loader2 className="w-5 h-5 animate-spin" /> Opslaan...</> : <><Check className="w-5 h-5" /> Bon koppelen aan transactie</>}
            </Button>
            <Button variant="outline" className="w-full h-11 rounded-2xl font-semibold gap-2" onClick={() => setPhase("scanning")} data-testid="btn-rescan">
              <RotateCcw className="w-4 h-4" /> Opnieuw scannen
            </Button>
          </motion.div>
        )}

        {phase === "choose" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex flex-col items-center py-4">
              <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mb-3">
                <AlertCircle className="w-7 h-7 text-amber-600" />
              </div>
              <h2 className="text-lg font-bold">Meerdere mogelijkheden</h2>
              <p className="text-sm text-muted-foreground mt-1 text-center">
                Bon van {fmtCents(parsedReceipt?.total || 0)} — kies de juiste transactie
              </p>
            </div>

            <div className="space-y-2">
              {candidates.map((tx: any) => (
                <div
                  key={tx.id}
                  onClick={() => { setMatchedTx(tx); saveToTransaction(tx); }}
                  className="bg-card rounded-2xl shadow-sm p-4 border border-border/40 cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/30 transition-colors active:scale-[0.98]"
                  data-testid={`match-candidate-${tx.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 text-red-500 flex items-center justify-center font-bold">-</div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold">-{fmtCents(tx.amount)}</span>
                      {tx.receiptData && <p className="text-[10px] text-emerald-500">Heeft al bon</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button variant="outline" className="w-full h-11 rounded-2xl font-semibold gap-2 mt-2" onClick={() => setPhase("scanning")} data-testid="btn-rescan-choose">
              <RotateCcw className="w-4 h-4" /> Opnieuw scannen
            </Button>
          </motion.div>
        )}

        {phase === "saved" && matchedTx && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
            <div className="flex flex-col items-center py-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-4"
              >
                <Check className="w-10 h-10 text-emerald-600" />
              </motion.div>
              <h2 className="text-xl font-bold text-emerald-700">Bon opgeslagen!</h2>
              <p className="text-sm text-muted-foreground mt-1 text-center">De bon is gekoppeld aan de transactie</p>
            </div>

            <div className="bg-card rounded-2xl shadow-sm p-4 border border-emerald-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{matchedTx.description}</p>
                  <p className="text-xs text-muted-foreground">{new Date(matchedTx.createdAt).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}</p>
                </div>
                <span className="font-bold text-emerald-700">{fmtCents(matchedTx.amount)}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Button
                className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2 active:scale-[0.98] transition-transform"
                onClick={() => onViewTx(matchedTx)}
                data-testid="btn-view-matched-tx"
              >
                Bekijk transactie
              </Button>
              <Button
                variant="outline"
                className="w-full h-11 rounded-2xl font-semibold gap-2 active:scale-[0.98] transition-transform"
                onClick={() => { setParsedReceipt(null); setMatchedTx(null); setPhase("scanning"); }}
                data-testid="btn-scan-another"
              >
                <Camera className="w-4 h-4" /> Nog een bon scannen
              </Button>
              <Button
                variant="ghost"
                className="w-full h-10 rounded-2xl font-medium text-muted-foreground"
                onClick={onBack}
                data-testid="btn-back-to-pay"
              >
                Terug naar W€spr Pay
              </Button>
            </div>
          </motion.div>
        )}

        {phase === "no_match" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex flex-col items-center py-8">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <X className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-lg font-bold">Geen match gevonden</h2>
              <p className="text-sm text-muted-foreground mt-1 text-center px-4">
                Er is geen transactie gevonden met het bedrag {fmtCents(parsedReceipt?.total || 0)}
              </p>
              {parsedReceipt?.merchant?.name && (
                <p className="text-xs text-muted-foreground mt-1">Winkel: {parsedReceipt.merchant.name}</p>
              )}
            </div>

            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
              <p className="text-xs text-amber-700">
                De bon kon niet automatisch worden gekoppeld. Je kunt de bon handmatig koppelen door een transactie te openen en daar op "Bon scannen" te tikken.
              </p>
            </div>

            <Button
              className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2 active:scale-[0.98] transition-transform"
              onClick={() => { setParsedReceipt(null); setPhase("scanning"); }}
              data-testid="btn-retry-scan"
            >
              <RotateCcw className="w-4 h-4" /> Opnieuw scannen
            </Button>
            <Button
              variant="outline"
              className="w-full h-11 rounded-2xl font-semibold"
              onClick={onBack}
              data-testid="btn-back-no-match"
            >
              Terug
            </Button>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {toast && <ToastFeedback message={toast} onDone={() => setToast(null)} />}
      </AnimatePresence>
    </motion.div>
  );
}

function TransactionDetailScreen({ tx, onBack, onRepeat }: { tx: any; onBack: () => void; onRepeat: (tx: any) => void }) {
  const [toast, setToast] = useState<string | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [localTx, setLocalTx] = useState(tx);

  const handleShare = () => {
    const details = `Transactie: ${localTx.description}\nBedrag: ${localTx.type === 'credit' ? '+' : '-'}€${(localTx.amount / 100).toFixed(2)}\nDatum: ${new Date(localTx.createdAt).toLocaleDateString("nl-NL")}\nRef: TX-${localTx.id?.toString().padStart(6, '0')}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(details).then(() => setToast("Transactiedetails gekopieerd!")).catch(() => setToast("Transactiedetails gekopieerd!"));
    } else {
      setToast("Transactiedetails gekopieerd!");
    }
  };

  const handleSaveScannedReceipt = async (receiptData: any) => {
    try {
      const res = await fetch(`/api/transactions/${localTx.id}/receipt`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptData }),
      });
      if (res.ok) {
        const updated = await res.json();
        setLocalTx(updated);
        queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
        setShowScanner(false);
        setToast("Bon succesvol opgeslagen!");
      }
    } catch {
      setToast("Fout bij opslaan bon");
    }
  };

  if (showScanner) {
    return (
      <ReceiptScanner
        tx={localTx}
        onBack={() => setShowScanner(false)}
        onSave={handleSaveScannedReceipt}
      />
    );
  }

  const hasReceipt = !!localTx.receiptData;
  const receipt = hasReceipt ? parseReceipt(localTx) : null;

  return (
    <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="flex flex-col h-full bg-muted/20 relative">
      <header className="px-4 py-4 flex items-center gap-3 bg-emerald-600 text-white sticky top-0 z-50">
        <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-white/20 rounded-full -ml-2">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold tracking-tight flex-1">Transactiedetails</h1>
      </header>
      <div className="flex-1 overflow-y-auto hide-scrollbar p-4">
        <div className="flex flex-col items-center pt-6 pb-8">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${localTx.type === 'credit' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'}`}>
            {localTx.type === 'credit' ? <ArrowUpRight className="w-8 h-8 rotate-180" /> : <ArrowUpRight className="w-8 h-8" />}
          </div>
          <span className={`text-3xl font-bold ${localTx.type === 'credit' ? 'text-emerald-600' : 'text-foreground'}`}>
            {localTx.type === 'credit' ? '+' : '-'}€{(localTx.amount / 100).toFixed(2)}
          </span>
          <p className="text-muted-foreground mt-1">{localTx.description}</p>
        </div>
        <div className="bg-card rounded-2xl shadow-sm p-4 space-y-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground text-sm">Status</span>
            <span className="text-sm font-semibold text-emerald-600">Voltooid</span>
          </div>
          <div className="border-t border-border/40" />
          <div className="flex justify-between">
            <span className="text-muted-foreground text-sm">Datum</span>
            <span className="text-sm font-medium">{new Date(localTx.createdAt).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}</span>
          </div>
          <div className="border-t border-border/40" />
          <div className="flex justify-between">
            <span className="text-muted-foreground text-sm">Tijd</span>
            <span className="text-sm font-medium">{new Date(localTx.createdAt).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
          <div className="border-t border-border/40" />
          <div className="flex justify-between">
            <span className="text-muted-foreground text-sm">Type</span>
            <span className="text-sm font-medium">{localTx.type === 'credit' ? 'Ontvangen' : 'Betaling'}</span>
          </div>
          <div className="border-t border-border/40" />
          <div className="flex justify-between">
            <span className="text-muted-foreground text-sm">Referentie</span>
            <span className="text-sm font-medium text-muted-foreground">TX-{localTx.id?.toString().padStart(6, '0')}</span>
          </div>
        </div>

        {hasReceipt && receipt ? (
          <div className="mt-4 bg-card rounded-2xl shadow-sm overflow-hidden border border-emerald-100" data-testid="receipt-summary-card">
            <div className="bg-emerald-50 px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-800">Bon opgeslagen</p>
                  <p className="text-[10px] text-emerald-600">{receipt.merchant?.name || localTx.description}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-emerald-700">{fmtCents(receipt.total || localTx.amount)}</p>
              </div>
            </div>
            {receipt.items && receipt.items.length > 0 && (
              <div className="px-4 py-2.5 space-y-1.5">
                {receipt.items.slice(0, 3).map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground truncate mr-2">{item.qty > 1 ? `${item.qty}x ` : ""}{item.description}</span>
                    <span className="font-medium text-foreground whitespace-nowrap">{fmtCents(item.total)}</span>
                  </div>
                ))}
                {receipt.items.length > 3 && (
                  <p className="text-[10px] text-muted-foreground italic">+ {receipt.items.length - 3} meer artikel{receipt.items.length - 3 > 1 ? "en" : ""}</p>
                )}
                {(receipt.vatAmount || 0) > 0 && (
                  <div className="flex justify-between text-[10px] pt-1 border-t border-border/30">
                    <span className="text-muted-foreground">BTW ({receipt.vatRate || 0}%)</span>
                    <span className="text-muted-foreground">{fmtCents(receipt.vatAmount)}</span>
                  </div>
                )}
              </div>
            )}
            <div className="px-4 py-2 border-t border-emerald-100 flex gap-2">
              <Button
                size="sm"
                className="flex-1 h-9 rounded-lg gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold active:scale-[0.98] transition-transform"
                onClick={() => setShowReceipt(true)}
                data-testid="btn-tx-download-receipt"
              >
                <Receipt className="w-3.5 h-3.5" />
                Bekijk volledige bon
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-9 rounded-lg gap-1.5 text-xs font-medium border-emerald-200 text-emerald-700 hover:bg-emerald-50 active:scale-[0.98] transition-transform px-3"
                onClick={() => setShowScanner(true)}
                data-testid="btn-tx-scan-receipt"
              >
                <Camera className="w-3.5 h-3.5" />
                Opnieuw
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 bg-card rounded-2xl shadow-sm overflow-hidden border border-dashed border-muted-foreground/20" data-testid="receipt-empty-card">
            <div className="px-4 py-5 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
                <Receipt className="w-6 h-6 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-semibold text-foreground">Geen bon gekoppeld</p>
              <p className="text-xs text-muted-foreground mt-0.5">Scan je kassabon om deze aan de transactie te koppelen</p>
              <Button
                className="mt-3 h-10 rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-6 active:scale-[0.98] transition-transform"
                onClick={() => setShowScanner(true)}
                data-testid="btn-tx-scan-receipt"
              >
                <Camera className="w-4 h-4" />
                Bon scannen
              </Button>
            </div>
          </div>
        )}

        <div className="mt-3 flex gap-3">
          <Button variant="outline" className="flex-1 rounded-xl gap-2 h-11" onClick={() => onRepeat(localTx)} data-testid="btn-tx-repeat"><RotateCcw className="w-4 h-4" /> Herhalen</Button>
          <Button variant="outline" className="flex-1 rounded-xl gap-2 h-11" onClick={handleShare} data-testid="btn-tx-share"><Send className="w-4 h-4" /> Delen</Button>
        </div>
      </div>
      <AnimatePresence>
        {showReceipt && <ReceiptPreview tx={localTx} onClose={() => setShowReceipt(false)} />}
        {toast && <ToastFeedback message={toast} onDone={() => setToast(null)} />}
      </AnimatePresence>
    </motion.div>
  );
}

function AllTransactionsScreen({ txs, onBack, onSelectTx }: { txs: any[]; onBack: () => void; onSelectTx: (tx: any) => void }) {
  const grouped: Record<string, any[]> = {};
  txs.forEach((tx: any) => {
    const month = new Date(tx.createdAt).toLocaleDateString("nl-NL", { month: "long", year: "numeric" });
    if (!grouped[month]) grouped[month] = [];
    grouped[month].push(tx);
  });

  return (
    <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="flex flex-col h-full bg-muted/20">
      <header className="px-4 py-4 flex items-center gap-3 bg-emerald-600 text-white sticky top-0 z-50">
        <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-white/20 rounded-full -ml-2">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold tracking-tight flex-1">Alle Transacties</h1>
      </header>
      <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-6">
        {Object.entries(grouped).map(([month, items]) => (
          <div key={month}>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 capitalize">{month}</h3>
            <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
              {items.map((tx: any, i: number) => (
                <div key={tx.id} onClick={() => onSelectTx(tx)} className={`flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/50 transition-colors ${i < items.length - 1 ? 'border-b border-border/40' : ''}`} data-testid={`all-tx-${tx.id}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'credit' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'}`}>
                    {tx.type === 'credit' ? '+' : '-'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-[15px]">{tx.description}</h3>
                    <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {tx.receiptData && <Receipt className="w-3.5 h-3.5 text-emerald-500 opacity-60" />}
                    <span className={`font-bold ${tx.type === 'credit' ? 'text-emerald-600' : 'text-foreground'}`}>
                      {tx.type === 'credit' ? '+' : '-'}€{(tx.amount / 100).toFixed(2)}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {txs.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Wallet className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Geen transacties</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

