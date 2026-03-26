import { motion } from "framer-motion";
import { ArrowLeft, Star, QrCode, MessageCircle, Phone, Video, Mail } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "./ui/button";

export function ContactProfile({ contact, onBack, onCall, onVideoCall, onEmail }: {
  contact: { id: string; displayName: string; avatar?: string | null; auraId?: string; bio?: string | null };
  onBack: () => void;
  onCall?: (name: string, avatar?: string | null) => void;
  onVideoCall?: (name: string, avatar?: string | null) => void;
  onEmail?: (name: string, avatar?: string | null) => void;
}) {
  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 20, opacity: 0 }}
      className="flex flex-col h-full bg-muted/20 overflow-auto"
    >
      <header className="px-4 py-4 flex items-center gap-3 bg-background/80 backdrop-blur-xl sticky top-0 z-50 border-b border-border/50">
        <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold tracking-tight flex-1">Profiel</h1>
      </header>

      <div className="bg-card shadow-sm mb-2">
        <div className="flex flex-col items-center py-8 px-6">
          <Avatar className="h-24 w-24 rounded-2xl shadow-lg border-2 border-border/50 mb-4">
            {contact.avatar && <AvatarImage src={contact.avatar} className="object-cover" />}
            <AvatarFallback className="rounded-2xl bg-primary text-primary-foreground text-3xl">
              {contact.displayName?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-bold">{contact.displayName}</h2>
          <p className="text-sm text-muted-foreground mt-1">W€spr ID: {contact.auraId || "onbekend"}</p>
          {contact.bio && <p className="text-sm text-center text-muted-foreground mt-2 max-w-[240px]">{contact.bio}</p>}

          <div className="flex items-center gap-6 mt-6">
            <button
              onClick={() => onCall?.(contact.displayName, contact.avatar)}
              className="flex flex-col items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400"
              data-testid="profile-call-btn"
            >
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              Bellen
            </button>
            <button
              onClick={() => onVideoCall?.(contact.displayName, contact.avatar)}
              className="flex flex-col items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400"
              data-testid="profile-video-btn"
            >
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
                <Video className="w-5 h-5" />
              </div>
              Video
            </button>
            <button
              onClick={() => onEmail?.(contact.displayName, contact.avatar)}
              className="flex flex-col items-center gap-1.5 text-xs font-medium text-violet-600 dark:text-violet-400"
              data-testid="profile-mail-btn"
            >
              <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/40 rounded-full flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              Mail
            </button>
          </div>
        </div>
      </div>

      <div className="bg-card shadow-sm mb-2">
        <div className="px-4 py-4">
          <h3 className="text-xs font-bold text-muted-foreground mb-2">GEGEVENS</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">W€spr ID</span>
              <span className="text-sm font-medium">{contact.auraId || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Regio</span>
              <span className="text-sm font-medium">Europa</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className="text-sm font-medium text-emerald-600 flex items-center gap-1">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span> Online
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card shadow-sm mb-2">
        <div className="px-4 py-4">
          <h3 className="text-xs font-bold text-muted-foreground mb-3">GEDEELDE MEDIA</h3>
          <div className="grid grid-cols-3 gap-1.5">
            {[1, 2, 3].map(i => (
              <div key={i} className="aspect-square bg-muted rounded-xl flex items-center justify-center">
                <span className="text-muted-foreground/40 text-xs">Leeg</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card shadow-sm">
        <div className="px-4 py-4 flex flex-col gap-2">
          <button className="flex items-center gap-3 py-2.5 cursor-pointer hover:bg-muted/50 rounded-xl px-2 -mx-2 transition-colors">
            <QrCode className="w-5 h-5 text-primary" />
            <span className="font-medium text-sm">QR-code delen</span>
          </button>
          <button className="flex items-center gap-3 py-2.5 cursor-pointer hover:bg-muted/50 rounded-xl px-2 -mx-2 transition-colors">
            <Star className="w-5 h-5 text-amber-500" />
            <span className="font-medium text-sm">Toevoegen aan favorieten</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
