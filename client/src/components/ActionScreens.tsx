import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, Users, QrCode, Phone, MessageCircle, Camera, X, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { QRCodeSVG } from "qrcode.react";
import jsQR from "jsqr";
import { useToast } from "@/hooks/use-toast";

export function ActionScreens({ type, onBack, onOpenChat, onCall, inline }: {
  type: "new_chat" | "add_friend";
  onBack: () => void;
  onOpenChat?: (id: string) => void;
  onCall?: (name: string, avatar?: string | null) => void;
  inline?: boolean;
}) {
  const isChat = type === "new_chat";
  const [search, setSearch] = useState("");
  const [groupMode, setGroupMode] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [panel, setPanel] = useState<"main" | "scanner" | "mijnqr">("main");
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [scannedUser, setScannedUser] = useState<any | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [qrToken, setQrToken] = useState(() => Math.random().toString(36).slice(2, 10).toUpperCase());
  const [qrCountdown, setQrCountdown] = useState(5);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (panel !== "mijnqr") return;
    setQrCountdown(5);
    const tick = setInterval(() => {
      setQrCountdown(prev => {
        if (prev <= 1) {
          setQrToken(Math.random().toString(36).slice(2, 10).toUpperCase());
          return 5;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [panel]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const scanningRef = useRef(false);

  const { data: contacts } = useQuery({
    queryKey: ["/api/contacts"],
    queryFn: () => apiRequest("/api/contacts"),
  });

  const { data: me } = useQuery<any>({
    queryKey: ["/api/me"],
    queryFn: () => apiRequest("/api/me"),
  });

  const { data: chats } = useQuery({
    queryKey: ["/api/chats"],
    queryFn: () => apiRequest("/api/chats"),
  });

  const { data: searchResults, isLoading: searching } = useQuery<any[]>({
    queryKey: ["/api/users/search", search],
    queryFn: () => apiRequest(`/api/users/search?q=${encodeURIComponent(search.trim())}`),
    enabled: !isChat && search.trim().length >= 2,
    staleTime: 5000,
  });

  const addContactMutation = useMutation({
    mutationFn: (vars: { id: string; displayName: string }) =>
      apiRequest("/api/contacts", { method: "POST", body: JSON.stringify({ contactId: vars.id }) }),
    onSuccess: (_, vars) => {
      setAddedIds(prev => new Set(prev).add(vars.id));
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({ description: `${vars.displayName} toegevoegd aan je contacten!` });
    },
    onError: () => {
      toast({ description: "Kon contact niet toevoegen. Probeer opnieuw.", variant: "destructive" });
    },
  });

  const contactIds = new Set((contacts || []).map((c: any) => c.contactId || c.contact?.id));
  const filteredContacts = search.trim()
    ? (contacts || []).filter((c: any) =>
        c.contact?.displayName?.toLowerCase().includes(search.toLowerCase())
      )
    : contacts || [];

  function stopCamera() {
    scanningRef.current = false;
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setCameraActive(false);
  }

  async function startCamera() {
    setScanError(null);
    setScannedUser(null);
    scanningRef.current = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) { stream.getTracks().forEach(t => t.stop()); return; }
      video.srcObject = stream;
      await video.play();
      setCameraActive(true);
      const tick = () => {
        if (!scanningRef.current) return;
        const v = videoRef.current;
        const c = canvasRef.current;
        if (!v || !c || v.readyState < 2) { rafRef.current = requestAnimationFrame(tick); return; }
        c.width = v.videoWidth; c.height = v.videoHeight;
        const ctx = c.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(v, 0, 0, c.width, c.height);
        const imageData = ctx.getImageData(0, 0, c.width, c.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code?.data?.startsWith("wespr://user?id=")) {
          const auraId = code.data.split("&")[0].replace("wespr://user?id=", "");
          scanningRef.current = false;
          stopCamera();
          apiRequest(`/api/users/search?q=${encodeURIComponent(auraId)}`)
            .then((results: any[]) => {
              const found = results?.find((u: any) => u.auraId === auraId);
              if (found) setScannedUser(found);
              else setScanError("Geen W€spr-gebruiker gevonden voor deze QR-code.");
            })
            .catch(() => setScanError("Fout bij opzoeken van gebruiker."));
        } else {
          rafRef.current = requestAnimationFrame(tick);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setScanError("Camera niet toegankelijk. Controleer je browser-instellingen.");
    }
  }

  useEffect(() => {
    if (panel === "scanner" && !scannedUser) startCamera();
    return () => stopCamera();
  }, [panel]);

  useEffect(() => () => stopCamera(), []);

  if (groupMode) {
    const allContacts = contacts || [];
    return (
      <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex flex-col h-full bg-muted/20">
        <header className="px-4 py-4 flex items-center gap-3 bg-background/80 backdrop-blur-xl sticky top-0 z-50 border-b border-border/50">
          <Button variant="ghost" size="icon" onClick={() => setGroupMode(false)} className="-ml-2">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold tracking-tight">Nieuwe Groep</h1>
        </header>
        <div className="p-4">
          <div className="mb-6">
            <label className="text-xs font-bold text-muted-foreground mb-2 block">GROEPSNAAM</label>
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Geef je groep een naam..."
              className="w-full bg-muted/50 rounded-xl px-4 py-3 text-[15px] outline-none border border-border/50 focus:border-primary/50 transition-colors"
            />
          </div>
          <label className="text-xs font-bold text-muted-foreground mb-3 block">LEDEN SELECTEREN</label>
          <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
            {allContacts.map((item: any, i: number) => {
              const isSelected = selectedMembers.includes(item.contact.id);
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedMembers(prev =>
                    isSelected ? prev.filter(id => id !== item.contact.id) : [...prev, item.contact.id]
                  )}
                  className={`flex items-center gap-4 px-4 py-3 cursor-pointer transition-colors ${isSelected ? "bg-primary/5" : "hover:bg-muted/50"} ${i < allContacts.length - 1 ? "border-b border-border/30" : ""}`}
                >
                  <Avatar className="h-10 w-10 rounded-xl">
                    <AvatarImage src={item.contact.avatar} className="object-cover" />
                    <AvatarFallback className="rounded-xl">{item.contact.displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="flex-1 font-medium text-[15px]">{item.contact.displayName}</span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"}`}>
                    {isSelected && <span className="text-white text-xs">✓</span>}
                  </div>
                </div>
              );
            })}
          </div>
          {selectedMembers.length > 0 && (
            <Button className="w-full mt-4 rounded-xl gap-2">
              <Users className="w-4 h-4" /> Groep aanmaken ({selectedMembers.length} leden)
            </Button>
          )}
        </div>
      </motion.div>
    );
  }

  if (isChat) {
    return (
      <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="flex flex-col h-full bg-background">
        <header className="px-4 py-4 flex items-center gap-3 bg-background/80 backdrop-blur-xl sticky top-0 z-50 border-b border-border/50">
          <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold tracking-tight">Nieuwe Chat</h1>
        </header>
        <div className="flex-1 overflow-y-auto hide-scrollbar">
          <div className="p-4">
            <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-4 py-2.5 mb-6">
              <Search className="w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Zoek in contacten..."
                className="bg-transparent border-none outline-none flex-1 text-[15px] placeholder:text-muted-foreground/70"
                data-testid="chat-search-input"
              />
            </div>
            <div onClick={() => setGroupMode(true)} className="flex items-center gap-4 py-3 cursor-pointer group">
              <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex-1 font-bold text-[15px]">Nieuwe Groep Aanmaken</div>
            </div>
            <h3 className="text-xs font-bold text-muted-foreground mt-4 mb-3 px-1">CONTACTEN</h3>
            {filteredContacts.map((item: any) => (
              <div key={item.id} className="flex items-center gap-4 py-2.5 cursor-pointer hover:bg-muted/50 rounded-xl px-2 -mx-2 transition-colors">
                <Avatar className="h-10 w-10 rounded-xl">
                  <AvatarImage src={item.contact.avatar} className="object-cover" />
                  <AvatarFallback className="rounded-xl">{item.contact.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="flex-1 font-medium text-[15px]">{item.contact.displayName}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      const chat = (chats || []).find((c: any) => c.name === item.contact.displayName);
                      if (chat) onOpenChat?.(chat.id);
                    }}
                    className="p-1.5 rounded-full text-primary hover:bg-primary/10"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onCall?.(item.contact.displayName, item.contact.avatar)}
                    className="p-1.5 rounded-full text-primary hover:bg-primary/10"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="flex flex-col h-full bg-background">
      {(!inline || panel !== "main") && (
        <header className="px-4 py-4 flex items-center gap-3 bg-background/80 backdrop-blur-xl sticky top-0 z-50 border-b border-border/50">
          <Button variant="ghost" size="icon" onClick={panel !== "main" ? () => { stopCamera(); setScannedUser(null); setScanError(null); setPanel("main"); } : onBack} className="-ml-2" data-testid="add-friend-back">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold tracking-tight flex-1">
            {panel === "scanner" ? "QR-code Scannen" : panel === "mijnqr" ? "Mijn QR-code" : "Vriend Toevoegen"}
          </h1>
          {panel === "main" && (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => { setSearch(""); setPanel("scanner"); }} data-testid="open-scanner" title="QR scannen">
                <Camera className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setPanel("mijnqr")} data-testid="open-mijnqr" title="Mijn QR">
                <QrCode className="w-5 h-5" />
              </Button>
            </div>
          )}
        </header>
      )}

      <AnimatePresence mode="wait">
        {panel === "main" && (
          <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 overflow-y-auto hide-scrollbar">
            <div className="p-4">
              <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-4 py-2.5 mb-5">
                <Search className="w-5 h-5 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Zoek op naam of W€spr ID..."
                  className="bg-transparent border-none outline-none flex-1 text-[15px] placeholder:text-muted-foreground/70"
                  data-testid="add-friend-search"
                  autoFocus
                />
                {search && (
                  <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                )}
                {inline && !isChat && (
                  <>
                    <button onClick={() => { setSearch(""); setPanel("scanner"); }} className="text-muted-foreground hover:text-foreground shrink-0" title="QR scannen">
                      <Camera className="w-5 h-5" />
                    </button>
                    <button onClick={() => setPanel("mijnqr")} className="text-muted-foreground hover:text-foreground shrink-0" title="Mijn QR">
                      <QrCode className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              {search.trim().length >= 2 ? (
                <>
                  {searching && (
                    <div className="text-center py-10 text-sm text-muted-foreground">Zoeken...</div>
                  )}
                  {!searching && (!searchResults || searchResults.length === 0) && (
                    <div className="text-center py-10 text-sm text-muted-foreground">
                      Geen gebruikers gevonden voor "{search}"
                    </div>
                  )}
                  {!searching && searchResults && searchResults.length > 0 && (
                    <div className="flex flex-col gap-2">
                      {searchResults.map((user: any) => (
                        <UserResultRow
                          key={user.id}
                          user={user}
                          isContact={contactIds.has(user.id)}
                          isAdded={addedIds.has(user.id)}
                          onAdd={() => addContactMutation.mutate({ id: user.id, displayName: user.displayName })}
                          loading={addContactMutation.isPending && addContactMutation.variables?.id === user.id}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setPanel("scanner")}
                    className="flex items-center gap-4 py-4 px-4 bg-card rounded-2xl shadow-sm border border-border/50 hover:border-primary/30 hover:bg-muted/30 transition-colors text-left"
                    data-testid="open-scanner-card"
                  >
                    <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
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
                    <div className="h-12 w-12 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center text-violet-600 shrink-0">
                      <QrCode className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-[15px]">Mijn QR-code</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Laat anderen jou toevoegen</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>

                  {(contacts || []).length > 0 && (
                    <div className="mt-2">
                      <h3 className="text-xs font-bold text-muted-foreground mb-2 px-1">CONTACTEN</h3>
                      <div className="flex flex-col gap-2">
                        {(contacts || []).map((item: any) => (
                          <div key={item.id} className="flex items-center gap-4 py-3 px-4 rounded-2xl border border-border/40 bg-card">
                            <Avatar className="h-10 w-10 rounded-xl shrink-0">
                              <AvatarImage src={item.contact?.avatar} className="object-cover" />
                              <AvatarFallback className="rounded-xl">{item.contact?.displayName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-[15px] truncate">{item.contact?.displayName}</p>
                              <p className="text-xs text-muted-foreground truncate">{item.contact?.auraId}</p>
                            </div>
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full shrink-0">Contact</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {panel === "scanner" && (
          <motion.div key="scanner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col">
            {scannedUser ? (
              <div className="p-4 flex flex-col gap-4">
                <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
                  <span>✓ QR-code succesvol gescand</span>
                </div>
                <UserResultRow
                  user={scannedUser}
                  isContact={contactIds.has(scannedUser.id)}
                  isAdded={addedIds.has(scannedUser.id)}
                  onAdd={() => addContactMutation.mutate({ id: scannedUser.id, displayName: scannedUser.displayName })}
                  loading={addContactMutation.isPending}
                />
                <button
                  onClick={() => { setScannedUser(null); setScanError(null); startCamera(); }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
                >
                  Opnieuw scannen
                </button>
              </div>
            ) : (
              <div className="relative bg-black flex-1 flex items-center justify-center" style={{ minHeight: "350px" }}>
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover opacity-0"
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Dark vignette overlay */}
                <div className="absolute inset-0 z-[5]" style={{ background: "radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,0.72) 100%)" }} />

                {/* Always-visible scan frame + live scan line */}
                {!scanError && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <div className="relative w-56 h-56">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-2xl" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-2xl" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-2xl" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-2xl" />
                      <motion.div
                        animate={{ y: ["0%", "220px", "0%"] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                        className="absolute left-1 right-1 h-0.5 bg-primary shadow-[0_0_10px_3px] shadow-primary"
                      />
                    </div>
                  </div>
                )}

                {/* Loading spinner (on top of frame, while camera starts) */}
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
                    <button onClick={() => startCamera()} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium transition-colors">
                      Opnieuw proberen
                    </button>
                  </div>
                )}

                <p className="absolute bottom-8 left-0 right-0 text-center text-white/60 text-sm z-20 px-4">
                  Richt de camera op een W€spr QR-code
                </p>
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
                {/* Countdown ring */}
                <svg className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)] -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="47" fill="none" stroke="hsl(var(--border))" strokeWidth="2" />
                  <motion.circle
                    cx="50" cy="50" r="47"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray="295.3"
                    animate={{ strokeDashoffset: 295.3 - (295.3 * qrCountdown / 5) }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                  />
                </svg>
                <motion.div
                  key={qrToken}
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white p-5 rounded-3xl shadow-xl"
                >
                  <QRCodeSVG value={`wespr://user?id=${me.auraId}&t=${qrToken}`} size={200} level="M" includeMargin={false} />
                </motion.div>
              </div>
            ) : (
              <div className="w-52 h-52 bg-muted rounded-3xl flex items-center justify-center">
                <QrCode className="w-16 h-16 text-muted-foreground/30" />
              </div>
            )}
            {/* Security badge + countdown */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-full px-3 py-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Beveiligd · verloopt in {qrCountdown}s</span>
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground max-w-xs leading-relaxed">
              Laat anderen deze QR-code scannen om jou toe te voegen als contact. De code vernieuwt automatisch elke 5 seconden.
            </p>
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

function UserResultRow({ user, isContact, isAdded, onAdd, loading }: {
  user: { id: string; displayName: string; avatar?: string | null; auraId: string };
  isContact: boolean;
  isAdded: boolean;
  onAdd: () => void;
  loading?: boolean;
}) {
  const alreadyAdded = isContact || isAdded;
  return (
    <div className="flex items-center gap-4 py-3 px-4 rounded-2xl border border-border/40 bg-card shadow-sm" data-testid={`user-result-${user.id}`}>
      <Avatar className="h-11 w-11 rounded-xl shrink-0">
        <AvatarImage src={user.avatar || undefined} className="object-cover" />
        <AvatarFallback className="rounded-xl font-bold">{user.displayName.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[15px] truncate">{user.displayName}</p>
        <p className="text-xs text-muted-foreground truncate">{user.auraId}</p>
      </div>
      {alreadyAdded ? (
        <span className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full shrink-0 font-medium">
          {isAdded && !isContact ? "Toegevoegd!" : "Al contact"}
        </span>
      ) : (
        <button
          onClick={onAdd}
          disabled={loading}
          className="shrink-0 text-sm font-semibold bg-primary text-primary-foreground px-4 py-1.5 rounded-full hover:bg-primary/90 disabled:opacity-60 transition-colors"
          data-testid={`add-contact-${user.id}`}
        >
          {loading ? "..." : "Toevoegen"}
        </button>
      )}
    </div>
  );
}
