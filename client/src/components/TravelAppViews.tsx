import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RefreshCw, ExternalLink, Globe, Lock, ChevronRight, Train, MapPin, ShieldCheck, Check, Star, Search, Bed, Fingerprint } from "lucide-react";
import { Button } from "./ui/button";
import { useQuery } from "@tanstack/react-query";

// All travel apps skip iframe — show direct-link card immediately
const SKIP_IFRAME_TRAVEL: string[] = [];  // unused; skipIframe is always true

const APP_INFO: Record<string, { description: string; features: { icon: any; label: string }[] }> = {
  "NS": {
    description: "Plan je treinreis door Nederland — dienstregeling, tickets en real-time vertragingen",
    features: [
      { icon: Train, label: "Reisplanner & dienstregeling" },
      { icon: MapPin, label: "Stations & actuele info" },
      { icon: Globe, label: "Tickets kopen & opslaan" },
    ],
  },
  "9292": {
    description: "Dé OV-reisplanner van Nederland — trein, bus, tram en metro in één overzicht",
    features: [
      { icon: Train, label: "Alle OV-soorten gecombineerd" },
      { icon: MapPin, label: "Deur-tot-deur reisadvies" },
      { icon: Globe, label: "Real-time vertragingen & verstoringen" },
    ],
  },
  "GVB": {
    description: "Officiële app van GVB — openbaar vervoer in Amsterdam",
    features: [
      { icon: Train, label: "Tram, metro, bus & ferry" },
      { icon: MapPin, label: "Haltes & routekaart Amsterdam" },
      { icon: Globe, label: "Dienstregeling & actuele info" },
    ],
  },
  "RET": {
    description: "Openbaar vervoer in Rotterdam — metro, tram, bus en waterbus",
    features: [
      { icon: Train, label: "Metro, tram & bus Rotterdam" },
      { icon: MapPin, label: "Haltes & reisplanner" },
      { icon: Globe, label: "Actuele vertragingen & storingen" },
    ],
  },
  "HTM": {
    description: "Openbaar vervoer in Den Haag en omgeving — tram en bus",
    features: [
      { icon: Train, label: "Tram & bus Den Haag" },
      { icon: MapPin, label: "Haltes & dienstregeling" },
      { icon: Globe, label: "Actuele reisinformatie" },
    ],
  },
  "OV-chipkaart": {
    description: "Beheer je OV-chipkaart — saldo opladen, reishistorie en abonnementen",
    features: [
      { icon: Globe, label: "Saldo opladen & bekijken" },
      { icon: Train, label: "Reishistorie inzien" },
      { icon: ShieldCheck, label: "Abonnementen & producten" },
    ],
  },
  "Schiphol": {
    description: "Actuele vertrektijden, aankomsten en vluchtstatus op Amsterdam Airport",
    features: [
      { icon: MapPin, label: "Vluchtstatus real-time" },
      { icon: Search, label: "Vertrek- & aankomsttijden" },
      { icon: Globe, label: "Terminals & reisinformatie" },
    ],
  },
  "KLM": {
    description: "Vlieg met KLM — boek vluchten, check-in online en bekijk je reisroute",
    features: [
      { icon: Globe, label: "Vluchten zoeken & boeken" },
      { icon: Check, label: "Online inchecken" },
      { icon: MapPin, label: "Vluchtstatus & boarding pass" },
    ],
  },
  "Transavia": {
    description: "Goedkope vluchten vanuit Nederland — boek en check-in met Transavia",
    features: [
      { icon: Globe, label: "Vluchten zoeken & boeken" },
      { icon: Check, label: "Online inchecken" },
      { icon: MapPin, label: "Vluchtstatus & boardingpass" },
    ],
  },
  "Ryanair": {
    description: "Europa's grootste lowcostmaatschappij — vluchten, hotels en autoverhuur",
    features: [
      { icon: Globe, label: "Goedkope vluchten door Europa" },
      { icon: Check, label: "Online inchecken" },
      { icon: Star, label: "Hotels & autoverhuur boeken" },
    ],
  },
  "easyJet": {
    description: "Vlieg goedkoop door Europa met easyJet — eenvoudig boeken en inchecken",
    features: [
      { icon: Globe, label: "Vluchten zoeken & boeken" },
      { icon: Check, label: "Online inchecken" },
      { icon: MapPin, label: "Vluchtstatus bekijken" },
    ],
  },
  "Booking.com": {
    description: "Boek hotels, appartementen en vakantiehuizen overal ter wereld",
    features: [
      { icon: Bed, label: "Hotels & accommodaties zoeken" },
      { icon: Star, label: "Beoordelingen & prijsvergelijking" },
      { icon: Globe, label: "Gratis annulering beschikbaar" },
    ],
  },
  "Airbnb": {
    description: "Verblijf bij locals over de hele wereld — unieke accommodaties en ervaringen",
    features: [
      { icon: Bed, label: "Unieke verblijven boeken" },
      { icon: Star, label: "Beoordeelde verhuurders" },
      { icon: Globe, label: "Ervaringen & activiteiten" },
    ],
  },
  "Uber": {
    description: "Boek een rit in seconden — betrouwbaar en beschikbaar in honderden steden",
    features: [
      { icon: MapPin, label: "Rit boeken in de buurt" },
      { icon: Star, label: "Vaste prijs, geen verrassingen" },
      { icon: Globe, label: "Beschikbaar in 70+ landen" },
    ],
  },
  "Bolt": {
    description: "Betaalbaar vervoer — taxi's, e-steps en deelfietsen in één app",
    features: [
      { icon: MapPin, label: "Taxi & e-step boeken" },
      { icon: Star, label: "Lage tarieven, snel rijden" },
      { icon: Globe, label: "Beschikbaar in 45+ landen" },
    ],
  },
  "Swapfiets": {
    description: "Altijd een werkende fiets — abonnement inclusief onderhoud en reparaties",
    features: [
      { icon: Check, label: "Maandelijks opzegbaar" },
      { icon: Globe, label: "Beschikbaar in 9 landen" },
      { icon: ShieldCheck, label: "Reparatie & vervanging inbegrepen" },
    ],
  },
  "OV-fiets": {
    description: "Huur een NS-fiets bij elk groot station — ideaal als laatste kilometer",
    features: [
      { icon: MapPin, label: "Beschikbaar op 300+ stations" },
      { icon: Globe, label: "Met je OV-chipkaart te huren" },
      { icon: Train, label: "Dag- en weekabonnement" },
    ],
  },
  "Felyx": {
    description: "Deel een elektrische scooter in Amsterdam, Rotterdam en Den Haag",
    features: [
      { icon: MapPin, label: "Scooters vinden in de buurt" },
      { icon: Globe, label: "Elektrisch & milieuvriendelijk" },
      { icon: Check, label: "Geen vaste parkeerplek nodig" },
    ],
  },
  "CHECK": {
    description: "Elektrische deelsteps en -fietsen in Nederlandse steden",
    features: [
      { icon: MapPin, label: "Steps & fietsen vinden" },
      { icon: Globe, label: "Beschikbaar in meerdere steden" },
      { icon: Check, label: "Per minuut of met abonnement" },
    ],
  },
  "TUI": {
    description: "Vakanties, vluchten en hotels — alles voor jouw droomreis bij TUI",
    features: [
      { icon: Globe, label: "Pakketreizen & citytrips" },
      { icon: Bed, label: "Hotels & resorts boeken" },
      { icon: Star, label: "Last minute deals" },
    ],
  },
  "Corendon": {
    description: "Betaalbare vakanties vanuit Nederland — zon, zee en cultuurreizen",
    features: [
      { icon: Globe, label: "Vlieg- en autovakantie" },
      { icon: Bed, label: "Hotels & appartementen" },
      { icon: Star, label: "Vroegboekkorting & deals" },
    ],
  },
  "ANWB": {
    description: "Wegenwacht, reisinformatie en verzekeringen — de ANWB helpt je onderweg",
    features: [
      { icon: ShieldCheck, label: "Wegenwacht & pechhulp" },
      { icon: MapPin, label: "Reisroutes & reisadvies" },
      { icon: Globe, label: "Verzekeringen & ledendiensten" },
    ],
  },
  "Metro Guangzhou": {
    description: "Officiële app van de metro in Guangzhou — routeplanner, lijnen en dienstregeling",
    features: [
      { icon: Train, label: "Metrolijnen & routes" },
      { icon: MapPin, label: "Stations zoeken" },
      { icon: Globe, label: "Dienstregeling bekijken" },
    ],
  },
  "Railway 12306": {
    description: "Boek treintickets door heel China — de officiële app van China Railway",
    features: [
      { icon: Train, label: "Treintickets boeken" },
      { icon: MapPin, label: "Routes & stations" },
      { icon: Globe, label: "Dienstregeling & vertragingen" },
    ],
  },
  "Cabify": {
    description: "Betrouwbare ritten in Spanje en Latijns-Amerika — boek een taxi of privéauto",
    features: [
      { icon: MapPin, label: "Rit boeken in seconden" },
      { icon: Star, label: "Vaste prijzen, geen verrassingen" },
      { icon: Globe, label: "Beschikbaar in 40+ steden" },
    ],
  },
};

