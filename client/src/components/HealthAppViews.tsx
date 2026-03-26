import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Globe, HeartPulse, Stethoscope, Pill, ShieldCheck, FileText, Users, Search, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";

const HEALTH_APPS: Record<string, { url: string; color: string }> = {
  "MijnZorgApp":       { url: "https://www.mijngezondheid.net",                                    color: "#00A79D" },
  "VAXY":              { url: "https://www.rivm.nl/covid-19-vaccinatie",                           color: "#4A90D9" },
  "Huisarts":          { url: "https://www.zorgkaartnederland.nl/huisarts",                        color: "#E4003A" },
  "Apotheek":          { url: "https://www.apotheek.nl",                                           color: "#00843D" },
  "Zorgverzekeraar":   { url: "https://www.zorgwijzer.nl/zorgvergelijker/zorgverzekering",         color: "#0055A5" },
  "Doctolib Connect":  { url: "https://www.doctolib.fr",                                           color: "#3B5BDB" },
  "BeterDichtbij":     { url: "https://www.beterdichtbij.nl",                                      color: "#005EB8" },
  "Thuisarts":         { url: "https://www.thuisarts.nl",                                          color: "#F37021" },
  "Medgemak":          { url: "https://home.mijngezondheid.net/nl/inloggen",                       color: "#27AE60" },
  "AboutHerbs":        { url: "https://www.aboutherbs.com",                                        color: "#2D6A4F" },
  "Richtlijnen":       { url: "https://richtlijnendatabase.nl",                                    color: "#3F51B5" },
  "PatientsLikeMe":    { url: "https://www.patientslikeme.com",                                    color: "#008B8B" },
  "ZorgKlik":          { url: "https://www.zorgkaartnederland.nl",                                 color: "#E4003A" },
};

const APP_INFO: Record<string, { description: string; features: { icon: any; label: string }[] }> = {
  "MijnZorgApp": {
    description: "Jouw persoonlijk gezondheidsdossier — medicijnen, afspraken en uitslagen op één plek",
    features: [
      { icon: FileText, label: "Medisch dossier inzien" },
      { icon: HeartPulse, label: "Uitslagen & metingen" },
      { icon: Pill, label: "Medicatieoverzicht" },
    ],
  },
  "VAXY": {
    description: "Jouw vaccinatieoverzicht — RIVM-informatie over COVID-19 en andere vaccinaties",
    features: [
      { icon: ShieldCheck, label: "Vaccinatiestatus bekijken" },
      { icon: HeartPulse, label: "COVID-19 & griep info" },
      { icon: Globe, label: "RIVM-richtlijnen & adviezen" },
    ],
  },
  "Huisarts": {
    description: "Vind en beoordeel huisartsen bij jou in de buurt via Zorgkaart Nederland",
    features: [
      { icon: Search, label: "Huisarts zoeken op postcode" },
      { icon: Stethoscope, label: "Beoordelingen & ervaringen" },
      { icon: Globe, label: "Contactgegevens & openingstijden" },
    ],
  },
  "Apotheek": {
    description: "Betrouwbare medicatie-informatie en je eigen apotheek — alles over jouw medicijnen",
    features: [
      { icon: Pill, label: "Medicijninformatie opzoeken" },
      { icon: ShieldCheck, label: "Bijwerkingen & interacties" },
      { icon: Globe, label: "Apotheek zoeken in de buurt" },
    ],
  },
  "Zorgverzekeraar": {
    description: "Vergelijk zorgverzekeringen en vind de beste dekking voor jouw situatie",
    features: [
      { icon: ShieldCheck, label: "Verzekeringen vergelijken" },
      { icon: Globe, label: "Eigen risico & premies" },
      { icon: HeartPulse, label: "Vergoedingen & polissen" },
    ],
  },
  "Doctolib Connect": {
    description: "Boek direct een afspraak bij jouw huisarts, specialist of psycholoog via Doctolib",
    features: [
      { icon: Stethoscope, label: "Afspraken online boeken" },
      { icon: HeartPulse, label: "Videoafspraken beschikbaar" },
      { icon: Globe, label: "Herinneringen & bevestigingen" },
    ],
  },
  "BeterDichtbij": {
    description: "Veilig berichten sturen met je zorgverlener — huisarts, ziekenhuis of specialist",
    features: [
      { icon: Stethoscope, label: "Berichten aan je arts" },
      { icon: FileText, label: "Uitslagen & brieven ontvangen" },
      { icon: ShieldCheck, label: "Beveiligd & privacyvriendelijk" },
    ],
  },
  "Thuisarts": {
    description: "Betrouwbare medische informatie van huisartsen — wanneer ga je naar de dokter?",
    features: [
      { icon: Stethoscope, label: "Klachten opzoeken" },
      { icon: HeartPulse, label: "Zelfzorgadviezen" },
      { icon: Globe, label: "Wanneer naar de huisarts?" },
    ],
  },
  "Medgemak": {
    description: "Jouw medicijngebruik eenvoudig bijhouden — herinneringen, inname en herhaalrecepten",
    features: [
      { icon: Pill, label: "Medicijnreminders instellen" },
      { icon: ShieldCheck, label: "Inname bijhouden" },
      { icon: Globe, label: "Herhaalrecept aanvragen" },
    ],
  },
  "AboutHerbs": {
    description: "Wetenschappelijke informatie over kruiden, supplementen en natuurlijke middelen",
    features: [
      { icon: HeartPulse, label: "Kruiden & supplementen info" },
      { icon: ShieldCheck, label: "Interacties & veiligheid" },
      { icon: Globe, label: "Evidence-based informatie" },
    ],
  },
  "Richtlijnen": {
    description: "Officiële NHG-richtlijnen voor huisartsen — medische standaarden en protocollen",
    features: [
      { icon: FileText, label: "NHG-standaarden inzien" },
      { icon: Stethoscope, label: "Diagnostiek & behandeling" },
      { icon: Globe, label: "Up-to-date medische richtlijnen" },
    ],
  },
  "PatientsLikeMe": {
    description: "Deel ervaringen met lotgenoten — patiëntencommunity voor chronische aandoeningen",
    features: [
      { icon: Users, label: "Lotgenoten vinden" },
      { icon: HeartPulse, label: "Ervaringen & behandelingen" },
      { icon: Globe, label: "Symptomen & bijwerkingen delen" },
    ],
  },
  "ZorgKlik": {
    description: "Vind en beoordeel zorgverleners bij jou in de buurt via Zorgkaart Nederland",
    features: [
      { icon: Search, label: "Zorgverleners zoeken" },
      { icon: HeartPulse, label: "Ervaringen & beoordelingen" },
      { icon: Globe, label: "Specialisten & klinieken" },
    ],
  },
};

