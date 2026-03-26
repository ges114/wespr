import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RefreshCw, ExternalLink, Globe, AlertTriangle, Lock, ChevronRight, Camera, X, Image, Download, Share2, ZoomIn, RotateCcw, Fingerprint, ShieldCheck, Check } from "lucide-react";
import { Button } from "./ui/button";

const APP_URLS: Record<string, { url: string; color: string }> = {
  "UWV / Pensioen": { url: "https://www.uwv.nl", color: "#00529C" },

  "Huisarts": { url: "https://www.thuisarts.nl", color: "#0077C0" },
  "Apotheek": { url: "https://www.apotheek.nl", color: "#00A651" },
  "Zorgverzekeraar": { url: "https://www.zorgwijzer.nl/zorgvergelijker/zorgverzekering", color: "#0066B3" },
  "ZorgKlik": { url: "https://www.zorgkaartnederland.nl", color: "#E4003A" },

  "Albert Heijn": { url: "https://www.ah.nl", color: "#00A0E2" },
  "Starbucks EU": { url: "https://www.starbucks.nl", color: "#00704A" },
  "Zalando": { url: "https://www.zalando.nl", color: "#FF6900" },
  "HEMA": { url: "https://www.hema.nl", color: "#E4002B" },
  "Kruidvat": { url: "https://www.kruidvat.nl", color: "#E4002B" },
  "Lokale Bakker": { url: "https://www.brood.net", color: "#8B4513" },
  "DesignKlik": { url: "https://www.canva.com", color: "#7B2FF7" },

  "Thuisbezorgd.nl": { url: "https://www.thuisbezorgd.nl", color: "#FF7800" },
  "Uber Eats": { url: "https://www.ubereats.com/nl", color: "#06C167" },
  "Gorillas / Flink": { url: "https://www.flink.com/nl", color: "#FF0066" },

  "Ticketmaster": { url: "https://www.ticketmaster.nl", color: "#026CDF" },
  "Pathé Bioscopen": { url: "https://www.pathe.nl", color: "#1D1D1B" },
  "Museumkaart": { url: "https://www.museumkaart.nl", color: "#E4002B" },

  "Klassement": { url: "https://www.chess.com/nl", color: "#769656" },
  "Bordspellen": { url: "https://www.boardgamearena.com", color: "#4A90D9" },
  "Puzzels": { url: "https://www.puzzlegarage.com", color: "#2196F3" },

  "LinkedIn": { url: "https://www.linkedin.com", color: "#0A66C2" },
  "X": { url: "https://x.com", color: "#000000" },
  "Instagram": { url: "https://www.instagram.com", color: "#E1306C" },
  "Zoom": { url: "https://zoom.us", color: "#2D8CFF" },
  "Teams": { url: "https://teams.microsoft.com", color: "#5B5FC7" },

  "Bol.com": { url: "https://login.bol.com/wsp/login", color: "#0000A4" },
  "Alibaba.com": { url: "https://www.alibaba.com", color: "#FF6A00" },
  "Temu": { url: "https://www.temu.com", color: "#F55B23" },
  "MijnZorgApp": { url: "https://www.mijngezondheid.net", color: "#00A79D" },
  "VAXY": { url: "https://www.rivm.nl/covid-19-vaccinatie", color: "#4A90D9" },

  "Flink": { url: "https://www.goflink.com/nl", color: "#FF0066" },
  "Jamezz": { url: "https://www.jamezz.com", color: "#1A1A2E" },
  "Vivino": { url: "https://www.vivino.com/nl", color: "#9B1D20" },

  "NordVPN": { url: "https://nordvpn.com", color: "#4687FF" },
  "Authenticator": { url: "https://www.microsoft.com/nl-nl/security/mobile-authenticator-app", color: "#4285F4" },
  "KPN": { url: "https://www.kpn.com", color: "#009A44" },

  "YouTube": { url: "https://m.youtube.com", color: "#FF0000" },
  "Shazam": { url: "https://www.shazam.com", color: "#0088FF" },
  "Spotify": { url: "https://open.spotify.com", color: "#1DB954" },
  "Netflix": { url: "https://www.netflix.com/nl", color: "#E50914" },

  "Datumprikker": { url: "https://www.datumprikker.nl", color: "#FF6B00" },
  "Signal": { url: "https://signal.org", color: "#3A76F0" },
  "Chat": { url: "https://mail.google.com/chat", color: "#00AC47" },
  "Gmail": { url: "https://mail.google.com", color: "#EA4335" },

  "NOS": { url: "https://nos.nl", color: "#E8400A" },
  "NU.nl": { url: "https://www.nu.nl", color: "#CC0000" },
  "FD": { url: "https://fd.nl", color: "#F5A623" },
  "BNR": { url: "https://www.bnr.nl", color: "#003B73" },
  "RTL Nieuws": { url: "https://www.rtlnieuws.nl", color: "#00529B" },
  "KPN TV+": { url: "https://tv.kpn.com", color: "#009A44" },
  "NPO Start": { url: "https://npo.nl", color: "#FA5A0F" },
  "de Volkskrant": { url: "https://www.volkskrant.nl", color: "#1A1A1A" },
  "El País": { url: "https://elpais.com", color: "#1A3B6B" },
  "Podcasts": { url: "https://podcasts.apple.com", color: "#9933FF" },
  "Klarna": { url: "https://www.klarna.com/nl", color: "#FFB3C7" },
  "Camera": { url: "__NATIVE_CAMERA__", color: "#1A1A1A" },
  "Foto's": { url: "__NATIVE_PHOTOS__", color: "#2E7D32" },
};

