import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Send, Plus, Phone, AtSign, Video } from "lucide-react";
import { Button } from "./ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { motion } from "framer-motion";

export function ChatView({ chatId, onBack, onCall, onVideoCall, onEmail }: { chatId: string, onBack: () => void, onCall?: (name: string, avatar?: string | null) => void, onVideoCall?: (name: string, avatar?: string | null) => void, onEmail?: (name: string, avatar?: string | null) => void }) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: me } = useQuery({
    queryKey: ["/api/me"],
    queryFn: () => apiRequest("/api/me"),
  });

  const { data: chats } = useQuery({
    queryKey: ["/api/chats"],
    queryFn: () => apiRequest("/api/chats"),
  });

  const { data: messages, isLoading } = useQuery({
    queryKey: ["/api/chats", chatId, "messages"],
    queryFn: () => apiRequest(`/api/chats/${chatId}/messages`),
    refetchInterval: 3000,
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) =>
      apiRequest(`/api/chats/${chatId}/messages`, { method: "POST", body: JSON.stringify({ content }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chats", chatId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
      setMessage("");
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const chat = chats?.find((c: any) => c.id === chatId);

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      className="flex flex-col h-full bg-muted/20"
    >
      {/* Header */}
      <header className="px-4 py-3 flex items-center gap-3 bg-background/80 backdrop-blur-xl sticky top-0 z-50 border-b border-border/50">
        <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <Avatar className="h-9 w-9 rounded-xl">
          {chat?.avatar && <AvatarImage src={chat.avatar} className="object-cover" />}
          <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-sm">{chat?.name?.charAt(0) || "?"}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-[15px] truncate">{chat?.name || "Chat"}</h2>
        </div>
        <div className="flex items-center gap-0.5">
          {!chat?.isOfficial && (
            <button
              onClick={(e) => { e.stopPropagation(); onEmail?.(chat?.name || "Contact", chat?.avatar); }}
              className="p-2 rounded-full text-primary hover:bg-primary/10 transition-colors"
              data-testid="email-btn"
            >
              <AtSign className="w-4 h-4" />
            </button>
          )}
          {!chat?.isOfficial && (
            <button
              onClick={() => onVideoCall?.(chat?.name || "Contact", chat?.avatar)}
              className="p-2 rounded-full text-primary hover:bg-primary/10 transition-colors"
              data-testid="video-btn"
            >
              <Video className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onCall?.(chat?.name || "Contact", chat?.avatar)}
            className="p-2 rounded-full text-primary hover:bg-primary/10 transition-colors"
            data-testid="call-btn"
          >
            <Phone className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 hide-scrollbar">
        <div className="flex flex-col gap-3">
          {(messages || []).map((msg: any) => {
            const isMe = msg.senderId === me?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-2 max-w-[80%] lg:max-w-[60%] ${isMe ? 'flex-row-reverse' : ''}`}>
                  {!isMe && (
                    <Avatar className="h-8 w-8 rounded-lg shrink-0 mt-1">
                      {msg.sender?.avatar && <AvatarImage src={msg.sender.avatar} className="object-cover" />}
                      <AvatarFallback className="rounded-lg text-[10px]">{msg.sender?.displayName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`px-3.5 py-2.5 rounded-2xl text-[15px] leading-relaxed ${
                    isMe 
                      ? 'bg-primary text-primary-foreground rounded-tr-md' 
                      : 'bg-card shadow-sm border border-border/30 rounded-tl-md'
                  }`}>
                    {msg.content}
                    <div className={`text-[10px] mt-1 ${isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                      {new Date(msg.sentAt).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="p-3 bg-background border-t border-border/50">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-full shrink-0 text-muted-foreground">
            <Plus className="w-5 h-5" />
          </Button>
          <div className="flex-1 flex items-center bg-muted/50 rounded-2xl px-4 py-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && message.trim()) {
                  sendMutation.mutate(message);
                }
              }}
              placeholder="Typ een bericht..."
              className="flex-1 bg-transparent border-none outline-none text-[15px] placeholder:text-muted-foreground/70"
              data-testid="chat-input"
            />
          </div>
          <Button
            size="icon"
            disabled={!message.trim() || sendMutation.isPending}
            onClick={() => message.trim() && sendMutation.mutate(message)}
            className="rounded-full shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
            data-testid="send-message"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}