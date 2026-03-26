import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RefreshCw, ExternalLink, Globe, AlertTriangle, Shield, Lock, ChevronRight, Fingerprint, Building2, Mail, FileText, Droplets, CreditCard, Receipt, HeartPulse, Landmark, ShieldCheck, Stethoscope, Sun, Zap, BarChart3, Bot, MessageSquare, Code, Sparkles, Brain, TrendingUp, Wallet, Coins, ArrowLeftRight, PiggyBank, LineChart, Banknote, DollarSign, GraduationCap, Target, Trophy, Gamepad2, Bell, FolderOpen, Star, Home, MapPin, Search, Calendar, Pill, Activity, ClipboardList, ChevronDown, Hospital as HospitalIcon, X, User, Smartphone, Check, Eye, EyeOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ALL_HOSPITALS, REGIONS, type Hospital, type RegionId } from "@/data/hospitals";
import { Button } from "./ui/button";

const LOGOS: Record<string, string> = {
  "DigiD": "/images/digid-logo.svg",
  "Mijn Overheid": "/images/mijnoverheid-logo.svg",
  "Berichtenbox": "/images/berichtenbox-logo.svg",
  "Aangifte": "/images/aangifte-logo.svg",
  "Dunea": "/images/dunea-logo.svg",
  "Gem. Belastingen": "/images/gemeentebelasting-logo.svg",
  "SPMS Pensioen": "/images/spms-logo.svg",
  "PFZW": "/images/pfzw-logo.svg",
  "ABP": "/images/abp-logo.svg",
  "OHRA": "/images/ohra-logo.svg",
  "IZZ": "/images/izz-logo.svg",
  "Enlighten": "/images/enlighten-logo.svg",
  "Zonneplan": "/images/zonneplan-logo.svg",
  "Gemini": "/images/gemini-logo.svg",
  "ChatGPT": "/images/chatgpt-logo.svg",
  "DeepSeek": "/images/deepseek-logo.svg",
  "Replit": "/images/replit-logo.svg",
  "Claude": "/images/claude-logo.svg",
  "Kimi": "/images/kimi-logo.svg",
  "PDF Viewer": "/images/pdf-logo.svg",
  "Box": "/images/box-logo.svg",
  "Artsy": "/images/artsy-logo.svg",
  "Saatchi Art": "/images/saatchi-logo.svg",
  "Funda": "/images/funda-logo.svg",
  "Pararius": "/images/pararius-logo.svg",
  "Idealista": "/images/idealista-logo.svg",
  "Yaencontre": "/images/yaencontre-logo.svg",
  "Pisos.com": "/images/pisos-logo.svg",
  "Habitaclia": "/images/habitaclia-logo.svg",
  "Kunstveiling.nl": "/images/kunstveiling-logo.svg",
  "Catawiki": "/images/catawiki-logo.svg",
  "Middelheim": "/images/middelheim-logo.svg",
  "Depot": "/images/depot-logo.svg",
  "Smartify": "/images/smartify-logo.svg",
  "Arts & Culture": "/images/artsculture-logo.svg",
  "Museumtijdschrift": "/images/museumtijdschrift-logo.svg",
  "Google Lens": "/images/googlelens-logo.svg",
  "Time to Momo": "/images/timetomomo-logo.svg",
  "Buienradar": "/images/buienradar-logo.svg",
  "Weer.nl": "/images/weernl-logo.svg",
  "AccuWeather": "/images/accuweather-logo.svg",
  "Safari": "/images/safari-logo.svg",
  "Chrome": "/images/chrome-logo.svg",
  "Keeper": "/images/keeper-logo.svg",
  "Ring": "/images/ring-logo.svg",
  "UltraSync+": "/images/ultrasync-logo.svg",
  "MS Office": "/images/msoffice-logo.svg",
  "Bestanden": "/images/bestanden-logo.svg",
  "Wix": "/images/wix-logo.svg",
  "WeChat": "/images/wechat-logo.svg",
  "Alipay": "/images/alipay-logo.svg",
  "Duolingo": "/images/duolingo-logo.svg",
  "Studielink": "/images/studielink-logo.svg",
  "Coursera": "/images/coursera-logo.svg",
  "DeepL": "/images/deepl-logo.svg",
  "Google Translate": "/images/googletranslate-logo.svg",
  "Rabobank": "/images/rabobank-logo.svg",
  "Saxo Investor": "/images/saxo-logo.svg",
  "Santander": "/images/santander-logo.svg",
  "Bloomberg": "/images/bloomberg-logo.svg",
  "MarketWatch": "/images/marketwatch-logo.svg",
  "Euronext": "/images/euronext-logo.svg",
  "Revolut": "/images/revolut-logo.svg",
  "Bitvavo": "/images/bitvavo-logo.svg",
  "Binance": "/images/binance-logo.svg",
  "Coinbase": "/images/coinbase-logo.svg",
  "Base": "/images/base-logo.svg",
  "Valuta": "/images/valuta-logo.svg",
  "Raisin": "/images/raisin-logo.svg",
  "Uniswap": "/images/uniswap-logo.svg",
  "Doctolib Connect": "/images/doctolib-logo.svg",
  "PatientsLikeMe": "/images/patientslikeme-logo.svg",
  "Medgemak": "/images/medgemak-logo.svg",
  "Thuisarts": "/images/thuisarts-logo.svg",
  "AboutHerbs": "/images/aboutherbs-logo.svg",
  "BeterDichtbij": "/images/beterdichtbij-logo.svg",
  "Richtlijnen": "/images/richtlijnen-logo.svg",
  "Golf.nl": "/images/golfnl-logo.svg",
  "ClubApp": "/images/clubapp-logo.svg",
  "Meet & Play": "/images/meetplay-logo.svg",
  "Cabify": "/images/cabify-logo.svg",
};