const LOGOS: Record<string, string> = {
  "MijnZorgApp":      "/images/mijnzorgapp-logo.svg",
  "VAXY":             "/images/vaxy-logo.svg",
  "Doctolib Connect": "/images/doctolib-logo.svg",
  "BeterDichtbij":    "/images/beterdichtbij-logo.svg",
  "Thuisarts":        "/images/thuisarts-logo.svg",
  "Medgemak":         "/images/medgemak-logo.svg",
  "AboutHerbs":       "/images/aboutherbs-logo.svg",
  "Richtlijnen":      "/images/richtlijnen-logo.svg",
  "PatientsLikeMe":   "/images/patientslikeme-logo.svg",
};

const HEALTH_APP_LABELS = Object.keys(HEALTH_APPS);
export function isHealthApp(label: string): boolean {
  return HEALTH_APP_LABELS.includes(label);
}

export function HealthAppView({ label, onBack }: { label: string; onBack: () => void }) {
  const app = HEALTH_APPS[label];
  const info = APP_INFO[label];
  const logo = LOGOS[label];
  const [phase, setPhase] = useState<"splash" | "card">("splash");

  useEffect(() => {
    const t = setTimeout(() => setPhase("card"), 600);
    return () => clearTimeout(t);
  }, []);

  if (!app) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 flex items-center gap-3 border-b border-border/40" style={{ background: app.color }}>
        <button onClick={onBack} className="text-white/80 hover:text-white p-1 -ml-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        {logo
          ? <img src={logo} alt="" className="w-6 h-6 rounded object-contain bg-white/10" />
          : <HeartPulse className="w-5 h-5 text-white/80" />
        }
        <span className="text-white font-semibold text-sm">{label}</span>
      </div>

      <AnimatePresence mode="wait">
        {phase === "splash" && (
          <motion.div
            key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-5"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="relative flex items-center justify-center w-24 h-24"
            >
              {logo
                ? <img src={logo} alt="" className="w-20 h-20 rounded-2xl shadow-xl relative z-10" />
                : <div className="w-20 h-20 rounded-2xl shadow-xl flex items-center justify-center relative z-10" style={{ background: app.color }}>
                    <HeartPulse className="w-10 h-10 text-white" />
                  </div>
              }
              <div className="absolute inset-0 bg-white/50 blur-xl rounded-full scale-110" />
            </motion.div>
            <div className="flex flex-col items-center gap-2 px-6 w-full max-w-[240px]">
              <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "90%" }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: app.color }}
                />
              </div>
              <p className="text-xs font-bold tracking-tight">{label} wordt geopend...</p>
            </div>
          </motion.div>
        )}

        {phase === "card" && (
          <motion.div
            key="card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="flex-1 flex flex-col items-center justify-center gap-6 px-6 text-center overflow-y-auto py-8"
          >
            {/* Logo */}
            {logo
              ? <img src={logo} alt="" className="w-20 h-20 rounded-2xl shadow-lg mx-auto" />
              : <div className="w-20 h-20 rounded-2xl shadow-lg flex items-center justify-center mx-auto" style={{ background: app.color }}>
                  <HeartPulse className="w-10 h-10 text-white" />
                </div>
            }

            {/* Titel & beschrijving */}
            <div className="space-y-2 max-w-xs">
              <h2 className="text-xl font-bold text-foreground">{label}</h2>
              {info && <p className="text-sm text-muted-foreground leading-relaxed">{info.description}</p>}
            </div>

            {/* Kenmerken */}
            {info && (
              <div className="w-full max-w-xs space-y-2.5">
                {info.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 bg-muted/50 rounded-xl px-4 py-3 text-left">
                    <f.icon className="w-4 h-4 shrink-0" style={{ color: app.color }} />
                    <span className="text-sm font-medium text-foreground">{f.label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Open knop */}
            <div className="w-full max-w-xs space-y-3 pt-2">
              <a
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-white font-semibold text-sm shadow-lg active:scale-[0.98] transition-transform"
                style={{ background: app.color }}
                data-testid={`btn-open-${label.toLowerCase().replace(/\s/g, "-")}`}
              >
                <ExternalLink className="w-4 h-4" />
                Open {label}
              </a>
              <Button
                variant="ghost"
                className="w-full text-muted-foreground text-sm"
                onClick={onBack}
                data-testid={`btn-back-${label.toLowerCase().replace(/\s/g, "-")}`}
              >
                Terug naar W€spr
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