const APP_STORE_LINKS: Record<string, { apple?: string; play?: string }> = {};

const LOGOS: Record<string, string> = {
  "NS": "/images/ns-logo.svg",
  "9292": "/images/9292-logo.svg",
  "GVB": "/images/gvb-logo.svg",
  "RET": "/images/ret-logo.svg",
  "HTM": "/images/htm-logo.svg",
  "OV-chipkaart": "/images/ovchipkaart-logo.svg",
  "Schiphol": "/images/schiphol-logo.svg",
  "KLM": "/images/klm-logo.svg",
  "Transavia": "/images/transavia-logo.svg",
  "Ryanair": "/images/ryanair-logo.svg",
  "easyJet": "/images/easyjet-logo.svg",
  "Booking.com": "/images/booking-logo.svg",
  "Airbnb": "/images/airbnb-logo.svg",
  "Uber": "/images/uber-logo.svg",
  "Bolt": "/images/bolt-logo.svg",
  "Swapfiets": "/images/swapfiets-logo.svg",
  "OV-fiets": "/images/ovfiets-logo.svg",
  "Felyx": "/images/felyx-logo.svg",
  "CHECK": "/images/check-logo.svg",
  "TUI": "/images/tui-logo.svg",
  "Corendon": "/images/corendon-logo.svg",
  "ANWB": "/images/anwb-logo.svg",
  "Metro Guangzhou": "/images/metro-guangzhou-logo.svg",
  "Railway 12306": "/images/railway12306-logo.svg",
  "Cabify": "/images/cabify-logo.svg",
};