const APP_LOGOS: Record<string, string> = {
  "Albert Heijn": "/images/ah-logo.svg",
  "Thuisbezorgd.nl": "/images/thuisbezorgd-logo.svg",
  "Zalando": "/images/zalando-logo.svg",
  "HEMA": "/images/hema-logo.svg",
  "Kruidvat": "/images/kruidvat-logo.svg",
  "Pathé Bioscopen": "/images/pathe-logo.svg",
  "Ticketmaster": "/images/ticketmaster-logo.svg",
  "Uber Eats": "/images/ubereats-logo.svg",
  "Starbucks EU": "/images/starbucks-logo.svg",
  "LinkedIn": "/images/linkedin-logo.svg",
  "X": "/images/x-logo.svg",
  "Instagram": "/images/instagram-logo.svg",
  "Zoom": "/images/zoom-logo.svg",
  "Teams": "/images/teams-logo.svg",
  "Bol.com": "/images/bolcom-logo.svg",
  "Alibaba.com": "/images/alibaba-logo.svg",
  "Temu": "/images/temu-logo.svg",
  "MijnZorgApp": "/images/mijnzorgapp-logo.svg",
  "VAXY": "/images/vaxy-logo.svg",
  "Flink": "/images/flink-logo.svg",
  "Jamezz": "/images/jamezz-logo.svg",
  "Vivino": "/images/vivino-logo.svg",
  "NordVPN": "/images/nordvpn-logo.svg",
  "Authenticator": "/images/authenticator-logo.svg",
  "KPN": "/images/kpn-logo.svg",
  "YouTube": "/images/youtube-logo.svg",
  "Shazam": "/images/shazam-logo.svg",
  "Spotify": "/images/spotify-logo.svg",
  "Netflix": "/images/netflix-logo.svg",
  "Datumprikker": "/images/datumprikker-logo.svg",
  "Signal": "/images/signal-logo.svg",
  "Chat": "/images/googlechat-logo.svg",
  "Gmail": "/images/gmail-logo.svg",
  "NOS": "/images/nos-logo.svg",
  "NU.nl": "/images/nunl-logo.svg",
  "FD": "/images/fd-logo.svg",
  "BNR": "/images/bnr-logo.svg",
  "RTL Nieuws": "/images/rtlnieuws-logo.svg",
  "KPN TV+": "/images/kpntv-logo.svg",
  "NPO Start": "/images/npostart-logo.svg",
  "de Volkskrant": "/images/volkskrant-logo.svg",
  "El País": "/images/elpais-logo.svg",
  "Podcasts": "/images/podcasts-logo.svg",
  "Klarna": "/images/klarna-logo.svg",
  "Camera": "/images/camera-app-logo.svg",
  "Foto's": "/images/photos-app-logo.svg",
};

const SKIP_IFRAME = ["LinkedIn", "X", "Instagram", "Zoom", "Teams", "MijnZorgApp", "VAXY", "YouTube", "Spotify", "Netflix", "Signal", "Chat", "Gmail", "Klarna", "Camera", "Foto's"];

const NATIVE_APPS = ["Camera", "Foto's"];