const GOV_APPS: Record<string, { url: string; color: string; description: string; features: { icon: any; label: string }[]; appStore?: string; playStore?: string }> = {
  "W€spr Medisch Dossier": {
    url: "https://w€spr.eu/medisch-dossier",
    color: "#0D9488",
    description: "Toegang tot uw volledige medisch dossier van elk ziekenhuis waar u onder behandeling bent of bent geweest, waar ook ter wereld. Bekijk uitslagen, verslagen, medicatie en afspraken — veilig en versleuteld via uw W€spr ID.",
    features: [
      { icon: FileText, label: "Medische verslagen & uitslagen" },
      { icon: Stethoscope, label: "Behandelgeschiedenis" },
      { icon: Building2, label: "Ziekenhuizen wereldwijd" },
      { icon: Lock, label: "Versleuteld met W€spr ID" },
    ],
  },
  "DigiD": {
    url: "https://www.digid.nl",
    color: "#E17000",
    description: "Veilig inloggen bij overheidsorganisaties",
    features: [
      { icon: Fingerprint, label: "Inloggen met DigiD" },
      { icon: Shield, label: "Identiteit bevestigen" },
      { icon: Lock, label: "Beveiligd met SMS-controle" },
    ],
  },
  "Mijn Overheid": {
    url: "https://mijn.overheid.nl",
    color: "#154273",
    description: "Uw persoonlijke overheidsberichten en zaken",
    features: [
      { icon: Building2, label: "Overheidszaken bekijken" },
      { icon: Mail, label: "Berichten van de overheid" },
      { icon: FileText, label: "Persoonlijke gegevens" },
    ],
  },
  "Berichtenbox": {
    url: "https://mijn.overheid.nl/berichtenbox",
    color: "#39870C",
    description: "Al uw overheidspost op één plek",
    features: [
      { icon: Mail, label: "Digitale post ontvangen" },
      { icon: Shield, label: "Veilig en persoonlijk" },
      { icon: Building2, label: "Alle organisaties" },
    ],
  },
  "Aangifte": {
    url: "https://www.belastingdienst.nl",
    color: "#154273",
    description: "Belastingaangifte doen bij de Belastingdienst",
    features: [
      { icon: FileText, label: "Aangifte invullen" },
      { icon: Lock, label: "Beveiligd via DigiD" },
      { icon: Building2, label: "Belastingdienst" },
    ],
  },
  "Dunea": {
    url: "https://www.dunea.nl",
    color: "#0072BC",
    description: "Drinkwater voor de Randstad",
    features: [
      { icon: Droplets, label: "Waterverbruik inzien" },
      { icon: Receipt, label: "Facturen bekijken" },
      { icon: CreditCard, label: "Betalen en termijnen" },
    ],
  },
  "Gem. Belastingen": {
    url: "https://www.belastingen.nl",
    color: "#1B4F72",
    description: "Gemeentelijke belastingen en heffingen",
    features: [
      { icon: Building2, label: "Aanslagen bekijken" },
      { icon: CreditCard, label: "Online betalen" },
      { icon: FileText, label: "Bezwaar indienen" },
    ],
  },
  "SPMS Pensioen": {
    url: "https://www.spms.nl",
    color: "#1A3C6E",
    description: "Pensioenfonds Medisch Specialisten",
    features: [
      { icon: Stethoscope, label: "Pensioen medisch specialisten" },
      { icon: CreditCard, label: "Pensioenopbouw inzien" },
      { icon: FileText, label: "Documenten & brieven" },
    ],
  },
  "PFZW": {
    url: "https://www.pfzw.nl",
    color: "#00A651",
    description: "Pensioenfonds Zorg en Welzijn",
    features: [
      { icon: HeartPulse, label: "Pensioen zorg & welzijn" },
      { icon: CreditCard, label: "Pensioenopbouw bekijken" },
      { icon: FileText, label: "Pensioenregeling" },
    ],
  },
  "ABP": {
    url: "https://www.abp.nl",
    color: "#003D6B",
    description: "Pensioenfonds voor overheid en onderwijs",
    features: [
      { icon: Landmark, label: "Mijn ABP pensioen" },
      { icon: CreditCard, label: "Pensioenopbouw inzien" },
      { icon: ShieldCheck, label: "Nabestaandenpensioen" },
    ],
  },
  "OHRA": {
    url: "https://www.ohra.nl",
    color: "#E37222",
    description: "Verzekeringen en financiële producten",
    features: [
      { icon: ShieldCheck, label: "Mijn verzekeringen" },
      { icon: FileText, label: "Polissen en dekking" },
      { icon: CreditCard, label: "Schade melden" },
    ],
  },
  "IZZ": {
    url: "https://mijn.izzdoorvgz.nl",
    color: "#009CDE",
    description: "Zorgverzekeraar voor de zorg",
    features: [
      { icon: HeartPulse, label: "Zorgverzekering" },
      { icon: FileText, label: "Declaraties indienen" },
      { icon: ShieldCheck, label: "Aanvullende verzekering" },
    ],
  },
  "Enlighten": {
    url: "https://enlighten.enphaseenergy.com",
    color: "#F7931E",
    description: "Zonnepanelen monitoring van Enphase",
    features: [
      { icon: Sun, label: "Energieproductie volgen" },
      { icon: BarChart3, label: "Opbrengst dashboard" },
      { icon: Zap, label: "Systeemstatus bekijken" },
    ],
  },
  "Zonneplan": {
    url: "https://www.zonneplan.nl",
    color: "#00B4D8",
    description: "Slimme energie voor thuis",
    features: [
      { icon: Sun, label: "Zonne-energie beheren" },
      { icon: Zap, label: "Energieverbruik inzien" },
      { icon: BarChart3, label: "Besparing berekenen" },
    ],
  },
  "Gemini": {
    url: "https://gemini.google.com",
    color: "#1A73E8",
    description: "AI-assistent van Google",
    features: [
      { icon: Sparkles, label: "Vragen stellen aan AI" },
      { icon: MessageSquare, label: "Conversaties voeren" },
      { icon: Brain, label: "Creatief schrijven" },
    ],
  },
  "ChatGPT": {
    url: "https://chat.openai.com",
    color: "#10A37F",
    description: "AI-chatbot van OpenAI",
    features: [
      { icon: MessageSquare, label: "Chat met AI" },
      { icon: Code, label: "Code genereren" },
      { icon: Brain, label: "Teksten analyseren" },
    ],
  },
  "DeepSeek": {
    url: "https://chat.deepseek.com",
    color: "#4D6BFE",
    description: "Geavanceerde AI-assistent",
    features: [
      { icon: Bot, label: "AI-gesprekken voeren" },
      { icon: Code, label: "Programmeren met AI" },
      { icon: Brain, label: "Onderzoek & analyse" },
    ],
  },
  "Replit": {
    url: "https://replit.com",
    color: "#F26207",
    description: "Online programmeeromgeving met AI",
    features: [
      { icon: Code, label: "Code schrijven & uitvoeren" },
      { icon: Bot, label: "AI-assistent Ghostwriter" },
      { icon: Sparkles, label: "Apps bouwen met AI" },
    ],
  },
  "Claude": {
    url: "https://claude.ai",
    color: "#D4A574",
    description: "AI-assistent van Anthropic",
    features: [
      { icon: MessageSquare, label: "Veilige AI-gesprekken" },
      { icon: Brain, label: "Diepgaande analyse" },
      { icon: Sparkles, label: "Creatieve hulp" },
    ],
  },
  "Kimi": {
    url: "https://www.kimi.com",
    color: "#6C5CE7",
    description: "AI-assistent van Moonshot AI met langdurig geheugen",
    features: [
      { icon: Brain, label: "Langdurig geheugen" },
      { icon: MessageSquare, label: "Slimme AI-gesprekken" },
      { icon: FileText, label: "Documenten analyseren" },
      { icon: Globe, label: "Zoeken op internet" },
    ],
  },
  "Duolingo": {
    url: "https://www.duolingo.com",
    color: "#58CC02",
    description: "Leer talen op een leuke en effectieve manier met korte lessen",
    features: [
      { icon: GraduationCap, label: "Talen leren" },
      { icon: Target, label: "Dagelijkse doelen" },
      { icon: Trophy, label: "Voortgang bijhouden" },
      { icon: Gamepad2, label: "Spelenderwijs oefenen" },
    ],
  },
  "Studielink": {
    url: "https://www.studielink.nl",
    color: "#003DA5",
    description: "Inschrijven voor hoger onderwijs in Nederland",
    features: [
      { icon: GraduationCap, label: "Inschrijven voor opleiding" },
      { icon: FileText, label: "Aanmeldingen beheren" },
      { icon: Building2, label: "Universiteiten & hogescholen" },
    ],
  },
  "Coursera": {
    url: "https://www.coursera.org",
    color: "#0056D2",
    description: "Online cursussen van topuniversiteiten wereldwijd",
    features: [
      { icon: GraduationCap, label: "Online cursussen volgen" },
      { icon: Trophy, label: "Certificaten behalen" },
      { icon: Globe, label: "Universiteiten wereldwijd" },
    ],
  },
  "DeepL": {
    url: "https://www.deepl.com/translator",
    color: "#0F2B46",
    description: "Vertaal teksten en documenten met de beste AI-vertaler ter wereld",
    features: [
      { icon: Globe, label: "30+ talen vertalen" },
      { icon: FileText, label: "Documenten vertalen" },
      { icon: Sparkles, label: "AI-kwaliteit vertalingen" },
    ],
  },
  "Google Translate": {
    url: "https://translate.google.com",
    color: "#4285F4",
    description: "Vertaal tekst, documenten en websites in meer dan 100 talen",
    features: [
      { icon: Globe, label: "100+ talen" },
      { icon: MessageSquare, label: "Tekst vertalen" },
      { icon: FileText, label: "Documenten vertalen" },
    ],
  },
  "MS Office": {
    url: "https://www.office.com",
    color: "#D83B01",
    description: "Maak, bewerk en deel documenten, spreadsheets en presentaties",
    features: [
      { icon: FileText, label: "Word — documenten" },
      { icon: BarChart3, label: "Excel — spreadsheets" },
      { icon: Sparkles, label: "PowerPoint — presentaties" },
      { icon: Mail, label: "Outlook — e-mail" },
    ],
  },
  "Bestanden": {
    url: "__APP_ONLY__",
    color: "#007AFF",
    description: "Bekijk en beheer al je bestanden, documenten en mappen op je iPhone",
    appStore: "https://apps.apple.com/app/files/id1232058109",
    features: [
      { icon: FolderOpen, label: "Mappen & bestanden" },
      { icon: FileText, label: "Documenten bekijken" },
      { icon: Globe, label: "iCloud Drive" },
      { icon: Lock, label: "Beveiligde bestanden" },
    ],
  },
  "PDF Viewer": {
    url: "__APP_ONLY__",
    color: "#FF2D2D",
    description: "Open, bekijk en annoteer PDF-bestanden op je iPhone",
    appStore: "https://apps.apple.com/app/adobe-acrobat-reader/id469337564",
    playStore: "https://play.google.com/store/apps/details?id=com.adobe.reader",
    features: [
      { icon: FileText, label: "PDF's openen & lezen" },
      { icon: Code, label: "Annotaties & markeren" },
      { icon: Mail, label: "PDF's delen & versturen" },
      { icon: Lock, label: "Beveiligde documenten" },
    ],
  },
  "Artsy": {
    url: "https://www.artsy.net",
    color: "#000000",
    description: "Ontdek, koop en verzamel kunst van over de hele wereld",
    features: [
      { icon: Globe, label: "Galerieën wereldwijd" },
      { icon: FileText, label: "Kunstwerken ontdekken" },
      { icon: Shield, label: "Veilig kopen & bieden" },
      { icon: Star, label: "Favorieten opslaan" },
    ],
  },
  "Saatchi Art": {
    url: "https://www.saatchiart.com",
    color: "#1A1A1A",
    description: "Koop originele kunst rechtstreeks van kunstenaars",
    features: [
      { icon: FileText, label: "Schilderijen & prints" },
      { icon: Globe, label: "Internationale kunstenaars" },
      { icon: Shield, label: "Veilige betaling" },
      { icon: Star, label: "Curated collecties" },
    ],
  },
  "Funda": {
    url: "https://www.funda.nl",
    color: "#F7A100",
    description: "Zoek en vind je droomhuis in Nederland",
    features: [
      { icon: Home, label: "Woningen zoeken" },
      { icon: MapPin, label: "Locatie & buurt" },
      { icon: FileText, label: "Woningdetails & foto's" },
      { icon: Star, label: "Favorieten & alerts" },
    ],
  },
  "Pararius": {
    url: "https://www.pararius.nl",
    color: "#00A651",
    description: "Huurwoningen vinden in heel Nederland",
    features: [
      { icon: Home, label: "Huurwoningen zoeken" },
      { icon: MapPin, label: "Filter op locatie" },
      { icon: FileText, label: "Woningbeschrijvingen" },
      { icon: Globe, label: "Ook in het Engels" },
    ],
  },
  "Kunstveiling.nl": {
    url: "https://www.kunstveiling.nl",
    color: "#2C3E50",
    description: "Online veilingen van schilderijen, beelden en kunstobjecten",
    features: [
      { icon: Star, label: "Veilingen volgen" },
      { icon: FileText, label: "Kavels bekijken" },
      { icon: Shield, label: "Veilig bieden" },
      { icon: Globe, label: "Nederlandse kunst" },
    ],
  },
  "Catawiki": {
    url: "https://www.catawiki.com",
    color: "#F5A623",
    description: "Online veilingen voor bijzondere objecten — kunst, antiek en meer",
    features: [
      { icon: Star, label: "Curated veilingen" },
      { icon: Globe, label: "Wereldwijd bieden" },
      { icon: Shield, label: "Kopersbescherming" },
      { icon: FileText, label: "Expertkeuring" },
    ],
  },
  "Middelheim": {
    url: "https://www.middelheimmuseum.be",
    color: "#2E7D32",
    description: "Openluchtmuseum voor beeldhouwkunst in Antwerpen",
    features: [
      { icon: MapPin, label: "Beelden in het park" },
      { icon: FileText, label: "Tentoonstellingen" },
      { icon: Globe, label: "Plannen & bezoeken" },
      { icon: Star, label: "Collectie ontdekken" },
    ],
  },
  "Depot": {
    url: "https://www.boijmans.nl",
    color: "#B0B0B0",
    description: "Depot Boijmans Van Beuningen — het eerste publiek toegankelijke kunstdepot ter wereld",
    features: [
      { icon: Globe, label: "151.000 kunstwerken" },
      { icon: FileText, label: "Collectie verkennen" },
      { icon: MapPin, label: "Bezoek plannen" },
      { icon: Star, label: "Rondleidingen" },
    ],
  },
  "Smartify": {
    url: "https://smartify.org",
    color: "#6C63FF",
    description: "Scan kunstwerken en ontdek de verhalen erachter",
    features: [
      { icon: Star, label: "Kunstwerken scannen" },
      { icon: FileText, label: "Audio-gidsen" },
      { icon: Globe, label: "Musea wereldwijd" },
      { icon: MapPin, label: "Museum tours" },
    ],
  },
  "Arts & Culture": {
    url: "https://artsandculture.google.com",
    color: "#FBBC05",
    description: "Ontdek kunst, cultuur en erfgoed van over de hele wereld via Google",
    features: [
      { icon: Globe, label: "Virtuele museumtours" },
      { icon: FileText, label: "Kunstwerken in HD" },
      { icon: Star, label: "Collecties ontdekken" },
      { icon: MapPin, label: "Musea bij jou in de buurt" },
    ],
  },
  "Museumtijdschrift": {
    url: "https://www.museumtijdschrift.nl",
    color: "#1A237E",
    description: "Het laatste nieuws over musea, tentoonstellingen en kunst in Nederland",
    features: [
      { icon: FileText, label: "Artikelen & reviews" },
      { icon: Star, label: "Tentoonstellingstips" },
      { icon: Globe, label: "Museum agenda" },
      { icon: MapPin, label: "Musea in Nederland" },
    ],
  },
  "Google Lens": {
    url: "https://lens.google.com",
    color: "#4285F4",
    description: "Herken objecten, tekst en kunstwerken met je camera",
    features: [
      { icon: Globe, label: "Objecten herkennen" },
      { icon: FileText, label: "Tekst vertalen" },
      { icon: Star, label: "Kunstwerken identificeren" },
      { icon: Shield, label: "Visueel zoeken" },
    ],
  },
  "Time to Momo": {
    url: "https://www.timetomomo.com",
    color: "#FF5A5F",
    description: "Stedentrips en reistips — ontdek de leukste plekken in Europa",
    features: [
      { icon: MapPin, label: "Stadsgidsen" },
      { icon: Star, label: "Hotspots & tips" },
      { icon: Globe, label: "Europese steden" },
      { icon: FileText, label: "Reisinspiratie" },
    ],
  },
  "Idealista": {
    url: "https://www.idealista.com",
    color: "#1DBF73",
    description: "Zoek woningen te koop en te huur in Spanje, Portugal en Italië",
    features: [
      { icon: Home, label: "Koop & huurwoningen" },
      { icon: MapPin, label: "Zoek op locatie" },
      { icon: FileText, label: "Foto's & details" },
      { icon: Star, label: "Favorieten & alerts" },
    ],
  },
  "Yaencontre": {
    url: "https://www.yaencontre.com",
    color: "#FF6600",
    description: "Vind je droomhuis in Spanje — koop, huur en nieuwbouw",
    features: [
      { icon: Home, label: "Woningen zoeken" },
      { icon: MapPin, label: "Regio & stad filter" },
      { icon: FileText, label: "Woningbeschrijvingen" },
      { icon: Globe, label: "Nieuwbouwprojecten" },
    ],
  },
  "Pisos.com": {
    url: "https://www.pisos.com",
    color: "#0066CC",
    description: "Het grootste woningplatform van Spanje — koop en huur",
    features: [
      { icon: Home, label: "Appartementen & huizen" },
      { icon: MapPin, label: "Zoek per provincie" },
      { icon: FileText, label: "Gedetailleerde info" },
      { icon: Star, label: "Meldingen instellen" },
    ],
  },
  "Habitaclia": {
    url: "https://www.habitaclia.com",
    color: "#E30613",
    description: "Woningen zoeken in Spanje — focus op Catalonië en de kust",
    features: [
      { icon: Home, label: "Koop & huurwoningen" },
      { icon: MapPin, label: "Catalonië & kustgebied" },
      { icon: FileText, label: "Foto's & plattegronden" },
      { icon: Globe, label: "Vakantiewoningen" },
    ],
  },
  "Buienradar": {
    url: "https://www.buienradar.nl",
    color: "#0078D4",
    description: "Bekijk actuele neerslag, weersvoorspellingen en weerkaarten",
    features: [
      { icon: Globe, label: "Neerslagradar live" },
      { icon: MapPin, label: "Weer op jouw locatie" },
      { icon: Sun, label: "14-daagse voorspelling" },
      { icon: Zap, label: "Onweerswaarschuwingen" },
    ],
  },
  "Weer.nl": {
    url: "https://www.weer.nl",
    color: "#FF8C00",
    description: "Het meest complete weeroverzicht van Nederland",
    features: [
      { icon: Sun, label: "Dagvoorspelling" },
      { icon: Globe, label: "Weerkaarten" },
      { icon: MapPin, label: "Lokaal weer" },
      { icon: Zap, label: "Weerwaarschuwingen" },
    ],
  },
  "AccuWeather": {
    url: "https://www.accuweather.com",
    color: "#EF6C00",
    description: "Nauwkeurige weersverwachtingen wereldwijd — uur voor uur",
    features: [
      { icon: Globe, label: "Wereldwijd weer" },
      { icon: Sun, label: "Uurlijkse voorspelling" },
      { icon: MapPin, label: "RealFeel temperatuur" },
      { icon: Zap, label: "Extreme weermeldingen" },
    ],
  },
  "Box": {
    url: "https://www.box.com",
    color: "#0061D5",
    description: "Bewaar, deel en beheer al je bestanden veilig in de cloud",
    features: [
      { icon: FolderOpen, label: "Bestanden & mappen" },
      { icon: Shield, label: "Veilig delen" },
      { icon: Globe, label: "Cloud opslag" },
      { icon: Lock, label: "Toegangsbeheer" },
    ],
  },
  "Safari": {
    url: "https://www.apple.com/safari",
    color: "#006CFF",
    description: "Apple's snelle en veilige webbrowser voor al je apparaten",
    features: [
      { icon: Globe, label: "Websites bezoeken" },
      { icon: Lock, label: "Privé browsen" },
      { icon: Shield, label: "Anti-tracking" },
      { icon: FileText, label: "Leeslijst & bladwijzers" },
    ],
  },
  "Chrome": {
    url: "https://www.google.com/chrome",
    color: "#4285F4",
    description: "Google's snelle browser met synchronisatie en extensies",
    features: [
      { icon: Globe, label: "Websites bezoeken" },
      { icon: Lock, label: "Incognito modus" },
      { icon: Shield, label: "Veilig browsen" },
      { icon: Mail, label: "Google-account sync" },
    ],
  },
  "Keeper": {
    url: "https://www.keepersecurity.com",
    color: "#0061FF",
    description: "Bewaar en beheer al je wachtwoorden veilig op één plek",
    features: [
      { icon: Lock, label: "Wachtwoorden opslaan" },
      { icon: Shield, label: "Veilige kluis" },
      { icon: Fingerprint, label: "Biometrisch inloggen" },
      { icon: Globe, label: "Automatisch invullen" },
    ],
  },
  "Ring": {
    url: "https://ring.com",
    color: "#1C96E8",
    description: "Bekijk je deurbel, camera's en beveiligingssysteem — altijd en overal",
    features: [
      { icon: Shield, label: "Live camera beelden" },
      { icon: Globe, label: "Deurbel notificaties" },
      { icon: Lock, label: "Bewegingsdetectie" },
    ],
  },
  "UltraSync+": {
    url: "https://www.ultrasync.com",
    color: "#2D3436",
    description: "Beheer je alarmsysteem op afstand — Fuutlaan, Den Haag",
    appStore: "https://apps.apple.com/app/ultrasync/id1073498498",
    playStore: "https://play.google.com/store/apps/details?id=com.interlogix.ultrasync",
    features: [
      { icon: Shield, label: "Alarm in-/uitschakelen" },
      { icon: Lock, label: "Zones & sensoren" },
      { icon: Globe, label: "Camerabewaking" },
      { icon: Bell, label: "Meldingen & alerts" },
    ],
  },
  "Wix": {
    url: "https://www.wix.com",
    color: "#0C6EFC",
    description: "Bouw en beheer professionele websites en webshops zonder code",
    features: [
      { icon: Globe, label: "Website bouwen" },
      { icon: Code, label: "Drag & drop editor" },
      { icon: Sparkles, label: "AI website generator" },
    ],
  },
  "WeChat": {
    url: "https://www.wechat.com",
    color: "#07C160",
    description: "Chat, bel, betaal en deel momenten met vrienden en familie wereldwijd",
    features: [
      { icon: MessageSquare, label: "Berichten & groepschats" },
      { icon: CreditCard, label: "WeChat Pay" },
      { icon: Globe, label: "Moments & Mini Programs" },
    ],
  },
  "Alipay": {
    url: "https://www.alipay.com",
    color: "#1677FF",
    description: "Betaal, beleg en beheer je financiën met Alipay — de grootste betaalapp ter wereld",
    features: [
      { icon: CreditCard, label: "Mobiel betalen" },
      { icon: Wallet, label: "Digitale portemonnee" },
      { icon: Globe, label: "Internationaal betalen" },
      { icon: TrendingUp, label: "Beleggen & sparen" },
    ],
  },
  "Rabobank": {
    url: "https://www.rabobank.nl",
    color: "#FF6600",
    description: "Bankieren bij de Rabobank",
    features: [
      { icon: CreditCard, label: "Rekeningen & saldo" },
      { icon: Receipt, label: "Overschrijvingen" },
      { icon: ShieldCheck, label: "Verzekeringen & sparen" },
    ],
  },
  "Saxo Investor": {
    url: "https://www.home.saxo/nl-nl",
    color: "#0B1E3F",
    description: "Online beleggen bij Saxo Bank",
    features: [
      { icon: TrendingUp, label: "Aandelen & ETF's handelen" },
      { icon: LineChart, label: "Portefeuille beheren" },
      { icon: BarChart3, label: "Marktanalyse & onderzoek" },
    ],
  },
  "Santander": {
    url: "https://www.santander.com",
    color: "#EC0000",
    description: "Internationale bank & financiële diensten",
    features: [
      { icon: Landmark, label: "Rekeningen beheren" },
      { icon: CreditCard, label: "Betalen & overschrijven" },
      { icon: TrendingUp, label: "Sparen & beleggen" },
    ],
  },
  "Bloomberg": {
    url: "https://www.bloomberg.com",
    color: "#1A1A1A",
    description: "Financieel nieuws & marktdata",
    features: [
      { icon: LineChart, label: "Realtime marktdata" },
      { icon: TrendingUp, label: "Beurskoersen volgen" },
      { icon: FileText, label: "Financieel nieuws" },
    ],
  },
  "MarketWatch": {
    url: "https://www.marketwatch.com",
    color: "#1E8C45",
    description: "Beurs- en financieel nieuws",
    features: [
      { icon: TrendingUp, label: "Aandelenkoersen" },
      { icon: BarChart3, label: "Marktoverzicht" },
      { icon: FileText, label: "Analyse & opinie" },
    ],
  },
  "Euronext": {
    url: "https://www.euronext.com",
    color: "#003B71",
    description: "Europese effectenbeurs",
    features: [
      { icon: Landmark, label: "AEX & Europese indices" },
      { icon: LineChart, label: "Koersen & notering" },
      { icon: TrendingUp, label: "IPO's & handel" },
    ],
  },
  "Revolut": {
    url: "https://www.revolut.com",
    color: "#0075EB",
    description: "Digitaal bankieren & beleggen",
    features: [
      { icon: Wallet, label: "Multi-valuta rekening" },
      { icon: ArrowLeftRight, label: "Wisselkoersen" },
      { icon: TrendingUp, label: "Aandelen & crypto" },
    ],
  },
  "Bitvavo": {
    url: "https://bitvavo.com",
    color: "#1C65E2",
    description: "Nederlandse crypto exchange",
    features: [
      { icon: Coins, label: "Crypto kopen & verkopen" },
      { icon: LineChart, label: "Koersen volgen" },
      { icon: Wallet, label: "Crypto wallet" },
    ],
  },
  "Binance": {
    url: "https://www.binance.com",
    color: "#F0B90B",
    description: "Grootste crypto exchange ter wereld",
    features: [
      { icon: Coins, label: "Crypto handelen" },
      { icon: TrendingUp, label: "Spot & futures" },
      { icon: PiggyBank, label: "Staking & sparen" },
    ],
  },
  "Coinbase": {
    url: "https://www.coinbase.com",
    color: "#0052FF",
    description: "Crypto kopen, verkopen & bewaren",
    features: [
      { icon: Coins, label: "Crypto portfolio" },
      { icon: ArrowLeftRight, label: "Kopen & verkopen" },
      { icon: ShieldCheck, label: "Beveiligde opslag" },
    ],
  },
  "Base": {
    url: "https://base.org",
    color: "#0052FF",
    description: "Layer 2 blockchain van Coinbase",
    features: [
      { icon: Coins, label: "DeFi applicaties" },
      { icon: ArrowLeftRight, label: "Tokens swappen" },
      { icon: Zap, label: "Snelle transacties" },
    ],
  },
  "Valuta": {
    url: "https://www.xe.com",
    color: "#2E7D32",
    description: "Wisselkoersen & valuta omrekenen",
    features: [
      { icon: DollarSign, label: "Wisselkoersen live" },
      { icon: ArrowLeftRight, label: "Valuta omrekenen" },
      { icon: LineChart, label: "Koershistorie" },
    ],
  },
  "Raisin": {
    url: "https://www.raisin.nl",
    color: "#00796B",
    description: "Sparen met de beste rente in Europa",
    features: [
      { icon: PiggyBank, label: "Spaarrekeningen vergelijken" },
      { icon: Banknote, label: "Hoogste rente vinden" },
      { icon: Landmark, label: "Europese banken" },
    ],
  },
  "Uniswap": {
    url: "https://app.uniswap.org",
    color: "#FF007A",
    description: "Decentrale crypto exchange",
    features: [
      { icon: ArrowLeftRight, label: "Tokens swappen" },
      { icon: Coins, label: "Liquiditeit verstrekken" },
      { icon: LineChart, label: "DeFi portfolio" },
    ],
  },
  "Doctolib Connect": {
    url: "https://www.doctolib.nl",
    color: "#0596DE",
    description: "Online afspraken maken bij artsen en specialisten",
    features: [
      { icon: Stethoscope, label: "Afspraak maken bij arts" },
      { icon: HeartPulse, label: "Specialisten zoeken" },
      { icon: FileText, label: "Medisch dossier inzien" },
    ],
  },
  "PatientsLikeMe": {
    url: "https://www.patientslikeme.com",
    color: "#00A99D",
    description: "Ervaringen delen met andere patiënten",
    features: [
      { icon: HeartPulse, label: "Gezondheid bijhouden" },
      { icon: ShieldCheck, label: "Behandelingen vergelijken" },
      { icon: FileText, label: "Ervaringen delen" },
    ],
  },
  "Medgemak": {
    url: "https://www.medgemak.nl",
    color: "#4CAF50",
    description: "Medicijnen bestellen en herhaalrecepten",
    features: [
      { icon: HeartPulse, label: "Medicijnen bestellen" },
      { icon: Receipt, label: "Herhaalrecepten beheren" },
      { icon: ShieldCheck, label: "Apotheek verbinden" },
    ],
  },
  "Thuisarts": {
    url: "https://www.thuisarts.nl",
    color: "#E65100",
    description: "Betrouwbare medische informatie van huisartsen",
    features: [
      { icon: Stethoscope, label: "Klachten opzoeken" },
      { icon: FileText, label: "Zelfzorg adviezen" },
      { icon: HeartPulse, label: "Wanneer naar de huisarts" },
    ],
  },
  "AboutHerbs": {
    url: "https://www.mskcc.org/cancer-care/diagnosis-treatment/symptom-management/integrative-medicine/herbs",
    color: "#2E7D32",
    description: "Wetenschappelijke info over kruiden en supplementen",
    features: [
      { icon: HeartPulse, label: "Kruiden & supplementen" },
      { icon: ShieldCheck, label: "Interacties checken" },
      { icon: FileText, label: "Wetenschappelijk onderbouwd" },
    ],
  },
  "BeterDichtbij": {
    url: "https://www.beterdichtbij.nl",
    color: "#1565C0",
    description: "Veilig contact met je ziekenhuis",
    features: [
      { icon: Stethoscope, label: "Berichten naar arts" },
      { icon: FileText, label: "Uitslagen inzien" },
      { icon: HeartPulse, label: "Afspraken beheren" },
    ],
  },
  "Richtlijnen": {
    url: "https://richtlijnendatabase.nl",
    color: "#5C6BC0",
    description: "Medische richtlijnen en protocollen",
    features: [
      { icon: FileText, label: "Richtlijnen opzoeken" },
      { icon: Stethoscope, label: "Protocollen raadplegen" },
      { icon: ShieldCheck, label: "Evidence-based zorg" },
    ],
  },
  "Golf.nl": {
    url: "https://www.golf.nl",
    color: "#1B5E20",
    description: "De golfbond van Nederland",
    features: [
      { icon: TrendingUp, label: "Handicap bijhouden" },
      { icon: Landmark, label: "Golfbanen zoeken" },
      { icon: FileText, label: "Competities & evenementen" },
    ],
  },
  "ClubApp": {
    url: "__APP_ONLY__",
    color: "#FF6F00",
    description: "Alles van jouw sportclub op één plek. Bekijk trainingsschema's, ontvang clubnieuws, registreer je voor wedstrijden en blijf verbonden met je teamgenoten.",
    appStore: "https://apps.apple.com/app/id1136583337",
    playStore: "https://play.google.com/store/apps/details?id=nl.clubapp.app",
    features: [
      { icon: HeartPulse, label: "Trainingsschema's & wedstrijden" },
      { icon: FileText, label: "Clubnieuws & mededelingen" },
      { icon: ShieldCheck, label: "Lidmaatschap & contributie" },
      { icon: CreditCard, label: "Aanwezigheid registreren" },
      { icon: Landmark, label: "Teamindelingen bekijken" },
    ],
  },
  "Meet & Play": {
    url: "https://www.meetandplay.nl",
    color: "#7B1FA2",
    description: "Vind sportmaatjes in jouw buurt",
    features: [
      { icon: HeartPulse, label: "Sportactiviteiten zoeken" },
      { icon: ShieldCheck, label: "Deelnemers matchen" },
      { icon: FileText, label: "Evenementen organiseren" },
    ],
  },
  "Cabify": {
    url: "__APP_ONLY__",
    color: "#7B4FFC",
    description: "Boek een taxi of privérit in jouw stad. Veilig, betrouwbaar en met vaste prijzen vooraf. Beschikbaar in grote Europese steden.",
    features: [
      { icon: MapPin, label: "Rit boeken" },
      { icon: CreditCard, label: "Vaste prijs vooraf" },
      { icon: ShieldCheck, label: "Veilig & verzekerd" },
    ],
    appStore: "https://apps.apple.com/app/cabify/id476087442",
    playStore: "https://play.google.com/store/apps/details?id=com.cabify.rider",
  },
  "Agenda": {
    url: "__APP_ONLY__",
    color: "#FF3B30",
    description: "Beheer je afspraken, vergaderingen en evenementen op één plek",
    appStore: "https://apps.apple.com/app/calendar/id1108185179",
    features: [
      { icon: FileText, label: "Afspraken plannen" },
      { icon: Globe, label: "Gedeelde agenda's" },
      { icon: Bell, label: "Herinneringen instellen" },
    ],
  },
  "Klok": {
    url: "__APP_ONLY__",
    color: "#1A1A1A",
    description: "Wereldklok, wekker, stopwatch en timer — altijd bij de hand",
    appStore: "https://apps.apple.com/app/clock/id1584215688",
    features: [
      { icon: Globe, label: "Wereldklok & tijdzones" },
      { icon: Bell, label: "Wekkers instellen" },
      { icon: Zap, label: "Stopwatch & timer" },
    ],
  },
  "Rekenmachine": {
    url: "https://www.desmos.com/scientific",
    color: "#FF9500",
    description: "Wetenschappelijke rekenmachine voor dagelijks gebruik",
    features: [
      { icon: FileText, label: "Berekeningen uitvoeren" },
      { icon: Globe, label: "Wetenschappelijke functies" },
      { icon: Zap, label: "Eenheidsconversie" },
    ],
  },
  "FaceTime": {
    url: "https://facetime.apple.com",
    color: "#32D74B",
    description: "Videobellen met familie en vrienden via Apple FaceTime",
    features: [
      { icon: Globe, label: "HD videogesprekken" },
      { icon: ShieldCheck, label: "Groepsgesprekken" },
      { icon: Sparkles, label: "SharePlay & effecten" },
    ],
  },
};

