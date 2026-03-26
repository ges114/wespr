import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronRight, QrCode, ShieldCheck, Settings, Bell, CircleHelp, ArrowLeft, Camera, Image as ImageIcon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { EudiQRScreen } from "@/components/EudiQRScreen";

function ListItem({ icon: Icon, label, color = "text-primary", hideBorder = false, onClick }: { icon: any, label: string, color?: string, hideBorder?: boolean, onClick?: () => void }) {
  return (
    <div onClick={onClick} className="flex items-center gap-4 px-4 py-3 cursor-pointer bg-card hover:bg-muted/50 transition-colors">
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${color} bg-muted`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className={`flex-1 flex items-center justify-between pb-3 -mb-3 pt-1 ${!hideBorder ? 'border-b border-border/40' : ''}`}>
        <span className="font-medium text-[15px]">{label}</span>
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </div>
    </div>
  );
}

function ProfileEditScreen({ user, onBack }: { user: any; onBack: () => void }) {
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [bio, setBio] = useState(user?.bio || "");

  useEffect(() => {
    setDisplayName(user?.displayName || "");
    setBio(user?.bio || "");
  }, [user]);

  const mutation = useMutation({
    mutationFn: (data: { displayName?: string; bio?: string; avatar?: string }) =>
      apiRequest("/api/me", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      onBack();
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Basic validation: max 5MB
      if (file.size > 5 * 1024 * 1024) {
        alert("Afbeelding is te groot. Kies een bestand kleiner dan 5MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 400;
            const MAX_HEIGHT = 400;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d', { alpha: false });
            if (ctx) {
              ctx.fillStyle = 'white';
              ctx.fillRect(0, 0, width, height);
              ctx.drawImage(img, 0, 0, width, height);
            }
            const dataUrl = canvas.toDataURL('image/jpeg', 0.4);
            mutation.mutate({ avatar: dataUrl });
          } catch (err) {
            console.error("Canvas error:", err);
            alert("Er is iets misgegaan bij het verwerken van de foto. Probeer een andere foto.");
          }
        };
        img.onerror = () => {
          alert("Kon de afbeelding niet laden. Is het een geldig bestand?");
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 20, opacity: 0 }}
      className="flex flex-col h-full bg-muted/20"
    >
      <header className="px-4 py-4 flex items-center gap-3 bg-background/80 backdrop-blur-xl sticky top-0 z-50 border-b border-border/50">
        <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2" data-testid="edit-profile-back-btn">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold tracking-tight flex-1">Profiel bewerken</h1>
      </header>

      <div className="bg-card shadow-sm mb-2">
        <div className="flex flex-col items-center py-8 px-6">
          <div className="relative group">
            <Avatar className="h-24 w-24 rounded-2xl shadow-lg border-2 border-border/50 mb-4 overflow-hidden">
              {user?.avatar && <AvatarImage src={user.avatar} className="object-cover" />}
              <AvatarFallback className="rounded-2xl bg-primary text-primary-foreground text-3xl">
                {user?.displayName?.charAt(0) || "G"}
              </AvatarFallback>
            </Avatar>
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="w-8 h-8" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
          </div>
          <p className="text-xs text-muted-foreground">Tik om foto te wijzigen</p>
        </div>
      </div>

      <div className="bg-card shadow-sm mb-2 px-4 py-4 space-y-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Weergavenaam</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-xl border border-border/50 bg-muted/30 px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            data-testid="input-display-name"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Bio / Status</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-border/50 bg-muted/30 px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
            data-testid="input-bio"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">W€spr ID</label>
          <div className="w-full rounded-xl border border-border/50 bg-muted/50 px-4 py-3 text-[15px] text-muted-foreground" data-testid="text-aura-id">
            {user?.auraId || "..."}
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        <Button
          onClick={() => mutation.mutate({ displayName, bio })}
          disabled={mutation.isPending}
          className="w-full rounded-xl py-6 text-[15px] font-semibold"
          data-testid="button-save-profile"
        >
          {mutation.isPending ? "Opslaan..." : "Opslaan"}
        </Button>
      </div>
    </motion.div>
  );
}

export function Profile({ onOpenWallet, onOpenPrivacy, onOpenNotifications, onOpenSettings, onOpenHelp, onOpenScanner }: {
  onOpenWallet?: () => void;
  onOpenPrivacy?: () => void;
  onOpenNotifications?: () => void;
  onOpenSettings?: () => void;
  onOpenHelp?: () => void;
  onOpenScanner?: () => void;
}) {
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showEudiQR, setShowEudiQR] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/me"],
    queryFn: () => apiRequest("/api/me"),
  });

  if (showEditProfile && user) {
    return <ProfileEditScreen user={user} onBack={() => setShowEditProfile(false)} />;
  }

  if (showEudiQR) {
    return <EudiQRScreen onClose={() => setShowEudiQR(false)} />;
  }

  return (
    <div className="flex flex-col min-h-full bg-muted/20 pb-8 lg:px-6 lg:pt-4">
      <div className="bg-card pt-12 lg:pt-6 pb-6 px-4 mb-2 shadow-sm lg:rounded-xl">
        {isLoading ? (
          <div className="flex items-center gap-5">
            <Skeleton className="h-16 w-16 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-5 cursor-pointer group" onClick={() => setShowEditProfile(true)} data-testid="profile-header-edit">
            <Avatar className="h-16 w-16 rounded-2xl group-hover:scale-105 transition-transform duration-300 shadow-sm border border-border/50">
              {user?.avatar && <AvatarImage src={user.avatar} className="object-cover" />}
              <AvatarFallback className="rounded-2xl bg-primary text-primary-foreground text-xl">
                {user?.displayName?.charAt(0) || "ME"}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">{user?.displayName || "Mijn Naam"}</h2>
                {user?.eudiVerified && (
                  <div className="flex items-center gap-1 bg-[#003399] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" title="Geverifieerd via EU Digital Identity Wallet">
                    <svg viewBox="0 0 16 16" width="11" height="11">
                      {Array.from({ length: 12 }, (_, i) => {
                        const angle = (i * 30 - 90) * Math.PI / 180;
                        const x = 8 + 5 * Math.cos(angle);
                        const y = 8 + 5 * Math.sin(angle);
                        return <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="2.5" fill="#FFCC00">★</text>;
                      })}
                    </svg>
                    EUDI Verified
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm text-muted-foreground font-medium">W€spr ID: {user?.auraId || "..."}</span>
                <div className="flex items-center gap-3">
                  <button onClick={(e) => { e.stopPropagation(); onOpenScanner?.(); }} className="p-1 -m-1 rounded-lg hover:bg-muted/50 transition-colors" data-testid="profile-qr-btn">
                    <QrCode className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                  </button>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-card mb-2 shadow-sm flex flex-col lg:rounded-xl">
        <div onClick={() => setShowEudiQR(true)} className="flex items-center gap-4 px-4 py-3 cursor-pointer bg-card hover:bg-muted/50 transition-colors" data-testid="menu-eudi-qr">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-[#003399]">
            <svg viewBox="0 0 32 32" width="20" height="20">
              {Array.from({ length: 12 }, (_, i) => {
                const angle = (i * 30 - 90) * Math.PI / 180;
                const x = 16 + 10 * Math.cos(angle);
                const y = 16 + 10 * Math.sin(angle);
                return <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="4.5" fill="#FFCC00">★</text>;
              })}
            </svg>
          </div>
          <div className="flex-1 flex items-center justify-between pb-3 -mb-3 pt-1 border-b border-border/40">
            <div>
              <span className="font-medium text-[15px]">EUDI Wallet · QR Verificatie</span>
              {user?.eudiVerified && (
                <span className="ml-2 text-[10px] font-bold text-[#003399] bg-[#003399]/10 px-1.5 py-0.5 rounded-full">Actief</span>
              )}
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
        <ListItem onClick={onOpenPrivacy} icon={ShieldCheck} label="Privacy & Security" color="text-blue-500" />
        <ListItem onClick={onOpenNotifications} icon={Bell} label="Meldingen" color="text-amber-500" hideBorder />
      </div>

      <div className="bg-card shadow-sm flex flex-col lg:rounded-xl">
        <ListItem onClick={onOpenSettings} icon={Settings} label="Instellingen" color="text-slate-500" />
        <ListItem onClick={onOpenHelp} icon={CircleHelp} label="Help & Feedback" color="text-purple-500" hideBorder />
      </div>
    </div>
  );
}
