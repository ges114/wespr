import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, Eye, Lock, Fingerprint, Bell, BellOff, MessageCircle, Users, Globe, Moon, Sun, Palette, Languages, HelpCircle, Mail, FileText, ChevronRight, Check, ToggleLeft, ToggleRight, Phone, Smartphone, Wifi, Database, Download, Trash2, LogOut, Info, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";

function ScreenWrapper({ title, onBack, children }: { title: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex flex-col h-full bg-muted/20">
      <header className="px-4 py-4 flex items-center gap-3 bg-background/80 backdrop-blur-xl sticky top-0 z-50 border-b border-border/50">
        <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
      </header>
      <div className="flex-1 overflow-y-auto hide-scrollbar pb-8">{children}</div>
    </motion.div>
  );
}

function ToggleRow({ icon: Icon, label, defaultOn = false, color = "text-primary" }: { icon: any; label: string; defaultOn?: boolean; color?: string }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center gap-4 px-4 py-3 bg-card cursor-pointer" onClick={() => setOn(!on)}>
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${color} bg-muted`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="flex-1 font-medium text-[15px]">{label}</span>
      {on ? <ToggleRight className="w-6 h-6 text-primary" /> : <ToggleLeft className="w-6 h-6 text-muted-foreground" />}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, color = "text-primary", border = true }: { icon: any; label: string; value: string; color?: string; border?: boolean }) {
  return (
    <div className={`flex items-center gap-4 px-4 py-3 bg-card ${border ? 'border-b border-border/30' : ''}`}>
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${color} bg-muted`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="flex-1 font-medium text-[15px]">{label}</span>
      <span className="text-sm text-muted-foreground">{value}</span>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </div>
  );
}

export function PrivacyScreen({ onBack }: { onBack: () => void }) {
  return (
    <ScreenWrapper title="Privacy & Security" onBack={onBack}>
      <div className="mt-2 bg-card shadow-sm">
        <div className="px-4 py-3 border-b border-border/30">
          <h3 className="text-xs font-bold text-muted-foreground">ACCOUNT BEVEILIGING</h3>
        </div>
        <ToggleRow icon={Fingerprint} label="Biometrische vergrendeling" defaultOn={true} />
        <ToggleRow icon={Lock} label="Twee-factor authenticatie" defaultOn={true} />
        <InfoRow icon={Smartphone} label="Ingelogde apparaten" value="2 actief" border={false} />
      </div>

      <div className="mt-2 bg-card shadow-sm">
        <div className="px-4 py-3 border-b border-border/30">
          <h3 className="text-xs font-bold text-muted-foreground">PRIVACY</h3>
        </div>
        <ToggleRow icon={Eye} label="Leesbevestigingen tonen" defaultOn={true} />
        <ToggleRow icon={Globe} label="Online status tonen" defaultOn={false} />
        <ToggleRow icon={Phone} label="Telefoonnummer verbergen" defaultOn={true} />
      </div>

      <div className="mt-2 bg-card shadow-sm">
        <div className="px-4 py-3 border-b border-border/30">
          <h3 className="text-xs font-bold text-muted-foreground">GEGEVENSBESCHERMING (AVG/GDPR)</h3>
        </div>
        <InfoRow icon={Database} label="Mijn gegevens downloaden" value="" />
        <InfoRow icon={Shield} label="Privacybeleid" value="" />
        <InfoRow icon={FileText} label="Gebruikersvoorwaarden" value="" border={false} />
      </div>

      <div className="mt-2 bg-card shadow-sm">
        <InfoRow icon={Trash2} label="Account verwijderen" value="" color="text-destructive" border={false} />
      </div>

      <div className="px-4 py-4">
        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          W€spr voldoet aan de Europese privacywetgeving (AVG/GDPR). Jouw gegevens worden versleuteld opgeslagen en nooit gedeeld met derden zonder jouw toestemming.
        </p>
      </div>
    </ScreenWrapper>
  );
}