// Apps in GOV_APPS met persoonlijk account → EUDI+biometrische gate
const GOV_PERSONAL_LOGIN: Record<string, { loginUrl: string; loginDomain: string; inTab?: true }> = {
  "DigiD":          { loginUrl: "https://www.digid.nl",                loginDomain: "digid.nl" },
  "Mijn Overheid":  { loginUrl: "https://mijn.overheid.nl",            loginDomain: "mijn.overheid.nl" },
  "Dunea":          { loginUrl: "https://dunea.nl",                      loginDomain: "dunea.nl" },
  "Gem. Belastingen": { loginUrl: "https://belastingdienst.nl",         loginDomain: "belastingdienst.nl" },
  "SPMS Pensioen":  { loginUrl: "https://www.spms.nl",                  loginDomain: "spms.nl" },
  "PFZW":           { loginUrl: "https://pfzw.nl",                      loginDomain: "pfzw.nl" },
  "ABP":            { loginUrl: "https://www.abp.nl",                   loginDomain: "abp.nl" },
  "OHRA":           { loginUrl: "https://www.ohra.nl/inloggen",            loginDomain: "ohra.nl" },
  "UltraSync+":     { loginUrl: "https://www.ultrasync.com",             loginDomain: "ultrasync.com" },
  "IZZ":            { loginUrl: "https://mijn.izzdoorvgz.nl",            loginDomain: "mijn.izzdoorvgz.nl" },
  "Berichtenbox":   { loginUrl: "https://mijn.overheid.nl/berichtenbox", loginDomain: "mijn.overheid.nl" },
  "Aangifte":       { loginUrl: "https://mijn.belastingdienst.nl",    loginDomain: "mijn.belastingdienst.nl" },
  "Saxo Investor":  { loginUrl: "https://www.home.saxo/accounts/login", loginDomain: "home.saxo", inTab: true },
  "Revolut":        { loginUrl: "https://app.revolut.com/sign-in",    loginDomain: "app.revolut.com", inTab: true },
  "Bitvavo":        { loginUrl: "https://account.bitvavo.com/login",  loginDomain: "account.bitvavo.com", inTab: true },
  "Binance":        { loginUrl: "https://accounts.binance.com/login", loginDomain: "accounts.binance.com", inTab: true },
  "Coinbase":       { loginUrl: "https://login.coinbase.com",         loginDomain: "login.coinbase.com", inTab: true },
  "Raisin":         { loginUrl: "https://www.raisin.nl/login",        loginDomain: "raisin.nl" },
  "Studielink":     { loginUrl: "https://studielink.nl/portal/login", loginDomain: "studielink.nl" },
  "Coursera":       { loginUrl: "https://www.coursera.org/login",     loginDomain: "coursera.org", inTab: true },
  "Funda":          { loginUrl: "https://mijn.funda.nl",              loginDomain: "mijn.funda.nl" },
  "Doctolib Connect": { loginUrl: "https://www.doctolib.fr/login",    loginDomain: "doctolib.fr", inTab: true },
  "Medgemak":       { loginUrl: "https://www.medgemak.nl/login",      loginDomain: "medgemak.nl" },
  "BeterDichtbij":  { loginUrl: "https://www.beterdichtbij.nl/login", loginDomain: "beterdichtbij.nl" },
  "Rabobank":       { loginUrl: "https://bankieren.rabobank.nl/welcomen",   loginDomain: "bankieren.rabobank.nl" },
};

const SKIP_IFRAME = ["W€spr Medisch Dossier", "DigiD", "Berichtenbox", "Aangifte", "Dunea", "Gem. Belastingen", "SPMS Pensioen", "PFZW", "ABP", "OHRA", "IZZ", "Enlighten", "Zonneplan", "Gemini", "ChatGPT", "DeepSeek", "Replit", "Claude", "Rabobank", "Saxo Investor", "Santander", "Bloomberg", "MarketWatch", "Euronext", "Revolut", "Bitvavo", "Binance", "Coinbase", "Base", "Valuta", "Raisin", "Uniswap", "ClubApp", "Kimi", "Duolingo", "Studielink", "Coursera", "Google Translate", "DeepL", "WeChat", "Alipay", "Wix", "Ring", "UltraSync+", "MS Office", "Bestanden", "Keeper", "PDF Viewer", "Box", "Artsy", "Saatchi Art", "Funda", "Pararius", "Idealista", "Yaencontre", "Pisos.com", "Habitaclia", "Kunstveiling.nl", "Catawiki", "Middelheim", "Depot", "Smartify", "Arts & Culture", "Museumtijdschrift", "Google Lens", "Time to Momo", "Buienradar", "Weer.nl", "AccuWeather", "Safari", "Chrome", "Cabify", "Agenda", "Klok", "Rekenmachine"];

const OPEN_EXTERNAL = ["Gemini", "ChatGPT", "DeepSeek", "Replit", "Claude", "Kimi", "Saxo Investor", "Santander", "Bloomberg", "MarketWatch", "Euronext", "Revolut", "Bitvavo", "Binance", "Coinbase", "Base", "Valuta", "Raisin", "Uniswap", "Studielink", "Coursera", "DeepL", "Duolingo", "Google Translate", "WeChat", "Alipay", "Wix", "Ring", "UltraSync+", "MS Office", "Keeper", "Box", "Artsy", "Saatchi Art", "Funda", "Pararius", "Idealista", "Yaencontre", "Pisos.com", "Habitaclia", "Kunstveiling.nl", "Catawiki", "Middelheim", "Depot", "Smartify", "Arts & Culture", "Museumtijdschrift", "Google Lens", "Time to Momo", "Buienradar", "Weer.nl", "AccuWeather", "Safari", "Chrome", "Cabify", "Agenda", "Klok", "Rekenmachine"];

const OPEN_NEW_TAB = ["Buienradar", "Weer.nl", "AccuWeather"];


function HagaWebsiteMock() {
  const [activeTab, setActiveTab] = useState("Home");
  const [searchText, setSearchText] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [selectedSpec, setSelectedSpec] = useState<string | null>(null);
  const tabs = ["Home", "Specialismen", "Afspraken", "Bezoek", "Contact"];

  const specialismen = [
    { name: "Cardiologie", desc: "Hart- en vaatziekten", icon: Activity },
    { name: "Orthopedie", desc: "Botten, gewrichten en spieren", icon: Stethoscope },
    { name: "Neurologie", desc: "Hersenen en zenuwstelsel", icon: Brain },
    { name: "Kindergeneeskunde", desc: "Medische zorg voor kinderen", icon: HeartPulse },
    { name: "Oogheelkunde", desc: "Ogen en gezichtsvermogen", icon: Target },
    { name: "KNO", desc: "Keel, neus en oor", icon: Stethoscope },
    { name: "Dermatologie", desc: "Huid- en geslachtsziekten", icon: Sun },
    { name: "Gynaecologie", desc: "Vrouwenziekten en verloskunde", icon: HeartPulse },
    { name: "Urologie", desc: "Nieren en urinewegen", icon: Activity },
    { name: "Longgeneeskunde", desc: "Longziekten en ademhaling", icon: Activity },
  ];

  const renderSpecDetail = () => {
    const spec = specialismen.find(s => s.name === selectedSpec);
    if (!spec) return null;
    return (
      <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="px-4 pt-4 pb-8">
        <button onClick={() => setSelectedSpec(null)} className="flex items-center gap-1.5 text-sm font-medium text-[#1B1464] mb-4" data-testid="haga-spec-back">
          <ArrowLeft className="w-4 h-4" /> Terug
        </button>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-[#1B1464]/10 flex items-center justify-center">
            <spec.icon className="w-7 h-7 text-[#1B1464]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#1B1464]">{spec.name}</h2>
            <p className="text-sm text-gray-500">{spec.desc}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm mb-3">
          <h3 className="text-sm font-bold text-gray-800 mb-2">Over {spec.name}</h3>
          <p className="text-xs text-gray-600 leading-relaxed">De afdeling {spec.name} van het HagaZiekenhuis biedt hoogwaardige medische zorg. Onze specialisten werken met de nieuwste technieken en apparatuur om u de best mogelijke behandeling te bieden.</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm mb-3">
          <h3 className="text-sm font-bold text-gray-800 mb-3">Onze specialisten</h3>
          {["Dr. J. Bakker", "Dr. M. van den Berg", "Dr. A. de Groot"].map((name, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              <div className="w-9 h-9 rounded-full bg-[#1B1464]/10 flex items-center justify-center">
                <span className="text-xs font-bold text-[#1B1464]">{name.split(" ").pop()?.charAt(0)}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{name}</p>
                <p className="text-[11px] text-gray-400">{spec.name}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </div>
          ))}
        </div>
        <button className="w-full bg-[#96C216] text-white rounded-xl py-3 text-sm font-semibold mt-2 active:scale-[0.98] transition-transform" data-testid="haga-make-appointment">
          Afspraak maken
        </button>
      </motion.div>
    );
  };

  return (
    <div className="bg-white min-h-full" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div className="bg-[#1B1464] text-white">
        <div className="px-4 py-3 flex items-center justify-between">
          <button onClick={() => { setActiveTab("Home"); setSelectedSpec(null); setShowSearch(false); }} className="flex items-center gap-3" data-testid="haga-logo">
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight leading-tight">HagaZiekenhuis</span>
              <span className="text-[10px] text-white/60 tracking-wider uppercase">Den Haag</span>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <button className="bg-[#96C216] text-white text-xs font-semibold px-3 py-1.5 rounded-full active:scale-95 transition-transform" data-testid="haga-spoedknop">Spoed?</button>
            <button onClick={() => setShowSearch(!showSearch)} className="p-1" data-testid="haga-search-toggle">
              {showSearch ? <X className="w-5 h-5 text-white/70" /> : <Search className="w-5 h-5 text-white/70" />}
            </button>
          </div>
        </div>
        {showSearch && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="px-4 pb-3">
            <div className="bg-white/15 rounded-xl px-4 py-2.5 flex items-center gap-3">
              <Search className="w-4 h-4 text-white/60 shrink-0" />
              <input
                type="text"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                placeholder="Zoek specialisme, aandoening of behandeling..."
                className="bg-transparent w-full text-sm text-white placeholder:text-white/50 focus:outline-none"
                autoFocus
                data-testid="haga-search-input"
              />
            </div>
          </motion.div>
        )}
        <div className="flex gap-4 px-4 pb-2 text-xs text-white/80 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSelectedSpec(null); setShowSearch(false); }}
              className={`whitespace-nowrap pb-1 transition-colors ${activeTab === tab ? 'font-medium text-white border-b-2 border-[#96C216]' : 'hover:text-white/90'}`}
              data-testid={`haga-tab-${tab.toLowerCase()}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {selectedSpec ? renderSpecDetail() : activeTab === "Home" ? (
        <>
          <div className="relative bg-gradient-to-br from-[#1B1464] to-[#2D1F8E] text-white p-6 pb-10">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M20 0L40 20L20 40L0 20Z\' fill=\'%23ffffff\' fill-opacity=\'0.05\'/%3E%3C/svg%3E")', backgroundSize: '40px 40px' }} />
            <h1 className="text-2xl font-bold mb-2 relative z-10">Waar kunnen wij u mee helpen?</h1>
            <p className="text-sm text-white/80 mb-4 relative z-10">Welkom bij HagaZiekenhuis. Wij staan voor u klaar.</p>
            <button onClick={() => setShowSearch(true)} className="relative z-10 bg-white/15 backdrop-blur rounded-xl px-4 py-3 flex items-center gap-3 w-full text-left" data-testid="haga-hero-search">
              <Search className="w-4 h-4 text-white/60 shrink-0" />
              <span className="text-sm text-white/50">Zoek specialisme, aandoening of behandeling...</span>
            </button>
          </div>

          <div className="px-4 -mt-5 relative z-10">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 mb-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Calendar, label: "Afspraak maken", color: "#1B1464", tab: "Afspraken" },
                  { icon: MapPin, label: "Locaties", color: "#96C216", tab: "Contact" },
                  { icon: Stethoscope, label: "Specialismen", color: "#1B1464", tab: "Specialismen" },
                  { icon: ClipboardList, label: "Mijn Haga", color: "#96C216", tab: "" },
                  { icon: Activity, label: "Uitslagen", color: "#1B1464", tab: "" },
                  { icon: Pill, label: "Medicijnen", color: "#96C216", tab: "" },
                ].map((item, i) => (
                  <button key={i} onClick={() => { if (item.tab) setActiveTab(item.tab); }} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-gray-50 active:scale-95 transition-all" data-testid={`haga-quick-${i}`}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: item.color + '12', color: item.color }}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-medium text-gray-700 text-center leading-tight">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="px-4 mb-4">
            <h2 className="text-base font-bold text-[#1B1464] mb-3">Nieuws & actueel</h2>
            {[
              { title: "HagaZiekenhuis opent nieuw behandelcentrum", date: "5 maart 2026", img: "linear-gradient(135deg, #1B1464, #4B3BA6)" },
              { title: "Nieuwe MRI-scanner in gebruik genomen", date: "28 februari 2026", img: "linear-gradient(135deg, #96C216, #6B8E23)" },
              { title: "Patiënttevredenheid stijgt naar 8.7", date: "20 februari 2026", img: "linear-gradient(135deg, #0D9488, #14B8A6)" },
            ].map((item, i) => (
              <button key={i} className="flex gap-3 mb-3 bg-white rounded-xl border border-gray-100 p-3 shadow-sm w-full text-left hover:border-gray-200 active:scale-[0.99] transition-all" data-testid={`haga-news-${i}`}>
                <div className="w-20 h-16 rounded-lg shrink-0 flex items-center justify-center" style={{ background: item.img }}>
                  <HospitalIcon className="w-6 h-6 text-white/80" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 leading-tight mb-1">{item.title}</h3>
                  <span className="text-[11px] text-gray-400">{item.date}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="px-4 mb-4">
            <h2 className="text-base font-bold text-[#1B1464] mb-3">Onze locaties</h2>
            <div className="space-y-2">
              {[
                { name: "Locatie Leyweg", addr: "Leyweg 275, Den Haag", tel: "(070) 210 0000" },
                { name: "Locatie Sportlaan", addr: "Sportlaan 600, Den Haag", tel: "(070) 210 0000" },
              ].map((loc, i) => (
                <button key={i} onClick={() => setActiveTab("Contact")} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3 shadow-sm w-full text-left hover:border-gray-200 active:scale-[0.99] transition-all" data-testid={`haga-location-${i}`}>
                  <div className="w-10 h-10 rounded-lg bg-[#96C216]/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-[#96C216]" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-gray-900 block">{loc.name}</span>
                    <span className="text-xs text-gray-500">{loc.addr}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 pb-4">
            <div className="bg-[#96C216]/10 rounded-2xl p-4 text-center">
              <div className="flex justify-center mb-2">
                <div className="flex items-center gap-1">
                  {[1,2,3,4].map(i => <Star key={i} className="w-4 h-4 text-[#96C216] fill-[#96C216]" />)}
                  <Star className="w-4 h-4 text-[#96C216] fill-[#96C216]/50" />
                </div>
              </div>
              <p className="text-sm font-semibold text-[#1B1464]">Patiëntbeoordeling: 8.7 / 10</p>
              <p className="text-xs text-gray-500 mt-1">Gebaseerd op 12.847 beoordelingen</p>
            </div>
          </div>
        </>
      ) : activeTab === "Specialismen" ? (
        <div className="px-4 pt-4 pb-8">
          <h2 className="text-lg font-bold text-[#1B1464] mb-1">Specialismen</h2>
          <p className="text-xs text-gray-500 mb-4">Kies een specialisme voor meer informatie</p>
          <div className="space-y-2">
            {specialismen
              .filter(s => !searchText || s.name.toLowerCase().includes(searchText.toLowerCase()) || s.desc.toLowerCase().includes(searchText.toLowerCase()))
              .map((spec, i) => (
              <button key={i} onClick={() => setSelectedSpec(spec.name)} className="bg-white rounded-xl border border-gray-100 p-3.5 flex items-center gap-3 shadow-sm w-full text-left hover:border-gray-200 active:scale-[0.99] transition-all" data-testid={`haga-spec-${i}`}>
                <div className="w-10 h-10 rounded-xl bg-[#1B1464]/10 flex items-center justify-center">
                  <spec.icon className="w-5 h-5 text-[#1B1464]" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-semibold text-gray-900 block">{spec.name}</span>
                  <span className="text-[11px] text-gray-500">{spec.desc}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </button>
            ))}
          </div>
        </div>
      ) : activeTab === "Afspraken" ? (
        <div className="px-4 pt-4 pb-8">
          <h2 className="text-lg font-bold text-[#1B1464] mb-1">Afspraak maken</h2>
          <p className="text-xs text-gray-500 mb-4">Plan uw afspraak bij het HagaZiekenhuis</p>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-4">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#96C216]/10 flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-8 h-8 text-[#96C216]" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">Online afspraak maken</h3>
              <p className="text-xs text-gray-500 mb-4">Maak eenvoudig een afspraak via Mijn HagaZiekenhuis</p>
              <button className="w-full bg-[#1B1464] text-white rounded-xl py-3 text-sm font-semibold active:scale-[0.98] transition-transform" data-testid="haga-appointment-portal">
                Ga naar Mijn HagaZiekenhuis
              </button>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-3">Of bel ons</h3>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-[#1B1464]/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-[#1B1464]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Afsprakenbureau</p>
                <p className="text-xs text-[#1B1464] font-medium">(070) 210 0000</p>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === "Bezoek" ? (
        <div className="px-4 pt-4 pb-8">
          <h2 className="text-lg font-bold text-[#1B1464] mb-1">Bezoek informatie</h2>
          <p className="text-xs text-gray-500 mb-4">Alles wat u moet weten over uw bezoek</p>
          {[
            { title: "Bezoektijden", desc: "Dagelijks van 14:00 tot 20:00 uur", icon: Calendar, detail: "Maximaal 2 bezoekers per patiënt" },
            { title: "Parkeren", desc: "P1 en P2 beschikbaar, betaald parkeren", icon: MapPin, detail: "Eerste 30 minuten gratis" },
            { title: "Eten & drinken", desc: "Restaurant en koffiecorner aanwezig", icon: Building2, detail: "Open van 08:00 tot 19:30 uur" },
            { title: "WiFi", desc: "Gratis WiFi beschikbaar", icon: Globe, detail: "Netwerk: HagaZiekenhuis-Gast" },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm mb-3" data-testid={`haga-visit-${i}`}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#1B1464]/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-[#1B1464]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{item.title}</h3>
                  <p className="text-xs text-gray-600 mt-0.5">{item.desc}</p>
                  <p className="text-[11px] text-gray-400 mt-1">{item.detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : activeTab === "Contact" ? (
        <div className="px-4 pt-4 pb-8">
          <h2 className="text-lg font-bold text-[#1B1464] mb-1">Contact</h2>
          <p className="text-xs text-gray-500 mb-4">Neem contact op met het HagaZiekenhuis</p>
          {[
            { name: "Locatie Leyweg", addr: "Leyweg 275, 2545 CH Den Haag", tel: "(070) 210 0000" },
            { name: "Locatie Sportlaan", addr: "Sportlaan 600, 2548 AK Den Haag", tel: "(070) 210 0000" },
          ].map((loc, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm mb-3" data-testid={`haga-contact-${i}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-[#96C216]/10 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-[#96C216]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{loc.name}</h3>
                  <p className="text-xs text-gray-500">{loc.addr}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#1B1464]" />
                  <span className="text-sm font-medium text-[#1B1464]">{loc.tel}</span>
                </div>
                <span className="text-[10px] text-gray-400">Ma-Vr 08:00-17:00</span>
              </div>
            </div>
          ))}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-2">Spoedeisende hulp</h3>
            <p className="text-xs text-gray-600 mb-3">De SEH is 24 uur per dag, 7 dagen per week bereikbaar.</p>
            <button className="w-full bg-red-500 text-white rounded-xl py-3 text-sm font-semibold active:scale-[0.98] transition-transform" data-testid="haga-emergency">
              Bel 112 bij levensbedreiging
            </button>
          </div>
        </div>
      ) : null}

      <div className="bg-[#1B1464] text-white/60 px-4 py-6 text-center">
        <p className="text-xs font-semibold text-white/80 mb-1">HagaZiekenhuis</p>
        <p className="text-[10px]">Leyweg 275 | 2545 CH Den Haag</p>
        <p className="text-[10px]">Tel: (070) 210 0000</p>
        <p className="text-[10px] mt-2">© 2026 HagaZiekenhuis</p>
      </div>
    </div>
  );
}