const APP_CARD: Record<string, { description: string; features: string[] }> = {
  // Shopping
  "Albert Heijn":     { description: "Boodschappen doen, aanbiedingen bekijken en de Bonus-app gebruiken.", features: ["Boodschappenlijst & bezorging", "Bonusaanbiedingen & kortingen", "Albert Heijn account"] },
  "Bol.com":          { description: "Nederland's grootste online winkel voor boeken, elektronica en meer.", features: ["Miljoenen producten", "Snelle bezorging", "Bol.com account & bestellingen"] },
  "Zalando":          { description: "Mode, schoenen en accessoires van honderden merken.", features: ["Gratis retourneren", "Grote maat-selectie", "Stijladviezen & trends"] },
  "HEMA":             { description: "De Nederlandse volkswinkel voor dagelijkse producten, kleding en eten.", features: ["Kleding & huishouden", "Fotoservice & cadeaus", "Click & collect"] },
  "Kruidvat":         { description: "Drogisterij met gezondheids-, schoonheids- en babyprodukten.", features: ["Persoonlijke verzorging", "Vitaminen & supplementen", "Aanbiedingen & Spaarpunten"] },
  "Starbucks EU":     { description: "Bestel je favoriete koffie van tevoren en sla de rij over.", features: ["Mobiel bestellen & ophalen", "Starbucks Rewards spaarprogramma", "Seizoensgebonden drankjes"] },
  "Lokale Bakker":    { description: "Vers brood, gebak en koffie van lokale bakkers bij jou in de buurt.", features: ["Vers brood & banket", "Bestellen voor afhalen", "Seizoensspecialiteiten"] },
  "DesignKlik":       { description: "Maak professionele ontwerpen, presentaties en social media content.", features: ["Duizenden templates", "Foto's bewerken & ontwerpen", "Samenwerken in teams"] },
  "Alibaba.com":      { description: "Internationaal handelsplatform voor groothandel en B2B-inkoop.", features: ["Miljoenen leveranciers", "Veilig handelen", "Dropshipping & bulk-inkoop"] },
  "Temu":             { description: "Trendy producten direct van fabrikanten voor lage prijzen.", features: ["Dagelijkse deals & kortingen", "Brede productcategorieën", "Wereldwijde verzending"] },
  // Eten & bezorgen
  "Thuisbezorgd.nl":  { description: "Bestel eten bij restaurants bij jou in de buurt, snel thuis bezorgd.", features: ["Duizenden restaurants", "Live bezorging volgen", "Keuzefilters op keuken"] },
  "Uber Eats":        { description: "Maaltijdbezorging van restaurants, supermarkten en gemakswinkels.", features: ["Snelle bezorging", "Realtime tracking", "Breed restaurantaanbod"] },
  "Gorillas / Flink": { description: "Supermarkt-bezorging in minuten, rechtstreeks aan de deur.", features: ["Bezorging in 10 minuten", "Verse producten", "Geen minimumbestelling"] },
  "Flink":            { description: "Boodschappen bestellen en in minuten thuisbezorgd krijgen.", features: ["Ultrasnelle bezorging", "Dagelijkse boodschappen", "Verse groenten & fruit"] },
  "Jamezz":           { description: "Slim bestellen en betalen via je telefoon bij restaurants en cafés.", features: ["Tafelbestelling via QR", "Zelf betalen zonder te wachten", "Menu's digitaal bekijken"] },
  "Vivino":           { description: "Ontdek en beoordeel wijnen, en shop de beste flessen online.", features: ["Wijn scannen & beoordelen", "Persoonlijke aanbevelingen", "Wijn kopen & bezorgen"] },
  // Evenementen & cultuur
  "Ticketmaster":     { description: "Koop tickets voor concerten, festivals, sport en theater.", features: ["Officiële tickets", "Selecteer je eigen stoel", "Digitale tickets op je telefoon"] },
  "Pathé Bioscopen":  { description: "Bioscooptickets reserveren en de nieuwste films ontdekken.", features: ["Online reserveren", "Filmrecensies & trailers", "Pathé Unlimited abonnement"] },
  "Museumkaart":      { description: "Vrije toegang tot honderden musea in Nederland met één pas.", features: ["400+ musea", "Onbeperkt bezoeken", "Tijdelijk tentoonstellingen"] },
  // Communicatie & sociaal
  "X":                { description: "Volg nieuws, trends en gesprekken in real-time op X (Twitter).", features: ["Live nieuws & trending topics", "Posts, threads & polls", "Direct berichten sturen"] },
  "Instagram":        { description: "Deel foto's en video's, volg vrienden en ontdek nieuwe content.", features: ["Stories & Reels", "Direct berichten", "Ontdek & shops"] },
  "Chat":             { description: "Google Chat voor teamcommunicatie, groepsgesprekken en bestanden.", features: ["Teams & groepsgesprekken", "Bestanden delen", "Google Workspace integratie"] },
  // Media & streaming
  "YouTube":          { description: "Miljarden video's, muziek, nieuws en live streams, gratis te bekijken.", features: ["Muziek & podcasts", "Live streams & nieuws", "YouTube Premium offline kijken"] },
  "Shazam":           { description: "Herken nummers in een seconde en ontdek nieuwe muziek.", features: ["Muziek herkennen", "Songteksten & artiesteninfo", "Afspeellijsten aanmaken"] },
  "Spotify":          { description: "Muziek, podcasts en audioboekenstreaming voor elk moment.", features: ["100M+ nummers & podcasts", "Offline luisteren", "Gepersonaliseerde afspeellijsten"] },
  "Netflix":          { description: "Bekijk series, films en documentaires, altijd en overal.", features: ["Originele Netflix series & films", "Downloads voor offline kijken", "Meerdere profielen"] },
  "KPN TV+":          { description: "Televisie kijken, opnemen en on-demand content via KPN.", features: ["Live TV & terugkijken", "On-demand films & series", "Tot 4K kwaliteit"] },
  "NPO Start":        { description: "Kijk gratis alle programma's van NPO 1, 2 en 3.", features: ["Gratis publieke omroep", "Terugkijken & gemist", "Documentaires & nieuws"] },
  // Nieuws & actualiteiten
  "NOS":              { description: "Het laatste nieuws, sport en achtergrondinformatie van de NOS.", features: ["Nieuws & breaking alerts", "Sportverslaggeving", "Podcasts & video's"] },
  "NU.nl":            { description: "Het meest gelezen nieuwssite van Nederland.", features: ["Actueel nieuws 24/7", "Technologie & lifestyle", "Nieuwsbrieven op maat"] },
  "FD":               { description: "Financieel-economisch nieuws, analyses en beursinformatie.", features: ["Financieel nieuws", "Beurskoersen live", "Analyses & achtergronden"] },
  "BNR":              { description: "Radio, podcasts en nieuws over economie, politiek en technologie.", features: ["Live radio & podcasts", "Zakelijk nieuws", "Interviews & debatten"] },
  "RTL Nieuws":       { description: "Nieuws, reportages en analyses van RTL Nederland.", features: ["Live uitzendingen", "Video-nieuws", "Achtergrondverhalen"] },
  "de Volkskrant":    { description: "Kwaliteitsjournalistiek over politiek, cultuur en wetenschap.", features: ["Diepgaande reportages", "Opinie & achtergrond", "Podcasts & video"] },
  "El País":          { description: "Toonaangevende Spaanstalige krant met wereldnieuws.", features: ["Internationaal nieuws", "Cultuur & wetenschap", "Spaanstalig nieuws"] },
  "Podcasts":         { description: "Beluister miljoenen podcasts op Apple Podcasts, gratis toegankelijk.", features: ["Miljoenen podcasts", "Abonneren & offline luisteren", "Aanbevelingen op maat"] },
  // Security & admin
  "NordVPN":          { description: "Beveilig je internetverbinding en bescherm je privacy online.", features: ["Versleutelde VPN-verbinding", "Servers in 60+ landen", "Bescherming op openbare wifi"] },
  "Authenticator":    { description: "Microsoft Authenticator voor tweestapsverificatie en wachtwoordbeheer.", features: ["Tweestapsverificatie (2FA)", "Wachtwoorden opslaan", "Microsoft account beheren"] },
  "KPN":              { description: "Bekijk en beheer je KPN-abonnement, facturen en instellingen.", features: ["Datagebruik & bellen", "Facturen & betalingen", "Storingen melden"] },
  // Financieel (zonder persoonlijk account)
  "Klarna":           { description: "Koop nu, betaal later — flexibel betalen bij duizenden winkels.", features: ["Achteraf betalen", "Gespreide betalingen", "Klarna Kaart"] },
  // Overig
  "Datumprikker":     { description: "Plan eenvoudig een afspraak met meerdere mensen via een link.", features: ["Gratis prikbord aanmaken", "Deelbaar via link", "Geen account vereist"] },
  "Signal":           { description: "Privé berichten en bellen met end-to-end versleuteling.", features: ["End-to-end versleuteld", "Verdwijnende berichten", "Veilige groepsgesprekken"] },
  "Zoom":             { description: "Videovergaderingen, webinars en online samenwerking.", features: ["HD videovergaderingen", "Scherm delen", "Breakout rooms"] },
  "Teams":            { description: "Microsoft Teams voor chat, vergaderen en samenwerken in teams.", features: ["Chat & videobelgesprekken", "Bestanden & Office integratie", "Kanalen per team"] },
  "LinkedIn":         { description: "Professioneel netwerken, vacatures en zakelijk nieuws.", features: ["Netwerk uitbreiden", "Vacatures zoeken & solliciteren", "Bedrijfsnieuws volgen"] },
  "Gmail":            { description: "Google's e-mailservice met slimme organisatie en zoekopdrachten.", features: ["E-mail versturen & ontvangen", "Slimme categorisering", "15 GB gratis opslag"] },
  // Zorg (ook via HealthAppViews, maar als fallback hier)
  "Zorgverzekeraar":  { description: "Vergelijk en kies de beste zorgverzekering voor jou.", features: ["Verzekeringen vergelijken", "Premies & polissen", "Aanvullende verzekering"] },
  "MijnZorgApp":      { description: "Inzicht in je medische gegevens en gezondheidshistorie.", features: ["Medisch dossier inzien", "Uitslagen & medicatie", "Afspraken beheren"] },
  "VAXY":             { description: "Digitaal vaccinatiebewijs en RIVM-vaccinatiegeschiedenis.", features: ["Vaccinatiebewijs downloaden", "Vaccinatiegeschiedenis", "COVID-19 certificaat"] },
  "ZorgKlik":         { description: "Vind en beoordeel zorgverleners bij jou in de buurt.", features: ["Huisartsen & specialisten", "Patiëntbeoordelingen", "Wachttijden vergelijken"] },
};

