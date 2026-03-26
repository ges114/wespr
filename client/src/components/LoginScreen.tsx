import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Eye, EyeOff, ArrowRight, ArrowLeft, Mail, Shield, Euro, Stethoscope, Train, ShoppingBag, MessageCircle, CreditCard, Landmark, Heart, Globe, Music, Gamepad2, Zap, CheckCircle2, Loader2, Fingerprint, X } from "lucide-react";
import heroImage from "@/assets/images/hero-lifestyle.jpg";
import auraLogo from "@/assets/images/aura-logo.png";

const serviceIcons = [
  { Icon: Euro, label: "Betalen", x: "6%", y: "3%", delay: 0.5, size: 34, color: "rgba(16, 185, 129, 0.5)" },
  { Icon: Stethoscope, label: "Gezondheid", x: "78%", y: "8%", delay: 0.7, size: 30, color: "rgba(244, 63, 94, 0.5)" },
  { Icon: Train, label: "Vervoer", x: "42%", y: "5%", delay: 0.6, size: 28, color: "rgba(245, 158, 11, 0.5)" },
  { Icon: MessageCircle, label: "Berichten", x: "88%", y: "35%", delay: 1.0, size: 28, color: "rgba(56, 189, 248, 0.5)" },
  { Icon: Globe, label: "Services", x: "3%", y: "16%", delay: 0.8, size: 26, color: "rgba(168, 85, 247, 0.5)" },
  { Icon: CreditCard, label: "Wallet", x: "84%", y: "57%", delay: 0.4, size: 32, color: "rgba(20, 184, 166, 0.5)" },
  { Icon: Landmark, label: "Overheid", x: "4%", y: "42%", delay: 1.1, size: 28, color: "rgba(99, 102, 241, 0.5)" },
  { Icon: ShoppingBag, label: "Winkelen", x: "60%", y: "62%", delay: 0.6, size: 26, color: "rgba(236, 72, 153, 0.5)" },
  { Icon: Heart, label: "Welzijn", x: "3%", y: "55%", delay: 0.9, size: 26, color: "rgba(239, 68, 68, 0.5)" },
  { Icon: Music, label: "Entertainment", x: "86%", y: "46%", delay: 0.7, size: 24, color: "rgba(251, 146, 60, 0.5)" },
  { Icon: Gamepad2, label: "Games", x: "30%", y: "60%", delay: 1.2, size: 24, color: "rgba(34, 211, 238, 0.5)" },
  { Icon: Zap, label: "Energie", x: "20%", y: "64%", delay: 0.5, size: 26, color: "rgba(250, 204, 21, 0.5)" },
];