function DigiDAppConfirm({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<"confirm" | "verified">("confirm");

  const handleConfirm = () => {
    setStep("verified");
    setTimeout(onComplete, 1500);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="bg-white rounded-2xl border border-gray-200 p-5 max-w-sm mx-auto">
        {step === "confirm" ? (
          <>
            <div className="text-center mb-5">
              <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Inlogverzoek bevestigen</h2>
              <p className="text-sm text-gray-500">Wilt u inloggen bij MijnHagaZiekenhuis?</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 mb-5">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Dienst</span>
                  <span className="font-medium text-gray-900">MijnHagaZiekenhuis</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Niveau</span>
                  <span className="font-medium text-gray-900">Substantieel</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tijdstip</span>
                  <span className="font-medium text-gray-900">{new Date().toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleConfirm}
              className="w-full bg-green-600 text-white rounded-xl py-3.5 text-sm font-semibold hover:bg-green-700 transition-colors active:scale-[0.98] mb-3"
              data-testid="digid-app-accept"
            >
              Ja, ik wil inloggen
            </button>
            <button
              className="w-full border border-red-200 text-red-600 rounded-xl py-3 text-sm font-medium hover:bg-red-50 transition-colors"
              data-testid="digid-app-deny"
            >
              Nee, annuleren
            </button>
          </>
        ) : (
          <div className="text-center py-4">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8 text-green-600" />
              </div>
            </motion.div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Inloggen gelukt!</h2>
            <p className="text-sm text-gray-500">U wordt doorgestuurd naar MijnHagaZiekenhuis...</p>
            <div className="mt-4">
              <div className="w-8 h-8 rounded-full border-2 border-green-200 border-t-green-600 animate-spin mx-auto" />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function MijnHagaPortalMock({ onDomainChange }: { onDomainChange?: (domain: string) => void }) {
  const [email, setEmail] = useState("ges@w€spr.eu");
  const [password, setPassword] = useState("");
  const [phase, setPhase] = useState<"login" | "logging-in" | "dashboard" | "digid">("login");
  const [loginError, setLoginError] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [digidLoaded, setDigidLoaded] = useState(false);

  const handleEmailLogin = () => {
    if (!email.trim()) {
      setLoginError("Vul uw e-mailadres in");
      return;
    }
    if (!email.includes("@")) {
      setLoginError("Vul een geldig e-mailadres in");
      return;
    }
    if (!password.trim()) {
      setLoginError("Vul uw wachtwoord in");
      return;
    }
    setLoginError("");
    setPhase("logging-in");
    setTimeout(() => setPhase("dashboard"), 1500);
  };

  const handleDigiD = () => {
    setPhase("digid");
    setDigidLoaded(false);
    onDomainChange?.("digid.nl");
  };

  const handleDigiDBack = () => {
    setPhase("login");
    onDomainChange?.("mijn.hagaziekenhuis.nl");
  };

  if (phase === "logging-in") {
    return (
      <div className="bg-gray-50 min-h-full flex flex-col items-center justify-center px-6" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#1B1464]/10 flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 rounded-full border-2 border-[#1B1464]/20 border-t-[#1B1464] animate-spin" />
          </div>
          <h2 className="text-base font-bold text-gray-900 mb-1">Even geduld...</h2>
          <p className="text-sm text-gray-500">Uw gegevens worden opgehaald</p>
        </div>
      </div>
    );
  }

  if (phase === "digid") {
    const proxyUrl = `/api/proxy?url=${encodeURIComponent("https://www.digid.nl")}`;
    return (
      <div className="flex flex-col min-h-full" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
        <div className="bg-[#D45B07]">
          <div className="px-4 py-3 flex items-center gap-3">
            <button onClick={handleDigiDBack} className="h-8 w-8 flex items-center justify-center text-white hover:bg-white/20 rounded-full" data-testid="digid-back">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-white/20 flex items-center justify-center">
                <Fingerprint className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white/20 rounded-lg px-3 py-1.5 flex items-center gap-2 flex-1 min-w-0">
                <Lock className="w-3 h-3 text-white/70 shrink-0" />
                <span className="text-xs text-white/90 truncate font-medium">digid.nl</span>
                {digidLoaded && <div className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0 ml-auto animate-pulse" />}
              </div>
            </div>
            <button onClick={() => window.open("https://www.digid.nl", "_blank")} className="h-8 w-8 flex items-center justify-center text-white hover:bg-white/20 rounded-full" data-testid="digid-external">
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!digidLoaded && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-white">
            <div className="w-10 h-10 rounded-full border-2 border-[#D45B07]/40 border-t-transparent animate-spin" />
            <p className="text-sm text-gray-500">DigiD wordt geladen...</p>
          </div>
        )}
        <iframe
          src={proxyUrl}
          className={`flex-1 border-0 w-full ${digidLoaded ? '' : 'h-0 overflow-hidden'}`}
          style={digidLoaded ? { minHeight: '100vh' } : {}}
          onLoad={() => setDigidLoaded(true)}
          title="DigiD"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-full" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div className="bg-[#1B1464]">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[#96C216] flex items-center justify-center">
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <div>
              <span className="text-white font-bold text-sm">Mijn HagaZiekenhuis</span>
              <span className="block text-[10px] text-white/50">Patiëntenportaal</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-white/50" />
            <span className="text-xs text-white/50">NL</span>
          </div>
        </div>
      </div>

      {phase === "login" ? (
        <div className="px-4 pt-8 pb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 max-w-sm mx-auto">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-[#1B1464]/5 flex items-center justify-center mx-auto mb-3">
                <Shield className="w-8 h-8 text-[#1B1464]" />
              </div>
              <h1 className="text-xl font-bold text-[#1B1464]">Inloggen</h1>
              <p className="text-sm text-gray-500 mt-1">Welkom bij het patiëntenportaal</p>
            </div>

            {loginError && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mb-4 bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">{loginError}</p>
              </motion.div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">E-mailadres</label>
                <div className={`relative rounded-xl border-2 transition-all ${emailFocused ? 'border-[#1B1464] ring-2 ring-[#1B1464]/10' : email ? 'border-gray-300' : 'border-gray-200'}`}>
                  <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${emailFocused ? 'text-[#1B1464]' : 'text-gray-400'}`} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setLoginError(""); }}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    placeholder="uw.email@voorbeeld.nl"
                    className="w-full bg-transparent rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none"
                    data-testid="portal-email-input"
                    autoComplete="email"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">Wachtwoord</label>
                <div className={`relative rounded-xl border-2 transition-all ${passwordFocused ? 'border-[#1B1464] ring-2 ring-[#1B1464]/10' : password ? 'border-gray-300' : 'border-gray-200'}`}>
                  <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${passwordFocused ? 'text-[#1B1464]' : 'text-gray-400'}`} />
                  <input
                    type="password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setLoginError(""); }}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    placeholder="Wachtwoord"
                    className="w-full bg-transparent rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none"
                    data-testid="portal-password-input"
                    autoComplete="current-password"
                  />
                </div>
              </div>
              <button
                onClick={handleEmailLogin}
                className="w-full bg-[#1B1464] text-white rounded-xl py-3.5 text-sm font-semibold hover:bg-[#2D1F8E] transition-colors active:scale-[0.98]"
                data-testid="portal-login-button"
              >
                Inloggen
              </button>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <div className="flex-1 border-t border-gray-100" />
              <span className="text-xs text-gray-400">of</span>
              <div className="flex-1 border-t border-gray-100" />
            </div>

            <button
              onClick={handleDigiD}
              className="w-full mt-4 bg-[#D45B07] text-white rounded-xl py-3.5 flex items-center justify-center gap-2.5 text-sm font-semibold hover:bg-[#C04F06] transition-colors active:scale-[0.98]"
              data-testid="portal-digid-button"
            >
              <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center">
                <Fingerprint className="w-4 h-4 text-white" />
              </div>
              Inloggen met DigiD
            </button>

            <div className="text-center mt-5">
              <a className="text-xs text-[#1B1464] font-medium cursor-pointer hover:underline">Wachtwoord vergeten?</a>
            </div>
          </div>

          <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-4 max-w-sm mx-auto">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-800 mb-0.5">Veilige verbinding</p>
                <p className="text-[11px] text-gray-500 leading-relaxed">Uw gegevens worden versleuteld verzonden via een beveiligde verbinding.</p>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-white rounded-2xl border border-gray-100 p-4 max-w-sm mx-auto">
            <p className="text-xs font-semibold text-gray-800 mb-2">Wat kunt u in Mijn HagaZiekenhuis?</p>
            <div className="space-y-2">
              {[
                { icon: Calendar, text: "Afspraken inzien en beheren" },
                { icon: FileText, text: "Uitslagen en brieven bekijken" },
                { icon: Pill, text: "Medicijnoverzicht raadplegen" },
                { icon: MessageSquare, text: "Berichten sturen naar uw arts" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <item.icon className="w-3.5 h-3.5 text-[#96C216] shrink-0" />
                  <span className="text-[11px] text-gray-600">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="px-4 pt-6 pb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 max-w-sm mx-auto mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#1B1464]/10 flex items-center justify-center">
                <span className="text-lg font-bold text-[#1B1464]">JD</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Jan de Vries</p>
                <p className="text-xs text-gray-500">Patiëntnummer: 1234567</p>
              </div>
            </div>
            <div className="bg-[#96C216]/10 rounded-xl p-3">
              <p className="text-xs font-semibold text-[#1B1464] mb-1">Eerstvolgende afspraak</p>
              <p className="text-sm font-bold text-gray-900">Dinsdag 11 maart 2026, 10:30</p>
              <p className="text-xs text-gray-500 mt-0.5">Polikliniek Cardiologie - Locatie Leyweg</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto mb-4">
            {[
              { icon: Calendar, label: "Afspraken", count: "3", color: "#1B1464" },
              { icon: FileText, label: "Uitslagen", count: "2 nieuw", color: "#96C216" },
              { icon: MessageSquare, label: "Berichten", count: "1", color: "#0D9488" },
              { icon: Pill, label: "Medicijnen", count: "5", color: "#E67E22" },
            ].map((item, i) => (
              <button key={i} className="bg-white rounded-xl border border-gray-100 p-4 text-left shadow-sm" data-testid={`portal-tile-${i}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: item.color + '12', color: item.color }}>
                    <item.icon className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: item.color + '15', color: item.color }}>{item.count}</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{item.label}</p>
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-4 max-w-sm mx-auto">
            <p className="text-xs font-semibold text-gray-800 mb-3">Recente activiteit</p>
            {[
              { text: "Bloedonderzoek resultaten beschikbaar", time: "Vandaag, 09:15", icon: Activity },
              { text: "Afspraak bevestigd bij dr. Bakker", time: "Gisteren, 14:30", icon: Calendar },
              { text: "Recept verlengd: Metformine 500mg", time: "3 mrt, 11:00", icon: Pill },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
                <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">
                  <item.icon className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800">{item.text}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => { setPhase("login"); setEmail(""); setPassword(""); }}
            className="w-full max-w-sm mx-auto mt-4 border border-gray-200 rounded-xl py-2.5 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors block"
            data-testid="portal-logout"
          >
            Uitloggen
          </button>
        </div>
      )}

      <div className="bg-[#1B1464] text-white/50 px-4 py-5 text-center">
        <p className="text-[10px]">© 2026 HagaZiekenhuis - Patiëntenportaal</p>
        <p className="text-[10px] mt-1">Privacy | Gebruiksvoorwaarden | Hulp</p>
      </div>
    </div>
  );
}

function HospitalBrowser({ hospital, domain, color, onBack, target }: { hospital: Hospital; domain: string; color: string; onBack: () => void; target: "website" | "portal" }) {
  const [loaded, setLoaded] = useState(false);
  const [currentDomain, setCurrentDomain] = useState(domain);
  const [headerColor, setHeaderColor] = useState(color);
  const useProxy = target === "website";
  const targetUrl = target === "portal" ? (hospital.portalUrl || hospital.url) : hospital.url;
  const proxyUrl = `/api/proxy?url=${encodeURIComponent(targetUrl)}`;

  const handleDomainChange = (newDomain: string) => {
    setCurrentDomain(newDomain);
    if (newDomain === "digid.nl") {
      setHeaderColor("#D45B07");
    } else {
      setHeaderColor(color);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="px-3 py-2 flex items-center gap-2 border-b border-border/30 shadow-sm shrink-0 transition-colors duration-300" style={{ backgroundColor: headerColor }}>
        <button onClick={onBack} className="h-9 w-9 flex items-center justify-center text-white hover:bg-white/20 rounded-full" data-testid="back-from-browser">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="text-lg shrink-0">{currentDomain === "digid.nl" ? "🔐" : hospital.flag}</span>
          <div className="bg-white/20 rounded-lg px-3 py-1.5 flex items-center gap-2 flex-1 min-w-0">
            <Lock className="w-3 h-3 text-white/70 shrink-0" />
            <span className="text-xs text-white/90 truncate font-medium">{currentDomain}</span>
            {loaded && <div className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0 ml-auto animate-pulse" />}
          </div>
        </div>
        <button onClick={() => window.open(targetUrl, "_blank")} className="h-8 w-8 flex items-center justify-center text-white hover:bg-white/20 rounded-full" data-testid="open-hospital-external">
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>

      {useProxy ? (
        <div className="flex-1 relative">
          {!loaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background z-10">
              <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${color}40`, borderTopColor: 'transparent' }} />
              <p className="text-sm text-muted-foreground">Website laden...</p>
            </div>
          )}
          <iframe
            src={proxyUrl}
            className="w-full h-full border-0"
            onLoad={() => setLoaded(true)}
            title={hospital.name}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          />
        </div>
      ) : (
        <div className="flex-1 relative overflow-y-auto overflow-x-hidden">
          <MijnHagaPortalMock onDomainChange={handleDomainChange} />
        </div>
      )}
    </div>
  );
}

function MedischDossierView({ onBack }: { onBack: () => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [connectedHospital, setConnectedHospital] = useState<Hospital | null>(null);
  const [gatePhase, setGatePhase] = useState<"login" | "eudi" | "biometric" | "connected" | null>(null);
  const [bioState, setBioState] = useState<"idle" | "scanning" | "success">("idle");
  const [activeRegion, setActiveRegion] = useState<RegionId>("all");
  const color = "#0D9488";
  const EU_BLUE = "#003399";

  const handleSelectHospital = (hospital: Hospital) => {
    setSelectedHospital(hospital);
    setBioState("idle");
    setGatePhase("eudi");
  };

  const handleBiometric = async () => {
    if (bioState !== "idle") return;
    setBioState("scanning");
    const ok = await moTriggerWebAuthn();
    const proceed = () => {
      setBioState("success");
      setTimeout(() => {
        if (selectedHospital) setConnectedHospital(selectedHospital);
        setGatePhase("connected");
      }, 700);
    };
    if (ok) proceed(); else setTimeout(proceed, 1500);
  };

  const resetGate = () => { setGatePhase(null); setSelectedHospital(null); setBioState("idle"); };

  const filteredHospitals = ALL_HOSPITALS.filter(h => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || h.name.toLowerCase().includes(q) || h.city.toLowerCase().includes(q) || h.country.toLowerCase().includes(q);
    const matchesRegion = activeRegion === "all" || h.region === activeRegion;
    return matchesSearch && matchesRegion;
  });

  // ── EUDI Gate: 1. Login keuze ────────────────────────────────────────────
  if (gatePhase === "login" && selectedHospital) {
    const portalDomain = (selectedHospital.portalUrl || selectedHospital.url).replace("https://", "").replace("www.", "").replace(/\/.*$/, "");
    const loginLabel = selectedHospital.loginName || `Mijn ${selectedHospital.name}`;
    return (
      <div className="h-full overflow-y-auto bg-gray-50" style={{ fontFamily: "system-ui, sans-serif" }}>
        <div className="px-4 py-3 flex items-center justify-between shrink-0" style={{ background: color }}>
          <div className="flex items-center gap-2">
            <button onClick={resetGate} className="text-white/70 hover:text-white p-1 -ml-1 mr-1"><ArrowLeft className="w-5 h-5" /></button>
            <span className="text-3xl">{selectedHospital.flag}</span>
            <span className="text-white font-bold text-sm">{selectedHospital.name}</span>
          </div>
          <div className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-white/60" /><span className="text-white/60 text-[11px]">{portalDomain}</span></div>
        </div>
        <div className="px-5 pt-8 pb-10">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-white shadow-md border border-gray-100 flex items-center justify-center mx-auto mb-4 text-4xl">
              {selectedHospital.flag}
            </div>
            <h1 className="text-xl font-bold text-gray-900">{loginLabel}</h1>
            <p className="text-sm text-gray-500 mt-1">{selectedHospital.city}, {selectedHospital.country}</p>
          </div>
          <button onClick={() => setGatePhase("eudi")} className="w-full rounded-2xl py-4 px-5 flex items-center gap-4 mb-4 shadow-lg active:scale-[0.98] transition-all" style={{ background: "linear-gradient(135deg, #003399 0%, #0055DD 100%)" }} data-testid={`btn-hosp-eudi-${selectedHospital.id}`}>
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0"><EU_STARS_MO size={28} /></div>
            <div className="flex-1 text-left"><p className="text-white font-bold text-[15px] leading-tight">Inloggen met W€spr</p><p className="text-white/70 text-[12px] mt-0.5">EUDI Wallet · eIDAS 2.0 gecertificeerd</p></div>
            <ChevronRight className="w-5 h-5 text-white/60 shrink-0" />
          </button>
          <button onClick={() => selectedHospital.portalUrl && window.open(selectedHospital.portalUrl, "_blank")} className="w-full rounded-2xl py-4 px-5 flex items-center gap-4 mb-6 border border-gray-200 bg-white active:scale-[0.98] transition-all" data-testid={`btn-hosp-pw-${selectedHospital.id}`}>
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0"><Globe className="w-5 h-5 text-gray-500" /></div>
            <div className="flex-1 text-left"><p className="text-gray-800 font-semibold text-[15px]">Inloggen met wachtwoord</p><p className="text-gray-400 text-[12px] mt-0.5">Opent patiëntportaal in uw browser</p></div>
            <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
          </button>
          <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
            <div><p className="text-[13px] font-semibold text-teal-700">Veilig toegang via W€spr Medisch Dossier</p><p className="text-[11px] text-gray-600 mt-0.5 leading-snug">W€spr is gecertificeerd onder eIDAS 2.0. Uw medisch dossier blijft altijd versleuteld en privé.</p></div>
          </div>
        </div>
      </div>
    );
  }

  // ── EUDI Gate: 2. EUDI toestemmingsscherm ───────────────────────────────
  if (gatePhase === "eudi" && selectedHospital) {
    const portalDomain = (selectedHospital.portalUrl || selectedHospital.url).replace("https://", "").replace("www.", "").replace(/\/.*$/, "");
    const dataItems = [
      { label: "Volledige naam", value: "G.E. Spr" },
      { label: "Geboortedatum", value: "14 maart 1985" },
      { label: "BSN / Patiënt-ID", value: "••• ••• •••" },
      { label: "E-mailadres", value: "ges@w€spr.eu" },
      { label: "Verzekeringsgegevens", value: "CZ · Polisnr. ••••••" },
    ];
    return (
      <div className="h-full overflow-y-auto bg-white" style={{ fontFamily: "system-ui, sans-serif" }}>
        <div className="px-4 py-3 flex items-center gap-3 shrink-0" style={{ background: EU_BLUE }}>
          <button onClick={() => setGatePhase(null)} className="text-white/70 hover:text-white p-1 -ml-1"><ArrowLeft className="w-5 h-5" /></button>
          <div className="flex items-center gap-2 flex-1"><EU_STARS_MO size={20} /><span className="text-white font-bold text-sm">W€spr EUDI Wallet</span></div>
          <span className="text-white/50 text-[10px] font-medium uppercase tracking-wider">eIDAS 2.0</span>
        </div>
        <div className="px-5 pt-6 pb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center bg-white text-3xl shrink-0">{selectedHospital.flag}</div>
            <div><p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Aanvraag van</p><p className="text-lg font-bold text-gray-900">{selectedHospital.name}</p><p className="text-[12px] text-gray-500">{portalDomain}</p></div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-5 flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[12px] text-amber-800 leading-snug"><span className="font-semibold">{selectedHospital.name}</span> vraagt toegang tot uw medische identiteitsgegevens voor patiëntportaal-login.</p>
          </div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Te delen gegevens</p>
          <div className="space-y-2 mb-6">
            {dataItems.map(item => (
              <div key={item.label} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                <span className="text-[13px] text-gray-600">{item.label}</span>
                <span className="text-[13px] font-semibold text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: EU_BLUE }}><EU_STARS_MO size={22} /></div>
            <div><p className="text-[12px] font-bold text-[#003399]">Gecertificeerd onder EU-verordening 910/2014</p><p className="text-[10px] text-gray-500 mt-0.5">W€spr EUDI Wallet · eIDAS 2.0</p></div>
          </div>
          <button onClick={() => setGatePhase("biometric")} className="w-full rounded-2xl py-4 px-5 flex items-center gap-4 shadow-lg active:scale-[0.98] transition-all mb-3" style={{ background: "linear-gradient(135deg, #003399 0%, #0055DD 100%)" }} data-testid={`btn-hosp-eudi-toestaan-${selectedHospital.id}`}>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0"><Fingerprint className="w-5 h-5 text-white" /></div>
            <div className="flex-1 text-left"><p className="text-white font-bold text-[15px]">Toestaan &amp; bevestigen</p><p className="text-white/70 text-[12px]">Verifieer met Face ID of vingerafdruk</p></div>
            <ChevronRight className="w-5 h-5 text-white/60" />
          </button>
          <button onClick={() => setGatePhase(null)} className="w-full text-center text-sm text-gray-400 underline underline-offset-2 py-2" data-testid="btn-hosp-eudi-weigeren">Annuleren</button>
        </div>
      </div>
    );
  }

  // ── EUDI Gate: 3. Biometrische verificatie ──────────────────────────────
  if (gatePhase === "biometric" && selectedHospital) {
    return (
      <div className="h-full flex flex-col overflow-hidden bg-white" style={{ fontFamily: "system-ui, sans-serif" }}>
        <div className="px-4 py-3 flex items-center gap-3 shrink-0" style={{ background: EU_BLUE }}>
          <button onClick={() => setGatePhase("eudi")} className="text-white/70 hover:text-white p-1 -ml-1"><ArrowLeft className="w-5 h-5" /></button>
          <EU_STARS_MO size={20} />
          <span className="text-white font-bold text-sm">W€spr EUDI Wallet · Verificatie</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
          <div className="flex flex-col items-center gap-1 text-center">
            <div className="flex items-center gap-2 mb-2"><EU_STARS_MO size={22} /><span className="text-[#003399] font-bold text-sm">EUDI Wallet · W€spr</span></div>
            <p className="text-xl font-bold text-gray-900">{bioState === "success" ? "Identiteit bevestigd" : "Bevestig uw identiteit"}</p>
            <p className="text-sm text-gray-500">{bioState === "scanning" ? "Verifiëren..." : bioState === "success" ? `U wordt ingelogd bij ${selectedHospital.name}...` : `Voor toegang tot ${selectedHospital.loginName || `Mijn ${selectedHospital.name}`}`}</p>
          </div>
          <motion.button
            onClick={handleBiometric} disabled={bioState !== "idle"}
            animate={bioState === "scanning" ? { boxShadow: ["0 0 0 0px rgba(0,51,153,0.3)", "0 0 0 22px rgba(0,51,153,0)"] } : {}}
            transition={{ repeat: Infinity, duration: 1.4 }}
            className={`w-36 h-36 rounded-full border-4 flex flex-col items-center justify-center gap-2 transition-all duration-500 cursor-pointer active:scale-95 ${bioState === "success" ? "border-green-400 bg-green-50" : bioState === "scanning" ? "border-[#003399] bg-[#003399]/8" : "border-gray-200 bg-gray-50"}`}
            data-testid={`btn-hosp-biometric-${selectedHospital.id}`}
          >
            {bioState === "success" ? <Check className="w-14 h-14 text-green-500" /> : <Fingerprint className={`w-14 h-14 ${bioState === "scanning" ? "text-[#003399]" : "text-gray-400"}`} />}
            <span className={`text-[11px] font-semibold ${bioState === "success" ? "text-green-600" : bioState === "scanning" ? "text-[#003399]" : "text-gray-400"}`}>
              {bioState === "success" ? "Bevestigd ✓" : bioState === "scanning" ? "Wacht op apparaat..." : "Touch ID · Face ID"}
            </span>
          </motion.button>
          <div className="w-full bg-teal-50 border border-teal-100 rounded-2xl p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
            <div><p className="text-[13px] font-semibold text-teal-700">W€spr Medisch Dossier</p><p className="text-[11px] text-gray-500 mt-0.5 leading-snug">Uw biometrische verificatie wordt lokaal verwerkt. Medische gegevens worden nooit zonder uw toestemming gedeeld.</p></div>
          </div>
          <button onClick={() => setGatePhase("eudi")} className="text-sm text-gray-400 underline underline-offset-2" data-testid="btn-hosp-bio-cancel">Annuleren</button>
        </div>
      </div>
    );
  }

  // ── EUDI Gate: 4. Verbonden ──────────────────────────────────────────────
  if (gatePhase === "connected" && selectedHospital) {
    const loginLabel = selectedHospital.loginName || `Mijn ${selectedHospital.name}`;
    const portalDomain = (selectedHospital.portalUrl || selectedHospital.url).replace("https://", "").replace("www.", "").replace(/\/.*$/, "");
    return (
      <div className="h-full flex flex-col overflow-hidden bg-white" style={{ fontFamily: "system-ui, sans-serif" }}>
        <div className="px-4 py-3 flex items-center gap-3 shrink-0" style={{ background: color }}>
          <button onClick={resetGate} className="text-white/70 hover:text-white p-1 -ml-1"><ArrowLeft className="w-5 h-5" /></button>
          <span className="text-xl">{selectedHospital.flag}</span>
          <span className="text-white font-semibold text-[14px] flex-1">{selectedHospital.name}</span>
          <div className="flex items-center gap-1"><EU_STARS_MO size={16} /><span className="text-white/70 text-[10px] font-medium">W€spr</span></div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-5">
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-xl border-2 bg-white text-5xl" style={{ borderColor: `${color}30` }}>
              {selectedHospital.flag}
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center border-2 border-white"><Check className="w-4 h-4 text-white" /></div>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Verbonden met {selectedHospital.name}</h2>
            <p className="text-sm text-gray-500 leading-snug">Uw identiteit is geverifieerd via W€spr EUDI Wallet.<br />Tik hieronder om de website van <strong>{loginLabel}</strong> te openen.</p>
          </div>
          <a href={selectedHospital.portalUrl || selectedHospital.url} target="_blank" rel="noopener noreferrer" className="w-full rounded-2xl py-4 px-5 flex items-center gap-4 shadow-md active:scale-[0.98] transition-all no-underline" style={{ background: color }} data-testid={`btn-hosp-open-portal-${selectedHospital.id}`}>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0"><Globe className="w-5 h-5 text-white" /></div>
            <div className="flex-1 text-left"><p className="text-white font-bold text-[15px]">{loginLabel} openen</p><p className="text-white/70 text-[12px]">{portalDomain}</p></div>
            <ChevronRight className="w-5 h-5 text-white/60" />
          </a>
          <div className="w-full bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#003399] shrink-0 mt-0.5" />
            <div><p className="text-[13px] font-semibold text-[#003399]">Ingelogd via W€spr EUDI Wallet</p><p className="text-[11px] text-gray-500 mt-0.5 leading-snug">Uw geverifieerde identiteit is gedeeld met {selectedHospital.name} via eIDAS 2.0.</p></div>
          </div>
          <button onClick={resetGate} className="text-sm text-gray-400 underline underline-offset-2" data-testid="btn-hosp-back-connected">Terug naar ziekenhuiszoeker</button>
        </div>
      </div>
    );
  }

  const renderHospitalCard = (hospital: Hospital) => (
    <button
      key={hospital.id}
      onClick={() => handleSelectHospital(hospital)}
      className="w-full text-left bg-card rounded-2xl border border-border/40 p-3.5 hover:border-border transition-colors active:scale-[0.99]"
      data-testid={`hospital-${hospital.id}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 bg-muted/50">{hospital.flag}</div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold truncate">{hospital.name}</h3>
          <p className="text-xs text-muted-foreground">{hospital.city}, {hospital.country}</p>
          {hospital.loginName && <p className="text-[10px] mt-0.5 font-medium" style={{ color }}>{hospital.loginName}</p>}
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
      </div>
    </button>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-full overflow-y-auto bg-background">
      <div className="px-5 pt-6 pb-3" style={{ background: `linear-gradient(180deg, ${color}12, transparent)` }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15`, color }}>
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Medisch Dossier</h2>
            <p className="text-xs text-muted-foreground">Zoek uw ziekenhuis wereldwijd</p>
          </div>
        </div>
        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Zoek op ziekenhuis, stad of land..."
            className="w-full h-11 pl-10 pr-10 rounded-xl bg-card border border-border/50 text-sm outline-none focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]/30 transition-all"
            data-testid="input-hospital-search"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2" data-testid="clear-hospital-search">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
          {REGIONS.map((region) => (
            <button
              key={region.id}
              onClick={() => setActiveRegion(region.id)}
              className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0"
              style={activeRegion === region.id
                ? { backgroundColor: color, color: "white" }
                : { backgroundColor: "var(--muted)", color: "var(--muted-foreground)" }
              }
              data-testid={`region-filter-${region.id}`}
            >
              {region.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 py-2">
        {connectedHospital && !gatePhase && (
          <div className="mb-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 flex items-center gap-3" data-testid="connected-hospital-card">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-2xl shadow-sm border border-emerald-100 shrink-0">{connectedHospital.flag}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Verbonden</p>
              </div>
              <p className="text-[13px] font-bold text-gray-900 truncate">{connectedHospital.loginName || `Mijn ${connectedHospital.name}`}</p>
            </div>
            <a
              href={connectedHospital.portalUrl || connectedHospital.url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 px-3 py-1.5 rounded-xl text-[12px] font-semibold text-white active:scale-95 transition-all no-underline"
              style={{ background: color }}
              data-testid="btn-reopen-connected-hospital"
            >
              Openen
            </a>
          </div>
        )}

        {filteredHospitals.length > 0 && (
          <div className="space-y-1.5">
            {filteredHospitals.map(renderHospitalCard)}
          </div>
        )}

        {filteredHospitals.length === 0 && (
          <div className="text-center py-8">
            <HospitalIcon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Geen ziekenhuizen gevonden</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Probeer een andere zoekterm of regio</p>
          </div>
        )}
      </div>

      <div className="px-5 py-4">
        <div className="text-center text-[11px] text-muted-foreground">
          <p>{ALL_HOSPITALS.length} ziekenhuizen in {new Set(ALL_HOSPITALS.map(h => h.country)).size} landen</p>
          <div className="flex items-center justify-center gap-2 mt-1">
            <Lock className="w-3 h-3" />
            <span>End-to-end versleuteld via W€spr ID</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function GovWebView({ label, onBack }: { label: string; onBack: () => void }) {
  const app = GOV_APPS[label];
  const personal = GOV_PERSONAL_LOGIN[label] ?? null;
  const hasPersonalLogin = personal !== null;
  const skipIframe = SKIP_IFRAME.includes(label);
  const openNewTab = OPEN_NEW_TAB.includes(label);
  const isCustomView = label === "W€spr Medisch Dossier";

  const initialPhase = hasPersonalLogin ? "eudi" : (isCustomView ? "fallback" : "splash");
  const [phase, setPhase] = useState<"login" | "eudi" | "biometric" | "splash" | "iframe" | "fallback" | "browser" | "opened" | "connected">(initialPhase);
  const [bioState, setBioState] = useState<"idle" | "scanning" | "success">("idle");
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [browserLoaded, setBrowserLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Voor persoonlijke apps: gebruik de login-URL als proxy-URL
  const activeUrl = (hasPersonalLogin && personal) ? personal.loginUrl : (app?.url ?? "");
  const activeDomain = (hasPersonalLogin && personal) ? personal.loginDomain : (app ? app.url.replace("https://", "").replace("www.", "").replace(/\/.*$/, "") : "");
  const proxyUrl = `/api/proxy?url=${encodeURIComponent(activeUrl)}`;
  const logo = LOGOS[label];
  const shouldOpenExternal = OPEN_EXTERNAL.includes(label);

  const openInBrowser = () => {
    const a = document.createElement("a");
    a.href = activeUrl; a.target = "_blank"; a.rel = "noopener noreferrer";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setPhase("opened");
  };
  const openExternal = () => window.open(activeUrl, "_blank");

  const handleBiometric = async () => {
    if (bioState !== "idle") return;
    setBioState("scanning");
    const ok = await moTriggerWebAuthn();
    const proceed = () => {
      setBioState("success");
      setTimeout(() => setPhase("connected"), 700);
    };
    if (ok) { proceed(); } else { setTimeout(proceed, 1500); }
  };

  useEffect(() => {
    if (phase !== "splash" || !app || isCustomView) return;
    const delay = (skipIframe && shouldOpenExternal) ? 800 : 2000;
    const splashTimer = setTimeout(() => setPhase(skipIframe ? "fallback" : "iframe"), delay);
    return () => clearTimeout(splashTimer);
  }, [phase, app, skipIframe, shouldOpenExternal, isCustomView]);

  useEffect(() => {
    if (!app || phase !== "iframe") return;
    const fallbackTimer = setTimeout(() => { if (!iframeLoaded) setPhase("fallback"); }, 5000);
    return () => clearTimeout(fallbackTimer);
  }, [app, phase, iframeLoaded]);

  if (!app) return null;

  const handleIframeLoad = () => {
    setIframeLoaded(true);
    try {
      const iframe = iframeRef.current;
      if (iframe?.contentDocument) {
        const body = iframe.contentDocument.body;
        if (body && body.scrollHeight < 50) {
          setPhase("fallback");
          return;
        }
      }
    } catch (e) {}
  };

  const EU_BLUE = "#003399";

  // ── 1. Login scherm ───────────────────────────────────────────────────────
  if (phase === "login" && personal) {
    return (
      <div className="fixed inset-0 z-[1000] bg-gray-50 flex flex-col overflow-auto" style={{ fontFamily: "system-ui, sans-serif" }}>
        <div className="px-4 py-3 flex items-center justify-between shrink-0" style={{ background: app.color }}>
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="text-white/70 hover:text-white p-1 -ml-1 mr-1"><ArrowLeft className="w-5 h-5" /></button>
            {logo ? <img src={logo} alt="" className="w-6 h-6 rounded" /> : <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center text-white text-[11px] font-bold">{label[0]}</div>}
            <span className="text-white font-bold text-sm">{label}</span>
          </div>
          <div className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-white/60" /><span className="text-white/60 text-[11px]">{activeDomain}</span></div>
        </div>
        <div className="flex-1 px-5 pt-8 pb-10">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-white shadow-md border border-gray-100 flex items-center justify-center mx-auto mb-4">
              {logo ? <img src={logo} alt="" className="w-14 h-14 object-contain rounded-xl" /> : <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-2xl font-bold" style={{ background: app.color }}>{label[0]}</div>}
            </div>
            <h1 className="text-xl font-bold text-gray-900">Inloggen bij {label}</h1>
            <p className="text-sm text-gray-500 mt-1">{activeDomain}</p>
          </div>
          <button onClick={() => setPhase("eudi")} className="w-full rounded-2xl py-4 px-5 flex items-center gap-4 mb-4 shadow-lg active:scale-[0.98] transition-all" style={{ background: "linear-gradient(135deg, #003399 0%, #0055DD 100%)" }} data-testid={`btn-eudi-login-${label.toLowerCase().replace(/\s/g, "-")}`}>
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0"><EU_STARS_MO size={28} /></div>
            <div className="flex-1 text-left"><p className="text-white font-bold text-[15px] leading-tight">Inloggen met W€spr</p><p className="text-white/70 text-[12px] mt-0.5">EUDI Wallet · eIDAS 2.0 gecertificeerd</p></div>
            <ChevronRight className="w-5 h-5 text-white/60 shrink-0" />
          </button>
          <button onClick={openExternal} className="w-full rounded-2xl py-4 px-5 flex items-center gap-4 mb-6 border border-gray-200 bg-white active:scale-[0.98] transition-all" data-testid={`btn-pw-login-${label.toLowerCase().replace(/\s/g, "-")}`}>
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0"><Globe className="w-5 h-5 text-gray-500" /></div>
            <div className="flex-1 text-left"><p className="text-gray-800 font-semibold text-[15px]">Inloggen met wachtwoord</p><p className="text-gray-400 text-[12px] mt-0.5">Opent in uw browser</p></div>
            <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
          </button>
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#003399] shrink-0 mt-0.5" />
            <div><p className="text-[13px] font-semibold text-[#003399]">Veilig inloggen via W€spr</p><p className="text-[11px] text-gray-600 mt-0.5 leading-snug">W€spr is een gecertificeerde EUDI Wallet onder eIDAS 2.0. Geen wachtwoord nodig — uw identiteit wordt bevestigd via biometrie.</p></div>
          </div>
        </div>
      </div>
    );
  }

  // ── 2. EUDI Wallet toestemmingsscherm ─────────────────────────────────────
  if (phase === "eudi" && personal) {
    const dataItems = [
      { label: "Volledige naam", value: "G.E. Spr" },
      { label: "Geboortedatum", value: "14 maart 1985" },
      { label: "BSN / Identifier", value: "••• ••• •••" },
      { label: "E-mailadres", value: "ges@w€spr.eu" },
      { label: "Adres", value: "Amsterdam, Nederland" },
    ];
    return (
      <div className="fixed inset-0 z-[1000] bg-white flex flex-col overflow-hidden" style={{ fontFamily: "system-ui, sans-serif" }}>
        <div className="px-4 py-3 flex items-center gap-3 shrink-0" style={{ background: EU_BLUE }}>
          <button onClick={onBack} className="text-white/70 hover:text-white p-1 -ml-1"><ArrowLeft className="w-5 h-5" /></button>
          <div className="flex items-center gap-2 flex-1"><EU_STARS_MO size={20} /><span className="text-white font-bold text-sm">W€spr EUDI Wallet</span></div>
          <span className="text-white/50 text-[10px] font-medium uppercase tracking-wider">eIDAS 2.0</span>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pt-6 pb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center bg-white shrink-0">
              {logo ? <img src={logo} alt="" className="w-10 h-10 object-contain rounded-xl" /> : <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xl font-bold" style={{ background: app.color }}>{label[0]}</div>}
            </div>
            <div><p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Aanvraag van</p><p className="text-lg font-bold text-gray-900">{label}</p><p className="text-[12px] text-gray-500">{activeDomain}</p></div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-5 flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[12px] text-amber-800 leading-snug"><span className="font-semibold">{label}</span> vraagt toegang tot de volgende gegevens uit uw W€spr EUDI Wallet.</p>
          </div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Te delen gegevens</p>
          <div className="space-y-2 mb-6">
            {dataItems.map(item => (
              <div key={item.label} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                <span className="text-[13px] text-gray-600">{item.label}</span>
                <span className="text-[13px] font-semibold text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: EU_BLUE }}><EU_STARS_MO size={22} /></div>
            <div><p className="text-[12px] font-bold text-[#003399]">Gecertificeerd onder EU-verordening 910/2014</p><p className="text-[10px] text-gray-500 mt-0.5">W€spr is een door de EU erkende EUDI Wallet · eIDAS 2.0</p></div>
          </div>
          <button onClick={() => setPhase("biometric")} className="w-full rounded-2xl py-4 px-5 flex items-center gap-4 shadow-lg active:scale-[0.98] transition-all mb-3" style={{ background: "linear-gradient(135deg, #003399 0%, #0055DD 100%)" }} data-testid="btn-gov-eudi-toestaan">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0"><Fingerprint className="w-5 h-5 text-white" /></div>
            <div className="flex-1 text-left"><p className="text-white font-bold text-[15px]">Toestaan &amp; bevestigen</p><p className="text-white/70 text-[12px]">Verifieer met Face ID of vingerafdruk</p></div>
            <ChevronRight className="w-5 h-5 text-white/60" />
          </button>
          <button onClick={openExternal} className="w-full text-center text-sm text-gray-400 underline underline-offset-2 py-2" data-testid="btn-gov-eudi-weigeren">Liever inloggen met wachtwoord</button>
        </div>
      </div>
    );
  }

  // ── 3. Biometrisch verificatiescherm ──────────────────────────────────────
  if (phase === "biometric") {
    return (
      <div className="fixed inset-0 z-[1000] bg-white flex flex-col overflow-hidden" style={{ fontFamily: "system-ui, sans-serif" }}>
        <div className="px-4 py-3 flex items-center gap-3 shrink-0" style={{ background: EU_BLUE }}>
          <button onClick={() => setPhase("eudi")} className="text-white/70 hover:text-white p-1 -ml-1"><ArrowLeft className="w-5 h-5" /></button>
          <EU_STARS_MO size={20} />
          <span className="text-white font-bold text-sm">W€spr EUDI Wallet · Verificatie</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
          <div className="flex flex-col items-center gap-1 text-center">
            <div className="flex items-center gap-2 mb-2"><EU_STARS_MO size={22} /><span className="text-[#003399] font-bold text-sm">EUDI Wallet · W€spr</span></div>
            <p className="text-xl font-bold text-gray-900">{bioState === "success" ? "Identiteit bevestigd" : "Bevestig uw identiteit"}</p>
            <p className="text-sm text-gray-500">{bioState === "scanning" ? "Verifiëren..." : bioState === "success" ? `U wordt ingelogd bij ${label}...` : "Gebruik Face ID of vingerafdruk"}</p>
          </div>
          <motion.button
            onClick={handleBiometric} disabled={bioState !== "idle"}
            animate={bioState === "scanning" ? { boxShadow: ["0 0 0 0px rgba(0,51,153,0.3)", "0 0 0 22px rgba(0,51,153,0)"] } : {}}
            transition={{ repeat: Infinity, duration: 1.4 }}
            className={`w-36 h-36 rounded-full border-4 flex flex-col items-center justify-center gap-2 transition-all duration-500 cursor-pointer active:scale-95 ${bioState === "success" ? "border-green-400 bg-green-50" : bioState === "scanning" ? "border-[#003399] bg-[#003399]/8" : "border-gray-200 bg-gray-50"}`}
            data-testid={`btn-gov-biometric-${label.toLowerCase().replace(/\s/g, "-")}`}
          >
            {bioState === "success" ? <Check className="w-14 h-14 text-green-500" /> : <Fingerprint className={`w-14 h-14 ${bioState === "scanning" ? "text-[#003399]" : "text-gray-400"}`} />}
            <span className={`text-[11px] font-semibold ${bioState === "success" ? "text-green-600" : bioState === "scanning" ? "text-[#003399]" : "text-gray-400"}`}>
              {bioState === "success" ? "Bevestigd ✓" : bioState === "scanning" ? "Wacht op apparaat..." : "Touch ID · Face ID"}
            </span>
          </motion.button>
          <div className="w-full bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#003399] shrink-0 mt-0.5" />
            <div><p className="text-[13px] font-semibold text-[#003399]">Beveiligd via W€spr EUDI Wallet</p><p className="text-[11px] text-gray-500 mt-0.5 leading-snug">Uw biometrische verificatie wordt lokaal verwerkt. Geen biometrische data wordt verstuurd.</p></div>
          </div>
          <button onClick={() => setPhase("eudi")} className="text-sm text-gray-400 underline underline-offset-2" data-testid="btn-gov-bio-cancel">Annuleren</button>
        </div>
      </div>
    );
  }

  // ── 4. Verbonden (inTab apps) ──────────────────────────────────────────────
  if (phase === "connected" && personal) {
    return (
      <div className="fixed inset-0 z-[1000] bg-white flex flex-col overflow-hidden" style={{ fontFamily: "system-ui, sans-serif" }}>
        <div className="px-4 py-3 flex items-center gap-3 shrink-0" style={{ background: app.color }}>
          <button onClick={onBack} className="text-white/70 hover:text-white p-1 -ml-1"><ArrowLeft className="w-5 h-5" /></button>
          <div className="flex items-center gap-2 flex-1">{logo ? <img src={logo} alt="" className="w-6 h-6 rounded" /> : <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center text-white text-[11px] font-bold">{label[0]}</div>}<span className="text-white font-semibold text-[14px]">{label}</span></div>
          <div className="flex items-center gap-1"><EU_STARS_MO size={16} /><span className="text-white/70 text-[10px] font-medium">W€spr</span></div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-5">
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-xl" style={{ background: `${app.color}15`, border: `2px solid ${app.color}30` }}>
              {logo ? <img src={logo} alt="" className="w-16 h-16 rounded-2xl object-contain" /> : <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-3xl font-bold" style={{ background: app.color }}>{label[0]}</div>}
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center border-2 border-white"><Check className="w-4 h-4 text-white" /></div>
          </div>
          <div className="text-center"><h2 className="text-xl font-bold text-gray-900 mb-1">Verbonden met {label}</h2><p className="text-sm text-gray-500">Uw identiteit is geverifieerd via W€spr EUDI Wallet.<br />Tik hieronder om de website te openen.</p></div>
          <a href={personal.loginUrl} target="_blank" rel="noopener noreferrer" className="w-full rounded-2xl py-4 px-5 flex items-center gap-4 shadow-md active:scale-[0.98] transition-all no-underline" style={{ background: app.color }} data-testid={`btn-gov-open-login-${label.toLowerCase().replace(/\s/g, "-")}`}>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0"><Globe className="w-5 h-5 text-white" /></div>
            <div className="flex-1 text-left"><p className="text-white font-bold text-[15px]">{label} openen</p><p className="text-white/70 text-[12px]">{personal.loginDomain}</p></div>
            <ChevronRight className="w-5 h-5 text-white/60" />
          </a>
          <div className="w-full bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#003399] shrink-0 mt-0.5" />
            <div><p className="text-[13px] font-semibold text-[#003399]">Ingelogd via W€spr EUDI Wallet</p><p className="text-[11px] text-gray-500 mt-0.5 leading-snug">Uw geverifieerde identiteit is gedeeld met {label} via eIDAS 2.0.</p></div>
          </div>
          <button onClick={onBack} className="text-sm text-gray-400 underline underline-offset-2" data-testid="btn-gov-back-connected">Terug naar W€spr</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[1000] bg-background flex flex-col overflow-hidden" style={{ isolation: "isolate" }}>
      <header
        className="px-3 py-2 flex items-center gap-2 border-b border-border/30 shadow-sm shrink-0"
        style={{ backgroundColor: app.color, position: "relative", zIndex: 50 }}
      >
        <Button variant="ghost" size="icon" onClick={phase === "browser" ? () => setPhase("fallback") : onBack} className="-ml-1 h-9 w-9 text-white hover:bg-white/20 rounded-full" data-testid="gov-app-back">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0 flex items-center gap-2">
          {LOGOS[label] && <img src={LOGOS[label]} alt="" className="w-6 h-6 rounded shadow-sm" />}
          <div className="bg-white/20 rounded-lg px-3 py-1.5 flex items-center gap-2 flex-1 min-w-0">
            {app.url === "__APP_ONLY__" ? <ShieldCheck className="w-3 h-3 text-white/70 shrink-0" /> : <Globe className="w-3 h-3 text-white/70 shrink-0" />}
            <span className="text-xs text-white/90 truncate font-medium">{phase === "browser" ? activeDomain : label}</span>
            {((phase === "iframe" && iframeLoaded) || (phase === "browser" && browserLoaded)) && <div className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0 ml-auto animate-pulse" />}
          </div>
        </div>
        {(phase === "iframe" || phase === "browser") && (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20" onClick={openExternal}>
            <ExternalLink className="w-4 h-4" />
          </Button>
        )}
      </header>

      <div className="flex-1 relative overflow-hidden flex flex-col" style={{ zIndex: 1 }}>
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
                  transition={{ duration: 1.8, ease: "easeOut" }}
                  className="h-full"
                  style={{ backgroundColor: app.color }}
                />
              </div>
              <p className="text-xs font-bold tracking-tight">{label} wordt geopend...</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest opacity-60">Veilige verbinding</p>
            </div>
          </div>
        )}

        {phase === "fallback" && app.url === "__APP_ONLY__" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full overflow-y-auto bg-background"
          >
            <div className="px-5 pt-6 pb-5" style={{ background: `linear-gradient(180deg, ${app.color}18, transparent)` }}>
              <div className="flex items-start gap-4">
                {LOGOS[label] && <img src={LOGOS[label]} alt="" className="w-24 h-24 rounded-[20px] shadow-xl shrink-0" />}
                <div className="flex-1 min-w-0 pt-1">
                  <h2 className="text-xl font-bold mb-0.5">{label}</h2>
                  <p className="text-xs text-muted-foreground mb-2">Security & Beveiliging</p>
                  <div className="flex items-center gap-1 mb-2">
                    {[1,2,3,4,5].map(s => (
                      <svg key={s} className="w-3.5 h-3.5" fill={s <= 4 ? app.color : "#d1d5db"} viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                    ))}
                    <span className="text-xs text-muted-foreground ml-1">4.6</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${app.color}20`, color: app.color }}>Gratis</span>
                </div>
              </div>
            </div>

            <div className="px-5 pb-3">
              <div className="flex gap-3">
                {app.appStore && (
                  <Button
                    className="flex-1 h-12 rounded-xl text-white font-semibold text-sm shadow-md active:scale-[0.97] transition-transform bg-black hover:bg-black/90"
                    onClick={() => window.open(app.appStore, "_blank")}
                  >
                    <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                    App Store
                  </Button>
                )}
                {app.playStore && (
                  <Button
                    className="flex-1 h-12 rounded-xl text-white font-semibold text-sm shadow-md active:scale-[0.97] transition-transform"
                    style={{ backgroundColor: app.color }}
                    onClick={() => window.open(app.playStore, "_blank")}
                  >
                    <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="currentColor"><path d="M3.18 2.04L13.14 12 3.18 21.96a1.08 1.08 0 01-.18-.6V2.64c0-.22.06-.42.18-.6zM14.55 13.41l2.84 1.64-8.44 4.88 5.6-6.52zm3.65-3.53l2.3 1.33a.96.96 0 010 1.58l-2.3 1.33-3.14-2.12 3.14-2.12zM8.95 4.07l8.44 4.88-2.84 1.64-5.6-6.52z"/></svg>
                    Google Play
                  </Button>
                )}
              </div>
            </div>

            <div className="px-5 py-3">
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                {app.features.map((feature, i) => {
                  const FeatureIcon = feature.icon;
                  return (
                    <div key={i} className="min-w-[120px] flex-shrink-0 rounded-2xl p-4 text-center" style={{ backgroundColor: `${app.color}10` }}>
                      <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: `${app.color}20`, color: app.color }}>
                        <FeatureIcon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-medium leading-tight block">{feature.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="px-5 py-3">
              <h3 className="text-sm font-bold mb-2">Over deze app</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{app.description}</p>
            </div>

            <div className="px-5 py-3">
              <div className="bg-card rounded-2xl shadow-sm border border-border/40 p-4">
                <h3 className="text-sm font-bold mb-3">Informatie</h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Categorie</span><span className="font-medium">Security</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Compatibiliteit</span><span className="font-medium">iOS & Android</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Taal</span><span className="font-medium">Nederlands</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Prijs</span><span className="font-medium" style={{ color: app.color }}>Gratis</span></div>
                </div>
              </div>
            </div>

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

            <div className="px-5 py-4 pb-8">
              <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
                <ShieldCheck className="w-3 h-3" />
                <span>Beschikbaar als mobiele app</span>
              </div>
            </div>
          </motion.div>
        )}

        {phase === "fallback" && label === "W€spr Medisch Dossier" && (
          <MedischDossierView onBack={onBack} />
        )}

        {phase === "fallback" && app.url !== "__APP_ONLY__" && label !== "W€spr Medisch Dossier" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full overflow-y-auto bg-background"
          >
            <div className="px-5 pt-8 pb-4 text-center" style={{ background: `linear-gradient(135deg, ${app.color}15, ${app.color}05)` }}>
              {LOGOS[label] && <img src={LOGOS[label]} alt="" className="w-20 h-20 rounded-2xl shadow-lg mx-auto mb-4" />}
              <h2 className="text-xl font-bold mb-1">{label}</h2>
              <p className="text-sm text-muted-foreground">{app.description}</p>
            </div>
            <div className="px-5 py-4">
              <div className="bg-card rounded-2xl shadow-sm border border-border/40 overflow-hidden">
                {app.features.map((feature, i) => {
                  const FeatureIcon = feature.icon;
                  return (
                    <div key={i} className={`flex items-center gap-3 px-4 py-3.5 ${i < app.features.length - 1 ? "border-b border-border/30" : ""}`}>
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
              <Button
                className="w-full h-14 rounded-2xl text-white font-semibold text-[15px] shadow-lg active:scale-[0.98] transition-transform"
                style={{ backgroundColor: app.color }}
                onClick={openInBrowser}
              >
                Open {label}
                <Globe className="w-4 h-4 ml-2" />
              </Button>
            </div>
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
                <span>Beveiligde verbinding via {activeDomain}</span>
              </div>
            </div>
          </motion.div>
        )}

        {phase === "opened" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full flex flex-col items-center justify-center bg-background px-6"
          >
            {LOGOS[label] && <img src={LOGOS[label]} alt="" className="w-16 h-16 rounded-2xl shadow-lg mb-5" />}
            <h2 className="text-lg font-bold mb-1">{label} is geopend</h2>
            <p className="text-sm text-muted-foreground text-center mb-6">De app is geopend in een nieuw tabblad. Je kunt hieronder terugkeren naar W€spr.</p>
            <Button
              className="w-full max-w-[280px] h-12 rounded-2xl text-white font-semibold text-sm shadow-md active:scale-[0.98] transition-transform mb-3"
              style={{ backgroundColor: app.color }}
              onClick={() => {
                const a = document.createElement("a");
                a.href = app?.url || "";
                a.target = "_blank";
                a.rel = "noopener noreferrer";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              }}
            >
              <Globe className="w-4 h-4 mr-2" />
              Open {label} opnieuw
            </Button>
            <Button
              variant="outline"
              className="w-full max-w-[280px] h-12 rounded-2xl font-semibold text-[14px] border-2 active:scale-[0.98] transition-transform"
              onClick={onBack}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Terug naar W€spr
            </Button>
          </motion.div>
        )}

        {phase === "browser" && (
          <div className="absolute inset-0 flex flex-col">
            {!browserLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background z-10">
                <div className="w-8 h-8 border-3 border-muted border-t-primary rounded-full animate-spin mb-3" style={{ borderTopColor: app.color }} />
                <p className="text-sm text-muted-foreground">{label} laden...</p>
              </div>
            )}
            <iframe
              src={proxyUrl}
              className="w-full flex-1 border-0"
              onLoad={() => setBrowserLoaded(true)}
              onError={() => setPhase("fallback")}
              title={label}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        {(phase === "splash" || phase === "iframe") && !skipIframe && (
          <iframe
            ref={iframeRef}
            src={proxyUrl}
            className="w-full h-full border-0 absolute inset-0"
            onLoad={handleIframeLoad}
            onError={() => setPhase("fallback")}
            title={label}
            style={{ display: (phase === "iframe" && iframeLoaded) ? "block" : "none", zIndex: 1 }}
          />
        )}
      </div>
    </div>
  );
}

const RABO_RED = "#CC0000";
const EU_BLUE = "#003399";
const EU_YELLOW = "#FFCC00";
const isInIframe = typeof window !== "undefined" && window !== window.top;

function EuStarsRabo({ size = 32 }: { size?: number }) {
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
        <text key={i} x={s.x} y={s.y} textAnchor="middle" dominantBaseline="central" fontSize={size * 0.18} fill={EU_YELLOW}>★</text>
      ))}
    </svg>
  );
}

type RaboPhase = "login" | "eudi_consent" | "eudi_biometric" | "eudi_pin" | "eudi_verifying" | "logged_in";

export function RabobankEudiFlow({ onBack, onOpenAccounts }: { onBack: () => void; onOpenAccounts?: () => void }) {
  const [phase, setPhase] = useState<RaboPhase>("login");
  const [showSplash, setShowSplash] = useState(true);
  const [pinDigits, setPinDigits] = useState<string[]>([]);
  const [pinError, setPinError] = useState(false);
  const [verifyProgress, setVerifyProgress] = useState(0);
  const [webAuthnAvailable, setWebAuthnAvailable] = useState<boolean | null>(null);
  const [biometricScanning, setBiometricScanning] = useState(false);
  const [biometricSuccess, setBiometricSuccess] = useState(false);
  const [biometricError, setBiometricError] = useState<string | null>(null);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [activeTab, setActiveTab] = useState<"rekeningen" | "betalen" | "meer">("rekeningen");
  const [raboToast, setRaboToast] = useState<string | null>(null);

  const { data: me } = useQuery<any>({ queryKey: ["/api/me"] });
  const { data: txData } = useQuery<any[]>({ queryKey: ["/api/transactions"] });

  const firstName = me?.displayName?.split(" ")[0] || "Gebruiker";
  const fullName = me?.displayName || "G.E. Sarper";
  const balance = me?.walletBalance ?? 423050;
  const balanceEur = (balance / 100).toFixed(2).replace(".", ",");
  const transactions: any[] = txData || [];

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 1800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isInIframe) { setWebAuthnAvailable(false); return; }
    if (!window.PublicKeyCredential) { setWebAuthnAvailable(false); return; }
    window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      .then(ok => setWebAuthnAvailable(ok))
      .catch(() => setWebAuthnAvailable(false));
  }, []);

  useEffect(() => {
    if (phase !== "eudi_verifying") return;
    let v = 0;
    const iv = setInterval(() => {
      v += 14;
      setVerifyProgress(Math.min(v, 100));
      if (v >= 100) { clearInterval(iv); setTimeout(() => setPhase("logged_in"), 400); }
    }, 130);
    return () => clearInterval(iv);
  }, [phase]);

  const triggerWebAuthn = async (): Promise<"success" | "cancelled" | "unavailable"> => {
    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);
      const storedId = localStorage.getItem("wespr_biometric_cred_id");
      if (storedId) {
        try {
          const rawId = Uint8Array.from(atob(storedId), c => c.charCodeAt(0));
          const assertion = await navigator.credentials.get({
            publicKey: { challenge, rpId: window.location.hostname, allowCredentials: [{ type: "public-key", id: rawId, transports: ["internal"] as AuthenticatorTransport[] }], userVerification: "required", timeout: 60000 },
          });
          return assertion ? "success" : "cancelled";
        } catch {
          // Any error (domain mismatch, no passkey on device, etc.) — clear and re-register
          localStorage.removeItem("wespr_biometric_cred_id");
        }
      }
      // Register fresh credential for current domain
      const credential = await navigator.credentials.create({
        publicKey: { challenge, rp: { name: "W€spr", id: window.location.hostname }, user: { id: new Uint8Array([1, 2, 3]), name: me?.email || "user@wespr.eu", displayName: firstName }, pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }], authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" }, timeout: 60000 },
      });
      if (credential) {
        const rawRabo = new Uint8Array((credential as any).rawId);
        localStorage.setItem("wespr_biometric_cred_id", btoa(Array.from(rawRabo, b => String.fromCharCode(b)).join("")));
        return "success";
      }
      return "cancelled";
    } catch (e: any) {
      if (e?.name === "NotAllowedError" || e?.name === "AbortError") return "cancelled";
      return "unavailable";
    }
  };

  const handlePinDigit = (d: string) => {
    if (pinDigits.length >= 6) return;
    const next = [...pinDigits, d];
    setPinDigits(next);
    setPinError(false);
    if (next.length === 6) {
      const pin = next.join("");
      if (pin === "123456") {
        setTimeout(() => { setPinDigits([]); setPhase("eudi_verifying"); }, 300);
      } else {
        setTimeout(() => { setPinError(true); setPinDigits([]); }, 500);
      }
    }
  };

  const formatTxAmount = (amount: number, type: string) => {
    const eur = (Math.abs(amount) / 100).toFixed(2).replace(".", ",");
    return type === "incoming" ? `+ € ${eur}` : `- € ${eur}`;
  };

  const formatTxDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
  };

  if (showSplash) {
    return (
      <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center cursor-pointer" style={{ backgroundColor: RABO_RED }} onClick={() => setShowSplash(false)}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <img src="/images/rabobank-logo.svg" alt="Rabobank" className="w-20 h-20 rounded-2xl shadow-xl bg-white p-2" />
        </motion.div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-white font-bold text-lg mt-4">Rabobank</motion.p>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-4 w-40 h-1 bg-white/20 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 1.2, ease: "easeInOut" }} className="h-full bg-white rounded-full" />
        </motion.div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-white/40 text-xs mt-8">Tik om door te gaan</motion.p>
      </div>
    );
  }

  if (phase === "login") {
    return (
      <div className="fixed inset-0 z-[1000] bg-white flex flex-col overflow-hidden">
        <header className="px-4 py-3 flex items-center gap-2 shrink-0" style={{ backgroundColor: RABO_RED }}>
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 text-white hover:bg-white/20 -ml-1">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <img src="/images/rabobank-logo.svg" alt="" className="w-6 h-6 rounded bg-white p-0.5" />
          <span className="text-white font-bold text-sm flex-1">Rabobank</span>
        </header>

        <div className="flex-1 overflow-y-auto px-6 pt-8 pb-10">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Inloggen bij Rabobank</h1>
          <p className="text-sm text-gray-500 mb-7">Beheer je rekeningen, betalingen en meer</p>

          <div className="space-y-3 mb-6">
            <div className="border border-gray-200 rounded-xl px-4 py-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Gebruikersnaam</p>
              <p className="text-sm text-gray-400 italic">Typ je gebruikersnaam...</p>
            </div>
            <div className="border border-gray-200 rounded-xl px-4 py-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Wachtwoord</p>
              <p className="text-sm text-gray-400 italic">••••••••</p>
            </div>
          </div>

          <Button className="w-full h-12 rounded-xl font-bold mb-4 text-white" style={{ backgroundColor: RABO_RED }}>
            Inloggen
          </Button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">of log in met</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <button
            onClick={() => setPhase("eudi_consent")}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all active:scale-[0.98]"
            style={{ borderColor: EU_BLUE, background: `${EU_BLUE}08` }}
            data-testid="btn-rabo-eudi-login"
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: EU_BLUE }}>
              <EuStarsRabo size={28} />
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-[13px]" style={{ color: EU_BLUE }}>Inloggen met EUDI Wallet</p>
              <p className="text-[11px] text-gray-500">Je EU digitale identiteitsbewijs</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          <p className="text-[10px] text-gray-400 text-center mt-4">
            Beveiligd via eIDAS 2.0 · Europese Digital Identity
          </p>
        </div>
      </div>
    );
  }

  if (phase === "eudi_consent") {
    const items = [
      { label: "Naam", value: fullName, always: true },
      { label: "Geboortedatum", value: me?.dateOfBirth || "14 september 1988", always: true },
      { label: "BSN", value: "123 456 789", always: true },
      { label: "Nationaliteit", value: "Nederlandse", always: true },
    ];
    return (
      <div className="fixed inset-0 z-[1000] flex flex-col overflow-hidden" style={{ background: `linear-gradient(180deg, ${EU_BLUE} 0%, #001A6E 100%)` }}>
        <div className="px-5 pt-12 pb-5" style={{ background: "#001A6E" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <EuStarsRabo size={22} />
              <p className="text-[11px] font-bold tracking-widest uppercase" style={{ color: EU_YELLOW }}>EU Digital Identity</p>
            </div>
            <span className="text-white/30 text-[10px] bg-white/5 px-2 py-0.5 rounded-full">PID · NL</span>
          </div>
          <p className="text-white/70 text-[13px]">Rabobank vraagt toegang tot je gegevens</p>
        </div>

        <div className="flex-1 bg-white overflow-y-auto px-5 pt-6 pb-6">
          <div className="flex items-center gap-3 mb-5">
            <img src="/images/rabobank-logo.svg" alt="" className="w-10 h-10 rounded-xl bg-gray-50 p-1 border border-gray-100" />
            <div>
              <p className="font-bold text-sm text-gray-900">Rabobank</p>
              <p className="text-[11px] text-gray-500">rabobank.nl · Geverifieerde instelling</p>
            </div>
            <div className="ml-auto flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full">
              <ShieldCheck className="w-3 h-3 text-green-600" />
              <span className="text-[10px] font-bold text-green-700">Vertrouwd</span>
            </div>
          </div>

          <p className="text-sm font-semibold text-gray-800 mb-3">Te delen gegevens</p>
          <div className="space-y-2 mb-5">
            {items.map((item) => (
              <div key={item.label} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ backgroundColor: `${EU_BLUE}10` }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: EU_BLUE }}>
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] text-gray-500">{item.label}</p>
                  <p className="text-[13px] font-semibold text-gray-800">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-2 bg-blue-50 rounded-xl px-3 py-2.5 mb-5">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" style={{ color: EU_BLUE }} />
            <p className="text-[11px] text-blue-700">Je gegevens worden alleen gebruikt voor identificatie. Rabobank mag ze niet doorverkopen conform eIDAS 2.0.</p>
          </div>

          <Button
            className="w-full h-12 rounded-2xl font-bold text-[15px] gap-2 border-0 text-white"
            style={{ background: `linear-gradient(135deg, ${EU_BLUE}, #0044BB)` }}
            onClick={() => setPhase("eudi_biometric")}
            data-testid="btn-rabo-consent-bevestigen"
          >
            <Fingerprint className="w-4 h-4" />
            Bevestigen
          </Button>
          <Button variant="ghost" className="w-full mt-2 text-gray-400 text-sm" onClick={() => setPhase("login")}>
            Annuleren
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "eudi_biometric") {
    return (
      <div className="fixed inset-0 z-[1000] flex flex-col overflow-hidden" style={{ background: `linear-gradient(180deg, ${EU_BLUE} 0%, #001A6E 100%)` }}>
        <div className="px-5 pt-12 pb-5" style={{ background: "#001A6E" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <EuStarsRabo size={22} />
              <p className="text-[11px] font-bold tracking-widest uppercase" style={{ color: EU_YELLOW }}>EU Digital Identity</p>
            </div>
            <span className="text-white/30 text-[10px] bg-white/5 px-2 py-0.5 rounded-full">PID · NL</span>
          </div>
          <p className="text-white/70 text-[13px]">Bevestig je identiteit voor <span className="text-white font-semibold">Rabobank</span></p>
        </div>

        <div className="flex-1 bg-white rounded-t-3xl flex flex-col items-center px-6 pt-8 pb-6">
          <p className="text-gray-500 text-sm mb-6 text-center">Gebruik biometrie of PIN om je EUDI Wallet te ontgrendelen</p>

          <button
            onClick={async () => {
              if (biometricScanning || biometricSuccess) return;
              setBiometricError(null);
              if (webAuthnAvailable) {
                setBiometricScanning(true);
                const result = await triggerWebAuthn();
                if (result === "success") {
                  setBiometricSuccess(true);
                  setTimeout(() => setPhase("eudi_verifying"), 500);
                } else if (result === "cancelled") {
                  setBiometricScanning(false);
                  setBiometricError("Geannuleerd. Probeer opnieuw of gebruik PIN.");
                } else {
                  setBiometricScanning(false);
                  setBiometricError("Biometrie niet beschikbaar. Gebruik PIN.");
                }
              } else {
                setPhase("eudi_pin");
              }
            }}
            className="relative w-32 h-32 rounded-full focus:outline-none mb-3"
            data-testid="btn-biometric-rabobank"
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
                ${biometricSuccess ? "text-green-500" : biometricScanning ? "text-[#003399]" : webAuthnAvailable === false ? "text-gray-300" : "text-gray-400"}`} />
            </motion.div>
          </button>

          <p className="font-semibold text-gray-800 text-sm mb-1">
            {biometricSuccess ? "Identiteit bevestigd ✓" : biometricScanning ? "Wacht op apparaat..." : webAuthnAvailable === false ? "Tik om door te gaan met PIN" : "Touch ID · Face ID · Vingerafdruk"}
          </p>
          {webAuthnAvailable === true && !biometricScanning && !biometricSuccess && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 uppercase tracking-wide mb-1">Echte biometrie beschikbaar</span>
          )}
          {biometricError && <p className="text-xs text-red-500 text-center mt-1 mb-2">{biometricError}</p>}
          {isInIframe && !biometricSuccess && (
            <p className="text-[10px] text-amber-600 bg-amber-50 rounded-lg px-3 py-2 text-center mt-2 max-w-[240px]">
              In demo-modus: biometrie vereist een echt apparaat buiten de preview
            </p>
          )}

          <div className="flex-1" />
          <button onClick={() => { setBiometricError(null); setBiometricScanning(false); setPhase("eudi_pin"); }}
            className="text-sm font-semibold mt-4 mb-2" style={{ color: EU_BLUE }}>
            Liever EUDI PIN gebruiken
          </button>
          <button onClick={() => setPhase("eudi_consent")} className="text-xs text-gray-400">Terug</button>
        </div>
      </div>
    );
  }

  if (phase === "eudi_pin") {
    const digits = [1,2,3,4,5,6,7,8,9,"",0,"⌫"];
    return (
      <div className="fixed inset-0 z-[1000] flex flex-col overflow-hidden" style={{ background: `linear-gradient(180deg, ${EU_BLUE} 0%, #001A6E 100%)` }}>
        <div className="px-5 pt-12 pb-5" style={{ background: "#001A6E" }}>
          <div className="flex items-center gap-2 mb-2">
            <EuStarsRabo size={22} />
            <p className="text-[11px] font-bold tracking-widest uppercase" style={{ color: EU_YELLOW }}>EU Digital Identity</p>
          </div>
          <p className="text-white/70 text-[13px]">EUDI Wallet PIN voor <span className="text-white font-semibold">Rabobank</span></p>
        </div>
        <div className="flex-1 bg-white rounded-t-3xl flex flex-col items-center px-6 pt-8 pb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: `${EU_BLUE}15` }}>
            <Lock className="w-8 h-8" style={{ color: EU_BLUE }} />
          </div>
          <p className="font-bold text-gray-900 text-lg mb-1">EUDI Wallet PIN</p>
          <p className="text-gray-400 text-sm mb-6 text-center">Voer je 6-cijferige EUDI PIN in om je identiteit te bevestigen voor Rabobank</p>

          <div className="flex gap-3 mb-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all
                ${pinError ? "border-red-400 bg-red-50" : i < pinDigits.length ? "border-[#003399] bg-[#003399]" : "border-gray-200 bg-gray-50"}`}>
                {i < pinDigits.length && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
              </div>
            ))}
          </div>
          {pinError && <p className="text-red-500 text-xs mb-3">Verkeerde PIN. Probeer opnieuw.</p>}

          <div className="grid grid-cols-3 gap-3 mt-4 w-full max-w-[260px]">
            {digits.map((d, i) => (
              <button key={i} disabled={d === ""}
                onClick={() => d === "⌫" ? setPinDigits(p => p.slice(0, -1)) : typeof d === "number" ? handlePinDigit(String(d)) : undefined}
                className={`h-14 rounded-2xl text-xl font-bold transition-all active:scale-95
                  ${d === "" ? "invisible" : d === "⌫" ? "bg-gray-100 text-gray-600" : "bg-gray-50 text-gray-900 hover:bg-gray-100"}`}>
                {d}
              </button>
            ))}
          </div>
          <button onClick={() => setPhase("eudi_biometric")} className="text-sm mt-5" style={{ color: EU_BLUE }}>
            Liever biometrie gebruiken
          </button>
        </div>
      </div>
    );
  }

  if (phase === "eudi_verifying") {
    return (
      <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center" style={{ background: `linear-gradient(180deg, ${EU_BLUE} 0%, #001A6E 100%)` }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }} className="w-24 h-24 rounded-3xl bg-white/10 flex items-center justify-center mb-8">
          <EuStarsRabo size={56} />
        </motion.div>
        <p className="text-white font-bold text-xl mb-2">Identiteit verifiëren...</p>
        <p className="text-white/60 text-sm mb-8">Rabobank ontvangt je EUDI gegevens</p>
        <div className="w-56 h-2 bg-white/20 rounded-full overflow-hidden">
          <motion.div className="h-full rounded-full bg-white" animate={{ width: `${verifyProgress}%` }} transition={{ duration: 0.13 }} />
        </div>
        <div className="mt-6 flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
          <ShieldCheck className="w-4 h-4 text-white/70" />
          <p className="text-white/70 text-xs">Beveiligd via eIDAS 2.0</p>
        </div>
      </div>
    );
  }

  if (phase === "logged_in") {
    const recentTx = transactions.slice(0, 8);
    const showRaboToast = (msg: string) => {
      setRaboToast(msg);
      setTimeout(() => setRaboToast(null), 2500);
    };
    return (
      <div className="fixed inset-0 z-[1000] flex flex-col overflow-hidden bg-gray-50">
        {raboToast && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute bottom-8 left-4 right-4 z-50 bg-gray-900 text-white text-sm font-medium px-4 py-3 rounded-2xl shadow-xl text-center">
            {raboToast}
          </motion.div>
        )}

        <header className="px-4 pt-10 pb-4 shrink-0" style={{ backgroundColor: RABO_RED }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button onClick={onBack} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mr-1 active:bg-white/30" data-testid="btn-rabo-back">
                <ArrowLeft className="w-4 h-4 text-white" />
              </button>
              <img src="/images/rabobank-logo.svg" alt="" className="w-7 h-7 rounded bg-white p-0.5" />
              <span className="text-white font-bold text-base">Rabobank</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-white text-[11px] font-medium">EUDI</span>
              <EuStarsRabo size={14} />
            </div>
          </div>
          <p className="text-white/70 text-xs mb-1">Welkom terug,</p>
          <p className="text-white font-bold text-xl">{firstName}</p>
        </header>

        <div className="flex border-b border-gray-200 bg-white shrink-0">
          {(["rekeningen", "betalen", "meer"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-[12px] font-semibold capitalize transition-colors ${activeTab === tab ? "border-b-2" : "text-gray-400"}`}
              style={activeTab === tab ? { borderColor: RABO_RED, color: RABO_RED } : {}}>
              {tab === "rekeningen" ? "Rekeningen" : tab === "betalen" ? "Betalen" : "Meer"}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === "rekeningen" && (
            <div className="p-4 space-y-4">
              <div className="rounded-2xl overflow-hidden shadow-sm" style={{ background: `linear-gradient(135deg, ${RABO_RED}, #8B0000)` }}>
                <div className="px-5 pt-5 pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-white/70 text-[11px]">Betaalrekening</p>
                      <p className="text-white font-bold text-sm">{fullName}</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-2">
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-white font-bold text-3xl">
                      {balanceVisible ? `€ ${balanceEur}` : "€ ••••••"}
                    </p>
                    <button onClick={() => setBalanceVisible(v => !v)} className="text-white/60">
                      {balanceVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-white/50 text-[11px]">NL91 RABO 0123 4567 89</p>
                </div>
                <div className="border-t border-white/10 px-5 py-3 flex gap-4">
                  <button onClick={() => showRaboToast("Overschrijven: beschikbaar via Rabobank app")} className="flex-1 bg-white/15 active:bg-white/25 rounded-xl py-2 text-white text-[12px] font-semibold">Overschrijven</button>
                  <button onClick={() => showRaboToast("iDEAL: gebruik W€spr Pay voor betalingen")} className="flex-1 bg-white/15 active:bg-white/25 rounded-xl py-2 text-white text-[12px] font-semibold">iDEAL</button>
                  <button onClick={() => setActiveTab("meer")} className="flex-1 bg-white/15 active:bg-white/25 rounded-xl py-2 text-white text-[12px] font-semibold">Meer</button>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 pt-4 pb-2">
                  <p className="font-bold text-gray-800 text-sm">Recente transacties</p>
                  <span className="text-[11px] font-semibold" style={{ color: RABO_RED }}>Alles</span>
                </div>
                {recentTx.length === 0 ? (
                  <div className="px-4 pb-4 text-center text-gray-400 text-sm py-6">Geen transacties gevonden</div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {recentTx.map((tx: any) => (
                      <div key={tx.id} className="flex items-center gap-3 px-4 py-3" data-testid={`tx-rabo-${tx.id}`}>
                        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                          {tx.type === "incoming" ? <ArrowLeftRight className="w-4 h-4 text-green-600" /> : <Banknote className="w-4 h-4 text-gray-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{tx.description || tx.counterparty || "Betaling"}</p>
                          <p className="text-[11px] text-gray-400">{tx.createdAt ? formatTxDate(tx.createdAt) : ""}</p>
                        </div>
                        <p className={`text-sm font-bold shrink-0 ${tx.type === "incoming" ? "text-green-600" : "text-gray-800"}`}>
                          {formatTxAmount(tx.amount, tx.type)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-blue-50 rounded-2xl px-4 py-3 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: EU_BLUE }}>
                  <EuStarsRabo size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold" style={{ color: EU_BLUE }}>Ingelogd via EUDI Wallet</p>
                  <p className="text-[10px] text-blue-600/70">Alleen-lezen toegang conform eIDAS 2.0. Rabobank heeft je gegevens ontvangen.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "betalen" && (
            <div className="p-4 space-y-3">
              <p className="text-sm font-bold text-gray-700 mb-1">Betalingen</p>
              <p className="text-[11px] text-gray-400 mb-3">Betaalfuncties zijn beschikbaar via de Rabobank app of W€spr Pay.</p>
              {[
                { icon: ArrowLeftRight, label: "Overschrijven", desc: "Stuur geld naar een IBAN", toast: "Gebruik de Rabobank app of W€spr Pay → Overschrijven" },
                { icon: Smartphone, label: "Tikkie", desc: "Betaalverzoeken sturen", toast: "Tikkie werkt via de Rabobank app" },
                { icon: Banknote, label: "iDEAL QR", desc: "Scan een betaalcode", toast: "iDEAL betalingen doe je via W€spr Pay → Scan QR" },
              ].map(item => (
                <button key={item.label} onClick={() => showRaboToast(item.toast)}
                  className="w-full bg-white rounded-2xl px-4 py-4 flex items-center gap-3 shadow-sm active:bg-gray-50">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${RABO_RED}15` }}>
                    <item.icon className="w-5 h-5" style={{ color: RABO_RED }} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                    <p className="text-[11px] text-gray-400">{item.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
                </button>
              ))}
            </div>
          )}

          {activeTab === "meer" && (
            <div className="p-4 space-y-3">
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-50">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Accountbeheer</p>
                </div>
                <button onClick={() => showRaboToast("Rekening instellingen: beschikbaar via Rabobank app")}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-50">
                  <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-800 flex-1 text-left">Rekeninginstellingen</p>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>
                <button onClick={() => showRaboToast("Documenten: beschikbaar via Rabobank app")}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                  <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-gray-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-800 flex-1 text-left">Documenten & afschriften</p>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-white" />
                  </div>
                  <p className="font-bold text-sm text-emerald-800">PSD2 Open Banking</p>
                </div>
                <p className="text-[11px] text-emerald-700 leading-relaxed mb-3">
                  Koppel je Rabobank betaalrekening aan W€spr Pay voor live saldo en transacties. Je geeft W€spr alleen-lezen toegang via de Europese PSD2-wetgeving.
                </p>
                <button onClick={onOpenAccounts ?? onBack}
                  className="w-full bg-emerald-600 text-white text-[12px] font-bold py-2.5 rounded-xl active:bg-emerald-700"
                  data-testid="btn-rabo-naar-psd2">
                  Ga naar W€spr Pay → Rekeningen koppelen
                </button>
              </div>

              <button onClick={onBack}
                className="w-full bg-white rounded-2xl px-4 py-4 flex items-center gap-3 shadow-sm active:bg-gray-50"
                data-testid="btn-rabo-uitloggen">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                  <ArrowLeft className="w-5 h-5 text-red-500" />
                </div>
                <p className="text-sm font-semibold text-gray-800">Uitloggen bij Rabobank</p>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

// ─── MijnOverheid ────────────────────────────────────────────────────────────

const MO_BLUE = "#154273";
const MO_ORANGE = "#E17000";

const EU_STARS_MO = ({ size = 18 }: { size?: number }) => (
  <svg viewBox="0 0 40 40" width={size} height={size}>
    {Array.from({ length: 12 }, (_, i) => {
      const angle = (i * 30 - 90) * Math.PI / 180;
      const x = 20 + 13 * Math.cos(angle);
      const y = 20 + 13 * Math.sin(angle);
      return <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="6" fill="#FFCC00">★</text>;
    })}
  </svg>
);

async function moTriggerWebAuthn(): Promise<boolean> {
  try {
    const isInIframe = (() => { try { return window.self !== window.top; } catch { return true; } })();
    if (isInIframe || !(window as any).PublicKeyCredential) return false;
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const storedId = localStorage.getItem("wespr_biometric_cred_id");
    if (storedId) {
      try {
        const rawId = Uint8Array.from(atob(storedId), c => c.charCodeAt(0));
        const assertion = await navigator.credentials.get({
          publicKey: { challenge, rpId: window.location.hostname, allowCredentials: [{ type: "public-key", id: rawId, transports: ["internal"] as AuthenticatorTransport[] }], userVerification: "required", timeout: 60000 },
        });
        return !!assertion;
      } catch {
        localStorage.removeItem("wespr_biometric_cred_id");
      }
    }
    const credential = await navigator.credentials.create({
      publicKey: { challenge, rp: { name: "W€spr", id: window.location.hostname }, user: { id: new Uint8Array([1, 2, 3]), name: "ges@w\u20acspr.eu", displayName: "Ges" }, pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }], authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" }, timeout: 60000 },
    });
    if (credential) {
      const raw = new Uint8Array((credential as any).rawId);
      localStorage.setItem("wespr_biometric_cred_id", btoa(Array.from(raw, b => String.fromCharCode(b)).join("")));
      return true;
    }
    return false;
  } catch { return false; }
}

type MoPhase = "login" | "biometric" | "dashboard";
type MoBioState = "idle" | "scanning" | "success";

function MijnOverheidMock({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<MoPhase>("login");
  const [bioState, setBioState] = useState<MoBioState>("idle");
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const handleEudiLogin = async () => {
    if (bioState !== "idle") return;
    setPhase("biometric");
    setBioState("scanning");
    const ok = await moTriggerWebAuthn();
    if (ok) {
      setBioState("success");
      setTimeout(() => setPhase("dashboard"), 700);
    } else {
      setTimeout(() => {
        setBioState("success");
        setTimeout(() => setPhase("dashboard"), 700);
      }, 1500);
    }
  };

  // ── Login scherm ───────────────────────────────────────────────────────────
  if (phase === "login") {
    return (
      <div className="min-h-full bg-gray-50 flex flex-col" style={{ fontFamily: "'RO Sans', 'Noto Sans', system-ui, sans-serif" }}>
        {/* Gov.nl topbar */}
        <div className="bg-[#154273] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-sm bg-white flex items-center justify-center">
              <span className="text-[#154273] font-black text-[10px]">NL</span>
            </div>
            <span className="text-white font-bold text-sm">MijnOverheid</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-white/60" />
            <span className="text-white/60 text-[11px]">mijn.overheid.nl</span>
          </div>
        </div>

        <div className="flex-1 px-5 pt-8 pb-10">
          {/* Logo + titel */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-white shadow-md border border-gray-100 flex items-center justify-center mx-auto mb-4">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-[#154273] flex items-center justify-center mb-0.5">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <span className="text-[9px] font-bold text-[#154273]">OVERHEID</span>
              </div>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Inloggen bij MijnOverheid</h1>
            <p className="text-sm text-gray-500 mt-1">Uw persoonlijke overheidszaken op één plek</p>
          </div>

          {/* EUDI Wallet inloggen — hoofdknop */}
          <button
            onClick={handleEudiLogin}
            className="w-full rounded-2xl py-4 px-5 flex items-center gap-4 mb-4 shadow-lg active:scale-[0.98] transition-all"
            style={{ background: "linear-gradient(135deg, #003399 0%, #0050CC 100%)" }}
            data-testid="mo-eudi-login"
          >
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <EU_STARS_MO size={28} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-white font-bold text-[15px] leading-tight">Inloggen met W€spr</p>
              <p className="text-white/70 text-[12px] mt-0.5">EUDI Wallet · eIDAS 2.0 gecertificeerd</p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/60 shrink-0" />
          </button>

          {/* Veiligheidsinfo */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#154273] shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] font-semibold text-[#154273]">Veilig inloggen</p>
                <p className="text-[11px] text-gray-600 mt-0.5 leading-snug">W€spr is een gecertificeerde EUDI Wallet. Uw identiteit wordt bevestigd via biometrie — geen wachtwoord nodig.</p>
              </div>
            </div>
          </div>

          {/* Wat kunt u doen */}
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-3">Wat kunt u na inloggen doen?</p>
          <div className="space-y-2">
            {[
              { icon: Mail, label: "Berichten lezen van overheidsorganisaties" },
              { icon: FileText, label: "Uw persoonlijke gegevens inzien" },
              { icon: CreditCard, label: "Toeslagen en regelingen bekijken" },
              { icon: ClipboardList, label: "Status lopende zaken volgen" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-gray-100">
                <item.icon className="w-4 h-4 text-[#154273] shrink-0" />
                <p className="text-[13px] text-gray-700">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Biometrie ─────────────────────────────────────────────────────────────
  if (phase === "biometric") {
    return (
      <div className="min-h-full bg-white flex flex-col" style={{ fontFamily: "'RO Sans', 'Noto Sans', system-ui, sans-serif" }}>
        <div className="bg-[#154273] px-4 py-3 flex items-center gap-3">
          <div className="w-7 h-7 rounded-sm bg-white flex items-center justify-center">
            <span className="text-[#154273] font-black text-[10px]">NL</span>
          </div>
          <span className="text-white font-bold text-sm">MijnOverheid · Inloggen</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
          <div className="flex flex-col items-center gap-1 text-center">
            <div className="flex items-center gap-2 mb-2">
              <EU_STARS_MO size={24} />
              <span className="text-[#003399] font-bold text-sm">EUDI Wallet · W€spr</span>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {bioState === "success" ? "Identiteit bevestigd" : "Bevestig uw identiteit"}
            </p>
            <p className="text-sm text-gray-500">
              {bioState === "scanning" ? "Verifiëren..." : bioState === "success" ? "U wordt ingelogd bij MijnOverheid..." : "Gebruik Face ID of vingerafdruk"}
            </p>
          </div>

          <motion.div
            animate={bioState === "scanning" ? { boxShadow: ["0 0 0 0px rgba(21,66,115,0.3)", "0 0 0 22px rgba(21,66,115,0)"] } : {}}
            transition={{ repeat: Infinity, duration: 1.4 }}
            className={`w-36 h-36 rounded-full border-4 flex items-center justify-center transition-all duration-500 ${
              bioState === "success" ? "border-green-400 bg-green-50" :
              bioState === "scanning" ? "border-[#154273] bg-[#154273]/8" :
              "border-gray-200 bg-gray-50"
            }`}
            data-testid="mo-biometric-circle"
          >
            {bioState === "success" ? (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                <Check className="text-green-500" style={{ width: 72, height: 72 }} />
              </motion.div>
            ) : (
              <Fingerprint className={`transition-colors duration-500 ${bioState === "scanning" ? "text-[#154273]" : "text-gray-300"}`} style={{ width: 80, height: 80 }} />
            )}
          </motion.div>

          <p className="text-xs text-gray-400 text-center max-w-[200px]">
            {bioState === "success" ? "✓ Biometrie bevestigd" : bioState === "scanning" ? "Wacht op apparaat..." : "Tik om te verifiëren"}
          </p>

          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#154273]" />
            <p className="text-[10px] text-gray-400">Beveiligd · eIDAS 2.0 · Rijksoverheid</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Dashboard = echte mijn.overheid.nl via proxy ────────────────────────────
  if (phase === "dashboard") {
    return (
      <div className="min-h-full flex flex-col" style={{ fontFamily: "system-ui, sans-serif" }}>
        {/* W€spr browser-balk */}
        <div className="bg-[#154273] px-3 py-2 flex items-center gap-2 shrink-0">
          <button onClick={onBack} className="text-white/70 hover:text-white p-1 -ml-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          {/* adresbalk */}
          <div className="flex-1 bg-[#1e5a9e]/60 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
            <span className="text-white/90 text-[12px] font-mono truncate">mijn.overheid.nl</span>
          </div>
          {/* W€spr badge */}
          <div className="flex items-center gap-1 bg-white/10 rounded-lg px-2 py-1">
            <EU_STARS_MO size={14} />
            <span className="text-white text-[10px] font-bold">W€spr</span>
          </div>
        </div>

        {/* Laad-indicator */}
        {!iframeLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 mt-10">
            <div className="w-10 h-10 border-4 border-[#154273] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[13px] text-[#154273] font-semibold">Mijn Overheid laden…</p>
            <p className="text-[11px] text-gray-400 mt-1">Verbonden via W€spr EUDI Wallet</p>
          </div>
        )}

        {/* Echte mijn.overheid.nl */}
        <iframe
          src="/api/proxy?url=https%3A%2F%2Fmijn.overheid.nl"
          className="flex-1 w-full border-0"
          style={{ minHeight: "calc(100vh - 44px)" }}
          onLoad={() => setIframeLoaded(true)}
          title="MijnOverheid"
          allow="same-origin"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        />
      </div>
    );
  }

  return null;
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

const GOV_APP_LABELS = Object.keys(GOV_APPS);
export const isGovApp = (label: string) => GOV_APP_LABELS.includes(label);
export function GovAppView({ label, onBack }: { label: string; onBack: () => void }) {
  return <GovWebView label={label} onBack={onBack} />;
}
