export type Hospital = {
  id: string;
  name: string;
  city: string;
  country: string;
  flag: string;
  url: string;
  portalUrl?: string;
  loginName?: string;
  region: string;
};

export const REGIONS = [
  { id: "all", label: "Alle" },
  { id: "nl", label: "Nederland" },
  { id: "europa", label: "Europa" },
  { id: "amerika", label: "Amerika" },
  { id: "azie", label: "Azië" },
  { id: "overig", label: "Overig" },
] as const;

export type RegionId = typeof REGIONS[number]["id"];

export const ALL_HOSPITALS: Hospital[] = [
  // ── Nederland ──────────────────────────────────────────────────────────────
  {
    id: "amsterdamumc", name: "Amsterdam UMC", city: "Amsterdam", country: "Nederland",
    flag: "🇳🇱", url: "https://www.amsterdamumc.nl",
    portalUrl: "https://mijn.amsterdamumc.nl", loginName: "Mijn Amsterdam UMC", region: "nl",
  },
  {
    id: "olvg", name: "OLVG", city: "Amsterdam", country: "Nederland",
    flag: "🇳🇱", url: "https://www.olvg.nl",
    portalUrl: "https://mijn.olvg.nl", loginName: "Mijn OLVG", region: "nl",
  },
  {
    id: "haga", name: "HagaZiekenhuis", city: "Den Haag", country: "Nederland",
    flag: "🇳🇱", url: "https://www.hagaziekenhuis.nl",
    portalUrl: "https://mijn.hagaziekenhuis.nl", loginName: "Mijn HagaZiekenhuis", region: "nl",
  },
  {
    id: "erasmusmc", name: "Erasmus MC", city: "Rotterdam", country: "Nederland",
    flag: "🇳🇱", url: "https://www.erasmusmc.nl",
    portalUrl: "https://mijn.erasmusmc.nl", loginName: "Mijn Erasmus MC", region: "nl",
  },
  {
    id: "maasstad", name: "Maasstad Ziekenhuis", city: "Rotterdam", country: "Nederland",
    flag: "🇳🇱", url: "https://www.maasstadziekenhuis.nl",
    portalUrl: "https://mijn.maasstadziekenhuis.nl", loginName: "Mijn Maasstad", region: "nl",
  },
  {
    id: "lumc", name: "LUMC", city: "Leiden", country: "Nederland",
    flag: "🇳🇱", url: "https://www.lumc.nl",
    portalUrl: "https://mijn.lumc.nl", loginName: "Mijn LUMC", region: "nl",
  },
  {
    id: "umcg", name: "UMCG", city: "Groningen", country: "Nederland",
    flag: "🇳🇱", url: "https://www.umcg.nl",
    portalUrl: "https://mijn.umcg.nl", loginName: "Mijn UMCG", region: "nl",
  },
  {
    id: "umcutrecht", name: "UMC Utrecht", city: "Utrecht", country: "Nederland",
    flag: "🇳🇱", url: "https://www.umcutrecht.nl",
    portalUrl: "https://mijn.umcutrecht.nl", loginName: "Mijn UMC Utrecht", region: "nl",
  },
  {
    id: "radboudumc", name: "Radboudumc", city: "Nijmegen", country: "Nederland",
    flag: "🇳🇱", url: "https://www.radboudumc.nl",
    portalUrl: "https://mijn.radboudumc.nl", loginName: "Mijn Radboudumc", region: "nl",
  },
  {
    id: "mumc", name: "Maastricht UMC+", city: "Maastricht", country: "Nederland",
    flag: "🇳🇱", url: "https://www.mumc.nl",
    portalUrl: "https://mijn.mumc.nl", loginName: "Mijn MUMC+", region: "nl",
  },
  {
    id: "isala", name: "Isala", city: "Zwolle", country: "Nederland",
    flag: "🇳🇱", url: "https://www.isala.nl",
    portalUrl: "https://mijn.isala.nl", loginName: "Mijn Isala", region: "nl",
  },
  {
    id: "amphia", name: "Amphia Ziekenhuis", city: "Breda", country: "Nederland",
    flag: "🇳🇱", url: "https://www.amphia.nl",
    portalUrl: "https://mijn.amphia.nl", loginName: "Mijn Amphia", region: "nl",
  },
  {
    id: "jeroenbosch", name: "Jeroen Bosch Ziekenhuis", city: "'s-Hertogenbosch", country: "Nederland",
    flag: "🇳🇱", url: "https://www.jeroenboschziekenhuis.nl",
    portalUrl: "https://mijn.jeroenboschziekenhuis.nl", loginName: "Mijn JBZ", region: "nl",
  },
  {
    id: "rijnstate", name: "Rijnstate", city: "Arnhem", country: "Nederland",
    flag: "🇳🇱", url: "https://www.rijnstate.nl",
    portalUrl: "https://mijn.rijnstate.nl", loginName: "Mijn Rijnstate", region: "nl",
  },
  {
    id: "spaarne", name: "Spaarne Gasthuis", city: "Haarlem", country: "Nederland",
    flag: "🇳🇱", url: "https://www.spaarnegasthuis.nl",
    portalUrl: "https://mijn.spaarnegasthuis.nl", loginName: "Mijn Spaarne Gasthuis", region: "nl",
  },
  {
    id: "tergooi", name: "Tergooi MC", city: "Hilversum", country: "Nederland",
    flag: "🇳🇱", url: "https://www.tergooi.nl",
    portalUrl: "https://mijn.tergooi.nl", loginName: "Mijn Tergooi", region: "nl",
  },
  {
    id: "antonius", name: "St. Antonius Ziekenhuis", city: "Nieuwegein", country: "Nederland",
    flag: "🇳🇱", url: "https://www.antoniusziekenhuis.nl",
    portalUrl: "https://mijn.antoniusziekenhuis.nl", loginName: "Mijn Antonius", region: "nl",
  },
  {
    id: "mst", name: "Medisch Spectrum Twente", city: "Enschede", country: "Nederland",
    flag: "🇳🇱", url: "https://www.mst.nl",
    portalUrl: "https://mijn.mst.nl", loginName: "Mijn MST", region: "nl",
  },
  {
    id: "zuyderland", name: "Zuyderland MC", city: "Sittard", country: "Nederland",
    flag: "🇳🇱", url: "https://www.zuyderland.nl",
    portalUrl: "https://mijn.zuyderland.nl", loginName: "Mijn Zuyderland", region: "nl",
  },
  {
    id: "flevozh", name: "Flevoziekenhuis", city: "Almere", country: "Nederland",
    flag: "🇳🇱", url: "https://www.flevoziekenhuis.nl",
    portalUrl: "https://mijn.flevoziekenhuis.nl", loginName: "Mijn Flevoziekenhuis", region: "nl",
  },
  {
    id: "reinier", name: "Reinier de Graaf", city: "Delft", country: "Nederland",
    flag: "🇳🇱", url: "https://www.reinierdegraaf.nl",
    portalUrl: "https://mijn.reinierdegraaf.nl", loginName: "Mijn Reinier de Graaf", region: "nl",
  },
  {
    id: "meander", name: "Meander Medisch Centrum", city: "Amersfoort", country: "Nederland",
    flag: "🇳🇱", url: "https://www.meandermc.nl",
    portalUrl: "https://mijn.meandermc.nl", loginName: "Mijn Meander", region: "nl",
  },
  // ── België ─────────────────────────────────────────────────────────────────
  {
    id: "uzleuven", name: "UZ Leuven", city: "Leuven", country: "België",
    flag: "🇧🇪", url: "https://www.uzleuven.be",
    portalUrl: "https://mijn.uzleuven.be", loginName: "Mijn UZ Leuven", region: "europa",
  },
  {
    id: "uzgent", name: "UZ Gent", city: "Gent", country: "België",
    flag: "🇧🇪", url: "https://www.uzgent.be",
    portalUrl: "https://mijnportaal.uzgent.be", loginName: "Mijn UZ Gent", region: "europa",
  },
  {
    id: "azgroeninge", name: "AZ Groeninge", city: "Kortrijk", country: "België",
    flag: "🇧🇪", url: "https://www.azgroeninge.be",
    portalUrl: "https://mijn.azgroeninge.be", loginName: "Mijn AZ Groeninge", region: "europa",
  },
  // ── Duitsland ──────────────────────────────────────────────────────────────
  {
    id: "charite", name: "Charité Berlin", city: "Berlijn", country: "Duitsland",
    flag: "🇩🇪", url: "https://www.charite.de",
    portalUrl: "https://patientenportal.charite.de", loginName: "Mein Charité Portal", region: "europa",
  },
  {
    id: "ukebonn", name: "Universitätsklinikum Bonn", city: "Bonn", country: "Duitsland",
    flag: "🇩🇪", url: "https://www.ukbonn.de",
    portalUrl: "https://meinportal.ukbonn.de", loginName: "Mein UKB Portal", region: "europa",
  },
  // ── Frankrijk ──────────────────────────────────────────────────────────────
  {
    id: "aphp", name: "AP-HP Pitié-Salpêtrière", city: "Parijs", country: "Frankrijk",
    flag: "🇫🇷", url: "https://www.aphp.fr",
    portalUrl: "https://moncompte.aphp.fr", loginName: "Mon Compte AP-HP", region: "europa",
  },
  // ── Spanje ─────────────────────────────────────────────────────────────────
  {
    id: "valldhebron", name: "Hospital Vall d'Hebron", city: "Barcelona", country: "Spanje",
    flag: "🇪🇸", url: "https://www.vallhebron.com",
    portalUrl: "https://pacient.vallhebron.com", loginName: "El Meu Vall d'Hebron", region: "europa",
  },
  // ── VK ─────────────────────────────────────────────────────────────────────
  {
    id: "gstt", name: "Guy's and St Thomas'", city: "Londen", country: "Verenigd Koninkrijk",
    flag: "🇬🇧", url: "https://www.guysandstthomas.nhs.uk",
    portalUrl: "https://my.guysandstthomas.nhs.uk", loginName: "My GSTT", region: "europa",
  },
  // ── Amerika ────────────────────────────────────────────────────────────────
  {
    id: "mayo", name: "Mayo Clinic", city: "Rochester, MN", country: "Verenigde Staten",
    flag: "🇺🇸", url: "https://www.mayoclinic.org",
    portalUrl: "https://mychart.mayoclinic.org", loginName: "Mayo Clinic Patient Portal", region: "amerika",
  },
  {
    id: "johnshopkins", name: "Johns Hopkins Hospital", city: "Baltimore, MD", country: "Verenigde Staten",
    flag: "🇺🇸", url: "https://www.hopkinsmedicine.org",
    portalUrl: "https://mychart.hopkinsmedicine.org", loginName: "MyChart Hopkins", region: "amerika",
  },
  {
    id: "massgeneral", name: "Massachusetts General Hospital", city: "Boston, MA", country: "Verenigde Staten",
    flag: "🇺🇸", url: "https://www.massgeneral.org",
    portalUrl: "https://myhealth.mgh.harvard.edu", loginName: "MyHealth MGH", region: "amerika",
  },
  // ── Azië ───────────────────────────────────────────────────────────────────
  {
    id: "bumrungrad", name: "Bumrungrad International", city: "Bangkok", country: "Thailand",
    flag: "🇹🇭", url: "https://www.bumrungrad.com",
    portalUrl: "https://mypatient.bumrungrad.com", loginName: "My Bumrungrad", region: "azie",
  },
  {
    id: "mountelizabeth", name: "Mount Elizabeth Hospital", city: "Singapore", country: "Singapore",
    flag: "🇸🇬", url: "https://www.mountelizabeth.com.sg",
    portalUrl: "https://mymountpatient.com.sg", loginName: "My Mount Elizabeth", region: "azie",
  },
];
