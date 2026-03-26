import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RefreshCw, ExternalLink, Globe, Lock, ChevronRight, Car, MapPin } from "lucide-react";
import { Button } from "./ui/button";

const LOGOS: Record<string, string> = {
  "EasyPark NL": "/images/easypark-logo.svg",
  "Flitsmeister": "/images/flitsmeister-logo.svg",
  "Parkeren Den Haag": "/images/parkeren-dh-logo.svg",
  "Kaarten": "/images/apple-maps-logo.svg",
  "Q-Park": "/images/qpark-logo.svg",
};

// Apps that block proxy/iframe — shown as direct-link cards immediately
const SKIP_PROXY: Record<string, { description: string; features: { icon: any; label: string }[] }> = {
  "Parkeren Den Haag": {
    description: "Informatie over parkeren in Den Haag — zones, tarieven en parkeergarages",
    features: [
      { icon: MapPin, label: "Parkeerlocaties in Den Haag" },
      { icon: Car, label: "Tarieven & openingstijden" },
      { icon: Globe, label: "Vergunningen & bewonersparkeren" },
    ],
  },
  "Q-Park": {
    description: "Vind en reserveer een parkeerplaats bij Q-Park garages door heel Europa",
    features: [
      { icon: MapPin, label: "Garages zoeken & reserveren" },
      { icon: Car, label: "Tarieven vergelijken" },
      { icon: Globe, label: "Abonnementen & seizoenskaarten" },
    ],
  },
  "Flitsmeister": {
    description: "Navigeer slim en veilig — real-time flitsers, trajectcontroles en verkeersinfo voor Nederland",
    features: [
      { icon: MapPin, label: "Real-time flitsers & trajectcontroles" },
      { icon: Car, label: "Verkeersinfo & files" },
      { icon: Globe, label: "Offline kaarten Nederland" },
    ],
  },
};

const NAV_APPS: Record<string, { url: string; color: string }> = {
  "Google Maps": { url: "https://maps.google.com", color: "#4285F4" },
  "EasyPark NL": { url: "https://easypark.nl", color: "#4CAF50" },
  "Parkeren Den Haag": { url: "https://www.denhaag.nl/nl/parkeren.htm", color: "#00843D" },
  "Q-Park": { url: "https://www.q-park.nl", color: "#E4002B" },
  "Flitsmeister": { url: "https://www.flitsmeister.nl", color: "#FF6B00" },
};