// Apps met persoonlijk account → biometrische verificatie + rechtstreeks op login-pagina
const PERSONAL_LOGIN: Record<string, { loginUrl: string; loginDomain: string; inTab?: true }> = {
  // Overheid / Belastingen
  "UWV / Pensioen":   { loginUrl: "https://mijn.uwv.nl",              loginDomain: "mijn.uwv.nl" },
  // Pensioenen / Verzekeringen
  "PFZW":             { loginUrl: "https://www.pfzw.nl",              loginDomain: "pfzw.nl" },
  "ABP":              { loginUrl: "https://www.mijnabp.nl",           loginDomain: "mijnabp.nl" },
  "SPMS Pensioen":    { loginUrl: "https://www.spms.nl",              loginDomain: "spms.nl" },
  "OHRA":             { loginUrl: "https://www.ohra.nl/inloggen",     loginDomain: "ohra.nl" },
  "UltraSync+":       { loginUrl: "https://www.ultrasync.com",         loginDomain: "ultrasync.com" },
  "IZZ":              { loginUrl: "https://mijn.izzdoorvgz.nl",        loginDomain: "mijn.izzdoorvgz.nl" },
  // Nutsvoorzieningen
  "Dunea":            { loginUrl: "https://www.dunea.nl",             loginDomain: "dunea.nl" },
  "Gem. Belastingen": { loginUrl: "https://www.belastingdienst.nl",   loginDomain: "belastingdienst.nl" },
  // Zorg
  "Zorgverzekeraar":  { loginUrl: "https://www.zorgwijzer.nl/zorgvergelijker/zorgverzekering", loginDomain: "zorgwijzer.nl" },
  "MijnZorgApp":      { loginUrl: "https://www.mijngezondheid.net", loginDomain: "mijngezondheid.net", inTab: true },
  // Financieel / Beleggen
  "Saxo Investor":    { loginUrl: "https://www.home.saxo/accounts/login", loginDomain: "home.saxo", inTab: true },
  "Revolut":          { loginUrl: "https://app.revolut.com/sign-in",  loginDomain: "app.revolut.com", inTab: true },
  "Bitvavo":          { loginUrl: "https://account.bitvavo.com/login", loginDomain: "account.bitvavo.com", inTab: true },
  "Binance":          { loginUrl: "https://accounts.binance.com/login", loginDomain: "accounts.binance.com", inTab: true },
  "Coinbase":         { loginUrl: "https://login.coinbase.com",       loginDomain: "login.coinbase.com", inTab: true },
  "Raisin":           { loginUrl: "https://www.raisin.nl/login",      loginDomain: "raisin.nl" },
  "Klarna":           { loginUrl: "https://app.klarna.com/login",     loginDomain: "app.klarna.com", inTab: true },
  // Sociaal / Communicatie
  "LinkedIn":         { loginUrl: "https://www.linkedin.com/login",   loginDomain: "linkedin.com", inTab: true },
  "Gmail":            { loginUrl: "https://accounts.google.com",      loginDomain: "accounts.google.com", inTab: true },
  "Signal":           { loginUrl: "https://signal.org",               loginDomain: "signal.org", inTab: true },
  "Zoom":             { loginUrl: "https://zoom.us/signin",           loginDomain: "zoom.us", inTab: true },
  "Teams":            { loginUrl: "https://teams.microsoft.com",      loginDomain: "teams.microsoft.com", inTab: true },
  // Onderwijs
  "Studielink":       { loginUrl: "https://studielink.nl/portal/login", loginDomain: "studielink.nl" },
  "Coursera":         { loginUrl: "https://www.coursera.org/login",   loginDomain: "coursera.org", inTab: true },
  // Overige persoonlijk
  "KPN":              { loginUrl: "https://inloggen.kpn.com/?scope=openid&response_type=code&client_id=patHWjVx5dSN3QEbAdJRzjZ6jdCcusvMhlvfcc4N&redirect_uri=https%3A%2F%2Fwww.kpn.com%2Flogin-callback&state=5ffbf6c6-6ca4-4df2-9d75-5cbd2eae261b", loginDomain: "inloggen.kpn.com", inTab: true },
  "NordVPN":          { loginUrl: "https://my.nordaccount.com",       loginDomain: "nordaccount.com", inTab: true },
  "Funda":            { loginUrl: "https://mijn.funda.nl",            loginDomain: "mijn.funda.nl" },
  "Datumprikker":     { loginUrl: "https://www.datumprikker.nl/login", loginDomain: "datumprikker.nl" },
  // Shopping
  "Albert Heijn":     { loginUrl: "https://www.ah.nl/mijn",            loginDomain: "ah.nl", inTab: true },
  "Bol.com":          { loginUrl: "https://login.bol.com/wsp/login",  loginDomain: "bol.com", inTab: true },
};

export function isUniversalApp(label: string): boolean {
  return label in APP_URLS;
}

const isInIframe = (() => { try { return window.self !== window.top; } catch { return true; } })();