export function NotificationsScreen({ onBack }: { onBack: () => void }) {
  return (
    <ScreenWrapper title="Meldingen" onBack={onBack}>
      <div className="mt-2 bg-card shadow-sm">
        <div className="px-4 py-3 border-b border-border/30">
          <h3 className="text-xs font-bold text-muted-foreground">BERICHTEN</h3>
        </div>
        <ToggleRow icon={MessageCircle} label="Chatmeldingen" defaultOn={true} />
        <ToggleRow icon={Users} label="Groepsmeldingen" defaultOn={true} />
        <ToggleRow icon={Bell} label="Geluid" defaultOn={true} color="text-amber-500" />
        <ToggleRow icon={Smartphone} label="Trillen" defaultOn={false} color="text-amber-500" />
      </div>

      <div className="mt-2 bg-card shadow-sm">
        <div className="px-4 py-3 border-b border-border/30">
          <h3 className="text-xs font-bold text-muted-foreground">SOCIAL</h3>
        </div>
        <ToggleRow icon={Bell} label="Likes op posts" defaultOn={true} color="text-rose-500" />
        <ToggleRow icon={MessageCircle} label="Reacties op posts" defaultOn={true} color="text-rose-500" />
      </div>

      <div className="mt-2 bg-card shadow-sm">
        <div className="px-4 py-3 border-b border-border/30">
          <h3 className="text-xs font-bold text-muted-foreground">OVERIG</h3>
        </div>
        <ToggleRow icon={Bell} label="W€spr Pay transacties" defaultOn={true} color="text-emerald-500" />
        <ToggleRow icon={BellOff} label="Marketingupdates" defaultOn={false} color="text-slate-500" />
      </div>

      <div className="mt-2 bg-card shadow-sm">
        <div className="px-4 py-3 border-b border-border/30">
          <h3 className="text-xs font-bold text-muted-foreground">NIET STOREN</h3>
        </div>
        <ToggleRow icon={Moon} label="Niet storen modus" defaultOn={false} color="text-indigo-500" />
        <InfoRow icon={Moon} label="Schema" value="22:00 - 07:00" color="text-indigo-500" border={false} />
      </div>
    </ScreenWrapper>
  );
}

export function SettingsScreen({ onBack, onLogout }: { onBack: () => void; onLogout?: () => void }) {
  const [theme, setTheme] = useState("light");
  const [language, setLanguage] = useState("nl");
  const [langOpen, setLangOpen] = useState(false);
  const languages = [
    { id: "nl", label: "Nederlands", flag: "🇳🇱" },
    { id: "en", label: "English", flag: "🇬🇧" },
    { id: "de", label: "Deutsch", flag: "🇩🇪" },
    { id: "fr", label: "Français", flag: "🇫🇷" },
    { id: "es", label: "Español", flag: "🇪🇸" },
    { id: "it", label: "Italiano", flag: "🇮🇹" },
  ];
  const currentLang = languages.find(l => l.id === language) || languages[0];

  return (
    <ScreenWrapper title="Instellingen" onBack={onBack}>
      <div className="mt-2 bg-card shadow-sm">
        <div className="px-4 py-3 border-b border-border/30">
          <h3 className="text-xs font-bold text-muted-foreground">WEERGAVE</h3>
        </div>
        <div className="px-4 py-3 bg-card">
          <span className="font-medium text-[15px] mb-3 block">Thema</span>
          <div className="flex gap-3">
            {[
              { id: "light", icon: Sun, label: "Licht" },
              { id: "dark", icon: Moon, label: "Donker" },
              { id: "system", icon: Smartphone, label: "Systeem" },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`flex-1 flex flex-col items-center gap-2 py-3 rounded-xl border transition-colors ${
                  theme === t.id ? 'border-primary bg-primary/5' : 'border-border/50 hover:bg-muted/50'
                }`}
              >
                <t.icon className={`w-5 h-5 ${theme === t.id ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-xs font-medium ${theme === t.id ? 'text-primary' : 'text-muted-foreground'}`}>{t.label}</span>
                {theme === t.id && <Check className="w-3.5 h-3.5 text-primary" />}
              </button>
            ))}
          </div>
        </div>
        <InfoRow icon={Palette} label="Accentkleur" value="Teal" />
        <button
          onClick={() => setLangOpen(!langOpen)}
          className="w-full flex items-center gap-4 px-4 py-3 bg-card text-left"
          data-testid="lang-toggle"
        >
          <div className="h-8 w-8 rounded-lg flex items-center justify-center text-primary bg-muted">
            <Languages className="w-5 h-5" />
          </div>
          <span className="flex-1 font-medium text-[15px]">Taal</span>
          <span className="text-sm text-muted-foreground mr-1">{currentLang.flag} {currentLang.label}</span>
          <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${langOpen ? 'rotate-90' : ''}`} />
        </button>
        <motion.div
          initial={false}
          animate={{ height: langOpen ? "auto" : 0, opacity: langOpen ? 1 : 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="overflow-hidden bg-card"
        >
          <div className="px-4 pb-3 space-y-1">
            {languages.map(lang => (
              <button
                key={lang.id}
                onClick={() => { setLanguage(lang.id); setLangOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                  language === lang.id ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/50'
                }`}
                data-testid={`lang-${lang.id}`}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className={`flex-1 text-sm text-left ${language === lang.id ? 'font-semibold text-primary' : 'text-foreground'}`}>{lang.label}</span>
                {language === lang.id && <Check className="w-4 h-4 text-primary" />}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="mt-2 bg-card shadow-sm">
        <div className="px-4 py-3 border-b border-border/30">
          <h3 className="text-xs font-bold text-muted-foreground">OPSLAG & DATA</h3>
        </div>
        <InfoRow icon={Database} label="Opslagruimte" value="1.2 GB" />
        <InfoRow icon={Wifi} label="Data besparen" value="Uit" />
        <InfoRow icon={Download} label="Automatisch downloaden" value="Wi-Fi" border={false} />
      </div>

      <div className="mt-2 bg-card shadow-sm">
        <div className="px-4 py-3 border-b border-border/30">
          <h3 className="text-xs font-bold text-muted-foreground">ACCOUNT</h3>
        </div>
        <InfoRow icon={Smartphone} label="Gekoppelde apparaten" value="2" />
        <InfoRow icon={Info} label="App versie" value="2.1.0" border={false} />
      </div>

      <div className="mt-2 bg-card shadow-sm">
        <div
          className="flex items-center gap-4 px-4 py-3 bg-card cursor-pointer hover:bg-muted/50"
          onClick={() => {
            import("@/lib/api").then(({ setSessionToken }) => setSessionToken(null));
            fetch("/api/auth/logout", { method: "POST" }).finally(() => {
              if (onLogout) onLogout();
            });
          }}
          data-testid="button-logout"
        >
          <div className="h-8 w-8 rounded-lg flex items-center justify-center text-destructive bg-muted">
            <LogOut className="w-5 h-5" />
          </div>
          <span className="flex-1 font-medium text-[15px] text-destructive">Uitloggen</span>
        </div>
      </div>
    </ScreenWrapper>
  );
}