function DirectLinkCard({ label, onBack }: { label: string; onBack: () => void }) {
  const app = NAV_APPS[label];
  const info = SKIP_PROXY[label];
  if (!app || !info) return null;

  const domain = app.url.replace("https://", "").replace("www.", "").replace(/\/.*$/, "");

  const openHref = (url: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-background flex flex-col overflow-hidden" style={{ isolation: "isolate" }}>
      <header
        className="px-3 py-2 flex items-center gap-2 border-b border-border/30 shadow-sm shrink-0"
        style={{ backgroundColor: app.color, position: "relative", zIndex: 50 }}
      >
        <Button variant="ghost" size="icon" onClick={onBack} className="-ml-1 h-8 w-8 text-white hover:bg-white/20">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0 flex items-center gap-2">
          {LOGOS[label] && <img src={LOGOS[label]} alt="" className="w-6 h-6 rounded shadow-sm" />}
          <div className="bg-white/20 rounded-lg px-3 py-1.5 flex items-center gap-2 flex-1 min-w-0">
            <Globe className="w-3 h-3 text-white/70 shrink-0" />
            <span className="text-xs text-white/90 truncate font-medium">{domain}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-background">
        <div className="px-5 pt-8 pb-4 text-center" style={{ background: `linear-gradient(135deg, ${app.color}15, ${app.color}05)` }}>
          {LOGOS[label] && <img src={LOGOS[label]} alt="" className="w-20 h-20 rounded-2xl shadow-lg mx-auto mb-4" />}
          <h2 className="text-xl font-bold mb-1">{label}</h2>
          <p className="text-sm text-muted-foreground">{info.description}</p>
        </div>

        <div className="px-5 py-4">
          <div className="bg-card rounded-2xl shadow-sm border border-border/40 overflow-hidden">
            {info.features.map((feature, i) => {
              const FeatureIcon = feature.icon;
              return (
                <div key={i} className={`flex items-center gap-3 px-4 py-3.5 ${i < info.features.length - 1 ? "border-b border-border/30" : ""}`}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${app.color}15`, color: app.color }}>
                    <FeatureIcon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium flex-1">{feature.label}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-5 pb-3">
          <a
            href={app.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-14 rounded-2xl flex items-center justify-center gap-2 font-semibold text-[15px] shadow-lg active:scale-[0.98] transition-transform no-underline text-white"
            style={{ backgroundColor: app.color }}
          >
            Open {label}
            <Globe className="w-4 h-4" />
          </a>
        </div>
        <div className="px-5 pb-3">
          <Button variant="outline" className="w-full h-12 rounded-2xl font-semibold text-[14px] border-2 active:scale-[0.98] transition-transform" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Terug naar W€spr
          </Button>
        </div>
        <div className="px-5 pb-8">
          <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
            <Lock className="w-3 h-3" />
            <span>Beveiligde verbinding via {domain}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function LiveWebView({ label, onBack }: { label: string; onBack: () => void }) {
  const app = NAV_APPS[label];
  const [status, setStatus] = useState<"loading" | "loaded" | "blocked">("loading");
  const [key, setKey] = useState(0);

  if (!app) return null;

  const isEmbedMap = app.url === "__EMBED_MAP__";
  const proxyUrl = isEmbedMap
    ? "https://www.openstreetmap.org/export/embed.html?bbox=4.2007%2C52.0205%2C4.4007%2C52.1205&layer=mapnik&marker=52.0705%2C4.3007"
    : `/api/proxy?url=${encodeURIComponent(app.url)}`;
  const domain = isEmbedMap ? "openstreetmap.org" : app.url.replace("https://", "").replace("www.", "").replace(/\/.*$/, "");

  useEffect(() => {
    setStatus("loading");
  }, [key]);

  const handleLoad = () => setStatus("loaded");
  const handleError = () => setStatus("blocked");
  const openExternal = () => {
    const a = document.createElement("a");
    a.href = app.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-background flex flex-col overflow-hidden" style={{ isolation: "isolate" }}>
      <header
        className="px-3 py-2 flex items-center gap-2 border-b border-border/30 shadow-sm shrink-0"
        style={{ backgroundColor: app.color, position: "relative", zIndex: 50 }}
      >
        <Button variant="ghost" size="icon" onClick={onBack} className="-ml-1 h-8 w-8 text-white hover:bg-white/20">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0 flex items-center gap-2">
          {LOGOS[label] && <img src={LOGOS[label]} alt="" className="w-6 h-6 rounded shadow-sm" />}
          <div className="bg-white/20 rounded-lg px-3 py-1.5 flex items-center gap-2 flex-1 min-w-0">
            <Globe className="w-3 h-3 text-white/70 shrink-0" />
            <span className="text-xs text-white/90 truncate font-medium">{domain}</span>
            {status === "loaded" && <div className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0 ml-auto animate-pulse" />}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20" onClick={() => setKey(k => k + 1)}>
          <RefreshCw className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20" onClick={openExternal}>
          <ExternalLink className="w-4 h-4" />
        </Button>
      </header>

      <div className="flex-1 relative bg-white overflow-hidden" style={{ zIndex: 1 }}>
        <AnimatePresence>
          {status === "loading" && (
            <div
              style={{ position: "absolute", inset: 0, backgroundColor: "hsl(var(--background))", zIndex: 99999, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "60px" }}
            >
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative mb-6">
                {LOGOS[label] && <img src={LOGOS[label]} alt="" className="w-20 h-20 rounded-2xl shadow-xl relative z-10" />}
                <div className="absolute inset-0 bg-white/50 blur-xl rounded-full scale-110" />
              </motion.div>
              <div className="flex flex-col items-center gap-2 px-6 w-full max-w-[240px]">
                <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: "95%" }} transition={{ duration: 2.5, ease: "easeOut" }} className="h-full" style={{ backgroundColor: app.color }} />
                </div>
                <p className="text-xs font-bold tracking-tight">{label} wordt geopend...</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest opacity-60">Veilige verbinding</p>
              </div>
            </div>
          )}
          {status === "blocked" && (
            <motion.div key="blocked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background z-10 px-6 text-center">
              {LOGOS[label] && <img src={LOGOS[label]} alt="" className="w-20 h-20 rounded-2xl shadow-lg mx-auto" />}
              <p className="text-sm font-medium text-muted-foreground">Verbinding niet mogelijk via W€spr</p>
              <a href={app.url} target="_blank" rel="noopener noreferrer" className="rounded-xl h-12 px-8 text-white font-semibold flex items-center gap-2 no-underline" style={{ backgroundColor: app.color }}>
                Open {label} <Globe className="w-4 h-4" />
              </a>
              <Button variant="ghost" onClick={onBack} className="text-sm text-muted-foreground">Terug</Button>
            </motion.div>
          )}
        </AnimatePresence>

        <iframe
          key={key}
          src={proxyUrl}
          className="w-full h-full border-0"
          onLoad={handleLoad}
          onError={handleError}
          title={label}
          style={{ display: status === "loaded" ? "block" : "none" }}
          {...(isEmbedMap ? {} : { sandbox: "allow-same-origin allow-scripts allow-forms allow-popups" })}
        />
      </div>
    </div>
  );
}

const NAV_APP_LABELS = Object.keys(NAV_APPS);
export const isNavApp = (label: string) => NAV_APP_LABELS.includes(label);
export function NavAppView({ label, onBack }: { label: string; onBack: () => void }) {
  if (label in SKIP_PROXY) return <DirectLinkCard label={label} onBack={onBack} />;
  return <LiveWebView label={label} onBack={onBack} />;
}