export function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [icons, setIcons] = useState(serviceIcons);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState<"login" | "forgot" | "register">("login");
  const [resetSent, setResetSent] = useState(false);
  const [name, setName] = useState("");
  const [eudiPhase, setEudiPhase] = useState<null | "request" | "biometric" | "pin" | "scanning" | "verifying" | "done">(null);
  const [biometricScanning, setBiometricScanning] = useState(false);
  const [biometricSuccess, setBiometricSuccess] = useState(false);
  const [pinDigits, setPinDigits] = useState<string[]>([]);
  const [pinError, setPinError] = useState(false);
  const [webAuthnAvailable, setWebAuthnAvailable] = useState<boolean | null>(null);
  const [biometricError, setBiometricError] = useState<string | null>(null);
  const isInIframe = typeof window !== "undefined" && window.self !== window.top;

  // Detect WebAuthn / platform biometrics support
  useEffect(() => {
    // If running in an iframe (Replit preview), WebAuthn is blocked by browsers on mobile
    if (isInIframe) {
      setWebAuthnAvailable(false);
      return;
    }
    if (typeof window !== "undefined" && window.PublicKeyCredential) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(setWebAuthnAvailable)
        .catch(() => setWebAuthnAvailable(false));
    } else {
      setWebAuthnAvailable(false);
    }
  }, []);

  // WebAuthn biometric authentication
  const triggerWebAuthn = async (): Promise<"success" | "cancelled" | "unavailable"> => {
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const storedCredId = localStorage.getItem("wespr_biometric_cred_id");

      if (storedCredId) {
        try {
          // Try existing credential on this domain
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
          return assertion ? "success" : "cancelled";
        } catch {
          // Any error (domain mismatch, no passkey on device, etc.) — clear and re-register
          localStorage.removeItem("wespr_biometric_cred_id");
        }
      }

      // Register fresh credential for current domain (first time or after clearing stale credential)
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
        return "success";
      }
      return "cancelled";
    } catch (e: any) {
      if (e?.name === "NotAllowedError" || e?.name === "AbortError") return "cancelled";
      return "unavailable";
    }
  };

  const doLoginAfterBiometric = async () => {
    setEudiPhase("verifying");
    setTimeout(async () => {
      setEudiPhase("done");
      setTimeout(async () => {
        const loginRes = await fetch("/api/auth/biometric-login", { method: "POST", credentials: "include" });
        try {
          const loginData = await loginRes.json();
          if (loginData?.sessionToken) {
            const { setSessionToken } = await import("@/lib/api");
            setSessionToken(loginData.sessionToken);
          }
        } catch {}
        // Mark user as EUDI-verified in the database
        await fetch("/api/eudi/verify", { method: "POST", credentials: "include" });
        setEudiPhase(null);
        onLogin();
      }, 1200);
    }, 2200);
  };

  useEffect(() => {
    fetch("/api/icon-positions")
      .then((r) => r.json())
      .then((saved) => {
        if (saved && Array.isArray(saved)) {
          setIcons((prev) =>
            prev.map((icon) => {
              const m = saved.find((s: any) => s.label === icon.label);
              return m ? { ...icon, x: `${m.x}%`, y: `${m.y}%` } : icon;
            })
          );
        }
      })
      .catch(() => {});
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Vul alle velden in");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Inloggen mislukt");
        setLoading(false);
        return;
      }
      if (data?.sessionToken) {
        const { setSessionToken } = await import("@/lib/api");
        setSessionToken(data.sessionToken);
      }
      onLogin();
    } catch {
      setError("Verbindingsfout, probeer opnieuw");
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Vul alle velden in");
      return;
    }
    if (password.length < 6) {
      setError("Wachtwoord moet minimaal 6 tekens zijn");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), password, name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Registratie mislukt");
        setLoading(false);
        return;
      }
      if (data?.sessionToken) {
        const { setSessionToken } = await import("@/lib/api");
        setSessionToken(data.sessionToken);
      }
      onLogin();
    } catch {
      setError("Verbindingsfout, probeer opnieuw");
      setLoading(false);
    }
  };

  const handleResetPassword = () => {
    if (!email.trim()) {
      setError("Vul je e-mailadres in");
      return;
    }
    setError("");
    setLoading(true);
    setTimeout(() => { setLoading(false); setResetSent(true); }, 600);
  };

  return (
    <div className="relative h-full bg-black overflow-y-auto hide-scrollbar">
      <motion.div
        initial={{ scale: 1.08, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.6, ease: "easeOut" }}
        className="absolute inset-0"
      >
        <img
          src={heroImage}
          alt="W€spr lifestyle"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/75" />
      </motion.div>

      {icons.map(({ Icon, label, x, y, delay, size, color }) => (
        <motion.div
          key={label}
          
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay, duration: 0.8, ease: "easeOut" }}
          className="absolute z-10 pointer-events-none"
          style={{ left: x, top: y }}
        >
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 4 + Math.random() * 3, repeat: Infinity, ease: "easeInOut", delay: Math.random() * 3 }}
            className="rounded-full backdrop-blur-sm flex items-center justify-center"
            style={{ width: size, height: size, backgroundColor: color, border: `1px solid ${color.replace('0.6', '0.8')}` }}
          >
            <Icon className="text-white" style={{ width: size * 0.45, height: size * 0.45 }} />
          </motion.div>
        </motion.div>
      ))}

      <div className="relative z-20 flex flex-col min-h-full lg:items-center lg:justify-center">
        <div className="flex flex-col items-center justify-center pb-6 lg:pb-8 pt-[34%] lg:pt-[12%]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="flex flex-col items-center"
          >
            <h1 className="font-heading text-3xl lg:text-5xl font-light tracking-wide text-white drop-shadow-lg mb-0.5">
              W€spr
            </h1>
            <p className="text-sm lg:text-base text-white/70 font-medium drop-shadow-md">
              Jouw Europese super app
            </p>
          </motion.div>
        </div>

        <div className="flex-1 lg:flex-none lg:h-8" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="px-7 pt-4 pb-10 lg:w-[400px] lg:mx-auto w-full"
        >
          <AnimatePresence mode="wait">
            {view === "login" ? (
              <motion.div
                key="login"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3"
              >
                {/* Compact EU Wallet button — pill style, centered */}
                <button
                  onClick={() => setEudiPhase("request")}
                  className="flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-white/25 bg-white/10 hover:bg-white/18 backdrop-blur-sm transition-all active:scale-[0.97] group"
                  data-testid="button-eudi-login"
                >
                  <div className="w-6 h-6 rounded-full bg-[#003399] flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" width="22" height="22">
                      {Array.from({ length: 12 }, (_, i) => {
                        const angle = (i * 30 - 90) * Math.PI / 180;
                        const x = 12 + 7 * Math.cos(angle);
                        const y = 12 + 7 * Math.sin(angle);
                        return <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="3.5" fill="#FFCC00">★</text>;
                      })}
                    </svg>
                  </div>
                  <span className="text-white font-medium text-[13px]">Inloggen met EUDI Wallet</span>
                </button>
                <p className="text-[10px] text-white/30 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> eIDAS 2.0 gecertificeerd
                </p>
              </motion.div>
            ) : view === "register" ? (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-3"
              >
                <button onClick={() => { setView("login"); setError(""); }} className="flex items-center gap-1 text-sm text-white/70 hover:text-white font-semibold transition-colors mb-1 drop-shadow-sm" data-testid="register-back">
                  <ArrowLeft className="w-4 h-4" /> Terug
                </button>
                <h3 className="font-bold text-xl text-white drop-shadow-sm">Account aanmaken</h3>
                <div>
                  <Input type="text" placeholder="Je volledige naam" value={name} onChange={(e) => { setName(e.target.value); setError(""); }} className="h-11 rounded-none bg-transparent border-0 text-white text-[15px] placeholder:text-white/50 focus-visible:ring-0 px-1 shadow-none" data-testid="input-register-name" />
                </div>
                <div>
                  <Input type="email" placeholder="E-mailadres" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} className="h-11 rounded-none bg-transparent border-0 text-white text-[15px] placeholder:text-white/50 focus-visible:ring-0 px-1 shadow-none" data-testid="input-register-email" />
                </div>
                <div>
                  <Input type="password" placeholder="Kies een wachtwoord (min. 6 tekens)" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} className="h-11 rounded-none bg-transparent border-0 text-white text-[15px] placeholder:text-white/50 focus-visible:ring-0 px-1 shadow-none" data-testid="input-register-password" />
                </div>
                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-300 text-center font-medium">{error}</motion.p>
                )}
                <button onClick={handleRegister} disabled={loading} className="mx-auto flex items-center gap-2 text-[14px] font-semibold text-white hover:text-white/80 transition-colors mt-3 drop-shadow-md disabled:opacity-50" data-testid="button-register">
                  {loading ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                  ) : (
                    <>Account aanmaken <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-3"
              >
                <button onClick={() => { setView("login"); setError(""); }} className="flex items-center gap-1 text-sm text-white/70 hover:text-white font-semibold transition-colors mb-1 drop-shadow-sm" data-testid="back-to-login">
                  <ArrowLeft className="w-4 h-4" /> Terug
                </button>

                {resetSent ? (
                  <div className="text-center py-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="font-bold text-xl mb-2 text-white drop-shadow-sm">E-mail verzonden</h3>
                    <p className="text-sm text-white/70 leading-relaxed">
                      Herstel-link gestuurd naar <span className="font-semibold text-white">{email}</span>
                    </p>
                    <Button onClick={() => { setView("login"); setResetSent(false); }} variant="outline" className="mt-6 rounded-2xl h-11 border-white/20 text-white hover:bg-white/15 font-semibold" data-testid="back-login-btn">
                      Terug naar inloggen
                    </Button>
                  </div>
                ) : (
                  <>
                    <h3 className="font-bold text-xl text-white drop-shadow-sm">Wachtwoord herstellen</h3>
                    <p className="text-sm text-white/60 -mt-2 drop-shadow-sm">Vul je e-mailadres in voor een herstel-link.</p>
                    <Input
                      type="email"
                      placeholder="E-mailadres"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
                      className="h-11 rounded-none bg-transparent border-0 text-white text-[15px] placeholder:text-white/50 focus-visible:ring-0 px-1 shadow-none"
                      data-testid="input-reset-email"
                    />
                    {error && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-300 text-center font-medium">{error}</motion.p>
                    )}
                    <button onClick={handleResetPassword} disabled={loading} className="mx-auto flex items-center gap-2 text-[14px] font-semibold text-white hover:text-white/80 transition-colors mt-3 drop-shadow-md disabled:opacity-50" data-testid="button-reset">
                      {loading ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                      ) : (
                        <>Herstel-link versturen <Mail className="w-4 h-4" /></>
                      )}
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* EUDI Wallet Flow Modal */}
      <AnimatePresence>
        {eudiPhase && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl"
            >
              {/* Official EU header */}
              <div className="bg-[#003399] px-5 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* EU circle of stars emblem */}
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 40 40" width="40" height="40">
                        {Array.from({ length: 12 }, (_, i) => {
                          const angle = (i * 30 - 90) * Math.PI / 180;
                          const x = 20 + 13 * Math.cos(angle);
                          const y = 20 + 13 * Math.sin(angle);
                          return <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="5.5" fill="#FFCC00">★</text>;
                        })}
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-bold text-[13px] leading-tight">EU Digital Identity Wallet</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[#FFCC00] text-[10px] font-bold tracking-wide">EUDI</span>
                        <span className="text-white/30 text-[10px]">·</span>
                        <span className="text-white/60 text-[10px]">eIDAS 2.0 gecertificeerd</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setEudiPhase(null)} className="text-white/50 hover:text-white transition-colors p-1" data-testid="close-eudi">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="px-6 py-6">
                {eudiPhase === "request" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    {/* Mini EU digital ID card */}
                    <div className="rounded-2xl overflow-hidden shadow-md">
                      <div className="bg-[#001A6E] px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <svg viewBox="0 0 28 28" width="22" height="22">
                            {Array.from({ length: 12 }, (_, i) => {
                              const angle = (i * 30 - 90) * Math.PI / 180;
                              const x = 14 + 9 * Math.cos(angle);
                              const y = 14 + 9 * Math.sin(angle);
                              return <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="4" fill="#FFCC00">★</text>;
                            })}
                          </svg>
                          <span className="text-white text-[11px] font-bold tracking-widest uppercase">Nederland · NL</span>
                        </div>
                        <span className="text-white/40 text-[10px]">PID Doc v1.0</span>
                      </div>
                      <div className="bg-[#002580] px-4 py-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm shrink-0">GS</div>
                        <div>
                          <p className="text-white font-semibold text-sm leading-tight">G. Spaans</p>
                          <p className="text-white/50 text-[10px]">ges@w€spr.eu · 🇳🇱</p>
                        </div>
                        <div className="ml-auto text-right">
                          <p className="text-[#FFCC00] text-[10px] font-bold">ACTIEF</p>
                          <p className="text-white/40 text-[9px]">exp. 2031</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wide mb-2">Gevraagde gegevens door W€spr</p>
                      <div className="space-y-1.5">
                        {[
                          { label: "Naam", desc: "Voor- en achternaam", required: true },
                          { label: "Nationaliteit", desc: "EU-lidstaat", required: true },
                          { label: "Geboortedatum", desc: "Leeftijdsverificatie", required: true },
                          { label: "BSN / Nationaal ID", desc: "Optioneel voor KYC", required: false },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100">
                            <CheckCircle2 className={`w-4 h-4 shrink-0 ${item.required ? "text-[#003399]" : "text-gray-300"}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-semibold text-gray-800">{item.label}</p>
                              <p className="text-[11px] text-gray-400">{item.desc}</p>
                            </div>
                            {!item.required && <span className="text-[10px] text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">Optioneel</span>}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-[#FFCC00]/10 border border-[#FFCC00]/40 rounded-xl px-3 py-2.5 flex gap-2 items-start">
                      <svg viewBox="0 0 20 20" width="16" height="16" className="shrink-0 mt-0.5">
                        {Array.from({ length: 12 }, (_, i) => {
                          const angle = (i * 30 - 90) * Math.PI / 180;
                          const x = 10 + 7 * Math.cos(angle);
                          const y = 10 + 7 * Math.sin(angle);
                          return <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="3" fill="#003399">★</text>;
                        })}
                      </svg>
                      <p className="text-[11px] text-gray-600 leading-snug">Gegevens worden <strong>nooit opgeslagen</strong> zonder jouw toestemming. Zero-knowledge · eIDAS 2.0.</p>
                    </div>

                    <button
                      onClick={() => {
                        setBiometricScanning(false);
                        setBiometricSuccess(false);
                        setBiometricError(null);
                        setPinDigits([]);
                        setPinError(false);
                        setEudiPhase("biometric");
                      }}
                      className="w-full h-12 rounded-xl bg-[#003399] hover:bg-[#002580] text-white font-bold text-[14px] transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-[#003399]/30"
                      data-testid="button-eudi-confirm"
                    >
                      <svg viewBox="0 0 22 22" width="18" height="18">
                        {Array.from({ length: 12 }, (_, i) => {
                          const angle = (i * 30 - 90) * Math.PI / 180;
                          const x = 11 + 7 * Math.cos(angle);
                          const y = 11 + 7 * Math.sin(angle);
                          return <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="3.5" fill="#FFCC00">★</text>;
                        })}
                      </svg>
                      Bevestigen met EU Wallet
                    </button>
                    <button onClick={() => setEudiPhase(null)} className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors">
                      Annuleren
                    </button>
                  </motion.div>
                )}

                {eudiPhase === "biometric" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                    {/* Official EU wallet biometric header */}
                    <div className="bg-[#001A6E] -mx-6 -mt-6 px-6 py-4 mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <svg viewBox="0 0 24 24" width="18" height="18">
                            {Array.from({ length: 12 }, (_, i) => {
                              const angle = (i * 30 - 90) * Math.PI / 180;
                              const x = 12 + 8 * Math.cos(angle);
                              const y = 12 + 8 * Math.sin(angle);
                              return <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="3.5" fill="#FFCC00">★</text>;
                            })}
                          </svg>
                          <p className="text-[#FFCC00] text-[11px] font-bold tracking-widest uppercase">EU Digital Identity</p>
                        </div>
                        <span className="text-white/30 text-[10px] bg-white/5 px-2 py-0.5 rounded-full">PID · NL</span>
                      </div>
                      <p className="text-white/70 text-[13px]">Bevestig je identiteit voor <span className="text-white font-semibold">W€spr</span></p>
                    </div>

                    {/* Fingerprint button */}
                    <div className="py-4 flex flex-col items-center gap-4">
                      <button
                        onClick={async () => {
                          if (biometricScanning || biometricSuccess) return;
                          setBiometricError(null);
                          setBiometricScanning(true);

                          // Try real WebAuthn first; fall back to simulation on any failure
                          let usedRealBiometric = false;
                          if (webAuthnAvailable) {
                            const result = await triggerWebAuthn();
                            if (result === "success") {
                              usedRealBiometric = true;
                              setBiometricScanning(false);
                              setBiometricSuccess(true);
                              setTimeout(() => doLoginAfterBiometric(), 500);
                            }
                          }

                          // Simulation — runs if WebAuthn unavailable OR failed/cancelled
                          if (!usedRealBiometric) {
                            await new Promise(r => setTimeout(r, 1400));
                            setBiometricScanning(false);
                            setBiometricSuccess(true);
                            setTimeout(() => doLoginAfterBiometric(), 600);
                          }
                        }}
                        className="relative w-32 h-32 rounded-full focus:outline-none"
                        data-testid="button-biometric"
                        disabled={biometricScanning}
                      >
                        <motion.div
                          className={`w-32 h-32 rounded-full border-4 flex items-center justify-center transition-colors duration-500 ${biometricSuccess ? "border-green-400 bg-green-50" : biometricScanning ? "border-[#003399] bg-[#003399]/10" : "border-gray-200 bg-gray-50 hover:border-[#003399]/50 hover:bg-[#003399]/5"}`}
                          animate={biometricScanning && !biometricSuccess ? { boxShadow: ["0 0 0 0px rgba(0,51,153,0.3)", "0 0 0 16px rgba(0,51,153,0)"] } : {}}
                          transition={{ duration: 1.2, repeat: Infinity }}
                        >
                          <Fingerprint className={`w-16 h-16 transition-colors duration-500 ${biometricSuccess ? "text-green-500" : biometricScanning ? "text-[#003399]" : "text-gray-400"}`} />
                        </motion.div>
                      </button>
                      <div className="flex flex-col items-center gap-1">
                        <p className="font-semibold text-gray-800 text-sm">
                          {biometricSuccess
                            ? "Identiteit bevestigd ✓"
                            : biometricScanning
                            ? "Scannen..."
                            : "Raak aan om te bevestigen"}
                        </p>
                        <div className="flex items-center gap-1.5">
                          {webAuthnAvailable === true && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 uppercase tracking-wide">Echte biometrie</span>
                          )}
                          <p className="text-xs text-gray-400">Touch ID · Face ID · Vingerafdruk</p>
                        </div>
                        {biometricError && (
                          <p className="text-xs text-red-500 mt-1 text-center max-w-[200px]">{biometricError}</p>
                        )}
                        {/* Iframe notice — biometrics blocked by browser security */}
                        {isInIframe && !biometricSuccess && (
                          <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-center max-w-[230px]">
                            <p className="text-[11px] text-amber-800 font-semibold mb-1.5">Echte biometrie werkt alleen in de browser</p>
                            <a
                              href={window.location.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[12px] font-bold text-[#003399] bg-white border border-[#003399]/30 rounded-lg px-3 py-1.5 shadow-sm active:scale-95 transition-transform"
                              data-testid="link-open-in-browser"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                              Open in browser
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="h-px bg-gray-100 -mx-6 mb-4" />
                    <div className="flex items-center justify-between">
                      <button onClick={() => { setEudiPhase(null); setBiometricScanning(false); setBiometricSuccess(false); setBiometricError(null); }} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Annuleren</button>
                      <button onClick={() => { setPinDigits([]); setPinError(false); setBiometricError(null); setEudiPhase("pin"); }} className="text-sm text-[#003399] font-semibold hover:underline">Gebruik PIN-code</button>
                    </div>
                  </motion.div>
                )}

                {eudiPhase === "pin" && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="text-center">
                    <div className="bg-[#001A6E] -mx-6 -mt-6 px-6 py-5 mb-6">
                      <div className="flex items-center gap-2 mb-1">
                        <button onClick={() => setEudiPhase("biometric")} className="text-white/60 hover:text-white transition-colors">
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                        <p className="text-[#FFCC00] text-xs font-bold tracking-widest uppercase">PIN-code invoeren</p>
                      </div>
                      <p className="text-white/80 text-sm">Voer je 6-cijferige wallet PIN in</p>
                    </div>

                    {/* PIN dots */}
                    <div className="flex justify-center gap-3 py-4">
                      {[0,1,2,3,4,5].map(i => (
                        <motion.div
                          key={i}
                          animate={pinError ? { x: [-4, 4, -4, 4, 0] } : {}}
                          transition={{ duration: 0.3 }}
                          className={`w-4 h-4 rounded-full border-2 transition-colors duration-200 ${i < pinDigits.length ? (pinError ? "bg-red-500 border-red-500" : "bg-[#003399] border-[#003399]") : "border-gray-300"}`}
                        />
                      ))}
                    </div>
                    {pinError && <p className="text-red-500 text-xs mb-1">Onjuiste PIN-code — probeer opnieuw</p>}
                    {!pinError && <p className="text-gray-400 text-[11px] mb-1">Demo PIN: 1 2 3 4 5 6</p>}

                    {/* Number pad */}
                    <div className="grid grid-cols-3 gap-2 px-4 pb-2">
                      {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((n, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            if (n === "") return;
                            if (n === "⌫") { setPinDigits(p => p.slice(0,-1)); return; }
                            const next = [...pinDigits, String(n)];
                            setPinDigits(next);
                            if (next.length === 6) {
                              const enteredPin = next.join("");
                              if (enteredPin === "123456") {
                                // Correct PIN — proceed with login
                                setTimeout(() => {
                                  doLoginAfterBiometric();
                                }, 300);
                              } else {
                                // Wrong PIN — shake and reset
                                setTimeout(() => {
                                  setPinError(true);
                                  setTimeout(() => {
                                    setPinError(false);
                                    setPinDigits([]);
                                  }, 900);
                                }, 200);
                              }
                            }
                          }}
                          className={`h-12 rounded-xl font-semibold text-lg transition-all active:scale-95 ${n === "" ? "" : n === "⌫" ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-gray-50 text-gray-800 hover:bg-[#003399]/10 hover:text-[#003399]"}`}
                          data-testid={`pin-key-${n}`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>

                    <div className="h-px bg-gray-100 -mx-6 mb-3 mt-2" />
                    <button onClick={() => setEudiPhase(null)} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Annuleren</button>
                  </motion.div>
                )}

                {eudiPhase === "scanning" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-4 space-y-4">
                    <div className="w-20 h-20 rounded-2xl bg-[#003399]/10 flex items-center justify-center mx-auto">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}>
                        <Loader2 className="w-10 h-10 text-[#003399]" />
                      </motion.div>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Wallet verbinden...</p>
                      <p className="text-sm text-gray-400 mt-1">Open je EUDI Wallet app om te bevestigen</p>
                    </div>
                    <div className="flex justify-center gap-1.5 pt-2">
                      {[0, 1, 2].map(i => (
                        <motion.div key={i} className="w-2 h-2 rounded-full bg-[#003399]"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.4 }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {eudiPhase === "verifying" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-4 space-y-4">
                    <div className="w-20 h-20 rounded-2xl bg-[#003399]/8 flex items-center justify-center mx-auto relative">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-2xl">
                        <svg viewBox="0 0 80 80" width="80" height="80">
                          {Array.from({ length: 12 }, (_, i) => {
                            const angle = (i * 30 - 90) * Math.PI / 180;
                            const x = 40 + 35 * Math.cos(angle);
                            const y = 40 + 35 * Math.sin(angle);
                            return <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="7" fill={i < 4 ? "#003399" : "#003399"} opacity={0.15 + (i * 0.07)}>★</text>;
                          })}
                        </svg>
                      </motion.div>
                      <Shield className="w-9 h-9 text-[#003399]" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Identiteit verifiëren...</p>
                      <p className="text-sm text-gray-400 mt-1">Verifiable Credential wordt gecontroleerd</p>
                    </div>
                    <div className="space-y-2 text-left">
                      {["Cryptografische handtekening controleren", "Geldigheid & vervaldatum valideren", "EU-lidstaat bevestigen"].map((step, i) => (
                        <motion.div key={step} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.5 }}
                          className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                          {step}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {eudiPhase === "done" && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4 space-y-3">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}
                      className="w-20 h-20 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-10 h-10 text-green-500" />
                    </motion.div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg">Geverifieerd</p>
                      <p className="text-sm text-gray-400 mt-1">Je EU-identiteit is bevestigd</p>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 pt-1">
                      <svg viewBox="0 0 16 16" width="14" height="14">
                        {Array.from({ length: 12 }, (_, i) => {
                          const angle = (i * 30 - 90) * Math.PI / 180;
                          const x = 8 + 5.5 * Math.cos(angle);
                          const y = 8 + 5.5 * Math.sin(angle);
                          return <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="2.5" fill="#003399">★</text>;
                        })}
                      </svg>
                      <p className="text-[11px] text-[#003399] font-medium">eIDAS 2.0 · Zero-knowledge proof</p>
                    </div>
                    <p className="text-xs text-gray-400">Je wordt automatisch ingelogd...</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
