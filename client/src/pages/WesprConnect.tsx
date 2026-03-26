import { useEffect, useState } from "react";
import { ShieldCheck, Check, Lock, Wifi, X } from "lucide-react";

const EU_BLUE = "#003399";
const EU_YELLOW = "#FFCC00";

function EuStars({ size = 28 }: { size?: number }) {
  const count = 12;
  const r = size * 0.38;
  const cx = size / 2, cy = size / 2;
  const stars = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {stars.map((s, i) => (
        <text key={i} x={s.x} y={s.y} textAnchor="middle" dominantBaseline="central"
          fontSize={size * 0.18} fill={EU_YELLOW}>★</text>
      ))}
    </svg>
  );
}

function AnimatedCheck({ color }: { color: string }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 200);
    const t2 = setTimeout(() => setStep(2), 700);
    const t3 = setTimeout(() => setStep(3), 1100);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-28 h-28">
        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 112 112">
          <circle cx="56" cy="56" r="48" fill="none" stroke="#e5e7eb" strokeWidth="4" />
          <circle cx="56" cy="56" r="48" fill="none" stroke={color} strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="301.6"
            strokeDashoffset={step >= 2 ? "0" : "301.6"}
            style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 ${step >= 1 ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
            style={{ background: `${color}18` }}>
            <Check className={`w-9 h-9 transition-all duration-300 ${step >= 3 ? "scale-100" : "scale-0"}`}
              style={{ color }} strokeWidth={3} />
          </div>
        </div>
      </div>
      <div className={`transition-all duration-500 ${step >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color }}>Verificatie voltooid</span>
      </div>
    </div>
  );
}

export default function WesprConnectPage() {
  const params = new URLSearchParams(window.location.search);
  const appName = params.get("app") || "App";
  const color = params.get("color") || EU_BLUE;
  const logoPath = params.get("logo") || "";

  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), 60); return () => clearTimeout(t); }, []);

  const now = new Date();
  const timeStr = now.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });

  const dataItems = [
    { label: "Naam", value: "G.E. Sarper" },
    { label: "E-mail", value: "ges@w€spr.eu" },
    { label: "Methode", value: "eIDAS 2.0 · OpenID4VP" },
    { label: "Tijd", value: `${timeStr} · ${dateStr}` },
    { label: "Status", value: "Actief ✓", green: true },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "system-ui, -apple-system, sans-serif", background: "#f8fafc" }}>
      <div className="px-4 py-3 flex items-center justify-between shrink-0 shadow-sm" style={{ background: color }}>
        <div className="flex items-center gap-2">
          <EuStars size={22} />
          <span className="text-white font-bold text-sm tracking-tight">W€spr EUDI Wallet</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Lock className="w-3 h-3 text-white/70" />
          <span className="text-white/70 text-[10px] font-semibold uppercase tracking-wider">eIDAS 2.0</span>
        </div>
      </div>

      <div
        className="flex-1 flex flex-col items-center px-5 pt-8 pb-10 gap-6"
        style={{ opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(20px)", transition: "all 0.45s ease" }}
      >
        <AnimatedCheck color={color} />

        <div className="text-center">
          <h1 className="text-[22px] font-bold text-gray-900 mb-1">Verbonden met {appName}</h1>
          <p className="text-[13px] text-gray-500 leading-snug">Authenticatie geslaagd via W€spr EUDI Wallet.<br />Geen wachtwoord vereist.</p>
        </div>

        <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 pt-3 pb-2 border-b border-gray-100 flex items-center gap-2">
            {logoPath
              ? <img src={logoPath} alt="" className="w-7 h-7 rounded-lg object-contain" />
              : <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: color }}>{appName[0]}</div>}
            <span className="text-[13px] font-semibold text-gray-700">{appName}</span>
            <span className="ml-auto text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700">Verbonden</span>
          </div>
          {dataItems.map((item, i) => (
            <div key={i} className={`flex items-center justify-between px-4 py-2.5 ${i < dataItems.length - 1 ? "border-b border-gray-50" : ""}`}>
              <span className="text-[12px] text-gray-400">{item.label}</span>
              <span className={`text-[12px] font-semibold ${item.green ? "text-green-600" : "text-gray-800"}`}>{item.value}</span>
            </div>
          ))}
        </div>

        <div className="w-full rounded-2xl p-4 flex items-start gap-3 border" style={{ background: `${color}08`, borderColor: `${color}20` }}>
          <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" style={{ color }} />
          <div>
            <p className="text-[13px] font-semibold" style={{ color }}>Veilig ingelogd via W€spr EUDI Wallet</p>
            <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
              Uw geverifieerde Europese digitale identiteit is beveiligd gedeeld met {appName}. Uw biometrische gegevens verlaten uw apparaat nooit.
            </p>
          </div>
        </div>

        <div className="w-full grid grid-cols-3 gap-3">
          {[
            { icon: Lock, label: "End-to-end\nversleuteld" },
            { icon: ShieldCheck, label: "GDPR\ncompliant" },
            { icon: Wifi, label: "OpenID4VP\nprotocol" },
          ].map(({ icon: Icon, label }, i) => (
            <div key={i} className="bg-white rounded-xl p-3 flex flex-col items-center gap-1.5 shadow-sm border border-gray-100 text-center">
              <Icon className="w-4 h-4" style={{ color }} />
              <span className="text-[10px] text-gray-500 leading-tight whitespace-pre-line">{label}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => window.close()}
          className="flex items-center gap-1.5 text-[13px] text-gray-400 active:opacity-60 mt-2"
        >
          <X className="w-3.5 h-3.5" />
          Venster sluiten
        </button>

        <div className="mt-auto pt-2 flex items-center gap-1.5 text-[10px] text-gray-300">
          <EuStars size={14} />
          <span>W€spr · Europese Digitale Identiteitsportemonnee · eIDAS 2.0</span>
        </div>
      </div>
    </div>
  );
}