const TRAVEL_APPS: Record<string, { url: string; color: string; mobileUrl?: string }> = {
  "NS": { url: "https://www.ns.nl", color: "#003082", mobileUrl: "https://www.ns.nl/reisplanner" },
  "9292": { url: "https://9292.nl", color: "#009BD5" },
  "GVB": { url: "https://www.gvb.nl", color: "#004B87" },
  "RET": { url: "https://www.ret.nl", color: "#E4003A" },
  "HTM": { url: "https://www.htm.nl", color: "#CE1126" },
  "OV-chipkaart": { url: "https://www.ov-chipkaart.nl", color: "#E4003A" },
  "Schiphol": { url: "https://www.schiphol.nl", color: "#0a328c" },
  "KLM": { url: "https://www.klm.nl", color: "#00A1DE" },
  "Transavia": { url: "https://www.transavia.com/nl-NL/home/", color: "#00A651" },
  "Ryanair": { url: "https://www.ryanair.com/nl/nl", color: "#073590" },
  "easyJet": { url: "https://www.easyjet.com/nl/", color: "#FF6600" },
  "Booking.com": { url: "https://www.booking.com", color: "#003580" },
  "Airbnb": { url: "https://www.airbnb.nl", color: "#FF5A5F" },
  "Uber": { url: "https://m.uber.com", color: "#000000" },
  "Bolt": { url: "https://bolt.eu/nl-nl/", color: "#34D186" },
  "Swapfiets": { url: "https://swapfiets.nl", color: "#003F7F" },
  "OV-fiets": { url: "https://www.ns.nl/deur-tot-deur/ov-fiets", color: "#003082" },
  "Felyx": { url: "https://www.felyx.com", color: "#00C9A7" },
  "CHECK": { url: "https://ridecheck.app", color: "#FF3366" },
  "TUI": { url: "https://www.tui.nl", color: "#D40E14" },
  "Corendon": { url: "https://www.corendon.nl", color: "#F37021" },
  "ANWB": { url: "https://www.anwb.nl", color: "#003C82" },
  "Metro Guangzhou": { url: "https://www.metroman.cn/en/maps/guangzhou", color: "#E60012" },
  "Railway 12306": { url: "https://www.12306.cn", color: "#1E50A2" },
  "Cabify": { url: "https://cabify.com", color: "#7C3AED" },
};

