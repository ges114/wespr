import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Search, X, MessageCircle, User, ShoppingBag, ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "./ui/button";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";

export function SearchOverlay({ onBack, onOpenChat, onOpenContact }: {
  onBack: () => void;
  onOpenChat?: (id: string) => void;
  onOpenContact?: (contact: any) => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const { data: chats } = useQuery({ queryKey: ["/api/chats"], queryFn: () => apiRequest("/api/chats") });
  const { data: contacts } = useQuery({ queryKey: ["/api/contacts"], queryFn: () => apiRequest("/api/contacts") });
  const { data: services } = useQuery({ queryKey: ["/api/services"], queryFn: () => apiRequest("/api/services") });

  const q = query.toLowerCase().trim();

  const filteredChats = q ? (chats || []).filter((c: any) => c.name?.toLowerCase().includes(q) || c.lastMessage?.toLowerCase().includes(q)) : [];
  const filteredContacts = q ? (contacts || []).filter((c: any) => c.contact.displayName?.toLowerCase().includes(q)) : [];
  const filteredServices = q ? (services || []).filter((s: any) => s.label?.toLowerCase().includes(q) || s.subcategory?.toLowerCase().includes(q)) : [];

  const hasResults = filteredChats.length > 0 || filteredContacts.length > 0 || filteredServices.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-full bg-background"
    >
      <header className="px-4 py-3 flex items-center gap-3 bg-background/80 backdrop-blur-xl sticky top-0 z-50 border-b border-border/50">
        <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2 shrink-0">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div className="flex-1 flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Zoek in chats, contacten, diensten..."
            className="bg-transparent border-none outline-none flex-1 text-[15px] placeholder:text-muted-foreground/70"
            data-testid="search-input"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {!q && (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Search className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">Zoek naar berichten, contacten en diensten</p>
          </div>
        )}

        {q && !hasResults && (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <p className="text-sm">Geen resultaten voor "{query}"</p>
          </div>
        )}

        {filteredChats.length > 0 && (
          <div className="px-4 pt-4">
            <h3 className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-2">
              <MessageCircle className="w-3.5 h-3.5" /> CHATS
            </h3>
            {filteredChats.slice(0, 5).map((chat: any) => (
              <div
                key={chat.id}
                onClick={() => onOpenChat?.(chat.id)}
                className="flex items-center gap-3 py-2.5 cursor-pointer hover:bg-muted/50 rounded-xl px-2 -mx-2 transition-colors"
              >
                <Avatar className="h-10 w-10 rounded-xl">
                  {chat.avatar && <AvatarImage src={chat.avatar} className="object-cover" />}
                  <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-sm">{chat.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-[15px]">{chat.name}</h4>
                  <p className="text-xs text-muted-foreground truncate">{chat.lastMessage}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredContacts.length > 0 && (
          <div className="px-4 pt-4">
            <h3 className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-2">
              <User className="w-3.5 h-3.5" /> CONTACTEN
            </h3>
            {filteredContacts.slice(0, 5).map((item: any) => (
              <div
                key={item.id}
                onClick={() => onOpenContact?.(item.contact)}
                className="flex items-center gap-3 py-2.5 cursor-pointer hover:bg-muted/50 rounded-xl px-2 -mx-2 transition-colors"
              >
                <Avatar className="h-10 w-10 rounded-xl">
                  <AvatarImage src={item.contact.avatar} className="object-cover" />
                  <AvatarFallback className="rounded-xl">{item.contact.displayName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h4 className="font-medium text-[15px]">{item.contact.displayName}</h4>
                  <p className="text-xs text-muted-foreground">W€spr ID: {item.contact.auraId}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredServices.length > 0 && (
          <div className="px-4 pt-4 pb-8">
            <h3 className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-2">
              <ShoppingBag className="w-3.5 h-3.5" /> DIENSTEN
            </h3>
            {filteredServices.slice(0, 8).map((svc: any) => (
              <div
                key={svc.id}
                className="flex items-center gap-3 py-2.5 cursor-pointer hover:bg-muted/50 rounded-xl px-2 -mx-2 transition-colors"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${svc.colorBg} ${svc.colorText}`}>
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-[15px]">{svc.label}</h4>
                  <p className="text-xs text-muted-foreground">{svc.subcategory} · {svc.category}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}