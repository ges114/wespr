import { useState, useRef, useCallback, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Heart, MessageCircle, MoreHorizontal, Camera, ChevronRight, Compass, 
  Gamepad2, Ticket, Car, ShoppingBag, Landmark, Coffee, ArrowLeft, 
  Building2, ShieldCheck, HeartPulse, GraduationCap, Train, Plane, 
  Bike, Stethoscope, Pill, Apple, Pizza, Utensils, Music, Film, 
  Tv, Trophy, Target, Puzzle, Send, Plus, X, Check, Pencil, Trash2, Eye, Copy,
  Loader2, ExternalLink, Info, Settings, User, Clock, Star, Activity, MapPin,
  Shield, CreditCard, Bus, Zap, Globe, Building, Home, Euro,
  Fingerprint, Mail, FileText, Radio, Video, Users2, Briefcase, Droplets, Receipt, Headphones, Newspaper, TrendingUp, Dumbbell, FolderOpen, Search, Images
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, formatTimeAgo } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { isNavApp, NavAppView } from "./NavAppViews";
import { isTravelApp, TravelAppView } from "./TravelAppViews";
import { isHealthApp, HealthAppView } from "./HealthAppViews";
import { isGovApp, GovAppView } from "./GovAppViews";
import { isUniversalApp, UniversalAppView } from "./UniversalAppView";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

function useLongPress(onLongPress: () => void, onClick?: () => void, delay = 500) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);

  const start = useCallback(() => {
    longPressTriggered.current = false;
    timerRef.current = setTimeout(() => {
      longPressTriggered.current = true;
      onLongPress();
    }, delay);
  }, [onLongPress, delay]);

  const clear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const handleClick = useCallback(() => {
    if (!longPressTriggered.current && onClick) onClick();
  }, [onClick]);

  return {
    onMouseDown: start,
    onTouchStart: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchEnd: clear,
    onClick: handleClick,
  };
}

