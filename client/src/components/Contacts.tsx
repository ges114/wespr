import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus, Users2, Building2, Phone, Video, ArrowLeft, ChevronRight, ShieldCheck, Search, Check, UserCheck, X, Camera, QrCode } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "./ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import jsQR from "jsqr";

type SubView = null | "new_friends" | "group_chats" | "official";

export function Contacts({ onCall, onVideoCall, onEmail, onOpenContact, onOpenChat, onSubViewChange, resetRef }: {
  onCall?: (name: string, avatar?: string | null) => void;
  onVideoCall?: (name: string, avatar?: string | null) => void;
  onEmail?: (name: string, avatar?: string | null) => void;
  onOpenContact?: (contact: any) => void;
  onOpenChat?: (chatId: string) => void;
  onSubViewChange?: (view: SubView) => void;
  resetRef?: { current: (() => void) | null };
}) {
  const [subView, setSubView] = useState<SubView>(null);

  const changeSubView = (view: SubView) => {
    setSubView(view);
    onSubViewChange?.(view);
    if (resetRef && view) resetRef.current = () => changeSubView(null);
  };
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [callMenuId, setCallMenuId] = useState<string | null>(null);
  const [quickDialContact, setQuickDialContact] = useState<any | null>(null);
  const [query, setQuery] = useState("");

  const { data: contactList, isLoading } = useQuery({
    queryKey: ["/api/contacts"],
    queryFn: () => apiRequest("/api/contacts"),
  });

  const { data: chats } = useQuery({
    queryKey: ["/api/chats"],
    queryFn: () => apiRequest("/api/chats"),
  });

  if (subView === "new_friends") return <NewFriendsView onBack={() => changeSubView(null)} />;
  if (subView === "group_chats") return <GroupChatsView onBack={() => changeSubView(null)} chats={chats || []} />;
  if (subView === "official") return <OfficialAccountsView onBack={() => changeSubView(null)} chats={chats || []} />;

  const filteredContacts = (contactList || []).filter((item: any) =>
    !query || item.contact.displayName.toLowerCase().includes(query.toLowerCase())
  );

  const grouped = filteredContacts.reduce((acc: any, item: any) => {
    const letter = item.contact.displayName.charAt(0).toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  const sortedLetters = Object.keys(grouped).sort();

  const handleContactChat = (item: any) => {
    setQuickDialContact(item.contact);
  };

  return (
    <div className="flex flex-col" onClick={() => setCallMenuId(null)}>
      <div className="px-3 py-2 shrink-0">
        <div className="flex items-center gap-2 bg-muted/60 rounded-xl px-3 py-2">
          <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Zoek contacten..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            data-testid="contacts-search"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {!query && (
        <>
          <div className="px-4 py-2">
            <div onClick={() => changeSubView("new_friends")} className="flex items-center gap-4 py-3 cursor-pointer group">
              <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <UserPlus className="w-5 h-5" />
              </div>
              <div className="flex-1 flex items-center justify-between font-medium border-b border-border/40 pb-3 -mb-3 pt-2">
                <span>Nieuwe Bel vrienden</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
            <div onClick={() => changeSubView("group_chats")} className="flex items-center gap-4 py-3 cursor-pointer group">
              <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Users2 className="w-5 h-5" />
              </div>
              <div className="flex-1 flex items-center justify-between font-medium border-b border-border/40 pb-3 -mb-3 pt-2">
                <span>Groepsgesprekken</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
            <div onClick={() => changeSubView("official")} className="flex items-center gap-4 py-3 cursor-pointer group">
              <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="flex-1 flex items-center justify-between font-medium">
                <span>Officiële Accounts</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </div>
          <div className="h-2 bg-muted/30 w-full my-2"></div>
        </>
      )}

      {isLoading ? (
        <div className="px-4 py-4 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <Skeleton className="h-4 w-40" />
            </div>
          ))}
        </div>
      ) : sortedLetters.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
            <UserPlus className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <p className="font-semibold text-foreground mb-1">
            {query ? "Geen contacten gevonden" : "Nog geen contacten"}
          </p>
          <p className="text-sm text-muted-foreground">
            {query ? `Geen resultaten voor "${query}"` : "Voeg vrienden toe via 'Nieuwe Vrienden' hierboven"}
          </p>
        </div>
      ) : (
        sortedLetters.map(letter => (
          <div key={letter}>
            <div className="px-4 py-1 bg-muted/30 text-xs font-bold text-muted-foreground sticky top-0 backdrop-blur-md z-10">
              {letter}
            </div>
            <div className="flex flex-col">
              {grouped[letter].map((item: any, i: number) => {
                const showCallMenu = callMenuId === item.id;
                const isLast = i === grouped[letter].length - 1;
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors ${!isLast ? 'border-b border-border/30' : ''}`}
                  >
                    <button
                      onClick={() => handleContactChat(item)}
                      className="flex items-center gap-3 flex-1 text-left min-w-0"
                      data-testid={`contact-open-${item.id}`}
                    >
                      <Avatar className="h-10 w-10 rounded-xl shrink-0">
                        <AvatarImage src={item.contact.avatar} className="object-cover" />
                        <AvatarFallback className="rounded-xl text-sm font-semibold">{item.contact.displayName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium truncate">{item.contact.displayName}</span>
                    </button>

                    <div className="relative shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); setCallMenuId(showCallMenu ? null : item.id); }}
                        className={`p-2.5 rounded-full transition-colors ${showCallMenu ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600' : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'}`}
                        data-testid={`call-btn-${item.id}`}
                        title="Bellen"
                      >
                        <Phone className="w-5 h-5" />
                      </button>

                      <AnimatePresence>
                        {showCallMenu && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.92, y: -6 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: -6 }}
                            transition={{ duration: 0.13 }}
                            className="absolute right-0 top-full mt-1.5 z-50 bg-background border border-border rounded-2xl shadow-xl overflow-hidden min-w-[175px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => { setCallMenuId(null); onCall?.(item.contact.displayName, item.contact.avatar); }}
                              className="flex items-center gap-3 w-full px-4 py-3.5 text-sm font-medium hover:bg-muted/60 transition-colors border-b border-border/40"
                              data-testid={`voice-call-${item.id}`}
                            >
                              <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                              <span>Bellen</span>
                            </button>
                            <button
                              onClick={() => { setCallMenuId(null); onVideoCall?.(item.contact.displayName, item.contact.avatar); }}
                              className="flex items-center gap-3 w-full px-4 py-3.5 text-sm font-medium hover:bg-muted/60 transition-colors"
                              data-testid={`video-call-${item.id}`}
                            >
                              <Video className="w-4 h-4 text-blue-500 shrink-0" />
                              <span>Videobellen</span>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* Quick Dial Sheet */}
      <AnimatePresence>
        {quickDialContact && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-end justify-center"
            onClick={() => setQuickDialContact(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="w-full max-w-sm bg-background rounded-t-3xl overflow-hidden shadow-2xl pb-safe"
              onClick={e => e.stopPropagation()}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>

              {/* Contact info */}
              <div className="flex flex-col items-center pt-4 pb-6 px-6 gap-3">
                <Avatar className="h-24 w-24 rounded-2xl shadow-xl border border-border/40">
                  {quickDialContact.avatar && <AvatarImage src={quickDialContact.avatar} className="object-cover" />}
                  <AvatarFallback className="rounded-2xl bg-emerald-600 text-white text-3xl font-bold">
                    {quickDialContact.displayName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h3 className="text-xl font-bold">{quickDialContact.displayName}</h3>
                  <p className="text-sm text-muted-foreground">W€spr ID: {quickDialContact.auraId || "onbekend"}</p>
                </div>

                {/* Call button */}
                <button
                  onClick={() => { setQuickDialContact(null); onCall?.(quickDialContact.displayName, quickDialContact.avatar); }}
                  className="flex flex-col items-center gap-2 mt-3 active:scale-95 transition-all"
                  data-testid="quickdial-call-btn"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 transition-colors">
                    <Phone className="w-7 h-7" />
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Bellen</span>
                </button>

                {/* Cancel */}
                <button
                  onClick={() => setQuickDialContact(null)}
                  className="w-full py-3 rounded-2xl bg-muted hover:bg-muted/80 text-muted-foreground font-medium text-sm transition-colors mt-1"
                  data-testid="quickdial-cancel-btn"
                >
                  Annuleren
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NewFriendsView({ onBack }: { onBack: () => void }) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [panel, setPanel] = useState<"main" | "scanner" | "mijnqr">("main");
  const [qrToken, setQrToken] = useState(() => Math.random().toString(36).slice(2, 10).toUpperCase());
  const [qrCountdown, setQrCountdown] = useState(5);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scannedUser, setScannedUser] = useState<any | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const scanningRef = useRef(false);
  const queryClient = useQueryClient();

  const { data: me } = useQuery<any>({ queryKey: ["/api/me"], queryFn: () => apiRequest("/api/me") });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (panel !== "mijnqr") return;
    setQrCountdown(5);
    const tick = setInterval(() => {
      setQrCountdown(prev => {
        if (prev <= 1) { setQrToken(Math.random().toString(36).slice(2, 10).toUpperCase()); return 5; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [panel]);

  function stopCamera() {
    scanningRef.current = false;
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setCameraActive(false);
  }

  async function startCamera() {
    setScanError(null); setScannedUser(null); scanningRef.current = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) { stream.getTracks().forEach(t => t.stop()); return; }
      video.srcObject = stream;
      await video.play();
      setCameraActive(true);
      const tick = () => {
        if (!scanningRef.current) return;
        const v = videoRef.current; const c = canvasRef.current;
        if (!v || !c || v.readyState < 2) { rafRef.current = requestAnimationFrame(tick); return; }
        c.width = v.videoWidth; c.height = v.videoHeight;
        const ctx = c.getContext("2d"); if (!ctx) return;
        ctx.drawImage(v, 0, 0, c.width, c.height);
        const imageData = ctx.getImageData(0, 0, c.width, c.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code?.data?.startsWith("wespr://user?id=")) {
          const auraId = code.data.split("&")[0].replace("wespr://user?id=", "");
          scanningRef.current = false; stopCamera();
          apiRequest(`/api/users/search?q=${encodeURIComponent(auraId)}`)
            .then((results: any[]) => {
              const found = results?.find((u: any) => u.auraId === auraId);
              if (found) setScannedUser(found);
              else setScanError("Geen W€spr-gebruiker gevonden voor deze QR-code.");
            })
            .catch(() => setScanError("Fout bij opzoeken van gebruiker."));
        } else { rafRef.current = requestAnimationFrame(tick); }
      }
      rafRef.current = requestAnimationFrame(tick);
    } catch { setScanError("Camera niet toegankelijk. Controleer je browser-instellingen."); }
  }

  useEffect(() => {
    if (panel === "scanner" && !scannedUser) startCamera();
    return () => stopCamera();
  }, [panel]);

  useEffect(() => () => stopCamera(), []);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ["/api/users/search", debouncedSearch],
    queryFn: () => apiRequest(`/api/users/search?q=${encodeURIComponent(debouncedSearch)}`),
    enabled: debouncedSearch.length >= 2,
  });

  const addMutation = useMutation({
    mutationFn: (contactId: string) =>
      apiRequest("/api/contacts", { method: "POST", body: JSON.stringify({ contactId }) }),
    onSuccess: (_data, contactId) => {
      setAddedIds(prev => new Set(Array.from(prev).concat(contactId)));
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
    },
  });

  return (
    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex flex-col min-h-full bg-muted/20">
      {panel !== "main" && (
        <header className="px-4 py-4 flex items-center gap-3 bg-background/80 backdrop-blur-xl sticky top-0 z-50 border-b border-border/50">
          <Button variant="ghost" size="icon" onClick={() => { stopCamera(); setPanel("main"); }} className="-ml-2">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold tracking-tight">
            {panel === "scanner" ? "QR-code Scannen" : "Mijn QR-code"}
          </h1>
        </header>
      )}

      <AnimatePresence mode="wait">
        {panel === "main" && (
          <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-4 py-2.5">
              <Search className="w-5 h-5 text-muted-foreground shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Zoek op naam of W€spr ID..."
                className="bg-transparent border-none outline-none flex-1 text-[15px] placeholder:text-muted-foreground/70"
                data-testid="search-friends-input"
              />
              {search && (
                <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none">×</button>
              )}
            </div>

            {debouncedSearch.length >= 2 ? (
              <>
                <h3 className="text-xs font-bold text-muted-foreground px-1">
                  {isFetching ? "Zoeken..." : results.length > 0 ? `${(results as any[]).length} RESULTAAT${(results as any[]).length !== 1 ? "EN" : ""}` : "GEEN RESULTATEN"}
                </h3>
                {isFetching && (
                  <div className="space-y-3">
                    {[1, 2].map(i => (
                      <div key={i} className="flex items-center gap-4 bg-card rounded-2xl px-4 py-3">
                        <Skeleton className="h-12 w-12 rounded-xl" />
                        <div className="flex-1 space-y-1.5"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-24" /></div>
                      </div>
                    ))}
                  </div>
                )}
                {!isFetching && (results as any[]).length > 0 && (
                  <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
                    {(results as any[]).map((user: any, i: number) => {
                      const isAdded = user.isContact || addedIds.has(user.id);
                      return (
                        <div key={user.id} className={`flex items-center gap-4 px-4 py-3 ${i < (results as any[]).length - 1 ? "border-b border-border/30" : ""}`}>
                          <Avatar className="h-12 w-12 rounded-xl shrink-0">
                            {user.avatar && <AvatarImage src={user.avatar} className="object-cover" />}
                            <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold">{user.displayName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-[15px] truncate">{user.displayName}</h4>
                            <p className="text-xs text-muted-foreground truncate">{user.auraId}</p>
                          </div>
                          {isAdded ? (
                            <div className="flex items-center gap-1 text-emerald-600 text-xs font-medium shrink-0">
                              <UserCheck className="w-4 h-4" /><span>Contact</span>
                            </div>
                          ) : (
                            <Button size="sm" variant="outline" className="rounded-xl text-xs shrink-0"
                              onClick={() => addMutation.mutate(user.id)} disabled={addMutation.isPending}
                              data-testid={`add-contact-${user.id}`}>Toevoegen</Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {!isFetching && (results as any[]).length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <ShieldCheck className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-sm font-medium">Geen W€spr-gebruiker gevonden</p>
                    <p className="text-xs mt-1 opacity-70">Controleer de naam of het W€spr ID</p>
                  </div>
                )}
              </>
            ) : null}

            <button
              onClick={() => setPanel("scanner")}
              className="flex items-center gap-4 py-4 px-4 bg-card rounded-2xl shadow-sm border border-border/50 hover:border-primary/30 hover:bg-muted/30 transition-colors text-left"
              data-testid="open-scanner-card"
            >
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                <Camera className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-[15px]">QR-code Scannen</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Scan iemands W€spr QR-code</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>

            <button
              onClick={() => setPanel("mijnqr")}
              className="flex items-center gap-4 py-4 px-4 bg-card rounded-2xl shadow-sm border border-border/50 hover:border-primary/30 hover:bg-muted/30 transition-colors text-left"
              data-testid="open-mijnqr-card"
            >
              <div className="h-12 w-12 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center text-violet-600 shrink-0">
                <QrCode className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-[15px]">Mijn QR-code</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Laat anderen jou toevoegen</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </motion.div>
        )}

        {panel === "scanner" && (
          <motion.div key="scanner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col">
            {scannedUser ? (
              <div className="p-4 flex flex-col gap-4">
                <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
                  <span>✓ QR-code succesvol gescand</span>
                </div>
                <div className="flex items-center gap-4 py-3 px-4 rounded-2xl border border-border/40 bg-card shadow-sm">
                  <Avatar className="h-11 w-11 rounded-xl shrink-0">
                    <AvatarImage src={scannedUser.avatar || undefined} className="object-cover" />
                    <AvatarFallback className="rounded-xl font-bold">{scannedUser.displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[15px] truncate">{scannedUser.displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{scannedUser.auraId}</p>
                  </div>
                  <Button size="sm" className="rounded-full shrink-0"
                    onClick={() => addMutation.mutate(scannedUser.id)} disabled={addMutation.isPending || addedIds.has(scannedUser.id)}>
                    {addedIds.has(scannedUser.id) ? "Toegevoegd!" : addMutation.isPending ? "..." : "Toevoegen"}
                  </Button>
                </div>
                <button onClick={() => { setScannedUser(null); setScanError(null); startCamera(); }} className="text-sm text-muted-foreground hover:text-foreground text-center">Opnieuw scannen</button>
              </div>
            ) : (
              <div className="relative bg-black flex-1 flex items-center justify-center" style={{ minHeight: "350px" }}>
                <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-cover opacity-0" />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 z-[5]" style={{ background: "radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,0.72) 100%)" }} />
                {!scanError && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <div className="relative w-56 h-56">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-2xl" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-2xl" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-2xl" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-2xl" />
                      <motion.div animate={{ y: ["0%", "220px", "0%"] }} transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }} className="absolute left-1 right-1 h-0.5 bg-primary shadow-[0_0_10px_3px] shadow-primary" />
                    </div>
                  </div>
                )}
                {!cameraActive && !scanError && (
                  <div className="absolute bottom-16 left-0 right-0 flex flex-col items-center gap-2 z-20">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <p className="text-xs text-white/50">Camera starten...</p>
                  </div>
                )}
                {scanError && (
                  <div className="flex flex-col items-center gap-4 text-white z-10 px-8 text-center">
                    <QrCode className="w-12 h-12 text-white/30" />
                    <p className="text-sm text-white/70">{scanError}</p>
                    <button onClick={() => startCamera()} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium transition-colors">Opnieuw proberen</button>
                  </div>
                )}
                <p className="absolute bottom-8 left-0 right-0 text-center text-white/60 text-sm z-20 px-4">Richt de camera op een W€spr QR-code</p>
              </div>
            )}
          </motion.div>
        )}

        {panel === "mijnqr" && (
          <motion.div key="mijnqr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center py-10 px-6 gap-5">
            <div className="text-center">
              <h2 className="font-bold text-xl">{me?.displayName || "Mijn QR"}</h2>
              <p className="text-sm text-muted-foreground mt-1">{me?.auraId}</p>
            </div>
            {me?.auraId ? (
              <div className="relative">
                <svg className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)] -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="47" fill="none" stroke="hsl(var(--border))" strokeWidth="2" />
                  <motion.circle cx="50" cy="50" r="47" fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="295.3"
                    animate={{ strokeDashoffset: 295.3 - (295.3 * qrCountdown / 5) }} transition={{ duration: 0.8, ease: "easeInOut" }} />
                </svg>
                <motion.div key={qrToken} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="bg-white p-5 rounded-3xl shadow-xl">
                  <QRCodeSVG value={`wespr://user?id=${me.auraId}&t=${qrToken}`} size={200} level="M" includeMargin={false} />
                </motion.div>
              </div>
            ) : (
              <div className="w-52 h-52 bg-muted rounded-3xl flex items-center justify-center">
                <QrCode className="w-16 h-16 text-muted-foreground/30" />
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-full px-3 py-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Beveiligd · verloopt in {qrCountdown}s</span>
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground max-w-xs leading-relaxed">Laat anderen deze QR-code scannen om jou toe te voegen als contact. De code vernieuwt automatisch elke 5 seconden.</p>
            {me?.auraId && (
              <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-4 py-2.5">
                <span className="text-sm font-mono font-medium">{me.auraId}</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function GroupChatsView({ onBack, chats }: { onBack: () => void; chats: any[] }) {
  const groups = chats.filter((c: any) => c.isGroup);

  return (
    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex flex-col min-h-full bg-muted/20">
      <header className="px-4 py-4 flex items-center gap-3 bg-background/80 backdrop-blur-xl sticky top-0 z-50 border-b border-border/50">
        <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold tracking-tight">Groepschats</h1>
      </header>
      <div className="p-4">
        {groups.length > 0 ? (
          <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
            {groups.map((g: any, i: number) => (
              <div key={g.id} className={`flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-muted/50 ${i < groups.length - 1 ? 'border-b border-border/30' : ''}`}>
                <Avatar className="h-12 w-12 rounded-xl">
                  {g.avatar && <AvatarImage src={g.avatar} className="object-cover" />}
                  <AvatarFallback className="rounded-xl bg-primary/10 text-primary">
                    <Users2 className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h4 className="font-medium text-[15px]">{g.name}</h4>
                  <p className="text-xs text-muted-foreground">{g.lastMessage}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <Users2 className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">Nog geen groepschats</p>
            <p className="text-xs mt-1">Maak een groep aan via de '+' knop</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function OfficialAccountsView({ onBack, chats }: { onBack: () => void; chats: any[] }) {
  const official = chats.filter((c: any) => c.isOfficial);
  const recommended = [
    { name: "W€spr Updates", desc: "Laatste nieuws en updates", icon: "🔔" },
    { name: "EU Digital Identity", desc: "Europese digitale identiteit", icon: "🇪🇺" },
    { name: "NS Reisplanner", desc: "Treininformatie en tickets", icon: "🚆" },
    { name: "Belastingdienst", desc: "Belastingzaken regelen", icon: "🏛️" },
  ];

  return (
    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex flex-col min-h-full bg-muted/20">
      <header className="px-4 py-4 flex items-center gap-3 bg-background/80 backdrop-blur-xl sticky top-0 z-50 border-b border-border/50">
        <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold tracking-tight">Officiële Accounts</h1>
      </header>
      <div className="p-4">
        {official.length > 0 && (
          <>
            <h3 className="text-xs font-bold text-muted-foreground mb-3">GEVOLGD</h3>
            <div className="bg-card rounded-2xl shadow-sm overflow-hidden mb-6">
              {official.map((o: any, i: number) => (
                <div key={o.id} className={`flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-muted/50 ${i < official.length - 1 ? 'border-b border-border/30' : ''}`}>
                  <Avatar className="h-12 w-12 rounded-xl">
                    {o.avatar && <AvatarImage src={o.avatar} className="object-cover" />}
                    <AvatarFallback className="rounded-xl bg-primary/10 text-primary">
                      <ShieldCheck className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-medium text-[15px] flex items-center gap-1.5">
                      {o.name}
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                    </h4>
                    <p className="text-xs text-muted-foreground truncate">{o.lastMessage}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <h3 className="text-xs font-bold text-muted-foreground mb-3">AANBEVOLEN</h3>
        <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
          {recommended.map((r, i) => (
            <div key={i} className={`flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-muted/50 ${i < recommended.length - 1 ? 'border-b border-border/30' : ''}`}>
              <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center text-2xl">
                {r.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-[15px]">{r.name}</h4>
                <p className="text-xs text-muted-foreground">{r.desc}</p>
              </div>
              <Button size="sm" variant="outline" className="rounded-xl text-xs">Volgen</Button>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}