function LiveWebView({ label, onBack }: { label: string; onBack: () => void }) {
  const app = TRAVEL_APPS[label];
  const skipIframe = true;
  const appInfo = APP_INFO[label];
  const [phase, setPhase] = useState<"splash" | "content" | "blocked">("splash");
  const [key, setKey] = useState(0);

  if (!app) return null;

  const siteUrl = app.mobileUrl || app.url;
  const proxyUrl = `/api/proxy?url=${encodeURIComponent(siteUrl)}`;
  const domain = app.url.replace("https://", "").replace("www.", "").replace(/\/.*$/, "");

  useEffect(() => {
    const delay = skipIframe ? 800 : 2000;
    const timer = setTimeout(() => setPhase(skipIframe ? "blocked" : "content"), delay);
    return () => clearTimeout(timer);
  }, [skipIframe]);

  useEffect(() => {
    if (phase === "content") setPhase("content");
  }, [key]);

  const handleLoad = () => setPhase("content");
  const handleError = () => setPhase("blocked");
  const storeLinks = APP_STORE_LINKS[label];

  const openHref = (url: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  const openExternal = () => openHref(siteUrl);

  return (
    <div className="fixed inset-0 z-[1000] bg-background flex flex-col overflow-hidden" style={{ isolation: "isolate" }}>
      <header 
        className="px-3 py-2 flex items-center gap-2 border-b border-border/30 shadow-sm shrink-0" 
        style={{ backgroundColor: app.color, position: 'relative', zIndex: 50 }}
      >
        <Button variant="ghost" size="icon" onClick={onBack} className="-ml-1 h-8 w-8 text-white hover:bg-white/20">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0 flex items-center gap-2">
          {LOGOS[label] && <img src={LOGOS[label]} alt="" className="w-6 h-6 rounded shadow-sm" />}
          <div className="bg-white/20 rounded-lg px-3 py-1.5 flex items-center gap-2 flex-1 min-w-0">
            <Globe className="w-3 h-3 text-white/70 shrink-0" />
            <span className="text-xs text-white/90 truncate font-medium">{label}</span>
            {phase === "content" && !skipIframe && <div className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0 ml-auto animate-pulse" />}
          </div>
        </div>
        {!skipIframe && (
          <>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20" onClick={() => setKey(k => k + 1)}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20" onClick={openExternal}>
              <ExternalLink className="w-4 h-4" />
            </Button>
          </>
        )}
      </header>

      <div className="flex-1 relative bg-white overflow-hidden" style={{ zIndex: 1 }}>
        {phase === "splash" && (
          <div className="absolute inset-0 bg-background flex flex-col items-center pt-16 z-50">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative mb-6">
              {LOGOS[label] && <img src={LOGOS[label]} alt="" className="w-20 h-20 rounded-2xl shadow-xl relative z-10" />}
              <div className="absolute inset-0 bg-white/50 blur-xl rounded-full scale-110" />
            </motion.div>
            <div className="flex flex-col items-center gap-2 px-6 w-full max-w-[240px]">
              <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "95%" }}
                  transition={{ duration: skipIframe ? 0.7 : 1.8, ease: "easeOut" }}
                  className="h-full"
                  style={{ backgroundColor: app.color }}
                />
              </div>
              <p className="text-xs font-bold tracking-tight">{label} wordt geopend...</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest opacity-60">Veilige verbinding</p>
            </div>
          </div>
        )}

        {(phase === "blocked" || (skipIframe && phase !== "splash")) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full overflow-y-auto bg-background"
          >
            <div className="px-5 pt-8 pb-4 text-center" style={{ background: `linear-gradient(135deg, ${app.color}15, ${app.color}05)` }}>
              {LOGOS[label] && <img src={LOGOS[label]} alt="" className="w-20 h-20 rounded-2xl shadow-lg mx-auto mb-4" />}
              <h2 className="text-xl font-bold mb-1">{label}</h2>
              {appInfo && <p className="text-sm text-muted-foreground">{appInfo.description}</p>}
            </div>
            {appInfo && (
              <div className="px-5 py-4">
                <div className="bg-card rounded-2xl shadow-sm border border-border/40 overflow-hidden">
                  {appInfo.features.map((feature, i) => {
                    const FeatureIcon = feature.icon;
                    return (
                      <div key={i} className={`flex items-center gap-3 px-4 py-3.5 ${i < appInfo.features.length - 1 ? "border-b border-border/30" : ""}`}>
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
            )}
            {storeLinks ? (
              <div className="px-5 pb-3 flex flex-col gap-3">
                {storeLinks.apple && (
                  <a
                    href={storeLinks.apple}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 font-semibold text-[15px] shadow-lg active:scale-[0.98] transition-transform no-underline text-white"
                    style={{ backgroundColor: "#000000" }}
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.14-2.15 1.26-2.13 3.76.03 2.98 2.61 3.98 2.64 3.99l-.06.17zm-7.18-14.3c.73-.88 1.94-1.55 2.95-1.59.12 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.14-1.14.4-2.32 1.04-3.02z"/></svg>
                    Download in App Store
                  </a>
                )}
                {storeLinks.play && (
                  <a
                    href={storeLinks.play}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 font-semibold text-[15px] shadow-lg active:scale-[0.98] transition-transform no-underline text-white"
                    style={{ backgroundColor: "#01875F" }}
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg"><path d="M3.18 23.76c.3.17.65.2.98.08L14.84 12 9.94 7.1zm15.16-10.44-2.89-1.68-3.26 3.26 3.26 3.26 2.92-1.7A1.65 1.65 0 0 0 18.34 13.32zm-15.9-9.06a1.67 1.67 0 0 0-.26.89v17.7c0 .32.09.62.26.89L12.48 12zm9.36 8.9L4.16.3c-.33-.12-.68-.09-.98.08L14.84 12z"/></svg>
                    Download in Play Store
                  </a>
                )}
              </div>
            ) : (
              <div className="px-5 pb-3">
                <Button
                  className="w-full h-14 rounded-2xl text-white font-semibold text-[15px] shadow-lg active:scale-[0.98] transition-transform"
                  style={{ backgroundColor: app.color }}
                  onClick={openExternal}
                >
                  Open {label}
                  <Globe className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
            <div className="px-5 pb-3">
              <Button
                variant="outline"
                className="w-full h-12 rounded-2xl font-semibold text-[14px] border-2 active:scale-[0.98] transition-transform"
                onClick={onBack}
              >
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
          </motion.div>
        )}

        {!skipIframe && phase === "content" && (
          <iframe
            key={key}
            src={proxyUrl}
            className="w-full h-full border-0"
            onLoad={handleLoad}
            onError={handleError}
            title={label}
          />
        )}
      </div>
    </div>
  );
}

const EU_BLUE = "#003399";
const EU_YELLOW = "#FFCC00";
const BOOKING_BLUE = "#003580";

function EuStars({ size = 32, spinning = false }: { size?: number; spinning?: boolean }) {
  return (
    <motion.svg viewBox="0 0 100 100" width={size} height={size}
      animate={spinning ? { rotate: 360 } : {}}
      transition={spinning ? { repeat: Infinity, duration: 6, ease: "linear" } : {}}
    >
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i * 30 - 90) * (Math.PI / 180);
        const x = 50 + 38 * Math.cos(angle);
        const y = 50 + 38 * Math.sin(angle);
        return <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="14" fill={EU_YELLOW}>★</text>;
      })}
    </motion.svg>
  );
}

type BookingPhase = "eudi_consent" | "eudi_biometric" | "logged_in";

const isInIframe = typeof window !== "undefined" && window !== window.top;

function BookingEudiFlow({ onBack }: { onBack: () => void }) {
  const { data: user } = useQuery<any>({ queryKey: ["/api/me"] });
  const [phase, setPhase] = useState<BookingPhase>("eudi_consent");
  const [shareEmail, setShareEmail] = useState(true);
  const [webAuthnAvailable, setWebAuthnAvailable] = useState<boolean | null>(null);
  const [biometricScanning, setBiometricScanning] = useState(false);
  const [biometricSuccess, setBiometricSuccess] = useState(false);
  const [biometricError, setBiometricError] = useState<string | null>(null);

  const firstName = user?.name?.split(" ")[0] || "Reiziger";

  useEffect(() => {
    if (isInIframe) { setWebAuthnAvailable(false); return; }
    if (typeof window !== "undefined" && window.PublicKeyCredential) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(setWebAuthnAvailable).catch(() => setWebAuthnAvailable(false));
    } else { setWebAuthnAvailable(false); }
  }, []);

  const triggerWebAuthn = async (): Promise<"success" | "cancelled" | "unavailable"> => {
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const storedCredId = localStorage.getItem("wespr_biometric_cred_id");
      if (storedCredId) {
        const credBytes = Uint8Array.from(atob(storedCredId), c => c.charCodeAt(0));
        const assertion = await navigator.credentials.get({
          publicKey: { challenge, rpId: window.location.hostname, allowCredentials: [{ type: "public-key", id: credBytes, transports: ["internal"] as AuthenticatorTransport[] }], userVerification: "required", timeout: 60000 },
        });
        return assertion ? "success" : "cancelled";
      } else {
        const credential = await navigator.credentials.create({
          publicKey: { challenge, rp: { name: "W€spr", id: window.location.hostname }, user: { id: new Uint8Array([1, 2, 3]), name: user?.email || "user@wespr.eu", displayName: firstName }, pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }], authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" }, timeout: 60000 },
        });
        if (credential) {
          localStorage.setItem("wespr_biometric_cred_id", btoa(String.fromCharCode(...new Uint8Array((credential as any).rawId))));
          return "success";
        }
        return "cancelled";
      }
    } catch (e: any) {
      if (e?.name === "NotAllowedError" || e?.name === "AbortError") return "cancelled";
      return "unavailable";
    }
  };

  const BOOKING_LOGIN_URL = "https://account.booking.com/sign-in";

  if (phase === "eudi_consent") {
    const dataItems = [
      { label: "Volledige naam", value: user?.name || "—", always: true },
      { label: "Geboortedatum", value: "••/••/••••", always: true },
      { label: "Nationaliteit", value: "Nederlands", always: true },
      { label: "E-mailadres", value: user?.email || "—", always: false, state: shareEmail, toggle: () => setShareEmail(s => !s) },
    ];
    return (
      <div className="fixed inset-0 z-[1000] flex flex-col overflow-hidden" style={{ background: `linear-gradient(180deg, ${EU_BLUE} 0%, #001A6E 100%)` }}>
        <div className="px-5 pt-12 pb-6 flex flex-col items-center text-center">
          <EuStars size={56} />
          <h1 className="text-white font-bold text-xl mt-2">EUDI Wallet</h1>
          <p className="text-white/60 text-xs mt-1">European Digital Identity · eIDAS 2.0</p>
        </div>

        <div className="flex-1 bg-white rounded-t-3xl overflow-y-auto">
          <div className="px-5 pt-6 pb-4">
            <div className="flex items-center gap-3 mb-5">
              <img src="/images/booking-logo.svg" alt="" className="w-10 h-10 rounded-xl shadow" />
              <div>
                <p className="font-bold text-gray-900">Booking.com</p>
                <p className="text-xs text-gray-500">vraagt toegang tot je identiteit</p>
              </div>
            </div>

            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Gevraagde gegevens</p>
            <div className="space-y-2 mb-6">
              {dataItems.map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: item.always || item.state ? `${EU_BLUE}15` : "#f3f4f6" }}>
                    <Check className="w-4 h-4" style={{ color: item.always || item.state ? EU_BLUE : "#9ca3af" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900">{item.label}</p>
                    <p className="text-[11px] text-gray-400 truncate">{item.value}</p>
                  </div>
                  {!item.always && item.toggle && (
                    <button onClick={item.toggle}
                      className="w-10 h-6 rounded-full transition-colors shrink-0"
                      style={{ backgroundColor: item.state ? EU_BLUE : "#d1d5db" }}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${item.state ? "translate-x-4" : ""}`} />
                    </button>
                  )}
                  {item.always && <span className="text-[10px] text-gray-400 shrink-0">Vereist</span>}
                </div>
              ))}
            </div>

            <div className="bg-blue-50 rounded-xl px-4 py-3 mb-6 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" style={{ color: EU_BLUE }} />
              <p className="text-[11px] text-blue-700">Je gegevens worden alleen gedeeld voor inloggen. Booking.com mag ze niet doorverkopen conform eIDAS 2.0.</p>
            </div>

            <Button
              className="w-full h-13 rounded-2xl font-bold text-[15px] gap-2 border-0"
              style={{ background: `linear-gradient(135deg, ${EU_BLUE}, #0044BB)`, color: "white" }}
              onClick={() => setPhase("eudi_biometric")}
              data-testid="btn-eudi-consent-akkoord"
            >
              <Fingerprint className="w-4 h-4" />
              Bevestigen
            </Button>
            <Button variant="ghost" className="w-full mt-2 text-gray-400 text-sm" onClick={onBack}>
              Liever inloggen met wachtwoord
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "eudi_biometric") {
    return (
      <div className="fixed inset-0 z-[1000] flex flex-col overflow-hidden"
        style={{ background: `linear-gradient(180deg, ${EU_BLUE} 0%, #001A6E 100%)` }}>
        <div className="bg-[#001A6E] px-5 pt-12 pb-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <EuStars size={22} />
              <p className="text-[#FFCC00] text-[11px] font-bold tracking-widest uppercase">EU Digital Identity</p>
            </div>
            <span className="text-white/30 text-[10px] bg-white/5 px-2 py-0.5 rounded-full">PID · NL</span>
          </div>
          <p className="text-white/70 text-[13px]">Bevestig je identiteit voor <span className="text-white font-semibold">Booking.com</span></p>
        </div>

        <div className="flex-1 bg-white rounded-t-3xl flex flex-col items-center px-6 pt-8 pb-6">
          <p className="text-gray-500 text-sm mb-6 text-center">Gebruik biometrie om je EUDI Wallet te ontgrendelen</p>

          <button
            onClick={async () => {
              if (biometricScanning || biometricSuccess) return;
              setBiometricError(null);
              setBiometricScanning(true);
              const result = await triggerWebAuthn();
              if (result === "success") {
                setBiometricSuccess(true);
                setTimeout(() => setPhase("logged_in"), 500);
              } else {
                setBiometricScanning(false);
                if (result === "cancelled") setBiometricError("Geannuleerd. Probeer opnieuw.");
                else setBiometricError("Biometrie niet beschikbaar op dit apparaat.");
              }
            }}
            className="relative w-32 h-32 rounded-full focus:outline-none mb-3"
            data-testid="btn-biometric-booking"
            disabled={biometricScanning}
          >
            <motion.div
              className={`w-32 h-32 rounded-full border-4 flex items-center justify-center transition-colors duration-500
                ${biometricSuccess ? "border-green-400 bg-green-50"
                : biometricScanning ? "border-[#003399] bg-[#003399]/10"
                : webAuthnAvailable === false ? "border-gray-100 bg-gray-50 opacity-60"
                : "border-gray-200 bg-gray-50 hover:border-[#003399]/50 hover:bg-[#003399]/5"}`}
              animate={biometricScanning && !biometricSuccess ? { boxShadow: ["0 0 0 0px rgba(0,51,153,0.3)", "0 0 0 20px rgba(0,51,153,0)"] } : {}}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              <Fingerprint className={`w-16 h-16 transition-colors duration-500
                ${biometricSuccess ? "text-green-500"
                : biometricScanning ? "text-[#003399]"
                : webAuthnAvailable === false ? "text-gray-300"
                : "text-gray-400"}`} />
            </motion.div>
          </button>

          <p className="font-semibold text-gray-800 text-sm mb-1">
            {biometricSuccess ? "Identiteit bevestigd ✓"
             : biometricScanning ? "Wacht op apparaat..."
             : "Touch ID · Face ID · Vingerafdruk"}
          </p>

          {webAuthnAvailable === true && !biometricScanning && !biometricSuccess && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 uppercase tracking-wide mb-1">Echte biometrie beschikbaar</span>
          )}
          {biometricError && (
            <p className="text-xs text-red-500 text-center mt-1 mb-2">{biometricError}</p>
          )}
          {isInIframe && !biometricSuccess && (
            <p className="text-[10px] text-amber-600 bg-amber-50 rounded-lg px-3 py-2 text-center mt-2 max-w-[240px]">
              In demo-modus: biometrie vereist een echt apparaat buiten de preview
            </p>
          )}

          <div className="flex-1" />

          <button onClick={() => setPhase("eudi_consent")} className="text-xs text-gray-400 mt-4">
            Terug
          </button>
        </div>
      </div>
    );
  }

  if (phase === "logged_in") {
    return (
      <div className="fixed inset-0 z-[1000] bg-white flex flex-col overflow-hidden">
        <header className="px-4 py-3 flex items-center gap-2 shrink-0" style={{ backgroundColor: BOOKING_BLUE }}>
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 text-white hover:bg-white/20 -ml-1">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <img src="/images/booking-logo.svg" alt="" className="w-6 h-6 rounded" />
          <span className="text-white font-bold text-sm flex-1">Booking.com</span>
          <div className="flex items-center gap-1 bg-white/15 rounded-full px-2 py-0.5">
            <EuStars size={14} />
            <span className="text-white text-[10px] font-bold">EUDI</span>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-xl border-2 bg-white" style={{ borderColor: `${BOOKING_BLUE}30` }}>
              <img src="/images/booking-logo.svg" alt="Booking.com" className="w-16 h-16 rounded-2xl object-contain" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center border-2 border-white">
              <Check className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Verbonden met Booking.com</h2>
            <p className="text-sm text-gray-500 leading-snug">Uw identiteit is geverifieerd via W€spr EUDI Wallet.<br />Tik hieronder om in te loggen bij Mijn Booking.</p>
          </div>

          <a
            href={BOOKING_LOGIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full rounded-2xl py-4 px-5 flex items-center gap-4 shadow-md active:scale-[0.98] transition-all no-underline"
            style={{ backgroundColor: BOOKING_BLUE }}
            data-testid="btn-booking-open-login"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-white font-bold text-[15px]">Mijn Booking openen</p>
              <p className="text-white/70 text-[12px]">account.booking.com/sign-in</p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/60" />
          </a>

          <div className="w-full bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" style={{ color: EU_BLUE }} />
            <div>
              <p className="text-[13px] font-semibold" style={{ color: EU_BLUE }}>Ingelogd via W€spr EUDI Wallet</p>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">Uw geverifieerde identiteit is gedeeld met Booking.com via eIDAS 2.0 · OpenID4VP.</p>
            </div>
          </div>

          <button onClick={onBack} className="text-sm text-gray-400 underline underline-offset-2" data-testid="btn-booking-back">
            Terug naar W€spr
          </button>
        </div>
      </div>
    );
  }

  return null;
}

const TRAVEL_APP_LABELS = Object.keys(TRAVEL_APPS);
export const isTravelApp = (label: string) => TRAVEL_APP_LABELS.includes(label);
export function TravelAppView({ label, onBack }: { label: string; onBack: () => void }) {
  if (label === "Booking.com") return <BookingEudiFlow onBack={onBack} />;
  return <LiveWebView label={label} onBack={onBack} />;
}