export function HelpScreen({ onBack }: { onBack: () => void }) {
  const faqs = [
    { q: "Hoe verander ik mijn W€spr ID?", a: "Ga naar je profiel > tik op je naam > wijzig je W€spr ID. Je kunt dit eenmaal per 30 dagen doen." },
    { q: "Hoe stuur ik geld via W€spr Pay?", a: "Open W€spr Pay > tik op 'Overmaken' > selecteer een contact of scan een QR-code > voer het bedrag in." },
    { q: "Is mijn data veilig?", a: "Ja, alle berichten zijn end-to-end versleuteld. W€spr voldoet volledig aan de Europese AVG/GDPR wetgeving." },
    { q: "Hoe voeg ik een contact toe?", a: "Tik op de '+' knop > 'Vriend toevoegen' > zoek op W€spr ID of scan een QR-code." },
    { q: "Hoe werkt de QR-scanner?", a: "De scanner kan betaalcodes, contactcodes en service-QR-codes herkennen. Open hem via het '+' menu." },
  ];
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <ScreenWrapper title="Help & Feedback" onBack={onBack}>
      <div className="mt-2 bg-card shadow-sm">
        <div className="px-4 py-3 border-b border-border/30">
          <h3 className="text-xs font-bold text-muted-foreground">VEELGESTELDE VRAGEN</h3>
        </div>
        {faqs.map((faq, i) => (
          <div key={i} className="border-b border-border/30 last:border-0">
            <div
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50"
            >
              <HelpCircle className="w-5 h-5 text-primary shrink-0" />
              <span className="flex-1 font-medium text-[14px]">{faq.q}</span>
              <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${openFaq === i ? 'rotate-90' : ''}`} />
            </div>
            {openFaq === i && (
              <div className="px-4 pb-3 pl-12">
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-2 bg-card shadow-sm">
        <div className="px-4 py-3 border-b border-border/30">
          <h3 className="text-xs font-bold text-muted-foreground">CONTACT</h3>
        </div>
        <div className="flex items-center gap-4 px-4 py-3 bg-card border-b border-border/30 cursor-pointer hover:bg-muted/50">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center text-primary bg-muted">
            <Mail className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <span className="font-medium text-[15px] block">E-mail support</span>
            <span className="text-xs text-muted-foreground">support@w€spr.eu</span>
          </div>
        </div>
        <div className="flex items-center gap-4 px-4 py-3 bg-card cursor-pointer hover:bg-muted/50">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center text-primary bg-muted">
            <ExternalLink className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <span className="font-medium text-[15px] block">W€spr Community</span>
            <span className="text-xs text-muted-foreground">community.w€spr.eu</span>
          </div>
        </div>
      </div>

      <div className="mt-2 bg-card shadow-sm">
        <div className="px-4 py-4">
          <h3 className="text-xs font-bold text-muted-foreground mb-3">FEEDBACK STUREN</h3>
          <textarea
            placeholder="Vertel ons wat je vindt van W€spr..."
            className="w-full bg-muted/50 rounded-xl px-4 py-3 text-[14px] outline-none border border-border/50 focus:border-primary/50 min-h-[100px] resize-none transition-colors"
          />
          <Button className="w-full mt-3 rounded-xl">Verstuur feedback</Button>
        </div>
      </div>
    </ScreenWrapper>
  );
}

export function MarketDetailScreen({ onBack, type }: { onBack: () => void; type: "stocks" | "crypto" | "bonds" }) {
  const configs = {
    stocks: {
      title: "Aandelen (Euronext)",
      color: "text-blue-600",
      bg: "bg-blue-600",
      items: [
        { name: "ASML Holding", ticker: "ASML", price: "€892,40", change: "+2.1%", up: true },
        { name: "Shell PLC", ticker: "SHEL", price: "€31,85", change: "+0.4%", up: true },
        { name: "Adyen NV", ticker: "ADYEN", price: "€1.234,00", change: "-1.3%", up: false },
        { name: "Philips NV", ticker: "PHIA", price: "€24,60", change: "+0.8%", up: true },
        { name: "Unilever", ticker: "UNA", price: "€52,10", change: "+0.2%", up: true },
      ],
    },
    crypto: {
      title: "Cryptocurrencies",
      color: "text-orange-600",
      bg: "bg-orange-600",
      items: [
        { name: "Bitcoin", ticker: "BTC", price: "€87.420", change: "+5.2%", up: true },
        { name: "Ethereum", ticker: "ETH", price: "€3.180", change: "+3.8%", up: true },
        { name: "Solana", ticker: "SOL", price: "€142,50", change: "+12.1%", up: true },
        { name: "Cardano", ticker: "ADA", price: "€0,72", change: "-2.4%", up: false },
        { name: "Polkadot", ticker: "DOT", price: "€8,35", change: "+1.1%", up: true },
      ],
    },
    bonds: {
      title: "Staatsobligaties",
      color: "text-purple-600",
      bg: "bg-purple-600",
      items: [
        { name: "Eurobond 2030", ticker: "EU30", price: "€101,20", change: "+0.1%", up: true },
        { name: "Green Bond NL", ticker: "GRNL", price: "€99,80", change: "+0.3%", up: true },
        { name: "Bund 10Y", ticker: "DE10", price: "€98,50", change: "-0.1%", up: false },
        { name: "OAT France", ticker: "FR10", price: "€97,40", change: "+0.2%", up: true },
      ],
    },
  };
  const config = configs[type];

  return (
    <ScreenWrapper title={config.title} onBack={onBack}>
      <div className={`${config.bg} px-6 py-8 text-white`}>
        <p className="text-white/80 text-sm mb-1">Totale waarde</p>
        <h2 className="text-3xl font-bold mb-1">
          {type === "stocks" ? "€ 8.230" : type === "crypto" ? "€ 3.120" : "€ 1.100"}
        </h2>
        <p className="text-white/80 text-sm flex items-center gap-1">
          <span className="text-emerald-300 font-medium">
            {type === "stocks" ? "+1.2%" : type === "crypto" ? "+8.4%" : "+0.5%"}
          </span>
          vandaag
        </p>
      </div>

      <div className="mt-2 bg-card shadow-sm">
        <div className="px-4 py-3 border-b border-border/30">
          <h3 className="text-xs font-bold text-muted-foreground">PORTEFEUILLE</h3>
        </div>
        {config.items.map((item, i) => (
          <div key={i} className={`flex items-center gap-4 px-4 py-3.5 ${i < config.items.length - 1 ? 'border-b border-border/30' : ''}`}>
            <div className={`w-10 h-10 rounded-xl ${config.color} bg-muted flex items-center justify-center font-bold text-xs`}>
              {item.ticker.slice(0, 3)}
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-[15px]">{item.name}</h4>
              <span className="text-xs text-muted-foreground">{item.ticker}</span>
            </div>
            <div className="text-right">
              <div className="font-bold text-[14px]">{item.price}</div>
              <div className={`text-xs font-medium ${item.up ? 'text-emerald-600' : 'text-red-500'}`}>{item.change}</div>
            </div>
          </div>
        ))}
      </div>
    </ScreenWrapper>
  );
}