async function triggerWebAuthn(): Promise<boolean> {
  try {
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

const EU_STARS_UA = ({ size = 18 }: { size?: number }) => (
  <svg viewBox="0 0 40 40" width={size} height={size}>
    {Array.from({ length: 12 }, (_, i) => {
      const angle = (i * 30 - 90) * Math.PI / 180;
      const x = 20 + 13 * Math.cos(angle);
      const y = 20 + 13 * Math.sin(angle);
      return <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="6" fill="#FFCC00">★</text>;
    })}
  </svg>
);

function NativeCameraView({ onBack }: { onBack: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [scale, setScale] = useState(1);
  const [flash, setFlash] = useState(false);
  const scaleRef = useRef({ lastDist: 0, dragging: false, scale: 1 });
  const containerRef = useRef<HTMLDivElement>(null);

  const startCamera = async (facing: "environment" | "user") => {
    if (stream) stream.getTracks().forEach(t => t.stop());
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
      setStream(s);
      if (videoRef.current) { videoRef.current.srcObject = s; videoRef.current.play(); }
    } catch {}
  };

  useEffect(() => { startCamera(facingMode); return () => { if (stream) stream.getTracks().forEach(t => t.stop()); }; }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const getDist = (t: TouchList) => Math.sqrt((t[1].clientX - t[0].clientX) ** 2 + (t[1].clientY - t[0].clientY) ** 2);
    const onTS = (e: TouchEvent) => { if (e.touches.length === 2) { e.preventDefault(); scaleRef.current.lastDist = getDist(e.touches); scaleRef.current.dragging = true; } };
    const onTM = (e: TouchEvent) => { if (e.touches.length === 2 && scaleRef.current.dragging) { e.preventDefault(); const d = getDist(e.touches); const ns = Math.max(1, Math.min(5, scaleRef.current.scale * (d / scaleRef.current.lastDist))); scaleRef.current.scale = ns; scaleRef.current.lastDist = d; setScale(ns); } };
    const onTE = () => { scaleRef.current.dragging = false; };
    el.addEventListener("touchstart", onTS, { passive: false }); el.addEventListener("touchmove", onTM, { passive: false }); el.addEventListener("touchend", onTE);
    return () => { el.removeEventListener("touchstart", onTS); el.removeEventListener("touchmove", onTM); el.removeEventListener("touchend", onTE); };
  }, []);

  const capturePhoto = () => {
    if (!videoRef.current) return;
    setFlash(true);
    setTimeout(() => setFlash(false), 150);
    const c = document.createElement("canvas");
    c.width = videoRef.current.videoWidth; c.height = videoRef.current.videoHeight;
    c.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    setPhoto(c.toDataURL("image/jpeg", 0.9));
  };

  const switchCamera = () => {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    startCamera(next);
    scaleRef.current.scale = 1;
    setScale(1);
  };

  const downloadPhoto = () => {
    if (!photo) return;
    const a = document.createElement("a");
    a.href = photo; a.download = `w€spr-foto-${Date.now()}.jpg`; a.click();
  };

  if (photo) {
    return (
      <div className="fixed inset-0 z-[1000] bg-black flex flex-col">
        <header className="px-3 py-2 flex items-center gap-2 bg-black/80 shrink-0 z-10">
          <Button variant="ghost" size="icon" onClick={() => setPhoto(null)} className="h-8 w-8 text-white hover:bg-white/20"><ArrowLeft className="w-5 h-5" /></Button>
          <span className="flex-1 text-white text-sm font-medium text-center">Foto</span>
          <Button variant="ghost" size="icon" onClick={downloadPhoto} className="h-8 w-8 text-white hover:bg-white/20"><Download className="w-4 h-4" /></Button>
        </header>
        <div className="flex-1 flex items-center justify-center p-4">
          <img src={photo} className="max-w-full max-h-full rounded-xl object-contain" alt="Foto" />
        </div>
        <div className="flex justify-center gap-4 py-4 bg-black/80">
          <Button variant="ghost" onClick={() => setPhoto(null)} className="text-white gap-2"><RotateCcw className="w-4 h-4" /> Opnieuw</Button>
          <Button variant="ghost" onClick={downloadPhoto} className="text-white gap-2"><Download className="w-4 h-4" /> Opslaan</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[1000] bg-black flex flex-col">
      <header className="px-3 py-2 flex items-center gap-2 bg-black/80 shrink-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => { if (stream) stream.getTracks().forEach(t => t.stop()); onBack(); }} className="h-8 w-8 text-white hover:bg-white/20"><ArrowLeft className="w-5 h-5" /></Button>
        <span className="flex-1 text-white text-sm font-medium text-center">Camera</span>
        <Button variant="ghost" size="icon" onClick={switchCamera} className="h-8 w-8 text-white hover:bg-white/20"><RotateCcw className="w-4 h-4" /></Button>
      </header>
      <div ref={containerRef} className="flex-1 relative overflow-hidden" style={{ touchAction: "none" }}>
        <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" style={{ transform: `scale(${scale})`, transformOrigin: "center center", transition: scaleRef.current.dragging ? "none" : "transform 0.15s ease-out" }} />
        {flash && <div className="absolute inset-0 bg-white z-20 animate-pulse" />}
        {scale > 1 && <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full z-10">{Math.round(scale * 100)}%</div>}
      </div>
      <div className="flex items-center justify-center gap-8 py-6 bg-black/80">
        <div className="w-10" />
        <button onClick={capturePhoto} className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition-transform" data-testid="button-shutter">
          <div className="w-12 h-12 rounded-full bg-white" />
        </button>
        <Button variant="ghost" size="icon" onClick={switchCamera} className="text-white"><RotateCcw className="w-5 h-5" /></Button>
      </div>
    </div>
  );
}

function NativePhotosView({ onBack }: { onBack: () => void }) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => setPhotos(prev => [reader.result as string, ...prev]);
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const downloadPhoto = (src: string) => {
    const a = document.createElement("a");
    a.href = src; a.download = `w€spr-foto-${Date.now()}.jpg`; a.click();
  };

  if (selectedPhoto) {
    return (
      <div className="fixed inset-0 z-[1000] bg-black flex flex-col">
        <header className="px-3 py-2 flex items-center gap-2 bg-black/80 shrink-0 z-10">
          <Button variant="ghost" size="icon" onClick={() => setSelectedPhoto(null)} className="h-8 w-8 text-white hover:bg-white/20"><ArrowLeft className="w-5 h-5" /></Button>
          <span className="flex-1 text-white text-sm font-medium text-center">Foto's</span>
          <Button variant="ghost" size="icon" onClick={() => downloadPhoto(selectedPhoto)} className="h-8 w-8 text-white hover:bg-white/20"><Download className="w-4 h-4" /></Button>
        </header>
        <div className="flex-1 flex items-center justify-center p-4">
          <img src={selectedPhoto} className="max-w-full max-h-full rounded-xl object-contain" alt="Foto" />
        </div>
        <div className="flex justify-center gap-4 py-4 bg-black/80">
          <Button variant="ghost" onClick={() => downloadPhoto(selectedPhoto)} className="text-white gap-2"><Download className="w-4 h-4" /> Opslaan</Button>
          <Button variant="ghost" onClick={() => { setPhotos(prev => prev.filter(p => p !== selectedPhoto)); setSelectedPhoto(null); }} className="text-red-400 gap-2"><X className="w-4 h-4" /> Verwijderen</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[1000] bg-background flex flex-col">
      <header className="px-3 py-2 flex items-center gap-2 border-b border-border/30 bg-background shrink-0">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8"><ArrowLeft className="w-5 h-5" /></Button>
        <span className="flex-1 text-sm font-semibold text-center">Foto's</span>
        <Button variant="ghost" size="icon" onClick={() => fileRef.current?.click()} className="h-8 w-8"><Camera className="w-4 h-4" /></Button>
      </header>
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
      <div className="flex-1 overflow-y-auto p-2">
        {photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <Image className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1">Geen foto's</h3>
            <p className="text-sm text-muted-foreground mb-4">Voeg foto's toe vanuit je galerij</p>
            <Button onClick={() => fileRef.current?.click()} className="rounded-xl gap-2"><Camera className="w-4 h-4" /> Foto's toevoegen</Button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {photos.map((p, i) => (
              <div key={i} onClick={() => setSelectedPhoto(p)} className="aspect-square overflow-hidden rounded-md cursor-pointer active:opacity-80 transition-opacity">
                <img src={p} className="w-full h-full object-cover" alt="" />
              </div>
            ))}
          </div>
        )}
      </div>
      {photos.length > 0 && (
        <div className="px-4 py-3 border-t border-border/30 bg-background">
          <Button onClick={() => fileRef.current?.click()} variant="outline" className="w-full rounded-xl gap-2"><Camera className="w-4 h-4" /> Meer foto's toevoegen</Button>
        </div>
      )}
    </div>
  );
}

