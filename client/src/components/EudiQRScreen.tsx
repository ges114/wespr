import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Shield, X, Fingerprint, Check } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

type Phase = "kassa" | "connecting" | "request" | "biometric" | "success";
type BioState = "idle" | "scanning" | "success";

const EU_STARS = ({ size = 20 }: { size?: number }) => (
  <svg viewBox="0 0 40 40" width={size} height={size}>
    {Array.from({ length: 12 }, (_, i) => {
      const angle = (i * 30 - 90) * Math.PI / 180;
      const x = 20 + 13 * Math.cos(angle);
      const y = 20 + 13 * Math.sin(angle);
      return <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="6" fill="#FFCC00">★</text>;
    })}
  </svg>
);

const QR_DATA = "wespr://eudi-verify?merchant=Demo+Kassa+NL&session=qr7x4k9&version=eidas2";

async function tryWebAuthn(): Promise<boolean> {
  try {
    const isInIframe = (() => { try { return window.self !== window.top; } catch { return true; } })();
    if (isInIframe || !(window as any).PublicKeyCredential) return false;

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
        return !!assertion;
      } catch {
        // Any error (domain mismatch, no passkey on device, etc.) — clear and re-register
        localStorage.removeItem("wespr_biometric_cred_id");
      }
    }

    // Register fresh credential for this domain
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
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function EudiQRScreen({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>("kassa");
  const [dots, setDots] = useState(0);
  const [bioState, setBioState] = useState<BioState>("idle");

  useEffect(() => {
    if (phase !== "connecting") return;
    const t = setInterval(() => setDots(d => (d + 1) % 4), 400);
    const done = setTimeout(() => { clearInterval(t); setPhase("request"); }, 2800);
    return () => { clearInterval(t); clearTimeout(done); };
  }, [phase]);

  const handleBiometricTap = async () => {
    if (bioState !== "idle") return;
    setBioState("scanning");

    const ok = await tryWebAuthn();

    if (ok) {
      setBioState("success");
      setTimeout(() => setPhase("success"), 700);
    } else {
      setTimeout(() => {
        setBioState("success");
        setTimeout(() => setPhase("success"), 700);
      }, 1400);
    }
  };

  return (
    <div className="fixed inset-0 z-[998] bg-background flex flex-col">
      {/* Header */}
      <div className="bg-[#003399] px-5 py-4 flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
          <EU_STARS size={36} />
        </div>
        <div className="flex-1">
          <p className="text-white font-bold text-[13px] leading-tight">EUDI Wallet · QR Verificatie</p>
          <p className="text-white/60 text-[11px]">eIDAS 2.0 gecertificeerd</p>
        </div>
        <button onClick={onClose} className="text-white/50 hover:text-white transition-colors p-1">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">

          {/* Fase 1: Kassa QR */}
          {phase === "kassa" && (
            <motion.div key="kassa" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center px-6 py-8 gap-6">

              <div className="text-center">
                <h2 className="text-xl font-bold text-foreground">Scan bij de kassa</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Dit is de QR-code die op het kassascherm verschijnt
                </p>
              </div>

              {/* Mock kassa terminal */}
              <div className="w-full max-w-xs rounded-3xl overflow-hidden shadow-xl border border-border">
                <div className="bg-[#1a1a2e] px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  </div>
                  <span className="text-white/50 text-[11px] font-mono">KASSA · POS-Terminal</span>
                  <div className="w-12" />
                </div>
                <div className="bg-white px-6 py-6 flex flex-col items-center gap-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Identiteitsverificatie</p>
                    <p className="text-base font-bold text-gray-900">Demo Kassa NL</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100">
                    <QRCodeSVG
                      value={QR_DATA}
                      size={160}
                      level="M"
                      fgColor="#003399"
                      bgColor="transparent"
                      imageSettings={{
                        src: "",
                        x: undefined,
                        y: undefined,
                        height: 0,
                        width: 0,
                        excavate: false,
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-[#003399] flex items-center justify-center">
                      <EU_STARS size={20} />
                    </div>
                    <span className="text-[11px] text-[#003399] font-semibold">EUDI · eIDAS 2.0</span>
                  </div>
                  <p className="text-[11px] text-gray-400 text-center leading-snug">
                    Scan met je W€spr app om je identiteit te bevestigen
                  </p>
                </div>
              </div>

              <button
                onClick={() => setPhase("connecting")}
                className="w-full max-w-xs h-13 py-3.5 rounded-2xl bg-[#003399] hover:bg-[#002580] text-white font-bold text-[15px] transition-all active:scale-[0.98] shadow-lg shadow-[#003399]/30 flex items-center justify-center gap-2"
                data-testid="button-scan-qr"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 3.5a.5.5 0 11-1 0 .5.5 0 011 0zm-1-8.5a.5.5 0 11-1 0 .5.5 0 011 0zm-7 8a.5.5 0 11-1 0 .5.5 0 011 0z" />
                </svg>
                QR-code scannen
              </button>

              <p className="text-[11px] text-muted-foreground text-center max-w-[220px] leading-snug">
                In de echte situatie open je de camera van W€spr en scan je de QR-code bij de kassa
              </p>
            </motion.div>
          )}

          {/* Fase 2: Verbinden */}
          {phase === "connecting" && (
            <motion.div key="connecting" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[60vh] px-6 gap-8">

              <div className="relative w-28 h-28">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-4 border-[#003399]/20 border-t-[#003399]" />
                <div className="absolute inset-3 rounded-full bg-[#003399]/5 flex items-center justify-center">
                  <EU_STARS size={40} />
                </div>
              </div>

              <div className="text-center space-y-2">
                <p className="text-lg font-bold text-foreground">
                  Verbinding tot stand brengen{".".repeat(dots)}
                </p>
                <p className="text-sm text-muted-foreground">W€spr maakt contact met de kassa</p>
              </div>

              <div className="w-full max-w-xs space-y-2">
                {["QR-code herkend", "Sessie beveiligen (TLS 1.3)", "Merchant authenticeren"].map((step, i) => (
                  <motion.div key={step} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.6 }}
                    className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    {step}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Fase 3: Bevestigen */}
          {phase === "request" && (
            <motion.div key="request" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="px-6 py-6 space-y-5">

              <div className="rounded-2xl overflow-hidden border border-border shadow-sm">
                <div className="bg-[#001A6E] px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <EU_STARS size={20} />
                    <span className="text-white text-[11px] font-bold tracking-widest uppercase">Geverifieerde kassa</span>
                  </div>
                  <span className="text-white/40 text-[10px]">eIDAS 2.0</span>
                </div>
                <div className="bg-[#002580] px-4 py-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-sm shrink-0">DK</div>
                  <div>
                    <p className="text-white font-semibold text-sm">Demo Kassa NL</p>
                    <p className="text-white/50 text-[11px]">kvk-demo-123456 · 🇳🇱 Nederland</p>
                  </div>
                  <div className="ml-auto">
                    <span className="text-[#FFCC00] text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded-full">ACTIEF</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide mb-2">
                  De kassa vraagt de volgende gegevens
                </p>
                <div className="space-y-1.5">
                  {[
                    { label: "Naam", desc: "Voor- en achternaam", required: true },
                    { label: "Nationaliteit", desc: "EU-lidstaat", required: true },
                    { label: "Geboortedatum", desc: "Leeftijdsverificatie 18+", required: true },
                    { label: "BSN / Nationaal ID", desc: "Alleen bij KYC-verplichting", required: false },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-muted/50 border border-border/50">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 ${item.required ? "text-[#003399]" : "text-muted-foreground/40"}`} />
                      <div className="flex-1">
                        <p className="text-[13px] font-semibold text-foreground">{item.label}</p>
                        <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                      </div>
                      {!item.required && <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Optioneel</span>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 flex gap-2 items-start">
                <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 leading-snug">
                  Gegevens worden <strong>eenmalig en versleuteld</strong> gedeeld. De kassa slaat niets op zonder jouw toestemming.
                </p>
              </div>

              <button
                onClick={() => setPhase("biometric")}
                className="w-full h-12 rounded-xl bg-[#003399] hover:bg-[#002580] text-white font-bold text-[14px] transition-all active:scale-[0.98] shadow-lg shadow-[#003399]/25 flex items-center justify-center gap-2"
                data-testid="button-eudi-share"
              >
                <EU_STARS size={18} />
                Bevestigen & Delen
              </button>
              <button onClick={onClose} className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                Weigeren
              </button>
            </motion.div>
          )}

          {/* Fase 4: Biometrie */}
          {phase === "biometric" && (
            <motion.div key="biometric" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[70vh] px-6 gap-6">

              <div className="flex flex-col items-center gap-1 mb-2">
                <div className="flex items-center gap-2 mb-1">
                  <EU_STARS size={22} />
                  <span className="text-[#003399] font-bold text-sm">EUDI Wallet</span>
                </div>
                <p className="text-xl font-bold text-foreground text-center">
                  {bioState === "success" ? "Identiteit bevestigd" : "Bevestig je identiteit"}
                </p>
                <p className="text-sm text-muted-foreground text-center">
                  {bioState === "scanning" ? "Verifiëren..." : bioState === "success" ? "Je gegevens worden veilig gedeeld" : "Gebruik vingerafdruk of Face ID"}
                </p>
              </div>

              <motion.button
                onClick={handleBiometricTap}
                disabled={bioState !== "idle"}
                animate={bioState === "scanning" ? {
                  boxShadow: ["0 0 0 0px rgba(0,51,153,0.3)", "0 0 0 22px rgba(0,51,153,0)"]
                } : {}}
                transition={{ repeat: Infinity, duration: 1.4 }}
                className={`w-36 h-36 rounded-full border-4 flex items-center justify-center transition-all duration-500 cursor-pointer ${
                  bioState === "success"
                    ? "border-green-400 bg-green-50"
                    : bioState === "scanning"
                    ? "border-[#003399] bg-[#003399]/10"
                    : "border-gray-200 bg-gray-50 hover:border-[#003399]/50 hover:bg-[#003399]/5 active:scale-95"
                }`}
                data-testid="button-eudi-biometric"
              >
                {bioState === "success" ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                    <Check className="w-18 h-18 text-green-500" style={{ width: 72, height: 72 }} />
                  </motion.div>
                ) : (
                  <Fingerprint className={`w-20 h-20 transition-colors duration-500 ${
                    bioState === "scanning" ? "text-[#003399]" : "text-gray-300"
                  }`} />
                )}
              </motion.button>

              <p className="text-xs text-muted-foreground text-center max-w-[200px]">
                {bioState === "success"
                  ? "✓ Biometrie bevestigd"
                  : bioState === "scanning"
                  ? "Wacht op apparaat..."
                  : "Tik om te verifiëren met vingerafdruk of Face ID"}
              </p>

              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#003399]" />
                <p className="text-[10px] text-muted-foreground">Beveiligd · eIDAS 2.0 · Zero-knowledge</p>
              </div>

              {bioState === "idle" && (
                <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground transition-colors mt-2">
                  Annuleren
                </button>
              )}
            </motion.div>
          )}

          {/* Fase 5: Succes */}
          {phase === "success" && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center px-6 py-10 gap-6">

              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}
                className="w-24 h-24 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </motion.div>

              <div className="text-center space-y-1">
                <h2 className="text-xl font-bold text-foreground">Identiteit gedeeld</h2>
                <p className="text-sm text-muted-foreground">De kassa heeft je EU-identiteit ontvangen</p>
              </div>

              <div className="w-full max-w-xs rounded-2xl overflow-hidden border border-border shadow-sm">
                <div className="bg-[#001A6E] px-4 py-2.5 flex items-center gap-2">
                  <EU_STARS size={18} />
                  <p className="text-white text-[11px] font-bold tracking-widest uppercase">Verificatie Bewijs</p>
                </div>
                <div className="bg-card px-4 py-3 space-y-2">
                  {[
                    { label: "Ontvanger", val: "Demo Kassa NL" },
                    { label: "Naam gedeeld", val: "G. Spaans" },
                    { label: "Leeftijd 18+", val: "Bevestigd ✓" },
                    { label: "Nationaliteit", val: "🇳🇱 Nederland" },
                    { label: "Protocol", val: "OpenID4VP · eIDAS 2.0" },
                  ].map(({ label, val }) => (
                    <div key={label} className="flex justify-between text-[12px]">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-semibold text-foreground">{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <EU_STARS size={16} />
                <p className="text-[11px] text-[#003399] font-medium">Zero-knowledge · Geen opslag · eIDAS 2.0</p>
              </div>

              <button
                onClick={onClose}
                className="w-full max-w-xs h-12 rounded-xl bg-[#003399] text-white font-bold text-[14px] transition-all active:scale-[0.98]"
                data-testid="button-eudi-done"
              >
                Klaar
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
