import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, formatTime } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle, Search, X, UserPlus, ChevronRight } from "lucide-react";

export function ChatList({ onOpenChat, onAddFriend }: { onOpenChat?: (chatId: string) => void; onAddFriend?: () => void }) {
  const [query, setQuery] = useState("");

  const { data: chats, isLoading } = useQuery({
    queryKey: ["/api/chats"],
    queryFn: () => apiRequest("/api/chats"),
  });

  const filtered = (chats || []).filter((c: any) =>
    !query || c.name?.toLowerCase().includes(query.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-1 p-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center gap-4 py-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 shrink-0">
        <div className="flex items-center gap-2 bg-muted/60 rounded-xl px-3 py-2">
          <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Zoek gesprekken..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            data-testid="chat-search"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {onAddFriend && (
        <div
          onClick={onAddFriend}
          className="flex items-center gap-4 px-4 py-3 cursor-pointer group border-b border-border/30 hover:bg-muted/30 transition-colors shrink-0"
          data-testid="chat-add-friend-btn"
        >
          <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
            <UserPlus className="w-5 h-5" />
          </div>
          <div className="flex-1 flex items-center justify-between">
            <span className="font-medium text-sm">Nieuwe Chat vrienden</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      )}

      {!chats || chats.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/50 gap-3">
          <div className="w-16 h-16 rounded-3xl bg-muted/30 flex items-center justify-center">
            <MessageCircle className="w-8 h-8" />
          </div>
          <p className="text-sm font-medium">Nog geen gesprekken</p>
          <p className="text-xs">Start een nieuw gesprek via het + menu</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/50 gap-2">
          <Search className="w-8 h-8" />
          <p className="text-sm">Geen resultaten voor "{query}"</p>
        </div>
      ) : (
        <div className="flex flex-col overflow-auto">
          {filtered.map((chat: any, i: number) => (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => onOpenChat?.(chat.id)}
              className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-muted/50 active:bg-muted transition-colors relative"
              data-testid={`chat-item-${chat.id}`}
            >
              <div className="relative">
                <Avatar className="h-12 w-12 rounded-full">
                  <AvatarImage src={chat.avatar} alt={chat.name} className="object-cover" />
                  <AvatarFallback className="rounded-full bg-primary/10 text-primary font-medium">
                    {chat.name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                {chat.unread > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm border-2 border-background">
                    {chat.unread}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0 border-b border-border/40 pb-3 -mb-3 pt-1">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-semibold text-foreground truncate pr-2 flex items-center gap-1">
                    {chat.name}
                    {chat.isOfficial && (
                      <span className="bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ml-1">
                        Official
                      </span>
                    )}
                  </h3>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatTime(chat.lastMessageTime)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground truncate pr-4">
                  {chat.lastMessage || "Geen berichten nog"}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