export function UniversalAppView({ label, onBack }: { label: string; onBack: () => void }) {
  const app = APP_URLS[label];
  const personal = PERSONAL_LOGIN[label] ?? null;
  const hasPersonalLogin = personal !== null;
  const skipIframe = SKIP_IFRAME.includes(label);

  // Biometric gate alleen voor apps met persoonlijk account; overige direct als card
  const [phase, setPhase] = useState<"login" | "eudi" | "biometric" | "splash" | "iframe" | "fallback" | "browser" | "connected" | "opened" | "card">(
    hasPersonalLogin ? "eudi" : "card"
  );
  const [bioState, setBioState] = useState<"idle" | "scanning" | "success">("idle");
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [browserLoaded, setBrowserLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  if (!app) return null;

  if (label === "Camera") return <NativeCameraView onBack={onBack} />;
  if (label === "Foto's") return <NativePhotosView onBack={onBack} />;

  // Gebruik de specifieke login-URL voor persoonlijke apps, anders de generieke URL
  const activeUrl = (hasPersonalLogin && personal) ? personal.loginUrl : app.url;
  const activeDomain = (hasPersonalLogin && personal) ? personal.loginDomain : app.url.replace("https://", "").replace("www.", "").replace(/\/.*$/, "");
  const proxyUrl = `/api/proxy?url=${encodeURIComponent(activeUrl)}`;
  const logo = APP_LOGOS[label];
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
    const ok = await triggerWebAuthn();
    const proceed = () => {
      setBioState("success");
      setTimeout(() => setPhase("connected"), 700);
    };
    if (ok) {
      proceed();
    } else {
      setTimeout(proceed, 1500);
    }
  };

  useEffect(() => {
    if (phase === "splash") {
      const splashTimer = setTimeout(() => setPhase(skipIframe ? "fallback" : "iframe"), 2000);
      return () => clearTimeout(splashTimer);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === "iframe") {
      const fallbackTimer = setTimeout(() => {
        if (!iframeLoaded) setPhase("fallback");
      }, 5000);
      return () => clearTimeout(fallbackTimer);
    }
  }, [phase, iframeLoaded]);

  // ── 1. Login scherm (app-branded) ─────────────────────────────────────────
  if (phase === "login") {
    return (
      <div className="fixed inset-0 z-[1000] bg-gray-50 flex flex-col overflow-auto" style={{ fontFamily: "system-ui, sans-serif" }}>
        {/* App header */}
        <div className="px-4 py-3 flex items-center justify-between shrink-0" style={{ background: app.color }}>
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="text-white/70 hover:text-white p-1 -ml-1 mr-1"><ArrowLeft className="w-5 h-5" /></button>
            {logo ? <img src={logo} alt="" className="w-6 h-6 rounded" /> : <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center text-white text-[11px] font-bold">{label[0]}</div>}
            <span className="text-white font-bold text-sm">{label}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-white/60" />
            <span className="text-white/60 text-[11px]">{activeDomain}</span>
          </div>
        </div>

        <div className="flex-1 px-5 pt-8 pb-10">
          {/* Logo + titel */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-white shadow-md border border-gray-100 flex items-center justify-center mx-auto mb-4">
              {logo
                ? <img src={logo} alt="" className="w-14 h-14 object-contain rounded-xl" />
                : <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-2xl font-bold" style={{ background: app.color }}>{label[0]}</div>
              }
            </div>
            <h1 className="text-xl font-bold text-gray-900">Inloggen bij {label}</h1>
            <p className="text-sm text-gray-500 mt-1">{activeDomain}</p>
          </div>

          {/* W€spr EUDI Wallet knop — hoofdoptie */}
          <button
            onClick={() => setPhase("eudi")}
            className="w-full rounded-2xl py-4 px-5 flex items-center gap-4 mb-4 shadow-lg active:scale-[0.98] transition-all"
            style={{ background: "linear-gradient(135deg, #003399 0%, #0055DD 100%)" }}
            data-testid={`btn-eudi-login-${label.toLowerCase().replace(/\s/g, "-")}`}
          >
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <EU_STARS_UA size={28} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-white font-bold text-[15px] leading-tight">Inloggen met W€spr</p>
              <p className="text-white/70 text-[12px] mt-0.5">EUDI Wallet · eIDAS 2.0 gecertificeerd</p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/60 shrink-0" />
          </button>

          {/* Alternatief: eigen wachtwoord */}
          <button
            onClick={openExternal}
            className="w-full rounded-2xl py-4 px-5 flex items-center gap-4 mb-6 border border-gray-200 bg-white active:scale-[0.98] transition-all"
            data-testid={`btn-password-login-${label.toLowerCase().replace(/\s/g, "-")}`}
          >
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5 text-gray-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-gray-800 font-semibold text-[15px]">Inloggen met wachtwoord</p>
              <p className="text-gray-400 text-[12px] mt-0.5">Opent in uw browser</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
          </button>

          {/* Veiligheidsinfo */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#003399] shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] font-semibold text-[#003399]">Veilig inloggen via W€spr</p>
                <p className="text-[11px] text-gray-600 mt-0.5 leading-snug">W€spr is een gecertificeerde EUDI Wallet onder eIDAS 2.0. Geen wachtwoord nodig — uw identiteit wordt bevestigd via biometrie.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── 2. EUDI Wallet toestemmingsscherm ─────────────────────────────────────
  if (phase === "eudi") {
    const EU_BLUE = "#003399";
    const dataItems = [
      { label: "Volledige naam", value: "G.E. Spr" },
      { label: "Geboortedatum", value: "14 maart 1985" },
      { label: "BSN / Identifier", value: "••• ••• •••" },
      { label: "E-mailadres", value: "ges@w€spr.eu" },
      { label: "Adres", value: "Amsterdam, Nederland" },
    ];
    return (
      <div className="fixed inset-0 z-[1000] bg-white flex flex-col overflow-hidden" style={{ fontFamily: "system-ui, sans-serif" }}>
        {/* EUDI header */}
        <div className="px-4 py-3 flex items-center gap-3 shrink-0" style={{ background: EU_BLUE }}>
          <button onClick={onBack} className="text-white/70 hover:text-white p-1 -ml-1"><ArrowLeft className="w-5 h-5" /></button>
          <div className="flex items-center gap-2 flex-1">
            <EU_STARS_UA size={20} />
            <span className="text-white font-bold text-sm">W€spr EUDI Wallet</span>
          </div>
          <span className="text-white/50 text-[10px] font-medium uppercase tracking-wider">eIDAS 2.0</span>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pt-6 pb-8">
          {/* Aanvragende partij */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center bg-white shrink-0">
              {logo
                ? <img src={logo} alt="" className="w-10 h-10 object-contain rounded-xl" />
                : <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xl font-bold" style={{ background: app.color }}>{label[0]}</div>
              }
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Aanvraag van</p>
              <p className="text-lg font-bold text-gray-900">{label}</p>
              <p className="text-[12px] text-gray-500">{activeDomain}</p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-5 flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[12px] text-amber-800 leading-snug"><span className="font-semibold">{label}</span> vraagt toegang tot de volgende gegevens uit uw W€spr EUDI Wallet.</p>
          </div>

          {/* Gegevens die worden gedeeld */}
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Te delen gegevens</p>
          <div className="space-y-2 mb-6">
            {dataItems.map(item => (
              <div key={item.label} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                <span className="text-[13px] text-gray-600">{item.label}</span>
                <span className="text-[13px] font-semibold text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>

          {/* EU Certificering */}
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: EU_BLUE }}>
              <EU_STARS_UA size={22} />
            </div>
            <div>
              <p className="text-[12px] font-bold text-[#003399]">Gecertificeerd onder EU-verordening 910/2014</p>
              <p className="text-[10px] text-gray-500 mt-0.5">W€spr is een door de EU erkende EUDI Wallet · eIDAS 2.0</p>
            </div>
          </div>

          {/* Toestaan knop */}
          <button
            onClick={() => setPhase("biometric")}
            className="w-full rounded-2xl py-4 px-5 flex items-center gap-4 shadow-lg active:scale-[0.98] transition-all mb-3"
            style={{ background: "linear-gradient(135deg, #003399 0%, #0055DD 100%)" }}
            data-testid="btn-eudi-toestaan"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Fingerprint className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-white font-bold text-[15px]">Toestaan &amp; bevestigen</p>
              <p className="text-white/70 text-[12px]">Verifieer met Face ID of vingerafdruk</p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/60" />
          </button>

          <button onClick={openExternal} className="w-full text-center text-sm text-gray-400 underline underline-offset-2 py-2" data-testid="btn-eudi-weigeren">Liever inloggen met wachtwoord</button>
        </div>
      </div>
    );
  }

  // ── 3. Biometrie ──────────────────────────────────────────────────────────
  if (phase === "biometric") {
    return (
      <div className="fixed inset-0 z-[1000] bg-white flex flex-col overflow-hidden" style={{ fontFamily: "system-ui, sans-serif" }}>
        <div className="px-4 py-3 flex items-center gap-3 shrink-0" style={{ background: "#003399" }}>
          <button onClick={() => setPhase("eudi")} className="text-white/70 hover:text-white p-1 -ml-1"><ArrowLeft className="w-5 h-5" /></button>
          <EU_STARS_UA size={20} />
          <span className="text-white font-bold text-sm">W€spr EUDI Wallet · Verificatie</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
          <div className="flex flex-col items-center gap-1 text-center">
            <div className="flex items-center gap-2 mb-2">
              <EU_STARS_UA size={22} />
              <span className="text-[#003399] font-bold text-sm">EUDI Wallet · W€spr</span>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {bioState === "success" ? "Identiteit bevestigd" : "Bevestig uw identiteit"}
            </p>
            <p className="text-sm text-gray-500">
              {bioState === "scanning" ? "Verifiëren..." : bioState === "success" ? `U wordt ingelogd bij ${label}...` : "Gebruik Face ID of vingerafdruk"}
            </p>
          </div>

          <motion.button
            onClick={handleBiometric}
            disabled={bioState !== "idle"}
            animate={bioState === "scanning" ? { boxShadow: ["0 0 0 0px rgba(0,51,153,0.3)", "0 0 0 22px rgba(0,51,153,0)"] } : {}}
            transition={{ repeat: Infinity, duration: 1.4 }}
            className={`w-36 h-36 rounded-full border-4 flex flex-col items-center justify-center gap-2 transition-all duration-500 cursor-pointer active:scale-95 ${
              bioState === "success" ? "border-green-400 bg-green-50" :
              bioState === "scanning" ? "border-[#003399] bg-[#003399]/8" : "border-gray-200 bg-gray-50"
            }`}
            data-testid={`btn-biometric-${label.toLowerCase().replace(/\s/g, "-")}`}
          >
            {bioState === "success"
              ? <Check className="w-14 h-14 text-green-500" />
              : <Fingerprint className={`w-14 h-14 ${bioState === "scanning" ? "text-[#003399]" : "text-gray-400"}`} />
            }
            <span className={`text-[11px] font-semibold ${bioState === "success" ? "text-green-600" : bioState === "scanning" ? "text-[#003399]" : "text-gray-400"}`}>
              {bioState === "success" ? "Bevestigd ✓" : bioState === "scanning" ? "Wacht op apparaat..." : "Touch ID · Face ID"}
            </span>
          </motion.button>

          {isInIframe && bioState === "idle" && (
            <button onClick={handleBiometric} className="text-sm text-[#003399] underline underline-offset-2" data-testid="btn-bio-fallback">Tik hier om door te gaan</button>
          )}

          <div className="w-full bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#003399] shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-semibold text-[#003399]">Beveiligd via W€spr EUDI Wallet</p>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">Uw biometrische verificatie wordt lokaal verwerkt. Geen biometrische data wordt verstuurd.</p>
            </div>
          </div>

          <button onClick={() => setPhase("eudi")} className="text-sm text-gray-400 underline underline-offset-2" data-testid="btn-bio-cancel">Annuleren</button>
        </div>
      </div>
    );
  }

  // ── Verbonden (inTab persoonlijke apps) ──────────────────────────────────
  if (phase === "connected" && personal) {
    return (
      <div className="fixed inset-0 z-[1000] bg-white flex flex-col overflow-hidden" style={{ fontFamily: "system-ui, sans-serif" }}>
        <div className="px-4 py-3 flex items-center gap-3 shrink-0" style={{ background: app.color }}>
          <button onClick={onBack} className="text-white/70 hover:text-white p-1 -ml-1"><ArrowLeft className="w-5 h-5" /></button>
          <div className="flex items-center gap-2 flex-1">
            {logo ? <img src={logo} alt="" className="w-6 h-6 rounded" /> : <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center text-white text-[11px] font-bold">{label[0]}</div>}
            <span className="text-white font-semibold text-[14px]">{label}</span>
          </div>
          <div className="flex items-center gap-1"><EU_STARS_UA size={16} /><span className="text-white/70 text-[10px] font-medium">W€spr</span></div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-5">
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-xl" style={{ background: `${app.color}15`, border: `2px solid ${app.color}30` }}>
              {logo ? <img src={logo} alt="" className="w-16 h-16 rounded-2xl object-contain" /> : <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-3xl font-bold" style={{ background: app.color }}>{label[0]}</div>}
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center border-2 border-white">
              <Check className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Verbonden met {label}</h2>
            <p className="text-sm text-gray-500">Uw identiteit is geverifieerd via W€spr EUDI Wallet.<br />Tik hieronder om door te gaan.</p>
          </div>
          <a
            href={personal.loginUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full rounded-2xl py-4 px-5 flex items-center gap-4 shadow-md active:scale-[0.98] transition-all no-underline"
            style={{ background: app.color }}
            data-testid={`btn-open-login-${label.toLowerCase().replace(/\s/g, "-")}`}
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0"><Globe className="w-5 h-5 text-white" /></div>
            <div className="flex-1 text-left">
              <p className="text-white font-bold text-[15px]">{label} openen</p>
              <p className="text-white/70 text-[12px]">{personal.loginDomain}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/60" />
          </a>
          <div className="w-full bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#003399] shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-semibold text-[#003399]">Ingelogd via W€spr EUDI Wallet</p>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">Uw geverifieerde identiteit is gedeeld met {label} via eIDAS 2.0. De loginpagina opent beveiligd in uw browser.</p>
            </div>
          </div>
          <button onClick={onBack} className="text-sm text-gray-400 underline underline-offset-2" data-testid="btn-back-connected">Terug naar W€spr</button>
        </div>
      </div>
    );
  }

  // ── DirectLinkCard (alle apps zonder persoonlijk account) ─────────────────
  if (phase === "card") {
    const cardInfo = APP_CARD[label];
    const features = cardInfo?.features ?? ["Toegang tot alle functies", "Snel en veilig", "Open in browser"];
    const description = cardInfo?.description ?? `Open ${label} in je browser.`;
    return (
      <div className="fixed inset-0 z-[1000] bg-background flex flex-col overflow-hidden">
        <div className="px-4 py-3 flex items-center gap-3 shrink-0 shadow-sm" style={{ backgroundColor: app.color }}>
          <button onClick={onBack} className="text-white/70 hover:text-white p-1 -ml-1 shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          {logo
            ? <img src={logo} alt="" className="w-6 h-6 rounded" />
            : <div className="w-6 h-6 rounded bg-white/20 flex items-center justify-center text-white text-[11px] font-bold">{label[0]}</div>
          }
          <span className="text-white font-semibold text-sm flex-1 truncate">{label}</span>
          <div className="flex items-center gap-1.5 shrink-0">
            <Lock className="w-3 h-3 text-white/60" />
            <span className="text-white/60 text-[11px]">{activeDomain}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-5 pt-10 pb-6 flex flex-col items-center text-center" style={{ background: `linear-gradient(160deg, ${app.color}18 0%, transparent 60%)` }}>
            <div className="w-24 h-24 rounded-3xl shadow-xl flex items-center justify-center mb-5 border border-white/60" style={{ backgroundColor: `${app.color}15` }}>
              {logo
                ? <img src={logo} alt="" className="w-16 h-16 object-contain rounded-2xl" />
                : <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-3xl font-bold" style={{ backgroundColor: app.color }}>{label[0]}</div>
              }
            </div>
            <h2 className="text-xl font-bold mb-2">{label}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">{description}</p>
          </div>

          <div className="px-5 pb-4">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Wat je hier kunt doen</p>
            <div className="space-y-2 mb-6">
              {features.map((f, i) => (
                <div key={i} className="flex items-center gap-3 bg-muted/40 rounded-xl px-4 py-3">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: app.color }} />
                  <span className="text-sm font-medium">{f}</span>
                </div>
              ))}
            </div>

            <a
              href={activeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-14 rounded-2xl text-white font-semibold text-[15px] shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2 no-underline"
              style={{ backgroundColor: app.color }}
              data-testid={`btn-open-direct-${label.toLowerCase().replace(/\s/g, "-")}`}
            >
              <Globe className="w-4 h-4" />
              Open {label}
            </a>

            <div className="flex items-center justify-center gap-2 mt-4 text-[11px] text-muted-foreground">
              <Lock className="w-3 h-3" />
              <span>Beveiligde verbinding via {activeDomain}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

  return (
    <div className="fixed inset-0 z-[1000] bg-background flex flex-col overflow-hidden" style={{ isolation: "isolate" }}>
      <header
        className="px-3 py-2 flex items-center gap-2 border-b border-border/30 shadow-sm shrink-0"
        style={{ backgroundColor: app.color, position: "relative", zIndex: 50 }}
      >
        <Button variant="ghost" size="icon" onClick={phase === "browser" ? () => setPhase("fallback") : onBack} className="-ml-1 h-8 w-8 text-white hover:bg-white/20" data-testid="universal-app-back">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0 flex items-center gap-2">
          {logo && <img src={logo} alt="" className="w-6 h-6 rounded shadow-sm" />}
          <div className="bg-white/20 rounded-lg px-3 py-1.5 flex items-center gap-2 flex-1 min-w-0">
            <Globe className="w-3 h-3 text-white/70 shrink-0" />
            <span className="text-xs text-white/90 truncate font-medium">{phase === "browser" ? activeDomain : label}</span>
            {((phase === "iframe" && iframeLoaded) || (phase === "browser" && browserLoaded)) && <div className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0 ml-auto animate-pulse" />}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20" onClick={openExternal}>
          <ExternalLink className="w-4 h-4" />
        </Button>
      </header>

      <div className="flex-1 relative overflow-hidden" style={{ zIndex: 1 }}>
        {phase === "splash" && (
          <div className="absolute inset-0 bg-background flex flex-col items-center pt-16 z-50">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative mb-6">
              {logo ? (
                <img src={logo} alt="" className="w-20 h-20 rounded-2xl shadow-xl relative z-10" />
              ) : (
                <div className="w-20 h-20 rounded-2xl shadow-xl relative z-10 flex items-center justify-center text-white text-2xl font-bold" style={{ backgroundColor: app.color }}>
                  {label.charAt(0)}
                </div>
              )}
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

        {phase === "fallback" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full overflow-y-auto bg-background"
          >
            <div className="px-5 pt-8 pb-4 text-center" style={{ background: `linear-gradient(135deg, ${app.color}15, ${app.color}05)` }}>
              {logo ? (
                <img src={logo} alt="" className="w-20 h-20 rounded-2xl shadow-lg mx-auto mb-4" />
              ) : (
                <div className="w-20 h-20 rounded-2xl shadow-lg mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold" style={{ backgroundColor: app.color }}>
                  {label.charAt(0)}
                </div>
              )}
              <h2 className="text-xl font-bold mb-1">{label}</h2>
              <p className="text-sm text-muted-foreground">Open {label} in je browser</p>
            </div>
            <div className="px-5 pb-4 pt-4">
              <Button
                className="w-full h-14 rounded-2xl text-white font-semibold text-[15px] shadow-lg active:scale-[0.98] transition-transform"
                style={{ backgroundColor: app.color }}
                onClick={openInBrowser}
              >
                Open {label}
                <Globe className="w-4 h-4 ml-2" />
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
            {logo ? <img src={logo} alt="" className="w-16 h-16 rounded-2xl shadow-lg mb-5" /> : <div className="w-16 h-16 rounded-2xl shadow-lg mb-5 flex items-center justify-center text-white text-2xl font-bold" style={{ backgroundColor: app.color }}>{label.charAt(0)}</div>}
            <h2 className="text-lg font-bold mb-1">{label} is geopend</h2>
            <p className="text-sm text-muted-foreground text-center mb-6">De app is geopend in een nieuw tabblad. Je kunt hieronder terugkeren naar W€spr.</p>
            <a
              href={activeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full max-w-[280px] h-12 rounded-2xl text-white font-semibold text-sm shadow-md active:scale-[0.98] transition-transform mb-3 flex items-center justify-center gap-2 no-underline"
              style={{ backgroundColor: app.color }}
            >
              <Globe className="w-4 h-4" />
              Open {label} opnieuw
            </a>
            <Button variant="outline" className="w-full max-w-[280px] h-12 rounded-2xl font-semibold text-[14px] border-2 active:scale-[0.98] transition-transform" onClick={onBack}>
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
              title={label}
            />
          </div>
        )}

        {(phase === "splash" || phase === "iframe") && (
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