function LongPressMenu({ actions, onClose }: { actions: { label: string; icon: any; onClick: () => void; destructive?: boolean }[]; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: "spring", duration: 0.3 }}
        className="bg-card rounded-2xl shadow-2xl w-[240px] overflow-hidden border border-border/50"
        onClick={(e) => e.stopPropagation()}
      >
        {actions.map((action, i) => {
          const Icon = action.icon;
          return (
            <button
              key={i}
              onClick={() => { action.onClick(); onClose(); }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-left text-[14px] font-medium transition-colors ${
                action.destructive
                  ? 'text-destructive hover:bg-destructive/10'
                  : 'text-foreground hover:bg-muted/50'
              } ${i < actions.length - 1 ? 'border-b border-border/30' : ''}`}
              data-testid={`context-action-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <Icon className="w-4.5 h-4.5 shrink-0" />
              {action.label}
            </button>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
import type { LucideIcon } from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Building2, Landmark, ShieldCheck, HeartPulse, GraduationCap,
  Train, Plane, Bike, Car, Stethoscope, Pill, Apple, Coffee,
  ShoppingBag, Pizza, Utensils, Music, Film, Tv, Trophy, Target,
  Puzzle, Gamepad2, Ticket, Compass, Heart, MapPin,
  Shield, CreditCard, Bus, Zap, Globe, Building, Home, Star,
  Fingerprint, Mail, FileText, Radio, Video, Users2, Briefcase, Droplets, Receipt, Headphones, FolderOpen,
};

function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] || ShoppingBag;
}

function SwipeToDelete({ children, onDelete }: { children: React.ReactNode; onDelete: () => void }) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="relative overflow-hidden">
      <div className="relative z-10" onContextMenu={(e) => { e.preventDefault(); setShowConfirm(true); }}>
        {children}
      </div>
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-end bg-background/90 backdrop-blur-sm px-3 gap-2"
          >
            <span className="text-sm font-medium flex-1 pl-4">Verwijderen?</span>
            <Button variant="outline" size="sm" onClick={() => setShowConfirm(false)} className="rounded-xl h-8">
              Annuleer
            </Button>
            <Button variant="destructive" size="sm" onClick={() => { onDelete(); setShowConfirm(false); }} className="rounded-xl h-8" data-testid="confirm-delete-category">
              <X className="w-3 h-3 mr-1" /> Verwijder
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CategoryCard({ icon: Icon, label, color = "text-primary", subtitle, bgColor = "bg-muted", onClick }: { icon: any, label: string, color?: string, subtitle?: string, bgColor?: string, onClick?: () => void }) {
  return (
    <div onClick={onClick} className="bg-card rounded-xl p-4 cursor-pointer hover:bg-muted/50 transition-colors shadow-sm flex flex-col gap-3" data-testid={`category-card-${label}`}>
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${color} ${bgColor}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <span className="font-semibold text-[14px] block">{label}</span>
        {subtitle && <span className="text-[12px] text-muted-foreground mt-0.5 block">{subtitle}</span>}
      </div>
    </div>
  );
}

function ListItem({ icon: Icon, label, color = "text-primary", hideBorder = false, subtitle, onClick }: { icon: any, label: string, color?: string, hideBorder?: boolean, subtitle?: string, onClick?: () => void }) {
  return (
    <div onClick={onClick} className="flex items-center gap-4 px-4 py-3.5 cursor-pointer bg-card hover:bg-muted/50 transition-colors">
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${color} bg-muted`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className={`flex-1 flex items-center justify-between pb-3.5 -mb-3.5 pt-1 ${!hideBorder ? 'border-b border-border/40' : ''}`}>
        <div className="flex flex-col">
           <span className="font-medium text-[15px]">{label}</span>
           {subtitle && <span className="text-[12px] text-muted-foreground mt-0.5">{subtitle}</span>}
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </div>
    </div>
  );
}

const CATEGORY_CONFIG: Record<string, { title: string; headerTitle: string; headerSubtitle: string; icon: LucideIcon; colorClass: string }> = {
  services: { title: "W€spr Services", headerTitle: "Mijn Europese Identiteit", headerSubtitle: "Veilig ingelogd en verbonden", icon: ShieldCheck, colorClass: "bg-blue-600 text-white" },
  transport: { title: "Vervoer & Reizen", headerTitle: "Reis door Europa", headerSubtitle: "Boek tickets en plan routes", icon: Train, colorClass: "bg-teal-600 text-white" },
  health: { title: "Gezondheid & Geneeskunde", headerTitle: "Jouw Zorg in de Hand", headerSubtitle: "Dossiers, afspraken en medicatie", icon: HeartPulse, colorClass: "bg-rose-600 text-white" },
  mini_apps: { title: "Winkelen & Bestellen", headerTitle: "Winkelen & Bestellen", headerSubtitle: "Shop, bestel en betaal direct", icon: ShoppingBag, colorClass: "bg-purple-600 text-white" },
  food: { title: "Eten & Bezorgen", headerTitle: "Thuisbezorgd", headerSubtitle: "Eten uit jouw buurt", icon: Utensils, colorClass: "bg-amber-500 text-white" },
  events: { title: "Evenementen", headerTitle: "Cultuur & Uitgaan", headerSubtitle: "Concerten, films en musea", icon: Ticket, colorClass: "bg-indigo-600 text-white" },
  social: { title: "Communicatie & Media", headerTitle: "Social & Communicatie", headerSubtitle: "Verbind, chat en deel", icon: Radio, colorClass: "bg-sky-600 text-white" },
  media: { title: "Muziek & Film", headerTitle: "Entertainment", headerSubtitle: "Stream, luister en ontdek", icon: Headphones, colorClass: "bg-red-600 text-white" },
  news: { title: "Nieuws & Actualiteiten", headerTitle: "Nieuws & Actualiteiten", headerSubtitle: "Blijf op de hoogte van het laatste nieuws", icon: Newspaper, colorClass: "bg-slate-700 text-white" },
  investing: { title: "Beurzen, Banken & Investeringen", headerTitle: "Beurzen & Investeringen", headerSubtitle: "Handel, beleg en beheer je vermogen", icon: TrendingUp, colorClass: "bg-emerald-700 text-white" },
  hobbies: { title: "Hobbies, Sport & Vrije Tijd", headerTitle: "Sport & Vrije Tijd", headerSubtitle: "Blijf actief en geniet van je hobby's", icon: Dumbbell, colorClass: "bg-orange-600 text-white" },
  admin: { title: "Administratie & Bestanden", headerTitle: "Administratie & Bestanden", headerSubtitle: "Documenten, bestanden en kantoor", icon: FolderOpen, colorClass: "bg-slate-600 text-white" },
  interests: { title: "Mijn Interesses", headerTitle: "Mijn Interesses", headerSubtitle: "Kunst, vastgoed en meer", icon: Star, colorClass: "bg-rose-500 text-white" },
};

const AVAILABLE_ICONS = [
  { name: "Building2", icon: Building2 }, { name: "Landmark", icon: Landmark }, { name: "ShieldCheck", icon: ShieldCheck },
  { name: "HeartPulse", icon: HeartPulse }, { name: "Stethoscope", icon: Stethoscope }, { name: "Pill", icon: Pill },
  { name: "Train", icon: Train }, { name: "Plane", icon: Plane }, { name: "Car", icon: Car }, { name: "Bike", icon: Bike },
  { name: "ShoppingBag", icon: ShoppingBag }, { name: "Coffee", icon: Coffee }, { name: "Apple", icon: Apple },
  { name: "Pizza", icon: Pizza }, { name: "Utensils", icon: Utensils }, { name: "Music", icon: Music },
  { name: "Film", icon: Film }, { name: "Trophy", icon: Trophy }, { name: "Puzzle", icon: Puzzle },
  { name: "GraduationCap", icon: GraduationCap }, { name: "Tv", icon: Tv }, { name: "Ticket", icon: Ticket },
  { name: "MapPin", icon: MapPin },
];

const COLOR_OPTIONS = [
  { bg: "bg-blue-100", text: "text-blue-600", preview: "bg-blue-500" },
  { bg: "bg-rose-100", text: "text-rose-600", preview: "bg-rose-500" },
  { bg: "bg-emerald-100", text: "text-emerald-600", preview: "bg-emerald-500" },
  { bg: "bg-purple-100", text: "text-purple-600", preview: "bg-purple-500" },
  { bg: "bg-amber-100", text: "text-amber-600", preview: "bg-amber-500" },
  { bg: "bg-orange-100", text: "text-orange-600", preview: "bg-orange-500" },
  { bg: "bg-teal-100", text: "text-teal-600", preview: "bg-teal-500" },
  { bg: "bg-indigo-100", text: "text-indigo-600", preview: "bg-indigo-500" },
  { bg: "bg-red-100", text: "text-red-600", preview: "bg-red-500" },
  { bg: "bg-slate-100", text: "text-slate-600", preview: "bg-slate-500" },
];

export function Discover({ initialCategory, onOpenWallet, onOpenChats }: { initialCategory?: string; onOpenWallet?: () => void; onOpenChats?: () => void } = {}) {
  const [view, setView] = useState<string>((initialCategory as string) || "menu");
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [contextMenuCategory, setContextMenuCategory] = useState<any | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [hiddenPrograms, setHiddenPrograms] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("hidden_mini_programs") || "[]")); } catch { return new Set(); }
  });
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load preferences from server (source of truth)
  const { data: serverPrefs } = useQuery({
    queryKey: ["/api/preferences"],
    queryFn: () => apiRequest("/api/preferences"),
    staleTime: 0,
  });

  // Sync server preferences into local state on load
  useEffect(() => {
    if (serverPrefs?.hiddenPrograms) {
      const fromServer = new Set<string>(serverPrefs.hiddenPrograms as string[]);
      setHiddenPrograms(fromServer);
      localStorage.setItem("hidden_mini_programs", JSON.stringify([...fromServer]));
    }
  }, [serverPrefs]);

  const saveHiddenToServer = useCallback(async (next: Set<string>) => {
    try {
      await apiRequest("/api/preferences", {
        method: "PUT",
        body: JSON.stringify({ ...(serverPrefs || {}), hiddenPrograms: [...next] }),
      });
    } catch { /* silent – localStorage is fallback */ }
  }, [serverPrefs]);

  const startLongPress = useCallback(() => {
    longPressTimer.current = setTimeout(() => setEditMode(true), 600);
  }, []);
  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  }, []);

  const removeProgram = useCallback((label: string) => {
    setHiddenPrograms(prev => {
      const next = new Set(prev); next.add(label);
      localStorage.setItem("hidden_mini_programs", JSON.stringify([...next]));
      saveHiddenToServer(next);
      return next;
    });
  }, [saveHiddenToServer]);

  const restoreAllPrograms = useCallback(() => {
    const empty = new Set<string>();
    setHiddenPrograms(empty);
    localStorage.removeItem("hidden_mini_programs");
    saveHiddenToServer(empty);
  }, [saveHiddenToServer]);

  const { data: user } = useQuery({
    queryKey: ["/api/me"],
    queryFn: () => apiRequest("/api/me"),
  });

  const { data: customCategories } = useQuery({
    queryKey: ["/api/service-categories"],
    queryFn: () => apiRequest("/api/service-categories"),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => {
      queryClient.setQueryData(["/api/service-categories"], (old: any[] | undefined) => (old || []).filter((c: any) => c.id !== id));
      return apiRequest(`/api/service-categories/${id}`, { method: "DELETE" });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest(`/api/service-categories/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-categories"] });
      setEditingCategory(null);
    },
  });

  if (view === "moments") return <MomentsFeed onBack={() => setView("menu")} />;
  if (view !== "menu") {
    const customCat = (customCategories || []).find((c: any) => c.key === view);
    if (customCat) {
      const dynamicConfig = {
        title: customCat.title,
        headerTitle: customCat.headerTitle || customCat.title,
        headerSubtitle: customCat.headerSubtitle || `Ontdek ${customCat.title}`,
        icon: getIcon(customCat.icon || customCat.menuIcon),
        colorClass: customCat.colorClass,
      };
      return <DynamicServiceMenu category={view} onBack={() => setView("menu")} customConfig={dynamicConfig} />;
    }
    if (CATEGORY_CONFIG[view]) {
      return <DynamicServiceMenu category={view} onBack={() => setView("menu")} />;
    }
    return <DynamicServiceMenu category={view} onBack={() => setView("menu")} customConfig={{
      title: view.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
      headerTitle: view.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
      headerSubtitle: "Laden...",
      icon: ShoppingBag,
      colorClass: "bg-slate-600 text-white",
    }} />;
  }

  // SuperApp mini-program grid items
  const QUICK_ACTIONS = [
    { icon: Euro, label: "W€spr Pay", color: "bg-emerald-500", onClick: () => onOpenWallet?.() },
    { icon: MessageCircle, label: "W€spr Connect", color: "bg-violet-500", onClick: () => onOpenChats?.() },
    { icon: Landmark, label: "W€spr Services", color: "bg-blue-600", onClick: () => setView("services") },
  ];

  const MINI_PROGRAMS = [
    { icon: Landmark, label: "Overheid", color: "bg-blue-600", onClick: () => setView("services") },
    { icon: Car, label: "Reizen", color: "bg-teal-500", onClick: () => setView("transport") },
    { icon: HeartPulse, label: "Gezondheid", color: "bg-rose-400", onClick: () => setView("health") },
    { icon: Radio, label: "Sociaal", color: "bg-sky-500", onClick: () => setView("social") },
    { icon: ShoppingBag, label: "Winkelen", color: "bg-purple-500", onClick: () => setView("mini_apps") },
    { icon: Coffee, label: "Eten", color: "bg-amber-500", onClick: () => setView("food") },
    { icon: Headphones, label: "Media", color: "bg-red-500", onClick: () => setView("media") },
    { icon: Newspaper, label: "Nieuws", color: "bg-slate-600", onClick: () => setView("news") },
    { icon: TrendingUp, label: "Beleggen", color: "bg-emerald-600", onClick: () => setView("investing") },
    { icon: Dumbbell, label: "Sport", color: "bg-orange-500", onClick: () => setView("hobbies") },
    { icon: FolderOpen, label: "Bestanden", color: "bg-slate-500", onClick: () => setView("admin") },
    { icon: Star, label: "Interesses", color: "bg-rose-600", onClick: () => setView("interests") },
    { icon: Ticket, label: "Events", color: "bg-indigo-500", onClick: () => setView("events") },
  ];

  return (
    <div className="flex flex-col min-h-full bg-muted/30 pb-8">

      {/* ── SuperApp Dashboard ── */}
      <div className="px-4 pt-4 pb-2 space-y-4">

        {/* Quick Actions */}
        <div className="bg-card rounded-2xl shadow-sm p-4">
          <div className="grid grid-cols-3 gap-3">
            {QUICK_ACTIONS.map(({ icon: Icon, label, color, onClick }) => (
              <button key={label} onClick={onClick} className="flex flex-col items-center gap-2 group" data-testid={`quick-action-${label}`}>
                <div className={`w-16 h-16 lg:w-20 lg:h-20 rounded-2xl ${color} flex items-center justify-center shadow-sm group-active:scale-95 transition-transform`}>
                  <Icon className="w-8 h-8 lg:w-9 lg:h-9 text-white" />
                </div>
                <span className="text-[12px] lg:text-[13px] font-semibold text-foreground/80 text-center leading-tight">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mini Programma's grid */}
        <div className="bg-card rounded-2xl shadow-sm p-4" onClick={() => editMode && setEditMode(false)}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide">Mini Programma's</h3>
            <div className="flex items-center gap-3">
              {hiddenPrograms.size > 0 && !editMode && (
                <button onClick={restoreAllPrograms} className="text-[11px] text-primary font-medium">
                  Herstel ({hiddenPrograms.size})
                </button>
              )}
              {editMode && (
                <button onClick={(e) => { e.stopPropagation(); setEditMode(false); }} className="text-[13px] text-primary font-bold px-2 py-0.5 bg-primary/10 rounded-lg">
                  Klaar
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-x-2 gap-y-4">
            {MINI_PROGRAMS.filter(({ label }) => !hiddenPrograms.has(label)).map(({ icon: Icon, label, color, onClick }) => (
              <motion.div
                key={label}
                className="relative flex flex-col items-center gap-1.5"
                animate={editMode ? { rotate: [-1.5, 1.5, -1.5] } : { rotate: 0 }}
                transition={editMode ? { repeat: Infinity, duration: 0.45, ease: "easeInOut" } : { duration: 0.2 }}
              >
                {editMode && (
                  <button
                    onClick={(e) => { e.stopPropagation(); removeProgram(label); }}
                    className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center z-20 shadow-md border-2 border-white"
                    data-testid={`remove-program-${label}`}
                  >
                    <X className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); if (!editMode) onClick(); }}
                  onPointerDown={startLongPress}
                  onPointerUp={cancelLongPress}
                  onPointerCancel={cancelLongPress}
                  className="flex flex-col items-center gap-1.5 group"
                  data-testid={`mini-program-${label}`}
                >
                  <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center shadow-sm ${!editMode ? "group-active:scale-95" : ""} transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[11px] font-medium text-foreground/70 text-center leading-tight">{label}</span>
                </button>
              </motion.div>
            ))}
            {(customCategories || []).map((cat: any) => {
              if (hiddenPrograms.has(cat.title)) return null;
              const CatIcon = getIcon(cat.menuIcon || cat.icon);
              return (
                <motion.div
                  key={cat.id}
                  className="relative flex flex-col items-center gap-1.5"
                  animate={editMode ? { rotate: [-1.5, 1.5, -1.5] } : { rotate: 0 }}
                  transition={editMode ? { repeat: Infinity, duration: 0.45, ease: "easeInOut" } : { duration: 0.2 }}
                >
                  {editMode && (
                    <button
                      onClick={(e) => { e.stopPropagation(); removeProgram(cat.title); }}
                      className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center z-20 shadow-md border-2 border-white"
                    >
                      <X className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); if (!editMode) setView(cat.key); }}
                    onPointerDown={startLongPress}
                    onPointerUp={cancelLongPress}
                    onPointerCancel={cancelLongPress}
                    className="flex flex-col items-center gap-1.5 group"
                    data-testid={`mini-program-custom-${cat.key}`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-500 flex items-center justify-center shadow-sm group-active:scale-95 transition-transform">
                      <CatIcon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-[11px] font-medium text-foreground/70 text-center leading-tight">{cat.title}</span>
                  </button>
                </motion.div>
              );
            })}
          </div>
          {editMode && (
            <p className="text-center text-[11px] text-muted-foreground/60 mt-4">Tik op <span className="font-bold text-red-500">–</span> om te verwijderen · Tik buiten de iconen of op Klaar om te stoppen</p>
          )}
        </div>

      </div>


       <AnimatePresence>
         {editingCategory && (
           <EditCategoryForm
             category={editingCategory}
             onSubmit={(data) => updateCategoryMutation.mutate({ id: editingCategory.id, data })}
             onCancel={() => setEditingCategory(null)}
             onDelete={() => { deleteCategoryMutation.mutate(editingCategory.id); setEditingCategory(null); }}
             isPending={updateCategoryMutation.isPending}
           />
         )}
         {contextMenuCategory && (
           <LongPressMenu
             onClose={() => setContextMenuCategory(null)}
             actions={[
               { label: "Openen", icon: Eye, onClick: () => setView(contextMenuCategory.key) },
               { label: "Bewerken", icon: Pencil, onClick: () => setEditingCategory(contextMenuCategory) },
               { label: "Verwijderen", icon: Trash2, onClick: () => deleteCategoryMutation.mutate(contextMenuCategory.id), destructive: true },
             ]}
           />
         )}
       </AnimatePresence>
    </div>
  );
}

function CategoryListItem({ cat, onTap, onLongPress, hideBorder }: { cat: any; onTap: () => void; onLongPress: () => void; hideBorder: boolean }) {
  const CatIcon = getIcon(cat.menuIcon);
  const longPressHandlers = useLongPress(onLongPress, onTap);

  return (
    <div
      {...longPressHandlers}
      className={`flex items-center gap-4 px-4 py-3.5 cursor-pointer select-none active:bg-muted/50 transition-colors ${!hideBorder ? 'border-b border-border/30' : ''}`}
      data-testid={`category-item-${cat.id}`}
    >
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${cat.menuColor} bg-muted`}>
        <CatIcon className="w-5 h-5" />
      </div>
      <div className="flex-1 flex flex-col">
        <span className="font-medium text-[15px]">{cat.title}</span>
        {cat.menuSubtitle && <span className="text-xs text-muted-foreground">{cat.menuSubtitle}</span>}
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground" />
    </div>
  );
}

// === ADD CATEGORY FORM ===
function AddCategoryForm({ onSubmit, onCancel }: { onSubmit: () => void; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("ShoppingBag");
  const [selectedColor, setSelectedColor] = useState(0);

  const HEADER_COLORS = [
    { colorClass: "bg-blue-600 text-white", preview: "bg-blue-600" },
    { colorClass: "bg-rose-600 text-white", preview: "bg-rose-600" },
    { colorClass: "bg-emerald-600 text-white", preview: "bg-emerald-600" },
    { colorClass: "bg-purple-600 text-white", preview: "bg-purple-600" },
    { colorClass: "bg-amber-500 text-white", preview: "bg-amber-500" },
    { colorClass: "bg-teal-600 text-white", preview: "bg-teal-600" },
    { colorClass: "bg-indigo-600 text-white", preview: "bg-indigo-600" },
    { colorClass: "bg-orange-600 text-white", preview: "bg-orange-600" },
  ];

  const MENU_COLORS = [
    "text-blue-500", "text-rose-500", "text-emerald-500", "text-purple-500",
    "text-amber-500", "text-teal-500", "text-indigo-500", "text-orange-500",
  ];

  const addMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/service-categories", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: (newCat: any) => {
      queryClient.setQueryData(["/api/service-categories"], (old: any[] | undefined) => [...(old || []), newCat]);
      onSubmit();
    },
  });

  const handleSubmit = () => {
    if (!title.trim()) return;
    const key = title.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    addMutation.mutate({
      key,
      title: title.trim(),
      headerTitle: title.trim(),
      headerSubtitle: subtitle.trim() || `Ontdek ${title.trim()}`,
      icon: selectedIcon,
      colorClass: HEADER_COLORS[selectedColor].colorClass,
      menuIcon: selectedIcon,
      menuColor: MENU_COLORS[selectedColor] || "text-slate-500",
      menuSubtitle: subtitle.trim() || undefined,
      isDefault: false,
      sortOrder: 99,
    });
  };

  const SelectedIconComp = getIcon(selectedIcon);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="px-4 mb-2 overflow-hidden"
    >
      <div className="bg-card rounded-2xl p-5 shadow-sm border border-primary/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[15px]">Nieuw domein</h3>
          <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8 rounded-full">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex justify-center mb-5">
          <div className="flex flex-col items-center gap-2">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${HEADER_COLORS[selectedColor].preview} text-white`}>
              <SelectedIconComp className="w-7 h-7" />
            </div>
            <span className="text-xs font-medium">{title || "Naam..."}</span>
          </div>
        </div>

        <div className="mb-4">
          <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Naam</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="bijv. Educatie, Sport, Muziek..."
            className="w-full bg-muted/50 rounded-xl px-4 py-2.5 text-[15px] outline-none border border-border/50 focus:border-primary/50 transition-colors"
            data-testid="input-category-name"
          />
        </div>

        <div className="mb-4">
          <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Beschrijving (optioneel)</label>
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="bijv. Cursussen & training"
            className="w-full bg-muted/50 rounded-xl px-4 py-2.5 text-[15px] outline-none border border-border/50 focus:border-primary/50 transition-colors"
            data-testid="input-category-subtitle"
          />
        </div>

        <div className="mb-4">
          <label className="text-xs font-bold text-muted-foreground mb-2 block">Icoon</label>
          <div className="grid grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
            {AVAILABLE_ICONS.map(({ name, icon: IC }) => (
              <button
                key={name}
                onClick={() => setSelectedIcon(name)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                  selectedIcon === name ? 'bg-primary text-primary-foreground scale-110 shadow-md' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                <IC className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <label className="text-xs font-bold text-muted-foreground mb-2 block">Kleur</label>
          <div className="flex gap-2 flex-wrap">
            {HEADER_COLORS.map((c, i) => (
              <button
                key={i}
                onClick={() => setSelectedColor(i)}
                className={`w-8 h-8 rounded-full ${c.preview} transition-all ${
                  selectedColor === i ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'
                }`}
              />
            ))}
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!title.trim() || addMutation.isPending}
          className="w-full rounded-xl gap-2"
          data-testid="submit-category"
        >
          <Check className="w-4 h-4" /> Domein toevoegen
        </Button>
      </div>
    </motion.div>
  );
}

// === EDIT CATEGORY FORM ===
function EditCategoryForm({ category, onSubmit, onCancel, onDelete, isPending }: {
  category: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  onDelete: () => void;
  isPending: boolean;
}) {
  const [title, setTitle] = useState(category.title);
  const [subtitle, setSubtitle] = useState(category.menuSubtitle || "");
  const [selectedIcon, setSelectedIcon] = useState(category.menuIcon || "ShoppingBag");
  const HEADER_COLORS = [
    { colorClass: "bg-blue-600 text-white", preview: "bg-blue-600" },
    { colorClass: "bg-rose-600 text-white", preview: "bg-rose-600" },
    { colorClass: "bg-emerald-600 text-white", preview: "bg-emerald-600" },
    { colorClass: "bg-purple-600 text-white", preview: "bg-purple-600" },
    { colorClass: "bg-amber-500 text-white", preview: "bg-amber-500" },
    { colorClass: "bg-teal-600 text-white", preview: "bg-teal-600" },
    { colorClass: "bg-indigo-600 text-white", preview: "bg-indigo-600" },
    { colorClass: "bg-orange-600 text-white", preview: "bg-orange-600" },
  ];
  const MENU_COLORS = [
    "text-blue-500", "text-rose-500", "text-emerald-500", "text-purple-500",
    "text-amber-500", "text-teal-500", "text-indigo-500", "text-orange-500",
  ];
  const colorIdx = HEADER_COLORS.findIndex(c => c.colorClass === category.colorClass);
  const [selectedColor, setSelectedColor] = useState(colorIdx >= 0 ? colorIdx : 0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      headerTitle: title.trim(),
      headerSubtitle: subtitle.trim() || `Ontdek ${title.trim()}`,
      icon: selectedIcon,
      colorClass: HEADER_COLORS[selectedColor].colorClass,
      menuIcon: selectedIcon,
      menuColor: MENU_COLORS[selectedColor] || "text-slate-500",
      menuSubtitle: subtitle.trim() || undefined,
    });
  };

  const SelectedIconComp = getIcon(selectedIcon);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="px-4 mb-2 overflow-hidden"
    >
      <div className="bg-card rounded-2xl p-5 shadow-sm border border-primary/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[15px]">Domein bewerken</h3>
          <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8 rounded-full">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex justify-center mb-5">
          <div className="flex flex-col items-center gap-2">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${HEADER_COLORS[selectedColor].preview} text-white`}>
              <SelectedIconComp className="w-7 h-7" />
            </div>
            <span className="text-xs font-medium">{title || "Naam..."}</span>
          </div>
        </div>

        <div className="mb-4">
          <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Naam</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-muted/50 rounded-xl px-4 py-2.5 text-[15px] outline-none border border-border/50 focus:border-primary/50 transition-colors"
            data-testid="edit-category-name"
          />
        </div>

        <div className="mb-4">
          <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Beschrijving</label>
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className="w-full bg-muted/50 rounded-xl px-4 py-2.5 text-[15px] outline-none border border-border/50 focus:border-primary/50 transition-colors"
            data-testid="edit-category-subtitle"
          />
        </div>

        <div className="mb-4">
          <label className="text-xs font-bold text-muted-foreground mb-2 block">Icoon</label>
          <div className="grid grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
            {AVAILABLE_ICONS.map(({ name, icon: IC }) => (
              <button
                key={name}
                onClick={() => setSelectedIcon(name)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                  selectedIcon === name ? 'bg-primary text-primary-foreground scale-110 shadow-md' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                <IC className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <label className="text-xs font-bold text-muted-foreground mb-2 block">Kleur</label>
          <div className="flex gap-2 flex-wrap">
            {HEADER_COLORS.map((c, i) => (
              <button
                key={i}
                onClick={() => setSelectedColor(i)}
                className={`w-8 h-8 rounded-full ${c.preview} transition-all ${
                  selectedColor === i ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'
                }`}
              />
            ))}
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!title.trim() || isPending}
          className="w-full rounded-xl gap-2"
          data-testid="save-edit-category"
        >
          <Check className="w-4 h-4" /> Opslaan
        </Button>

        <div className="mt-4 pt-4 border-t border-border/40">
          {showDeleteConfirm ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-destructive font-medium flex-1">Weet je het zeker?</span>
              <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)} className="rounded-xl">Annuleren</Button>
              <Button variant="destructive" size="sm" onClick={onDelete} className="rounded-xl" data-testid="confirm-delete-category">Verwijderen</Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
              data-testid="delete-category-btn"
            >
              <X className="w-4 h-4" /> Domein verwijderen
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// === DYNAMIC SERVICE MENU ===
function DynamicServiceMenu({ category, onBack, customConfig }: { category: string; onBack: () => void; customConfig?: { title: string; headerTitle: string; headerSubtitle: string; icon: LucideIcon; colorClass: string } }) {
  const config = customConfig || CATEGORY_CONFIG[category];
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [contextMenuItem, setContextMenuItem] = useState<any | null>(null);

  const { data: items, isLoading } = useQuery({
    queryKey: ["/api/services", category],
    queryFn: () => apiRequest(`/api/services/${category}`),
  });

  const addMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/services", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services", category] });
      setShowAddForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest(`/api/services/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services", category] });
      setEditingItem(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/services/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/services", category] }),
  });

  if (!config) {
    return (
      <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex flex-col bg-muted/20 min-h-full">
        <header className="px-4 py-4 flex items-center gap-3 bg-background/80 backdrop-blur-xl sticky top-0 z-50 border-b border-border/50">
          <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2"><ArrowLeft className="w-6 h-6" /></Button>
          <h1 className="text-xl font-bold tracking-tight flex-1">Laden...</h1>
        </header>
        <div className="flex-1 flex items-center justify-center"><Skeleton className="h-40 w-64 rounded-2xl" /></div>
      </motion.div>
    );
  }

  if (editingItem) {
    return <EditServiceForm
      item={editingItem}
      existingSubcategories={Object.keys((items || []).reduce((acc: Record<string, any[]>, i: any) => { if (!acc[i.subcategory]) acc[i.subcategory] = []; acc[i.subcategory].push(i); return acc; }, {}))}
      onSubmit={(data) => updateMutation.mutate({ id: editingItem.id, data })}
      onCancel={() => setEditingItem(null)}
      onDelete={() => { deleteMutation.mutate(editingItem.id); setEditingItem(null); }}
      isPending={updateMutation.isPending}
    />;
  }

  if (selectedItem === "__EUROPE_PLANNER__") {
    return <EuropeTripPlanner onBack={() => setSelectedItem(null)} />;
  }

  if (selectedItem) {
    if (selectedItem.label === "Google Maps") {
      return <GoogleMapsView onBack={() => setSelectedItem(null)} />;
    }
    if (selectedItem.label === "Kaarten") {
      return <KaartenView onBack={() => setSelectedItem(null)} />;
    }
    
    // Create handlers for long press delete
    const handleLongPress = () => setContextMenuItem(selectedItem);
    const deleteAction = { 
      label: "Verwijderen uit W€spr", 
      icon: Trash2, 
      onClick: () => {
        deleteMutation.mutate(selectedItem.id);
        setSelectedItem(null);
        setContextMenuItem(null);
      },
      destructive: true 
    };

    return (
      <div className="h-full relative select-none" onContextMenu={(e) => { e.preventDefault(); handleLongPress(); }}>
        {isNavApp(selectedItem.label) ? (
          <NavAppView label={selectedItem.label} onBack={() => setSelectedItem(null)} />
        ) : isTravelApp(selectedItem.label) ? (
          <TravelAppView label={selectedItem.label} onBack={() => setSelectedItem(null)} />
        ) : isHealthApp(selectedItem.label) ? (
          <HealthAppView label={selectedItem.label} onBack={() => setSelectedItem(null)} />
        ) : isGovApp(selectedItem.label) ? (
          <GovAppView label={selectedItem.label} onBack={() => setSelectedItem(null)} />
        ) : isUniversalApp(selectedItem.label) ? (
          <UniversalAppView label={selectedItem.label} onBack={() => setSelectedItem(null)} />
        ) : (
          <ServiceItemDetail item={selectedItem} config={config} onBack={() => setSelectedItem(null)} />
        )}
        
        <AnimatePresence>
          {contextMenuItem && (
            <LongPressMenu
              onClose={() => setContextMenuItem(null)}
              actions={[deleteAction]}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  const grouped = (items || []).reduce((acc: Record<string, any[]>, item: any) => {
    if (!acc[item.subcategory]) acc[item.subcategory] = [];
    acc[item.subcategory].push(item);
    return acc;
  }, {});

  const HeaderIcon = config.icon;
  const hasItems = Object.keys(grouped).length > 0;

  return (
    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }} className="flex flex-col bg-muted/20 min-h-full relative">
      <header className="px-4 py-4 flex items-center gap-3 bg-background/80 backdrop-blur-xl sticky top-0 z-50 border-b border-border/50">
        <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold tracking-tight flex-1">{config.title}</h1>
        <Button variant="ghost" size="icon" onClick={() => setShowAddForm(!showAddForm)} className="rounded-full text-primary" data-testid="add-service-btn">
          <Plus className="w-5 h-5" />
        </Button>
      </header>

      <div className="p-4 pb-24 lg:px-6 lg:max-w-5xl lg:mx-auto">
        <button
          onClick={() => {
            if (category === "transport") setSelectedItem("__EUROPE_PLANNER__");
          }}
          className={`w-full rounded-2xl p-5 mb-6 shadow-md relative overflow-hidden text-left ${config.colorClass} ${category === "transport" ? "active:scale-[0.98] transition-transform cursor-pointer" : ""}`}
          data-testid="category-header-banner"
        >
          <div className="relative z-10">
            <h2 className="text-xl font-bold mb-1">{config.headerTitle}</h2>
            <p className="opacity-90 text-sm">{config.headerSubtitle}</p>
            {category === "transport" && (
              <div className="flex items-center gap-1 mt-2 text-xs opacity-80">
                <span>Tik om te plannen</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            )}
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black/10 to-transparent" />
          <HeaderIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-16 h-16 opacity-20" />
        </button>

        <AnimatePresence>
          {showAddForm && (
            <AddServiceForm
              category={category}
              existingSubcategories={Object.keys(grouped)}
              onSubmit={(data) => addMutation.mutate(data)}
              onCancel={() => setShowAddForm(false)}
              isPending={addMutation.isPending}
            />
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        ) : !hasItems ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-muted`}>
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-bold text-[15px] mb-1">Nog geen items</h3>
            <p className="text-sm text-muted-foreground mb-5 max-w-[240px]">
              Voeg je eerste app of dienst toe aan dit domein
            </p>
            <Button onClick={() => setShowAddForm(true)} className="rounded-xl gap-2" data-testid="add-first-service-btn">
              <Plus className="w-4 h-4" /> Item toevoegen
            </Button>
          </div>
        ) : (
          Object.entries(grouped).map(([subcategory, subItems]) => (
            <div key={subcategory} className="mb-6">
              <h3 className="text-sm font-bold text-muted-foreground mb-3 px-1">{subcategory}</h3>
              <div className="bg-card rounded-2xl p-4 shadow-sm">
                <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-y-6 gap-x-2">
                  {(subItems as any[]).map((item: any) => (
                    <ServiceGridItem
                      key={item.id}
                      item={item}
                      onTap={() => setSelectedItem(item)}
                      onLongPress={() => setContextMenuItem(item)}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <AnimatePresence>
        {contextMenuItem && (
          <LongPressMenu
            onClose={() => setContextMenuItem(null)}
            actions={[
              { label: "Openen", icon: Eye, onClick: () => {
                const item = contextMenuItem;
                if (isNavApp(item.label)) {
                  // This is handled via setSelectedItem in the parent
                  setSelectedItem(item);
                } else if (isTravelApp(item.label)) {
                  setSelectedItem(item);
                } else {
                  setSelectedItem(item);
                }
              }},
              { label: "Verwijderen", icon: Trash2, onClick: () => {
                deleteMutation.mutate(contextMenuItem.id);
                setContextMenuItem(null);
              }, destructive: true },
              ...(!contextMenuItem.isDefault ? [
                { label: "Bewerken", icon: Pencil, onClick: () => setEditingItem(contextMenuItem) },
              ] : []),
            ]}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const BRANDED_LOGOS: Record<string, string> = {
  "Google Maps": "/images/google-maps-logo.svg",
  "EasyPark NL": "/images/easypark-logo.svg",
  "Flitsmeister": "/images/flitsmeister-logo.svg",
  "Parkeren Den Haag": "/images/parkeren-dh-logo.svg",
  "Kaarten": "/images/apple-maps-logo.svg",
  "Q-Park": "/images/qpark-logo.svg",
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
  "DigiD": "/images/digid-logo.svg",
  "Mijn Overheid": "/images/mijnoverheid-logo.svg",
  "Berichtenbox": "/images/berichtenbox-logo.svg",
  "Aangifte": "/images/aangifte-logo.svg",
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
  "Dunea": "/images/dunea-logo.svg",
  "Gem. Belastingen": "/images/gemeentebelasting-logo.svg",
  "SPMS Pensioen": "/images/spms-logo.svg",
  "PFZW": "/images/pfzw-logo.svg",
  "ABP": "/images/abp-logo.svg",
  "OHRA": "/images/ohra-logo.svg",
  "IZZ": "/images/izz-logo.svg",
  "Bol.com": "/images/bolcom-logo.svg",
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
  "Alibaba.com": "/images/alibaba-logo.svg",
  "Temu": "/images/temu-logo.svg",
  "Alipay": "/images/alipay-logo.svg",
  "Duolingo": "/images/duolingo-logo.svg",
  "Studielink": "/images/studielink-logo.svg",
  "Coursera": "/images/coursera-logo.svg",
  "DeepL": "/images/deepl-logo.svg",
  "Google Translate": "/images/googletranslate-logo.svg",
  "Chat": "/images/googlechat-logo.svg",
  "Gmail": "/images/gmail-logo.svg",
  "Rabobank": "/images/rabobank-logo.svg",
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
  "Camera": "/images/camera-app-logo.svg",
  "Foto's": "/images/photos-app-logo.svg",
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
};


function ServiceIcon({ item, size = "md" }: { item: any; size?: "sm" | "md" | "lg" }) {
  const IconComp = getIcon(item.icon);
  const logoUrl = BRANDED_LOGOS[item.label];
  const dims = size === "lg" ? "w-14 h-14 rounded-2xl" : size === "md" ? "w-9 h-9 rounded-xl" : "w-6 h-6 rounded-lg";
  const iconDims = size === "lg" ? "w-7 h-7" : size === "md" ? "w-5 h-5" : "w-3 h-3";

  if (logoUrl) {
    return (
      <div className={`${dims} overflow-hidden shadow-sm`}>
        <img src={logoUrl} alt={item.label} className="w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div className={`${dims} flex items-center justify-center ${item.colorBg} ${item.colorText}`}>
      <IconComp className={iconDims} />
    </div>
  );
}

function ServiceGridItem({ item, onTap, onLongPress }: { item: any; onTap: () => void; onLongPress: () => void }) {
  const longPressHandlers = useLongPress(onLongPress, onTap);

  return (
    <div
      {...longPressHandlers}
      className="flex flex-col items-center gap-2 cursor-pointer select-none active:scale-95 transition-transform"
      data-testid={`service-item-${item.id}`}
    >
      <ServiceIcon item={item} size="md" />
      <span className="text-[11px] font-medium text-center leading-tight">{item.label}</span>
    </div>
  );
}

function ServiceCard({ item, onLongPress }: { item: any; onLongPress: () => void }) {
  const [showApp, setShowApp] = useState(false);
  const longPressHandlers = useLongPress(onLongPress, () => setShowApp(true));

  if (showApp) {
    if (isNavApp(item.label)) return <NavAppView label={item.label} onBack={() => setShowApp(false)} />;
    if (isTravelApp(item.label)) return <TravelAppView label={item.label} onBack={() => setShowApp(false)} />;
    if (isHealthApp(item.label)) return <HealthAppView label={item.label} onBack={() => setShowApp(false)} />;
    if (isGovApp(item.label)) return <GovAppView label={item.label} onBack={() => setShowApp(false)} />;
    if (isUniversalApp(item.label)) return <UniversalAppView label={item.label} onBack={() => setShowApp(false)} />;
  }

  return (
    <motion.div
      {...longPressHandlers}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="bg-card rounded-3xl overflow-hidden shadow-sm border border-border/40 hover:border-primary/30 transition-all group active:shadow-md select-none w-full"
    >
      {item.image && (
        <div className="w-full overflow-hidden relative">
          <img
            src={item.image}
            alt={item.label}
            className="w-full aspect-[2/1] object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 z-20">
             <h3 className="font-bold text-[18px] text-white leading-tight drop-shadow-md">{item.label}</h3>
             <p className="text-[13px] text-white/90 line-clamp-1 font-medium drop-shadow-sm">{item.subcategory}</p>
          </div>
        </div>
      )}
      {!item.image && (
        <div className="p-4 flex items-center gap-4">
          <ServiceIcon item={item} size="md" />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[16px] text-foreground leading-tight truncate">{item.label}</h3>
            <p className="text-[13px] text-muted-foreground mt-0.5 line-clamp-1 font-medium">{item.subcategory}</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      )}
    </motion.div>
  );
}

// === ADD SERVICE FORM ===
function AddServiceForm({ category, existingSubcategories, onSubmit, onCancel, isPending }: {
  category: string;
  existingSubcategories: string[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const hasExisting = existingSubcategories.length > 0;
  const [label, setLabel] = useState("");
  const [subcategory, setSubcategory] = useState(existingSubcategories[0] || "");
  const [newSubcategory, setNewSubcategory] = useState("");
  const [useNewSubcategory, setUseNewSubcategory] = useState(!hasExisting);
  const [selectedIcon, setSelectedIcon] = useState("ShoppingBag");
  const [selectedColor, setSelectedColor] = useState(0);

  const handleSubmit = () => {
    if (!label.trim()) return;
    const finalSubcategory = useNewSubcategory ? newSubcategory : subcategory;
    if (!finalSubcategory.trim()) return;
    onSubmit({
      category,
      subcategory: finalSubcategory,
      label: label.trim(),
      icon: selectedIcon,
      colorBg: COLOR_OPTIONS[selectedColor].bg,
      colorText: COLOR_OPTIONS[selectedColor].text,
      isDefault: false,
    });
  };

  const SelectedIconComp = getIcon(selectedIcon);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="mb-6 overflow-hidden"
    >
      <div className="bg-card rounded-2xl p-5 shadow-sm border border-primary/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[15px]">Nieuw item toevoegen</h3>
          <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8 rounded-full">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Preview */}
        <div className="flex justify-center mb-5">
          <div className="flex flex-col items-center gap-2">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${COLOR_OPTIONS[selectedColor].bg} ${COLOR_OPTIONS[selectedColor].text}`}>
              <SelectedIconComp className="w-7 h-7" />
            </div>
            <span className="text-xs font-medium">{label || "Naam..."}</span>
          </div>
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Naam</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="bijv. Ziekenhuis, Tandarts..."
            className="w-full bg-muted/50 rounded-xl px-4 py-2.5 text-[15px] outline-none border border-border/50 focus:border-primary/50 transition-colors"
            data-testid="input-service-name"
          />
        </div>

        {/* Subcategory */}
        <div className="mb-4">
          <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Subcategorie</label>
          {!useNewSubcategory && hasExisting ? (
            <div className="space-y-2">
              <select
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full bg-muted/50 rounded-xl px-4 py-2.5 text-[15px] outline-none border border-border/50 appearance-none"
              >
                {existingSubcategories.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button onClick={() => setUseNewSubcategory(true)} className="text-xs text-primary font-medium">
                + Nieuwe subcategorie
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                value={newSubcategory}
                onChange={(e) => setNewSubcategory(e.target.value)}
                placeholder="bijv. Facturatie, Documenten..."
                className="w-full bg-muted/50 rounded-xl px-4 py-2.5 text-[15px] outline-none border border-border/50 focus:border-primary/50 transition-colors"
                data-testid="input-subcategory"
              />
              {hasExisting && (
                <button onClick={() => setUseNewSubcategory(false)} className="text-xs text-muted-foreground font-medium">
                  Bestaande subcategorie kiezen
                </button>
              )}
            </div>
          )}
        </div>

        {/* Icon Selector */}
        <div className="mb-4">
          <label className="text-xs font-bold text-muted-foreground mb-2 block">Icoon</label>
          <div className="grid grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
            {AVAILABLE_ICONS.map(({ name, icon: IC }) => (
              <button
                key={name}
                onClick={() => setSelectedIcon(name)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                  selectedIcon === name ? 'bg-primary text-primary-foreground scale-110 shadow-md' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                <IC className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        {/* Color Selector */}
        <div className="mb-5">
          <label className="text-xs font-bold text-muted-foreground mb-2 block">Kleur</label>
          <div className="flex gap-2 flex-wrap">
            {COLOR_OPTIONS.map((c, i) => (
              <button
                key={i}
                onClick={() => setSelectedColor(i)}
                className={`w-8 h-8 rounded-full ${c.preview} transition-all ${
                  selectedColor === i ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={!label.trim() || isPending}
          className="w-full rounded-xl gap-2"
          data-testid="submit-service"
        >
          <Check className="w-4 h-4" /> Toevoegen
        </Button>
      </div>
    </motion.div>
  );
}

// === EDIT SERVICE FORM ===
function EditServiceForm({ item, existingSubcategories, onSubmit, onCancel, onDelete, isPending }: {
  item: any;
  existingSubcategories: string[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  onDelete: () => void;
  isPending: boolean;
}) {
  const [label, setLabel] = useState(item.label);
  const [subcategory, setSubcategory] = useState(item.subcategory);
  const [selectedIcon, setSelectedIcon] = useState(item.icon || "ShoppingBag");
  const colorIdx = COLOR_OPTIONS.findIndex(c => c.bg === item.colorBg);
  const [selectedColor, setSelectedColor] = useState(colorIdx >= 0 ? colorIdx : 0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSubmit = () => {
    if (!label.trim()) return;
    onSubmit({
      label: label.trim(),
      subcategory: subcategory.trim(),
      icon: selectedIcon,
      colorBg: COLOR_OPTIONS[selectedColor].bg,
      colorText: COLOR_OPTIONS[selectedColor].text,
    });
  };

  const SelectedIconComp = getIcon(selectedIcon);

  return (
    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex flex-col bg-muted/20 min-h-full">
      <header className="px-4 py-4 flex items-center gap-3 bg-background/80 backdrop-blur-xl sticky top-0 z-50 border-b border-border/50">
        <Button variant="ghost" size="icon" onClick={onCancel} className="-ml-2">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold tracking-tight flex-1">Item bewerken</h1>
      </header>
      <div className="p-4">
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-primary/20">
          <div className="flex justify-center mb-5">
            <div className="flex flex-col items-center gap-2">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${COLOR_OPTIONS[selectedColor].bg} ${COLOR_OPTIONS[selectedColor].text}`}>
                <SelectedIconComp className="w-7 h-7" />
              </div>
              <span className="text-xs font-medium">{label || "Naam..."}</span>
            </div>
          </div>

          <div className="mb-4">
            <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Naam</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full bg-muted/50 rounded-xl px-4 py-2.5 text-[15px] outline-none border border-border/50 focus:border-primary/50 transition-colors"
              data-testid="edit-service-name"
            />
          </div>

          <div className="mb-4">
            <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Subcategorie</label>
            <input
              type="text"
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              className="w-full bg-muted/50 rounded-xl px-4 py-2.5 text-[15px] outline-none border border-border/50 focus:border-primary/50 transition-colors"
              data-testid="edit-service-subcategory"
            />
          </div>

          <div className="mb-4">
            <label className="text-xs font-bold text-muted-foreground mb-2 block">Icoon</label>
            <div className="flex gap-2 flex-wrap">
              {AVAILABLE_ICONS.map(({ name, icon: IC }) => (
                <button
                  key={name}
                  onClick={() => setSelectedIcon(name)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                    selectedIcon === name ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1 scale-110' : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  <IC className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5">
            <label className="text-xs font-bold text-muted-foreground mb-2 block">Kleur</label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map((c, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedColor(i)}
                  className={`w-8 h-8 rounded-full ${c.preview} transition-all ${
                    selectedColor === i ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={!label.trim() || isPending}
              className="flex-1 rounded-xl gap-2"
              data-testid="save-edit-service"
            >
              <Check className="w-4 h-4" /> Opslaan
            </Button>
          </div>

          <div className="mt-4 pt-4 border-t border-border/40">
            {showDeleteConfirm ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-destructive font-medium flex-1">Weet je het zeker?</span>
                <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)} className="rounded-xl">Annuleren</Button>
                <Button variant="destructive" size="sm" onClick={onDelete} className="rounded-xl" data-testid="confirm-delete-service">Verwijderen</Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
                data-testid="delete-service-btn"
              >
                <X className="w-4 h-4" /> Item verwijderen
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// === SERVICE ITEM DETAIL ===
function ServiceItemDetail({ item, config, onBack }: { item: any; config: any; onBack: () => void }) {
  const hasNativeApp = item.label === "Google Maps" || item.label === "Kaarten" || isNavApp(item.label) || isTravelApp(item.label) || isHealthApp(item.label) || isGovApp(item.label) || isUniversalApp(item.label);
  const [detailView, setDetailView] = useState<null | "app" | "info" | "qr">(hasNativeApp ? "app" : null);
  const ItemIcon = getIcon(item.icon);

  if (detailView === "app") {
    if (item.label === "Google Maps") {
      return <GoogleMapsView onBack={onBack} />;
    }
    if (item.label === "Kaarten") {
      return <KaartenView onBack={onBack} />;
    }
    if (isNavApp(item.label)) {
      return <NavAppView label={item.label} onBack={onBack} />;
    }
    if (isTravelApp(item.label)) {
      return <TravelAppView label={item.label} onBack={onBack} />;
    }
    if (isHealthApp(item.label)) {
      return <HealthAppView label={item.label} onBack={onBack} />;
    }
    if (isGovApp(item.label)) {
      return <GovAppView label={item.label} onBack={onBack} />;
    }
    if (isUniversalApp(item.label)) {
      return <UniversalAppView label={item.label} onBack={onBack} />;
    }
    return <ServiceAppView item={item} ItemIcon={ItemIcon} onBack={() => setDetailView(null)} />;
  }
  if (detailView === "info") {
    return <ServiceInfoView item={item} config={config} ItemIcon={ItemIcon} onBack={() => setDetailView(null)} />;
  }
  if (detailView === "qr") {
    return <ServiceQRView item={item} ItemIcon={ItemIcon} onBack={() => setDetailView(null)} />;
  }

  return (
    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex flex-col bg-muted/20 min-h-full">
      <header className="px-4 py-4 flex items-center gap-3 bg-background/80 backdrop-blur-xl sticky top-0 z-50 border-b border-border/50">
        <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2" data-testid="back-from-detail">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold tracking-tight flex-1">{item.label}</h1>
      </header>
      <div className="p-4">
        <div className="bg-card rounded-2xl p-6 shadow-sm mb-4 flex flex-col items-center">
          <div className="mb-4 shadow-md rounded-2xl">
            <ServiceIcon item={item} size="lg" />
          </div>
          <h2 className="text-xl font-bold mb-1">{item.label}</h2>
          <p className="text-sm text-muted-foreground">{item.subcategory} · {config.title}</p>
        </div>

        <div className="bg-card rounded-2xl p-5 shadow-sm mb-4">
          <h3 className="text-xs font-bold text-muted-foreground mb-3">BESCHIKBARE ACTIES</h3>
          <div className="space-y-3">
            <div onClick={() => setDetailView("app")} className="flex items-center gap-3 py-2.5 px-3 bg-muted/30 rounded-xl cursor-pointer hover:bg-muted/50 transition-colors active:scale-[0.98]" data-testid="action-open-app">
              <ServiceIcon item={item} size="sm" />
              <div className="flex-1">
                <span className="font-medium text-sm">Openen in app</span>
                <p className="text-xs text-muted-foreground">Direct naar de dienst</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
            <div onClick={() => setDetailView("info")} className="flex items-center gap-3 py-2.5 px-3 bg-muted/30 rounded-xl cursor-pointer hover:bg-muted/50 transition-colors active:scale-[0.98]" data-testid="action-more-info">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-100 text-blue-600">
                <Compass className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="font-medium text-sm">Meer informatie</span>
                <p className="text-xs text-muted-foreground">Lees over deze dienst</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
            <div onClick={() => setDetailView("qr")} className="flex items-center gap-3 py-2.5 px-3 bg-muted/30 rounded-xl cursor-pointer hover:bg-muted/50 transition-colors active:scale-[0.98]" data-testid="action-qr-scan">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-100 text-amber-600">
                <Camera className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="font-medium text-sm">QR-code scannen</span>
                <p className="text-xs text-muted-foreground">Scan om in te checken</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-bold text-muted-foreground mb-3">DETAILS</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Categorie</span><span className="font-medium">{config.title}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Subcategorie</span><span className="font-medium">{item.subcategory}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="font-medium">{item.isDefault ? "Standaard" : "Aangepast"}</span></div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function EuropeTripPlanner({ onBack }: { onBack: () => void }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selectedRoute, setSelectedRoute] = useState<number | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [booked, setBooked] = useState(false);

  const cities = ["Amsterdam", "Parijs", "Berlijn", "Barcelona", "Rome", "Praag", "Wenen", "Brussel", "Londen", "Kopenhagen", "Zürich", "Lissabon", "Budapest", "Stockholm", "Dublin", "Athene", "Warschau"];
  const [fromSuggestions, setFromSuggestions] = useState<string[]>([]);
  const [toSuggestions, setToSuggestions] = useState<string[]>([]);

  const popularRoutes = [
    { from: "Amsterdam", to: "Parijs", modes: [{ icon: "🚄", name: "Thalys", dur: "3u 18m", price: 35 }, { icon: "✈️", name: "KLM", dur: "1u 15m", price: 89 }, { icon: "🚌", name: "FlixBus", dur: "6u 30m", price: 19 }] },
    { from: "Amsterdam", to: "Berlijn", modes: [{ icon: "🚄", name: "ICE", dur: "6u 20m", price: 39 }, { icon: "✈️", name: "easyJet", dur: "1u 25m", price: 49 }, { icon: "🚌", name: "FlixBus", dur: "8u 45m", price: 22 }] },
    { from: "Amsterdam", to: "Brussel", modes: [{ icon: "🚄", name: "Thalys", dur: "1u 50m", price: 29 }, { icon: "🚌", name: "FlixBus", dur: "3u 15m", price: 12 }, { icon: "🚗", name: "BlaBlaCar", dur: "2u 30m", price: 18 }] },
    { from: "Amsterdam", to: "Londen", modes: [{ icon: "🚄", name: "Eurostar", dur: "4u 30m", price: 45 }, { icon: "✈️", name: "British Airways", dur: "1u 10m", price: 79 }, { icon: "🚌", name: "FlixBus", dur: "9u", price: 25 }] },
    { from: "Amsterdam", to: "Barcelona", modes: [{ icon: "✈️", name: "Transavia", dur: "2u 20m", price: 59 }, { icon: "✈️", name: "KLM", dur: "2u 15m", price: 119 }, { icon: "🚌", name: "FlixBus", dur: "18u", price: 45 }] },
    { from: "Amsterdam", to: "Rome", modes: [{ icon: "✈️", name: "KLM", dur: "2u 25m", price: 99 }, { icon: "✈️", name: "Ryanair", dur: "2u 30m", price: 39 }, { icon: "🚄", name: "Trein+TGV", dur: "15u", price: 89 }] },
  ];

  const matchedRoutes = from && to
    ? popularRoutes.filter(r =>
        r.from.toLowerCase().includes(from.toLowerCase()) && r.to.toLowerCase().includes(to.toLowerCase())
      )
    : [];

  const hasCustomRoute = from && to && matchedRoutes.length === 0;
  const customModes = hasCustomRoute ? [
    { icon: "✈️", name: "Vlucht", dur: "~2u", price: Math.floor(40 + Math.random() * 80) },
    { icon: "🚄", name: "Trein", dur: "~5u", price: Math.floor(25 + Math.random() * 60) },
    { icon: "🚌", name: "Bus", dur: "~8u", price: Math.floor(15 + Math.random() * 25) },
  ] : [];

  const displayRoutes = matchedRoutes.length > 0
    ? matchedRoutes[0].modes.map((m, i) => ({ ...m, idx: i }))
    : customModes.map((m, i) => ({ ...m, idx: i }));

  const coords: Record<string, { lat: number; lng: number }> = {
    "Amsterdam": { lat: 52.3676, lng: 4.9041 }, "Parijs": { lat: 48.8566, lng: 2.3522 }, "Berlijn": { lat: 52.5200, lng: 13.4050 },
    "Barcelona": { lat: 41.3874, lng: 2.1686 }, "Rome": { lat: 41.9028, lng: 12.4964 }, "Praag": { lat: 50.0755, lng: 14.4378 },
    "Wenen": { lat: 48.2082, lng: 16.3738 }, "Brussel": { lat: 50.8503, lng: 4.3517 }, "Londen": { lat: 51.5074, lng: -0.1278 },
    "Kopenhagen": { lat: 55.6761, lng: 12.5683 }, "Zürich": { lat: 47.3769, lng: 8.5417 }, "Lissabon": { lat: 38.7223, lng: -9.1393 },
    "Budapest": { lat: 47.4979, lng: 19.0402 }, "Stockholm": { lat: 59.3293, lng: 18.0686 }, "Dublin": { lat: 53.3498, lng: -6.2603 },
    "Athene": { lat: 37.9838, lng: 23.7275 }, "Warschau": { lat: 52.2297, lng: 21.0122 },
  };

  const mapCenter = to && coords[to] ? coords[to] : coords["Amsterdam"];

  return (
    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex flex-col bg-muted/20 h-full">
      <header className="px-4 py-3 flex items-center gap-3 bg-background/80 backdrop-blur-xl sticky top-0 z-50 border-b border-border/50 shrink-0">
        <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2" data-testid="back-from-europe-planner">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div className="flex items-center gap-2 flex-1">
          <Train className="w-5 h-5 text-teal-600" />
          <h1 className="text-lg font-bold tracking-tight">Reis door Europa</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setShowMap(!showMap)} className="rounded-full" data-testid="toggle-map">
          <MapPin className="w-5 h-5 text-teal-600" />
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto">
        {showMap && (
          <motion.div initial={{ height: 0 }} animate={{ height: 200 }} className="overflow-hidden">
            <iframe
              src={`https://maps.google.com/maps?q=${mapCenter.lat},${mapCenter.lng}&z=5&output=embed`}
              className="w-full h-[200px] border-0"
              allowFullScreen
              loading="eager"
              title="Europe map"
            />
          </motion.div>
        )}

        <div className="bg-gradient-to-br from-teal-600 to-teal-700 p-5 text-white">
          <div className="space-y-2">
            <div className="bg-white/20 backdrop-blur rounded-xl p-3 relative">
              <label className="text-[10px] uppercase opacity-70 font-semibold">Van</label>
              <input
                value={from}
                onChange={e => {
                  setFrom(e.target.value);
                  setBooked(false);
                  setSelectedRoute(null);
                  setFromSuggestions(e.target.value ? cities.filter(c => c.toLowerCase().includes(e.target.value.toLowerCase())).slice(0, 5) : []);
                }}
                placeholder="Vertrekstad..."
                className="w-full text-sm font-medium outline-none bg-transparent placeholder:text-white/50 mt-0.5"
                data-testid="europe-from"
              />
              {fromSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl z-20 overflow-hidden">
                  {fromSuggestions.map(s => (
                    <button key={s} onClick={() => { setFrom(s); setFromSuggestions([]); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-800 hover:bg-gray-50 border-b border-gray-50 last:border-0 flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-teal-500" /> {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white/20 backdrop-blur rounded-xl p-3 relative">
              <label className="text-[10px] uppercase opacity-70 font-semibold">Naar</label>
              <input
                value={to}
                onChange={e => {
                  setTo(e.target.value);
                  setBooked(false);
                  setSelectedRoute(null);
                  setToSuggestions(e.target.value ? cities.filter(c => c.toLowerCase().includes(e.target.value.toLowerCase()) && c !== from).slice(0, 5) : []);
                }}
                placeholder="Bestemmingsstad..."
                className="w-full text-sm font-medium outline-none bg-transparent placeholder:text-white/50 mt-0.5"
                data-testid="europe-to"
              />
              {toSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl z-20 overflow-hidden">
                  {toSuggestions.map(s => (
                    <button key={s} onClick={() => { setTo(s); setToSuggestions([]); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-800 hover:bg-gray-50 border-b border-gray-50 last:border-0 flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-teal-500" /> {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {!from && !to && (
          <div className="p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-3">POPULAIRE ROUTES VANUIT NEDERLAND</p>
            <div className="space-y-2">
              {popularRoutes.map((route, i) => (
                <button
                  key={i}
                  onClick={() => { setFrom(route.from); setTo(route.to); }}
                  className="w-full flex items-center gap-3 bg-card rounded-xl p-4 shadow-sm text-left hover:bg-muted/30 transition-colors"
                  data-testid={`popular-route-${i}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                    <Train className="w-5 h-5 text-teal-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{route.from} → {route.to}</p>
                    <p className="text-xs text-muted-foreground">Vanaf €{Math.min(...route.modes.map(m => m.price))} • {route.modes.length} opties</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </div>

            <p className="text-xs font-semibold text-muted-foreground mt-6 mb-3">EUROPESE STEDEN</p>
            <div className="flex flex-wrap gap-2">
              {cities.filter(c => c !== "Amsterdam").map(city => (
                <button key={city} onClick={() => { setFrom("Amsterdam"); setTo(city); }} className="bg-card rounded-xl px-3 py-2 text-xs font-medium shadow-sm hover:bg-teal-50 transition-colors" data-testid={`city-${city}`}>
                  {city}
                </button>
              ))}
            </div>
          </div>
        )}

        {from && to && displayRoutes.length > 0 && !booked && (
          <div className="p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-3">REISOPTIES: {from.toUpperCase()} → {to.toUpperCase()}</p>
            <div className="space-y-2">
              {displayRoutes.map((mode, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedRoute(selectedRoute === i ? null : i)}
                  className={`w-full bg-card rounded-2xl p-4 shadow-sm text-left border-2 transition-all ${selectedRoute === i ? "border-teal-500" : "border-transparent"}`}
                  data-testid={`travel-option-${i}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{mode.icon}</span>
                    <div className="flex-1">
                      <p className="font-semibold">{mode.name}</p>
                      <p className="text-xs text-muted-foreground">{mode.dur} reistijd</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-teal-600">€{mode.price}</p>
                      <p className="text-[10px] text-muted-foreground">per persoon</p>
                    </div>
                  </div>
                  {selectedRoute === i && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 pt-3 border-t border-border/30">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-teal-500" />
                          <div className="w-0.5 h-6 bg-teal-200" />
                          <div className="w-3 h-3 rounded-sm bg-teal-500" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <p className="text-sm font-medium">{from}</p>
                          <p className="text-sm font-medium">{to}</p>
                        </div>
                      </div>
                      <Button className="w-full rounded-xl h-11 bg-teal-600 hover:bg-teal-700" onClick={(e) => { e.stopPropagation(); setBooked(true); }} data-testid={`book-europe-${i}`}>
                        <Ticket className="w-4 h-4 mr-2" /> Boek voor €{mode.price}
                      </Button>
                    </motion.div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {booked && selectedRoute !== null && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-4">
            <div className="bg-card rounded-2xl p-6 shadow-lg text-center border-2 border-teal-200">
              <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="text-lg font-bold mb-1">Reis geboekt!</h3>
              <p className="font-medium">{from} → {to}</p>
              <p className="text-sm text-muted-foreground mt-1">{displayRoutes[selectedRoute].name} • {displayRoutes[selectedRoute].dur}</p>
              <p className="text-xl font-bold text-teal-600 mt-2">€{displayRoutes[selectedRoute].price}</p>
              <div className="bg-teal-50 rounded-xl p-3 mt-4">
                <div className="flex justify-between text-xs">
                  {[...Array(20)].map((_, i) => <div key={i} className="w-1 bg-teal-600" style={{ height: `${Math.random() * 20 + 10}px` }} />)}
                </div>
                <p className="text-[9px] text-muted-foreground text-center mt-1">E-ticket — scan bij instappen</p>
              </div>
              <Button variant="outline" className="rounded-xl mt-4" onClick={() => { setBooked(false); setSelectedRoute(null); setFrom(""); setTo(""); }}>
                Nieuwe reis plannen
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function MapEmbedView({ onBack, title, logo, testId }: { onBack: () => void; title: string; logo: string; testId: string }) {
  const [location, setLocation] = useState({ lat: 52.0705, lng: 4.3007 });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then(r => r.json())
      .then(data => {
        if (data.latitude && data.longitude) setLocation({ lat: data.latitude, lng: data.longitude });
      })
      .catch(() => {});
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: true, timeout: 15000 }
      );
    }
  }, []);

  const embedUrl = `https://maps.google.com/maps?q=${location.lat},${location.lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", flexDirection: "column", background: "white" }}>
      <div
        style={{ position: "relative", zIndex: 9999, display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "white", borderBottom: "1px solid #e5e7eb", flexShrink: 0 }}
      >
        <button
          onClick={onBack}
          style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", border: "none", background: "#f3f4f6", cursor: "pointer" }}
          data-testid={`back-from-${testId}`}
        >
          <ArrowLeft style={{ width: 20, height: 20 }} />
        </button>
        <img src={logo} alt="" style={{ width: 24, height: 24, borderRadius: 4 }} />
        <span style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>{title}</span>
        <button
          onClick={onBack}
          style={{ fontSize: 12, fontWeight: 700, color: "white", background: "hsl(var(--primary))", border: "none", borderRadius: 20, padding: "6px 14px", cursor: "pointer" }}
          data-testid={`${testId}-back-to-w€spr`}
        >
          ← W€spr
        </button>
      </div>

      <div style={{ flex: 1, position: "relative" }}>
        {!loaded && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, background: "white", zIndex: 10 }}>
            <img src={logo} alt="" style={{ width: 56, height: 56, borderRadius: 16 }} />
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <p style={{ fontSize: 14, color: "#9ca3af" }}>{title} laden...</p>
          </div>
        )}
        <iframe
          src={embedUrl}
          style={{ width: "100%", height: "100%", border: "none", display: "block" }}
          onLoad={() => setLoaded(true)}
          allowFullScreen
          loading="eager"
          referrerPolicy="no-referrer-when-downgrade"
          title={title}
          data-testid={`${testId}-iframe`}
        />
      </div>
    </div>
  );
}

function GoogleMapsView({ onBack }: { onBack: () => void }) {
  return <MapEmbedView onBack={onBack} title="Google Maps" logo="/images/google-maps-logo.svg" testId="maps" />;
}

function KaartenView({ onBack }: { onBack: () => void }) {
  return <MapEmbedView onBack={onBack} title="Kaarten" logo="/images/apple-maps-logo.svg" testId="kaarten" />;
}

function ServiceAppView({ item, ItemIcon, onBack }: { item: any; ItemIcon: any; onBack: () => void }) {
  const [loading, setLoading] = useState(true);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const appCards = [
    { id: "activiteit", title: "Laatste activiteit", icon: Activity, description: "Bekijk je recente transacties en acties binnen deze dienst.", items: ["Inlogpoging — vandaag 09:14", "Document bekeken — gisteren", "Betaling ontvangen — 3 dagen geleden"] },
    { id: "gegevens", title: "Mijn gegevens", icon: User, description: "Beheer je persoonlijke gegevens die gekoppeld zijn aan deze dienst.", items: ["Naam: Jan de Vries", "E-mail: jan@voorbeeld.nl", "Lid sinds: maart 2023"] },
    { id: "instellingen", title: "Instellingen", icon: Settings, description: "Pas meldingen, privacy en andere voorkeuren aan.", items: ["Meldingen: Aan", "Tweestapsverificatie: Actief", "Taal: Nederlands"] },
  ];

  return (
    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex flex-col bg-muted/20 min-h-full">
      <header className="px-4 py-4 flex items-center gap-3 bg-background/80 backdrop-blur-xl sticky top-0 z-50 border-b border-border/50">
        <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2" data-testid="back-from-app-view">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold tracking-tight flex-1">{item.label}</h1>
      </header>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${item.colorBg} ${item.colorText} shadow-md`}>
              <ItemIcon className="w-8 h-8" />
            </div>
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">App wordt geladen...</p>
          </motion.div>
        ) : (
          <motion.div key="content" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 space-y-4">
            <div className="bg-card rounded-2xl p-4 shadow-sm flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.colorBg} ${item.colorText} shadow-sm`}>
                <ItemIcon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-[15px]">{item.label}</h2>
                <p className="text-xs text-muted-foreground">Verbonden · Actief</p>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-medium text-emerald-600">Online</span>
              </div>
            </div>

            {appCards.map((card) => {
              const CardIcon = card.icon;
              const isExpanded = expandedCard === card.id;
              return (
                <motion.div
                  key={card.id}
                  onClick={() => setExpandedCard(isExpanded ? null : card.id)}
                  className="bg-card rounded-2xl shadow-sm overflow-hidden cursor-pointer"
                  data-testid={`app-card-${card.id}`}
                >
                  <div className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-muted text-muted-foreground">
                      <CardIcon className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-sm flex-1">{card.title}</span>
                    <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </div>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 border-t border-border/30">
                          <p className="text-xs text-muted-foreground mt-3 mb-3">{card.description}</p>
                          <div className="space-y-2">
                            {card.items.map((entry, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm bg-muted/30 rounded-lg px-3 py-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                                <span>{entry}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ServiceInfoView({ item, config, ItemIcon, onBack }: { item: any; config: any; ItemIcon: any; onBack: () => void }) {
  const descriptions: Record<string, string> = {
    default: `${item.label} is een betrouwbare digitale dienst binnen het W€spr-ecosysteem. Krijg snel toegang tot belangrijke functies, beheer je gegevens en blijf op de hoogte van de laatste updates.`,
  };
  const description = descriptions.default;

  return (
    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex flex-col bg-muted/20 min-h-full">
      <header className="px-4 py-4 flex items-center gap-3 bg-background/80 backdrop-blur-xl sticky top-0 z-50 border-b border-border/50">
        <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2" data-testid="back-from-info-view">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold tracking-tight flex-1">Meer informatie</h1>
      </header>
      <div className="p-4 space-y-4">
        <div className="bg-card rounded-2xl p-6 shadow-sm flex flex-col items-center">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${item.colorBg} ${item.colorText} mb-4 shadow-md`}>
            <ItemIcon className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold mb-1">{item.label}</h2>
          <p className="text-sm text-muted-foreground mb-4">{item.subcategory} · {config.title}</p>
          <p className="text-sm text-foreground/80 text-center leading-relaxed">{description}</p>
        </div>

        <div className="bg-card rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-bold text-muted-foreground mb-4">APP-INFORMATIE</h3>
          <div className="space-y-3.5">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Versie</span>
              <span className="text-sm font-medium">2.4.1</span>
            </div>
            <div className="h-px bg-border/30" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Laatst bijgewerkt</span>
              <span className="text-sm font-medium">december 2025</span>
            </div>
            <div className="h-px bg-border/30" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Ontwikkelaar</span>
              <span className="text-sm font-medium">W€spr Services B.V.</span>
            </div>
            <div className="h-px bg-border/30" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Beoordeling</span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium">4.6</span>
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span className="text-xs text-muted-foreground">(2.840 reviews)</span>
              </div>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full rounded-2xl h-12 gap-2"
          onClick={() => {}}
          data-testid="btn-visit-website"
        >
          <ExternalLink className="w-4 h-4" />
          Website bezoeken
        </Button>
      </div>
    </motion.div>
  );
}

function ServiceQRView({ item, ItemIcon, onBack }: { item: any; ItemIcon: any; onBack: () => void }) {
  return (
    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex flex-col bg-black min-h-full relative">
      <header className="px-4 py-4 flex items-center gap-3 sticky top-0 z-50">
        <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2 text-white hover:bg-white/10" data-testid="back-from-qr-view">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold tracking-tight flex-1 text-white">QR-scanner</h1>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="relative w-64 h-64 mb-8">
          <div className="absolute inset-0 bg-white/5 rounded-2xl" />
          <motion.div
            className="absolute top-0 left-0 w-10 h-10 border-t-3 border-l-3 border-white rounded-tl-xl"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div
            className="absolute top-0 right-0 w-10 h-10 border-t-3 border-r-3 border-white rounded-tr-xl"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          />
          <motion.div
            className="absolute bottom-0 left-0 w-10 h-10 border-b-3 border-l-3 border-white rounded-bl-xl"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
          />
          <motion.div
            className="absolute bottom-0 right-0 w-10 h-10 border-b-3 border-r-3 border-white rounded-br-xl"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
          />
          <motion.div
            className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
            animate={{ top: ["10%", "90%", "10%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${item.colorBg} ${item.colorText} shadow-lg opacity-30`}>
              <ItemIcon className="w-7 h-7" />
            </div>
          </div>
        </div>

        <p className="text-white/80 text-center text-sm leading-relaxed max-w-[250px]">
          Richt je camera op een QR-code van <span className="font-semibold text-white">{item.label}</span>
        </p>
        <p className="text-white/40 text-xs mt-2">Scan om in te checken of te verifiëren</p>
      </div>

      <div className="p-6 pb-10">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-3">
          <Camera className="w-5 h-5 text-white/60" />
          <span className="text-white/60 text-sm">Camera actief — wacht op QR-code...</span>
        </div>
      </div>
    </motion.div>
  );
}

// === MOMENTS FEED ===
function PinchZoomImage({ src, onRemove }: { src: string; onRemove?: () => void }) {
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({ lastDist: 0, lastCenter: { x: 0, y: 0 }, dragging: false, scale: 1, translate: { x: 0, y: 0 } });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const getTouchDist = (touches: TouchList) => {
      const dx = touches[1].clientX - touches[0].clientX;
      const dy = touches[1].clientY - touches[0].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const getTouchCenter = (touches: TouchList) => ({
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    });

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        e.stopPropagation();
        stateRef.current.lastDist = getTouchDist(e.touches);
        stateRef.current.lastCenter = getTouchCenter(e.touches);
        stateRef.current.dragging = true;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && stateRef.current.dragging) {
        e.preventDefault();
        e.stopPropagation();
        const dist = getTouchDist(e.touches);
        const center = getTouchCenter(e.touches);
        const s = stateRef.current;
        const newScale = Math.max(0.5, Math.min(5, s.scale * (dist / s.lastDist)));
        const newTranslate = {
          x: s.translate.x + (center.x - s.lastCenter.x),
          y: s.translate.y + (center.y - s.lastCenter.y),
        };
        s.scale = newScale;
        s.translate = newTranslate;
        s.lastDist = dist;
        s.lastCenter = center;
        setScale(newScale);
        setTranslate(newTranslate);
      }
    };

    const onTouchEnd = () => {
      stateRef.current.dragging = false;
      if (stateRef.current.scale <= 1) {
        stateRef.current.scale = 1;
        stateRef.current.translate = { x: 0, y: 0 };
        setScale(1);
        setTranslate({ x: 0, y: 0 });
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.5, Math.min(5, stateRef.current.scale * delta));
      stateRef.current.scale = newScale;
      if (newScale <= 1) {
        stateRef.current.translate = { x: 0, y: 0 };
        setTranslate({ x: 0, y: 0 });
      }
      setScale(newScale);
    };

    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("wheel", onWheel);
    };
  }, []);

  const handleDoubleClick = () => {
    if (scale > 1) {
      stateRef.current.scale = 1;
      stateRef.current.translate = { x: 0, y: 0 };
      setScale(1);
      setTranslate({ x: 0, y: 0 });
    } else {
      stateRef.current.scale = 2.5;
      setScale(2.5);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative mb-3 flex items-center justify-center bg-black/5 rounded-xl overflow-hidden"
      onDoubleClick={handleDoubleClick}
      style={{ touchAction: "none" }}
      data-testid="container-pinch-zoom"
    >
      <img
        src={src}
        className="w-full rounded-xl max-h-72 select-none"
        alt="Foto"
        draggable={false}
        style={{
          transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
          transformOrigin: "center center",
          transition: stateRef.current.dragging ? "none" : "transform 0.2s ease-out",
          objectFit: "contain",
        }}
        data-testid="img-captured-photo"
      />
      {scale > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
          {Math.round(scale * 100)}%
        </div>
      )}
      {onRemove && (
        <Button size="icon" variant="secondary" onClick={onRemove} className="absolute top-2 right-2 rounded-full w-7 h-7 z-10" data-testid="button-remove-photo">
          <X className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
}

function PinchZoomVideo({ videoRef, onCapture, onCancel }: { videoRef: React.RefObject<HTMLVideoElement>; onCapture: () => void; onCancel: () => void }) {
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({ lastDist: 0, dragging: false, scale: 1 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const getTouchDist = (touches: TouchList) => {
      const dx = touches[1].clientX - touches[0].clientX;
      const dy = touches[1].clientY - touches[0].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        stateRef.current.lastDist = getTouchDist(e.touches);
        stateRef.current.dragging = true;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && stateRef.current.dragging) {
        e.preventDefault();
        const dist = getTouchDist(e.touches);
        const newScale = Math.max(1, Math.min(5, stateRef.current.scale * (dist / stateRef.current.lastDist)));
        stateRef.current.scale = newScale;
        stateRef.current.lastDist = dist;
        setScale(newScale);
      }
    };

    const onTouchEnd = () => {
      stateRef.current.dragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(1, Math.min(5, stateRef.current.scale * delta));
      stateRef.current.scale = newScale;
      setScale(newScale);
    };

    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("wheel", onWheel);
    };
  }, []);

  const handleDoubleClick = () => {
    if (stateRef.current.scale > 1) {
      stateRef.current.scale = 1;
      setScale(1);
    } else {
      stateRef.current.scale = 2;
      setScale(2);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative mb-3 rounded-xl overflow-hidden bg-black"
      onDoubleClick={handleDoubleClick}
      style={{ touchAction: "none" }}
      data-testid="container-camera-zoom"
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full rounded-xl select-none"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          transition: stateRef.current.dragging ? "none" : "transform 0.15s ease-out",
        }}
        data-testid="video-camera-preview"
      />
      {scale > 1 && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full z-10">
          {Math.round(scale * 100)}%
        </div>
      )}
      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3 z-10">
        <Button size="sm" variant="secondary" onClick={onCancel} className="rounded-full" data-testid="button-cancel-camera">
          <X className="w-4 h-4" />
        </Button>
        <Button size="sm" onClick={onCapture} className="rounded-full bg-white text-black hover:bg-white/90 w-12 h-12" data-testid="button-capture-photo">
          <div className="w-8 h-8 rounded-full border-2 border-black/30" />
        </Button>
      </div>
    </div>
  );
}

function MomentsFeed({ onBack }: { onBack: () => void }) {
  const { toast } = useToast();
  const { data: postsData, isLoading } = useQuery({
    queryKey: ["/api/posts"],
    queryFn: () => apiRequest("/api/posts"),
  });
  const [newPostText, setNewPostText] = useState("");
  const [showNewPost, setShowNewPost] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      setCameraStream(stream);
      setShowCamera(true);
      setShowNewPost(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch {
      if (fileInputRef.current) fileInputRef.current.click();
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    const maxW = 1200;
    const scale = Math.min(1, maxW / videoRef.current.videoWidth);
    canvas.width = videoRef.current.videoWidth * scale;
    canvas.height = videoRef.current.videoHeight * scale;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    setCapturedImage(canvas.toDataURL("image/jpeg", 0.7));
    stopCamera();
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxW = 1200;
        const scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
        setCapturedImage(canvas.toDataURL("image/jpeg", 0.7));
        setShowNewPost(true);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const createPostMutation = useMutation({
    mutationFn: (content: string) => apiRequest("/api/posts", { method: "POST", body: JSON.stringify({ content, image: capturedImage }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setNewPostText("");
      setCapturedImage(null);
      setShowNewPost(false);
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) =>
      apiRequest(`/api/posts/${postId}/comments`, { method: "POST", body: JSON.stringify({ content }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/posts"] }),
  });

  const likePostMutation = useMutation({
    mutationFn: (postId: string) => apiRequest(`/api/posts/${postId}/like`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/posts"] }),
  });

  const unlikePostMutation = useMutation({
    mutationFn: (postId: string) => apiRequest(`/api/posts/${postId}/like`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/posts"] }),
  });

  const handleToggleLike = (postId: string) => {
    if (!me?.id) return;
    const post = (postsData || []).find((p: any) => p.id === postId);
    if (post?.likedUserIds?.includes(me.id)) {
      unlikePostMutation.mutate(postId);
    } else {
      likePostMutation.mutate(postId);
    }
  };

  const deletePostMutation = useMutation({
    mutationFn: (postId: string) => {
      setDeletingPostId(postId);
      return apiRequest(`/api/posts/${postId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      setDeletingPostId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({ description: "Moment verwijderd." });
    },
    onError: () => {
      setDeletingPostId(null);
      toast({ description: "Verwijderen mislukt, probeer opnieuw.", variant: "destructive" });
    },
  });

  const { data: me } = useQuery({
    queryKey: ["/api/me"],
    queryFn: () => apiRequest("/api/me"),
  });

  return (
    <motion.div 
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 20, opacity: 0 }}
      className="flex flex-col relative bg-background min-h-full"
    >
      <Button variant="ghost" size="icon" onClick={onBack} className="absolute top-4 left-4 z-50 text-white hover:bg-black/20 rounded-full backdrop-blur-sm">
        <ArrowLeft className="w-6 h-6" />
      </Button>

      <div className="relative h-64 w-full bg-muted shrink-0">
        <img src="/images/moments-header.png" alt="Moments Cover" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute -bottom-6 right-4 flex items-end gap-3">
          <span className="text-white font-bold text-lg mb-8 text-shadow-sm drop-shadow-md">Ge</span>
          <div className="h-16 w-16 rounded-xl overflow-hidden shadow-lg bg-primary flex items-center justify-center shrink-0">
            {me?.avatar
              ? <img src={me.avatar} alt="" className="w-full h-full object-cover block" />
              : <span className="text-primary-foreground text-xl font-bold">GE</span>
            }
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} data-testid="input-camera-file" />
        <Button variant="ghost" size="icon" onClick={openCamera} className="absolute top-4 right-4 text-white hover:bg-black/20 rounded-full backdrop-blur-sm" data-testid="button-open-camera">
          <Camera className="w-6 h-6" />
        </Button>
      </div>

      {!showNewPost && (
        <div
          className="mx-4 mt-10 mb-2 bg-card rounded-2xl px-4 py-3 shadow-sm border border-border/50 flex items-center gap-3 cursor-text"
          onClick={() => setShowNewPost(true)}
          data-testid="button-new-moment"
        >
          <div className="h-8 w-8 rounded-xl shrink-0 overflow-hidden bg-primary flex items-center justify-center">
            {me?.avatar
              ? <img src={me.avatar} alt="" className="w-full h-full object-cover block" />
              : <span className="text-primary-foreground text-xs font-semibold">GE</span>
            }
          </div>
          <span className="text-sm text-muted-foreground/70 flex-1">Wat is er in je opgekomen?</span>
          <Button variant="ghost" size="sm" className="shrink-0 rounded-xl gap-1.5 text-muted-foreground text-xs" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} data-testid="button-open-library-inline">
            <Images className="w-4 h-4" /> Foto's
          </Button>
        </div>
      )}

      {showNewPost && (
        <div className="mx-4 mt-10 mb-2 bg-card rounded-2xl p-4 shadow-sm border border-border/50">
          {showCamera && (
            <PinchZoomVideo videoRef={videoRef} onCapture={capturePhoto} onCancel={stopCamera} />
          )}
          {capturedImage && !showCamera && (
            <PinchZoomImage src={capturedImage} onRemove={() => setCapturedImage(null)} />
          )}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nieuw moment</span>
            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg text-muted-foreground" onClick={() => { setShowNewPost(false); setCapturedImage(null); stopCamera(); setNewPostText(""); }} data-testid="button-close-composer">
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
          <textarea
            value={newPostText}
            onChange={(e) => setNewPostText(e.target.value)}
            placeholder="Wat is er in je opgekomen?"
            className="w-full bg-transparent border-none outline-none resize-none text-[15px] min-h-[80px] placeholder:text-muted-foreground/70"
            autoFocus
          />
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} className="rounded-xl gap-1.5 text-muted-foreground" data-testid="button-add-from-library">
                <Images className="w-4 h-4" /> Foto's
              </Button>
              <Button variant="ghost" size="sm" onClick={openCamera} className="rounded-xl gap-1.5 text-muted-foreground" data-testid="button-open-camera-composer">
                <Camera className="w-4 h-4" /> Camera
              </Button>
            </div>
            <Button
              size="sm"
              disabled={(!newPostText.trim() && !capturedImage) || createPostMutation.isPending}
              onClick={() => createPostMutation.mutate(newPostText)}
              className="rounded-xl gap-2"
            >
              <Send className="w-4 h-4" /> Plaatsen
            </Button>
          </div>
        </div>
      )}

      <div className={`${showNewPost ? 'mt-4' : 'mt-12'} flex flex-col gap-6 px-4 pb-12`}>
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2].map(i => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          (postsData || []).map((post: any, i: number) => (
            <PostCard key={post.id} post={post} index={i} onLike={handleToggleLike} onComment={addCommentMutation.mutate} onDelete={deletePostMutation.mutate} currentUserId={me?.id} deletingPostId={deletingPostId} isLiked={me?.id ? post.likedUserIds?.includes(me.id) : false} />
          ))
        )}
      </div>
    </motion.div>
  );
}

function PostCard({ post, index, onLike, onComment, onDelete, currentUserId, deletingPostId, isLiked }: { post: any, index: number, onLike: (id: string) => void, onComment: (data: { postId: string; content: string }) => void, onDelete?: (id: string) => void, currentUserId?: string, deletingPostId?: string | null, isLiked?: boolean }) {
  const [commentText, setCommentText] = useState("");
  const [showCommentInput, setShowCommentInput] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="flex gap-3 border-b border-border/40 pb-6 last:border-0">
      <Avatar className="h-10 w-10 rounded-xl shrink-0">
        <AvatarImage src={post.user.avatar} className="object-cover" />
        <AvatarFallback className="rounded-xl">{post.user.name?.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0 pt-0.5">
        <h4 className="font-bold text-primary/90 text-[15px]">{post.user.name}</h4>
        {post.content && <p className="text-[15px] mt-1 leading-relaxed text-foreground/90">{post.content}</p>}
        {post.image && (
          <img src={post.image} alt="" className="mt-2 rounded-xl w-full max-h-72 object-cover" />
        )}
        <div className="flex items-center justify-between mt-3 text-muted-foreground text-xs">
          <span>{formatTimeAgo(post.createdAt)}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onLike(post.id)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md cursor-pointer transition-colors ${isLiked ? "bg-red-50 dark:bg-red-950/30 text-red-500 hover:bg-red-100" : "bg-muted/40 hover:bg-muted text-muted-foreground"}`}
              data-testid={`button-like-post-${post.id}`}
            >
              <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
            </button>
            <button onClick={() => setShowCommentInput(!showCommentInput)} className="flex items-center gap-1 bg-muted/40 px-2 py-1 rounded-md cursor-pointer hover:bg-muted transition-colors">
              <MessageCircle className="w-3.5 h-3.5" />
            </button>
            {currentUserId && post.userId === currentUserId && onDelete && (
              <button
                onClick={() => onDelete(post.id)}
                disabled={deletingPostId === post.id}
                className="flex items-center gap-1 bg-red-50 dark:bg-red-950/30 text-red-500 px-2 py-1 rounded-md cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
                data-testid={`button-delete-post-${post.id}`}
              >
                {deletingPostId === post.id
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Trash2 className="w-3.5 h-3.5" />
                }
              </button>
            )}
          </div>
        </div>
        {(post.likes.length > 0 || post.comments.length > 0) && (
          <div className="mt-2.5 bg-muted/40 rounded-lg p-2.5 text-sm">
            {post.likes.length > 0 && (
              <div className="flex items-center gap-2 text-primary font-medium">
                <Heart className="w-3.5 h-3.5" />
                <span>{post.likes.join(", ")}</span>
              </div>
            )}
            {post.likes.length > 0 && post.comments.length > 0 && <div className="h-px bg-border/40 my-2" />}
            {post.comments.map((c: any, idx: number) => (
              <div key={idx} className="mt-1">
                <span className="font-bold text-primary/90">{c.user}: </span>
                <span className="text-foreground/80">{c.text}</span>
              </div>
            ))}
          </div>
        )}
        {showCommentInput && (
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && commentText.trim()) {
                  onComment({ postId: post.id, content: commentText });
                  setCommentText("");
                  setShowCommentInput(false);
                }
              }}
              placeholder="Reageer..."
              className="flex-1 bg-muted/40 rounded-lg px-3 py-1.5 text-sm outline-none border-none"
            />
            <Button size="sm" variant="ghost" onClick={() => { if (commentText.trim()) { onComment({ postId: post.id, content: commentText }); setCommentText(""); setShowCommentInput(false); } }}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}