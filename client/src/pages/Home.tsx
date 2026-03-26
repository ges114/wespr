import { useState, useRef, MouseEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { BottomNav } from "@/components/BottomNav";
import { SideNav } from "@/components/SideNav";
import { ChatList } from "@/components/ChatList";
import { ChatView } from "@/components/ChatView";
import { Contacts } from "@/components/Contacts";
import { Discover } from "@/components/Discover";
import { Profile } from "@/components/Profile";
import { CallScreen, VideoCallScreen } from "@/components/CallScreen";
import { SearchOverlay } from "@/components/SearchOverlay";
import { ContactProfile } from "@/components/ContactProfile";
import { PrivacyScreen, NotificationsScreen, SettingsScreen, HelpScreen, MarketDetailScreen } from "@/components/DetailScreens";
import { Search, Plus, MessageSquarePlus, UserPlus, ScanLine, Wallet, ArrowLeft, Send, Paperclip, X, MessageCircle, Phone, Mail, Globe, Star, RefreshCw, ChevronLeft, ChevronRight, Inbox, Edit3, Trash2, Archive, AlertCircle, Tag, ChevronDown as ChevronDownIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Scanner } from "@/components/Scanner";
import { AuraPay } from "@/components/AuraPay";
import { ActionScreens } from "@/components/ActionScreens";

export type Tab = "chats" | "contacts" | "discover" | "ges" | "moments";
export type Tool = "none" | "scanner" | "wallet" | "new_chat" | "add_friend";
type Overlay = null | "search" | "privacy" | "notifications" | "settings" | "help" | "market_stocks" | "market_crypto" | "market_bonds";

export function Home({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>("discover");
  const [activeTool, setActiveTool] = useState<Tool>("none");
  const [openChatId, setOpenChatId] = useState<string | null>(null);
  const [callInfo, setCallInfo] = useState<{ name: string; avatar?: string | null } | null>(null);
  const [videoCallInfo, setVideoCallInfo] = useState<{ name: string; avatar?: string | null } | null>(null);
  const [emailInfo, setEmailInfo] = useState<{ name: string; avatar?: string | null } | null>(null);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [contactProfile, setContactProfile] = useState<any | null>(null);
  const [discoverCategory, setDiscoverCategory] = useState<string | undefined>(undefined);
  const [connectSubTab, setConnectSubTab] = useState<"chat" | "call" | "mail" | "browser">("chat");
  const [contactsSubView, setContactsSubView] = useState<string | null>(null);
  const contactsResetRef = useRef<(() => void) | null>(null);

  const handleCall = (name: string, avatar?: string | null) => {
    setCallInfo({ name, avatar });
  };

  const handleVideoCall = (name: string, avatar?: string | null) => {
    setVideoCallInfo({ name, avatar });
  };

  const handleEmail = (name: string, avatar?: string | null) => {
    setEmailInfo({ name, avatar });
  };

  const handleOpenContact = (contact: any) => {
    setContactProfile(contact);
    setOverlay(null);
  };

  const handleTabChange = (tab: Tab) => {
    if (tab !== "discover") setDiscoverCategory(undefined);
    if (tab !== "chats") setOpenChatId(null);
    if (tab !== "contacts") setContactProfile(null);
    setActiveTab(tab);
  };

  const isSplitTab = activeTab === "chats" || (activeTab === "contacts" && connectSubTab !== "browser");

  const handleConnectTabChange = (tab: "chat" | "call" | "mail" | "browser") => {
    setConnectSubTab(tab);
    setOpenChatId(null);
    setContactProfile(null);
    contactsResetRef.current?.();
    contactsResetRef.current = null;
    setContactsSubView(null);
    setActiveTool("none");
  };

  const renderConnectContent = () => {
    if (addFriendInline) {
      return <ActionScreens type="add_friend" onBack={() => setActiveTool("none")} onOpenChat={(id: string) => { setActiveTool("none"); setOpenChatId(id); }} onCall={handleCall} inline />;
    }
    switch (connectSubTab) {
      case "chat": return <ChatList onOpenChat={(id) => setOpenChatId(id)} onAddFriend={() => setActiveTool("add_friend")} />;
      case "call": return <Contacts onCall={handleCall} onVideoCall={handleVideoCall} onEmail={(n, a) => { handleConnectTabChange("mail"); handleEmail(n, a); }} onOpenContact={handleOpenContact} onOpenChat={(id) => { setConnectSubTab("chat"); setOpenChatId(id); }} onSubViewChange={(v) => { setContactsSubView(v); if (!v) contactsResetRef.current = null; }} resetRef={contactsResetRef} />;
      case "mail": return <WMailView onCompose={handleEmail} onAddFriend={() => setActiveTool("add_friend")} />;
      case "browser": return <WBrowserView />;
    }
  };

  const renderListContent = () => {
    switch (activeTab) {
      case "chats": return <ChatList onOpenChat={(id) => setOpenChatId(id)} onAddFriend={() => setActiveTool("add_friend")} />;
      case "contacts": return (
        <div className="flex flex-col h-full">
          <ConnectTabBar active={connectSubTab} onSelect={handleConnectTabChange} />
          {renderConnectContent()}
        </div>
      );
      default: return null;
    }
  };

  const renderFullContent = () => {
    switch (activeTab) {
      case "moments": return <Discover key="moments" initialCategory="moments" onOpenWallet={() => setActiveTool("wallet")} onOpenChats={() => handleTabChange("contacts")} />;
      case "contacts":
        if (connectSubTab === "browser") {
          return (
            <div className="flex flex-col h-full">
              <ConnectTabBar active={connectSubTab} onSelect={handleConnectTabChange} />
              <WBrowserView />
            </div>
          );
        }
        return null;
      case "discover": return <Discover key={discoverCategory || "menu"} initialCategory={discoverCategory} onOpenWallet={() => setActiveTool("wallet")} onOpenChats={() => handleTabChange("contacts")} />;
      case "ges": return (
        <Profile
          onOpenWallet={() => setActiveTool("wallet")}
          onOpenPrivacy={() => setOverlay("privacy")}
          onOpenNotifications={() => setOverlay("notifications")}
          onOpenSettings={() => setOverlay("settings")}
          onOpenHelp={() => setOverlay("help")}
          onOpenScanner={() => setActiveTool("scanner")}
        />
      );
      default: return null;
    }
  };

  const renderMobileContent = () => {
    switch (activeTab) {
      case "chats": return <ChatList onOpenChat={(id) => setOpenChatId(id)} onAddFriend={() => setActiveTool("add_friend")} />;
      case "moments": return <Discover key="moments" initialCategory="moments" onOpenWallet={() => setActiveTool("wallet")} onOpenChats={() => handleTabChange("contacts")} />;
      case "contacts": return (
        <div className="flex flex-col h-full">
          <ConnectTabBar active={connectSubTab} onSelect={handleConnectTabChange} />
          {renderConnectContent()}
        </div>
      );
      case "discover": return <Discover key={discoverCategory || "menu"} initialCategory={discoverCategory} onOpenWallet={() => setActiveTool("wallet")} onOpenChats={() => handleTabChange("contacts")} />;
      case "ges": return (
        <Profile
          onOpenWallet={() => setActiveTool("wallet")}
          onOpenPrivacy={() => setOverlay("privacy")}
          onOpenNotifications={() => setOverlay("notifications")}
          onOpenSettings={() => setOverlay("settings")}
          onOpenHelp={() => setOverlay("help")}
          onOpenScanner={() => setActiveTool("scanner")}
        />
      );
      default: return <ChatList onOpenChat={(id) => setOpenChatId(id)} onAddFriend={() => setActiveTool("add_friend")} />;
    }
  };

  const renderHeader = (forPanel?: "list" | "full") => {
    if (activeTab === "ges") return null;

    const titles: Record<Tab, string> = {
      chats: "W€spr Chat",
      moments: "Moments",
      contacts: "W€spr Connect",
      discover: "Ontdekken",
      ges: "",
    };

    const subViewTitles: Record<string, string> = {
      new_friends: "Vriend Toevoegen",
      group_chats: "Groepsgesprekken",
      official: "Officiële Accounts",
    };

    const overrideTitle = addFriendInline ? "Vriend Toevoegen" : (activeTab === "contacts" && contactsSubView ? subViewTitles[contactsSubView] : null);

    return (
      <header className="px-4 lg:px-5 py-4 flex items-center justify-between bg-background/80 backdrop-blur-xl sticky top-0 z-50 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-2">
          {(activeTab === "chats" || activeTab === "contacts") && (
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-muted-foreground hover:text-foreground h-8 w-8 -ml-1"
              onClick={overrideTitle ? () => { if (addFriendInline) { setActiveTool("none"); } else { contactsResetRef.current?.(); setContactsSubView(null); } } : () => handleTabChange("discover")}
              data-testid="back-to-discover"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <h1 className={`text-xl lg:text-lg font-bold tracking-tight font-heading ${overrideTitle ? "text-foreground" : "text-primary"}`}>
            {overrideTitle ?? titles[activeTab]}
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-muted-foreground hover:text-foreground h-8 w-8"
            onClick={() => setOverlay("search")}
            data-testid="search-btn"
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </header>
    );
  };

  const addFriendInline = activeTab === "contacts" && activeTool === "add_friend";
  const hasDesktopOverlay = !!(emailInfo || callInfo || videoCallInfo || overlay || (activeTool !== "none" && !addFriendInline));

  const renderDesktopOverlayContent = () => {
    if (emailInfo) return <EmailComposeScreen name={emailInfo.name} avatar={emailInfo.avatar} onClose={() => setEmailInfo(null)} />;
    if (callInfo) return <CallScreen name={callInfo.name} avatar={callInfo.avatar} onEnd={() => setCallInfo(null)} />;
    if (videoCallInfo) return <VideoCallScreen name={videoCallInfo.name} avatar={videoCallInfo.avatar} onEnd={() => setVideoCallInfo(null)} />;
    if (overlay === "search") return <SearchOverlay onBack={() => setOverlay(null)} onOpenChat={(id) => { setOverlay(null); setOpenChatId(id); }} onOpenContact={handleOpenContact} />;
    if (overlay === "privacy") return <PrivacyScreen onBack={() => setOverlay(null)} />;
    if (overlay === "notifications") return <NotificationsScreen onBack={() => setOverlay(null)} />;
    if (overlay === "settings") return <SettingsScreen onBack={() => setOverlay(null)} onLogout={onLogout} />;
    if (overlay === "help") return <HelpScreen onBack={() => setOverlay(null)} />;
    if (overlay === "market_stocks") return <MarketDetailScreen onBack={() => setOverlay(null)} type="stocks" />;
    if (overlay === "market_crypto") return <MarketDetailScreen onBack={() => setOverlay(null)} type="crypto" />;
    if (overlay === "market_bonds") return <MarketDetailScreen onBack={() => setOverlay(null)} type="bonds" />;
    if (activeTool === "scanner") return <Scanner onBack={() => setActiveTool("none")} onOpenWallet={() => setActiveTool("wallet")} />;
    if (activeTool === "wallet") return <AuraPay onBack={() => setActiveTool("none")} onOpenMarket={(type: string) => { setActiveTool("none"); setOverlay(type as Overlay); }} />;
    if (activeTool === "new_chat" || (activeTool === "add_friend" && !addFriendInline)) {
      return <ActionScreens type={activeTool} onBack={() => setActiveTool("none")} onOpenChat={(id: string) => { setActiveTool("none"); setOpenChatId(id); }} onCall={handleCall} />;
    }
    return null;
  };

  const renderDesktopDetailPanel = () => {
    if (hasDesktopOverlay) {
      return (
        <div className="flex-1 flex flex-col min-h-0">
          {renderDesktopOverlayContent()}
        </div>
      );
    }

    if (openChatId) {
      return (
        <div className="flex-1 flex flex-col min-h-0">
          <ChatView chatId={openChatId} onBack={() => setOpenChatId(null)} onCall={handleCall} onVideoCall={handleVideoCall} onEmail={handleEmail} />
        </div>
      );
    }

    if (contactProfile) {
      return (
        <div className="flex-1 flex flex-col min-h-0">
          <ContactProfile contact={contactProfile} onBack={() => setContactProfile(null)} onCall={handleCall} onVideoCall={handleVideoCall} onEmail={handleEmail} />
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/50 gap-4" data-testid="empty-detail-panel">
        <div className="w-20 h-20 rounded-3xl bg-muted/30 flex items-center justify-center">
          <MessageCircle className="w-8 h-8" />
        </div>
        <div className="text-center">
          <p className="font-medium text-muted-foreground/70">
            {activeTab === "chats" ? "Selecteer een gesprek" : "Selecteer een contact"}
          </p>
          <p className="text-sm mt-1">
            {activeTab === "chats" ? "Kies een chat om te beginnen" : "Klik op een contact voor details"}
          </p>
        </div>
      </div>
    );
  };

  const renderMobileFullScreenContent = () => {
    if (activeTab === "contacts" && connectSubTab === "browser") {
      return (
        <div className="flex flex-col h-full">
          {renderHeader()}
          <ConnectTabBar active={connectSubTab} onSelect={handleConnectTabChange} />
          <WBrowserView />
        </div>
      );
    }
    if (emailInfo) return <EmailComposeScreen name={emailInfo.name} avatar={emailInfo.avatar} onClose={() => setEmailInfo(null)} />;
    if (callInfo) return <CallScreen name={callInfo.name} avatar={callInfo.avatar} onEnd={() => setCallInfo(null)} />;
    if (videoCallInfo) return <VideoCallScreen name={videoCallInfo.name} avatar={videoCallInfo.avatar} onEnd={() => setVideoCallInfo(null)} />;
    if (overlay === "search") return <SearchOverlay onBack={() => setOverlay(null)} onOpenChat={(id) => { setOverlay(null); setOpenChatId(id); }} onOpenContact={handleOpenContact} />;
    if (overlay === "privacy") return <PrivacyScreen onBack={() => setOverlay(null)} />;
    if (overlay === "notifications") return <NotificationsScreen onBack={() => setOverlay(null)} />;
    if (overlay === "settings") return <SettingsScreen onBack={() => setOverlay(null)} onLogout={onLogout} />;
    if (overlay === "help") return <HelpScreen onBack={() => setOverlay(null)} />;
    if (overlay === "market_stocks") return <MarketDetailScreen onBack={() => setOverlay(null)} type="stocks" />;
    if (overlay === "market_crypto") return <MarketDetailScreen onBack={() => setOverlay(null)} type="crypto" />;
    if (overlay === "market_bonds") return <MarketDetailScreen onBack={() => setOverlay(null)} type="bonds" />;
    if (contactProfile) return <ContactProfile contact={contactProfile} onBack={() => setContactProfile(null)} />;
    if (openChatId) return <ChatView chatId={openChatId} onBack={() => setOpenChatId(null)} onCall={handleCall} onVideoCall={handleVideoCall} onEmail={handleEmail} />;
    if (activeTool === "scanner") return <Scanner onBack={() => setActiveTool("none")} onOpenWallet={() => setActiveTool("wallet")} />;
    if (activeTool === "wallet") return <AuraPay onBack={() => setActiveTool("none")} onOpenMarket={(type: string) => { setActiveTool("none"); setOverlay(type as Overlay); }} />;
    if (activeTool === "new_chat" || (activeTool === "add_friend" && !addFriendInline)) {
      return <ActionScreens type={activeTool} onBack={() => setActiveTool("none")} onOpenChat={(id: string) => { setActiveTool("none"); setOpenChatId(id); }} onCall={handleCall} />;
    }
    return null;
  };

  const mobileFullScreen = renderMobileFullScreenContent();

  const fabButton = (
    <div className="absolute bottom-20 lg:bottom-6 right-4 lg:right-6 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" className="w-14 h-14 lg:w-12 lg:h-12 rounded-2xl shadow-xl shadow-primary/30 bg-primary hover:bg-primary/90 text-primary-foreground focus-visible:ring-0 focus-visible:ring-offset-0 hover:scale-105 transition-transform" data-testid="fab-button">
            <Plus className="w-7 h-7 lg:w-5 lg:h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="w-56 p-2 rounded-2xl shadow-xl border-border/50 mb-2">
          <DropdownMenuItem onClick={() => setActiveTool("new_chat")} className="gap-3 py-3 cursor-pointer rounded-xl font-medium focus:bg-muted focus:text-foreground" data-testid="menu-new-chat">
            <MessageSquarePlus className="w-5 h-5 text-primary" />
            <span>Nieuwe chat</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActiveTool("add_friend")} className="gap-3 py-3 cursor-pointer rounded-xl font-medium focus:bg-muted focus:text-foreground" data-testid="menu-add-friend">
            <UserPlus className="w-5 h-5 text-primary" />
            <span>Vriend toevoegen</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActiveTool("scanner")} className="gap-3 py-3 cursor-pointer rounded-xl font-medium focus:bg-muted focus:text-foreground" data-testid="menu-scanner">
            <ScanLine className="w-5 h-5 text-primary" />
            <span>Scanner</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActiveTool("wallet")} className="gap-3 py-3 cursor-pointer rounded-xl font-medium focus:bg-muted focus:text-foreground" data-testid="menu-wallet">
            <Wallet className="w-5 h-5 text-primary" />
            <span>W€spr Pay</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <div className="flex h-full bg-background relative">
      <SideNav activeTab={activeTab} onChange={handleTabChange} />

      {/* ===== MOBILE LAYOUT ===== */}
      <div className="flex flex-col flex-1 min-w-0 relative lg:hidden">
        {mobileFullScreen ? (
          <div className="flex-1 flex flex-col min-h-0">
            {mobileFullScreen}
          </div>
        ) : (
          <>
            {renderHeader()}
            <main className="flex-1 overflow-y-auto pb-safe hide-scrollbar">
              <div className="pb-24">
                {renderMobileContent()}
              </div>
            </main>
            {fabButton}
            <BottomNav activeTab={activeTab} onChange={handleTabChange} />
          </>
        )}
      </div>

      {/* ===== DESKTOP LAYOUT ===== */}
      <div className="hidden lg:flex flex-1 min-w-0 min-h-0">
        {isSplitTab ? (
          <>
            <div className={`${(hasDesktopOverlay || openChatId || contactProfile) ? "w-[340px] xl:w-[380px] shrink-0 border-r border-border/50" : "flex-1"} flex flex-col bg-background relative`}>
              {renderHeader("list")}
              <div className="flex-1 overflow-y-auto hide-scrollbar">
                {renderListContent()}
              </div>
              {fabButton}
            </div>
            {(hasDesktopOverlay || openChatId || contactProfile) && (
              <div className="flex-1 flex flex-col min-w-0 bg-muted/10">
                {renderDesktopDetailPanel()}
              </div>
            )}
          </>
        ) : hasDesktopOverlay ? (
          <div className="flex-1 flex flex-col min-h-0">
            {renderDesktopOverlayContent()}
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-w-0 relative">
            {renderHeader("full")}
            {activeTab === "contacts" && connectSubTab === "browser" ? (
              <div className="flex-1 flex flex-col min-h-0">
                {renderFullContent()}
              </div>
            ) : (
              <main className="flex-1 overflow-y-auto hide-scrollbar">
                <div className="pb-6">
                  {renderFullContent()}
                </div>
              </main>
            )}
            {fabButton}
          </div>
        )}
      </div>
    </div>
  );
}

function EmailComposeScreen({ name, avatar, onClose }: { name: string; avatar?: string | null; onClose: () => void }) {
  const [to] = useState(name);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);

  const emailAddress = `${name.toLowerCase().replace(/\s+/g, ".")}@w€spr.eu`;

  const handleSend = () => {
    if (!subject.trim() && !body.trim()) return;
    setSent(true);
    setTimeout(() => onClose(), 2000);
  };

  const handleAttach = () => {
    const fakeFiles = ["document.pdf", "foto.jpg", "verslag.xlsx", "notities.txt"];
    const random = fakeFiles[Math.floor(Math.random() * fakeFiles.length)];
    if (!attachments.includes(random)) {
      setAttachments([...attachments, random]);
    }
  };

  if (sent) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full bg-background gap-4">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }} className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
          <Send className="w-8 h-8 text-emerald-600" />
        </motion.div>
        <h2 className="text-xl font-bold">E-mail verzonden!</h2>
        <p className="text-sm text-muted-foreground">Naar {emailAddress}</p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} transition={{ type: "spring", damping: 25 }} className="flex flex-col h-full bg-background">
      <header className="px-4 py-3 flex items-center gap-3 bg-background border-b border-border/50 sticky top-0 z-50">
        <Button variant="ghost" size="icon" onClick={onClose} className="-ml-2" data-testid="close-email">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-lg font-bold flex-1">Nieuwe e-mail</h1>
        <Button
          size="sm"
          className="rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700"
          onClick={handleSend}
          disabled={!subject.trim() && !body.trim()}
          data-testid="send-email"
        >
          <Send className="w-4 h-4" /> Verstuur
        </Button>
      </header>

      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="px-4 py-3 border-b border-border/30 flex items-center gap-3">
          <span className="text-sm text-muted-foreground w-12">Aan:</span>
          <div className="flex items-center gap-2 flex-1 bg-muted/50 rounded-xl px-3 py-2">
            <Avatar className="h-6 w-6 rounded-lg">
              <AvatarImage src={avatar || undefined} />
              <AvatarFallback className="rounded-lg text-[10px]">{to.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{to}</span>
            <span className="text-xs text-muted-foreground ml-auto">{emailAddress}</span>
          </div>
        </div>

        <div className="px-4 py-3 border-b border-border/30 flex items-center gap-3">
          <span className="text-sm text-muted-foreground w-12">Onderw:</span>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Onderwerp..."
            className="flex-1 bg-transparent outline-none text-sm"
            data-testid="input-email-subject"
          />
        </div>

        {attachments.length > 0 && (
          <div className="px-4 py-2 border-b border-border/30 flex flex-wrap gap-2">
            {attachments.map((a, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-muted/50 rounded-lg px-2.5 py-1.5 text-xs">
                <Paperclip className="w-3 h-3 text-muted-foreground" />
                <span>{a}</span>
                <button onClick={() => setAttachments(attachments.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-foreground" data-testid={`remove-attachment-${i}`}>
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Schrijf je bericht..."
          className="flex-1 px-4 py-3 bg-transparent outline-none text-sm resize-none min-h-[200px]"
          data-testid="input-email-body"
        />
      </div>

      <div className="px-4 py-3 border-t border-border/30 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={handleAttach} className="rounded-full" data-testid="attach-file">
          <Paperclip className="w-5 h-5 text-muted-foreground" />
        </Button>
        <span className="text-xs text-muted-foreground">Bijlage toevoegen</span>
      </div>
    </motion.div>
  );
}

function ContactsQuickBar({ onOpenChat, onSwitchToBellen }: {
  onOpenChat: (chatId: string) => void;
  onSwitchToBellen: () => void;
}) {
  const { data: contacts = [] } = useQuery({
    queryKey: ["/api/contacts"],
    queryFn: () => apiRequest("/api/contacts"),
  });
  const { data: chats = [] } = useQuery({
    queryKey: ["/api/chats"],
    queryFn: () => apiRequest("/api/chats"),
  });

  if (!contacts.length) return null;

  const getChatId = (name: string) =>
    (chats as any[]).find((c: any) => c.name === name)?.id;

  return (
    <div className="shrink-0 border-b border-border/30 bg-background">
      <div className="flex items-center justify-between px-4 pt-2.5 pb-1">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Contacten</span>
        <button
          onClick={onSwitchToBellen}
          className="text-[10px] text-primary font-semibold"
          data-testid="contacts-see-all"
        >
          Alle contacten
        </button>
      </div>
      <div className="flex gap-4 px-4 pb-3 overflow-x-auto hide-scrollbar">
        {(contacts as any[]).map((item: any) => {
          const chatId = getChatId(item.contact.displayName);
          return (
            <button
              key={item.id}
              onClick={() => chatId ? onOpenChat(chatId) : onSwitchToBellen()}
              className="flex flex-col items-center gap-1.5 shrink-0"
              data-testid={`quick-contact-${item.id}`}
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 overflow-hidden flex items-center justify-center">
                  {item.contact.avatar ? (
                    <img src={item.contact.avatar} alt={item.contact.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-primary">{item.contact.displayName.charAt(0)}</span>
                  )}
                </div>
              </div>
              <span className="text-[10px] font-medium text-foreground max-w-[52px] truncate text-center leading-tight">
                {item.contact.displayName.split(" ")[0]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ConnectTabBar({ active, onSelect }: {
  active: "chat" | "call" | "mail" | "browser";
  onSelect: (tab: "chat" | "call" | "mail" | "browser") => void;
}) {
  const tabs = [
    { id: "chat" as const, icon: MessageCircle, label: "Chat" },
    { id: "call" as const, icon: Phone, label: "Bellen" },
    { id: "mail" as const, icon: Mail, label: "Mail" },
    { id: "browser" as const, icon: Globe, label: "Browser" },
  ];
  return (
    <div className="flex border-b border-border/50 bg-background shrink-0">
      {tabs.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onSelect(id)}
          data-testid={`connect-tab-${id}`}
          className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 text-[10px] font-semibold transition-colors border-b-2 ${
            active === id
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Icon className="w-5 h-5" strokeWidth={active === id ? 2.2 : 1.8} />
          <span className="leading-none">{label}</span>
        </button>
      ))}
    </div>
  );
}

const DEMO_EMAILS = [
  {
    id: "1", from: "Sophie van der Berg", email: "sophie@wespr.eu",
    subject: "Vakantieplannen 🌞",
    preview: "Hoi! Hebben jullie al nagedacht over de zomervakantie?",
    body: `Hoi Ges,

Hebben jullie al nagedacht over de zomervakantie? Ik dacht misschien om eind juli naar Zuid-Frankrijk te gaan. De kinderen zouden dat geweldig vinden, en het is ook niet te ver rijden.

Laat me weten of jullie interesse hebben, dan kunnen we alvast iets plannen voordat alle goede plekken volgeboekt zijn!

Groetjes,
Sophie`,
    date: "10:23", read: false, starred: true, folder: "Inbox", color: "#8b5cf6",
  },
  {
    id: "2", from: "Max Janssen", email: "max@wespr.eu",
    subject: "Vergadering morgen om 10:00",
    preview: "Vergeet niet dat we morgen om 10:00 bijeenkomen.",
    body: `Hallo,

Vergeet niet dat we morgen om 10:00 bijeenkomen in de vergaderzaal op de 3e verdieping. De agenda is:

1. Status update Q2
2. Nieuwe projectplanning
3. Budget bespreking
4. Rondvraag

Zorg dat je de cijfers van afgelopen kwartaal bij je hebt.

Met vriendelijke groet,
Max`,
    date: "Gist.", read: false, starred: false, folder: "Inbox", color: "#3b82f6",
  },
  {
    id: "3", from: "W€spr Team", email: "team@wespr.eu",
    subject: "Welkom bij W€spr Mail! 🎉",
    preview: "Bedankt voor het gebruik van W€spr. Je mailbox is klaar.",
    body: `Welkom bij W€spr Mail!

Bedankt voor het gebruik van W€spr. Je mailbox is klaar voor gebruik en volledig versleuteld met onze end-to-end encryptie technologie.

Wat je kunt doen:
• E-mails versturen naar contacten
• Bijlagen toevoegen
• Mappen beheren
• Zoeken in je mailbox

Heb je vragen? Bezoek onze helpdesk of stuur ons een bericht.

Het W€spr Team`,
    date: "Ma.", read: true, starred: false, folder: "Inbox", color: "#10b981",
  },
  {
    id: "4", from: "Lukas Müller", email: "lukas@wespr.eu",
    subject: "Re: Project update",
    preview: "Goed nieuws! Het project loopt op schema.",
    body: `Hi,

Goed nieuws! Het project loopt op schema en we verwachten volgende week de eerste fase af te ronden.

De testresultaten zien er veelbelovend uit. Ik stuur je aan het einde van de dag een gedetailleerd rapport.

Groet,
Lukas`,
    date: "Za.", read: true, starred: false, folder: "Inbox", color: "#f59e0b",
  },
];

type Email = typeof DEMO_EMAILS[0];

function WMailView({ onCompose, onAddFriend }: { onCompose: (name: string, avatar?: string | null) => void; onAddFriend?: () => void }) {
  const [activeFolder, setActiveFolder] = useState("Inbox");
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [emails, setEmails] = useState(DEMO_EMAILS);
  const [composing, setComposing] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [senderExpanded, setSenderExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const folders = [
    { icon: Inbox, label: "Inbox", count: emails.filter(e => !e.read && e.folder === "Inbox").length },
    { icon: Star, label: "Ster", count: 0 },
    { icon: Send, label: "Verzonden", count: 0 },
    { icon: Edit3, label: "Concepten", count: 0 },
    { icon: AlertCircle, label: "Spam", count: 0 },
    { icon: Trash2, label: "Prullenbak", count: 0 },
  ];

  const folderEmails = emails.filter(e => {
    const inFolder = activeFolder === "Ster" ? e.starred : e.folder === activeFolder;
    const matchesSearch = !searchQuery || e.from.toLowerCase().includes(searchQuery.toLowerCase()) || e.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return inFolder && matchesSearch;
  });

  const toggleStar = (id: string, ev: MouseEvent) => {
    ev.stopPropagation();
    setEmails(prev => prev.map(e => e.id === id ? { ...e, starred: !e.starred } : e));
    if (selectedEmail?.id === id) setSelectedEmail(prev => prev ? { ...prev, starred: !prev.starred } : null);
  };

  const deleteEmail = (id: string) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, folder: "Prullenbak" } : e));
    setSelectedEmail(null);
  };

  const archiveEmail = (id: string) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, folder: "Verzonden" } : e));
    setSelectedEmail(null);
  };

  const openEmail = (em: Email) => {
    setSelectedEmail(em);
    setEmails(prev => prev.map(e => e.id === em.id ? { ...e, read: true } : e));
    setComposing(false);
    setSenderExpanded(false);
  };

  const startReply = () => {
    if (!selectedEmail) return;
    setComposeTo(selectedEmail.email);
    setComposeSubject(`Re: ${selectedEmail.subject}`);
    setComposeBody(`\n\n--- Oorspronkelijk bericht van ${selectedEmail.from} ---\n${selectedEmail.body}`);
    setComposing(true);
    setSelectedEmail(null);
  };

  const startForward = () => {
    if (!selectedEmail) return;
    setComposeTo("");
    setComposeSubject(`Fwd: ${selectedEmail.subject}`);
    setComposeBody(`\n\n--- Doorgestuurd bericht van ${selectedEmail.from} ---\n${selectedEmail.body}`);
    setComposing(true);
    setSelectedEmail(null);
  };

  const sendMail = () => {
    setComposing(false);
    setComposeTo(""); setComposeSubject(""); setComposeBody("");
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar */}
      <div className="w-[130px] shrink-0 border-r border-border/40 flex flex-col py-2 bg-muted/20">
        <button
          onClick={() => { setComposing(true); setComposeTo(""); setComposeSubject(""); setComposeBody(""); setSelectedEmail(null); }}
          className="mx-2 mb-1.5 flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-2 rounded-xl text-[11px] font-bold transition-colors shadow justify-center"
          data-testid="mail-compose-btn"
        >
          <Edit3 className="w-3.5 h-3.5" /> Opstellen
        </button>
        {folders.map(({ icon: Icon, label, count }) => (
          <button
            key={label}
            onClick={() => { setActiveFolder(label); setSelectedEmail(null); setComposing(false); }}
            className={`flex items-center gap-2 px-3 py-2 text-[11px] font-semibold rounded-lg mx-1 transition-colors ${activeFolder === label ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" : "hover:bg-muted/60 text-muted-foreground"}`}
            data-testid={`mail-folder-${label}`}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            <span className="flex-1 text-left truncate">{label}</span>
            {count > 0 && <span className="text-[10px] font-bold text-blue-600">{count}</span>}
          </button>
        ))}
      </div>

      {/* Email list */}
      <div className={`flex flex-col border-r border-border/40 overflow-hidden transition-all ${selectedEmail || composing ? "w-[42%] shrink-0" : "flex-1"}`}>
        <div className="px-2 py-2 border-b border-border/30 shrink-0">
          <div className="flex items-center gap-1.5 bg-muted/60 rounded-lg px-2 py-1.5">
            <Search className="w-3 h-3 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Zoeken..."
              className="flex-1 bg-transparent text-[11px] outline-none"
              data-testid="mail-search"
            />
          </div>
        </div>
        {onAddFriend && (
          <div
            onClick={onAddFriend}
            className="flex items-center gap-3 px-3 py-2.5 cursor-pointer group border-b border-border/30 hover:bg-muted/30 transition-colors shrink-0"
            data-testid="mail-add-friend-btn"
          >
            <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
              <UserPlus className="w-4 h-4" />
            </div>
            <div className="flex-1 flex items-center justify-between">
              <span className="font-medium text-sm">Nieuwe Mail vrienden</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        )}
        <div className="flex-1 overflow-auto">
          {folderEmails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-center py-8">
              <Inbox className="w-8 h-8 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">{activeFolder} is leeg</p>
            </div>
          ) : (
            folderEmails.map(em => (
              <button
                key={em.id}
                onClick={() => openEmail(em)}
                data-testid={`mail-item-${em.id}`}
                className={`w-full flex items-start gap-2 px-3 py-2.5 border-b border-border/20 hover:bg-muted/40 transition-colors text-left ${selectedEmail?.id === em.id ? "bg-blue-50 dark:bg-blue-950/30" : !em.read ? "bg-blue-50/40 dark:bg-blue-950/10" : ""}`}
              >
                <div className="relative shrink-0 mt-0.5">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-[11px]" style={{ background: em.color }}>
                    {em.from.charAt(0)}
                  </div>
                  {!em.read && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-background" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-[12px] truncate ${!em.read ? "font-bold text-foreground" : "font-medium"}`}>{em.from.split(" ")[0]}</span>
                    <span className={`text-[10px] shrink-0 ${!em.read ? "font-bold text-blue-500" : "text-muted-foreground"}`}>{em.date}</span>
                  </div>
                  <p className={`text-[11px] truncate ${!em.read ? "font-bold text-foreground" : "text-muted-foreground"}`}>{em.subject}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{em.preview}</p>
                </div>
                <button onClick={(e) => toggleStar(em.id, e as unknown as MouseEvent)} className="p-0.5 shrink-0 mt-1">
                  <Star className={`w-3 h-3 ${em.starred ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
                </button>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Read / Compose panel */}
      {composing && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 shrink-0">
            <span className="font-semibold text-sm flex-1">Nieuw bericht</span>
            <button onClick={() => setComposing(false)} className="p-1 rounded hover:bg-muted/60"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex flex-col gap-0 border-b border-border/30">
            <div className="flex items-center px-4 py-2 border-b border-border/20">
              <span className="text-xs text-muted-foreground w-14">Aan</span>
              <input value={composeTo} onChange={e => setComposeTo(e.target.value)} placeholder="Ontvanger..." className="flex-1 text-sm bg-transparent outline-none" data-testid="mail-to" />
            </div>
            <div className="flex items-center px-4 py-2">
              <span className="text-xs text-muted-foreground w-14">Onderwerp</span>
              <input value={composeSubject} onChange={e => setComposeSubject(e.target.value)} placeholder="Onderwerp..." className="flex-1 text-sm bg-transparent outline-none" data-testid="mail-subject" />
            </div>
          </div>
          <textarea
            value={composeBody}
            onChange={e => setComposeBody(e.target.value)}
            placeholder="Schrijf je bericht..."
            className="flex-1 px-4 py-3 text-sm bg-transparent outline-none resize-none"
            data-testid="mail-body"
          />
          <div className="px-4 py-3 border-t border-border/30 flex items-center gap-2">
            <button onClick={sendMail} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors" data-testid="mail-send-btn">
              <Send className="w-3.5 h-3.5" /> Verzenden
            </button>
            <button onClick={() => setComposing(false)} className="px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-muted/60 transition-colors">
              Annuleren
            </button>
          </div>
        </motion.div>
      )}

      {selectedEmail && !composing && (
        <motion.div key={selectedEmail.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center gap-1 px-3 py-2.5 border-b border-border/40 shrink-0">
            <button onClick={() => setSelectedEmail(null)} className="p-1.5 rounded-full hover:bg-muted/60 transition-colors" data-testid="mail-back">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-sm flex-1 truncate">{selectedEmail.subject}</span>
            <button onClick={(e) => toggleStar(selectedEmail.id, e as unknown as MouseEvent)} className="p-1.5 rounded-full hover:bg-muted/60">
              <Star className={`w-4 h-4 ${selectedEmail.starred ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
            </button>
            <button onClick={() => archiveEmail(selectedEmail.id)} className="p-1.5 rounded-full hover:bg-muted/60 transition-colors" title="Archiveren" data-testid="mail-archive-btn">
              <Archive className="w-4 h-4 text-muted-foreground" />
            </button>
            <button onClick={() => deleteEmail(selectedEmail.id)} className="p-1.5 rounded-full hover:bg-muted/60 transition-colors" title="Verwijderen" data-testid="mail-delete-btn">
              <Trash2 className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <div className="flex-1 overflow-auto px-4 py-4">
            <button
              onClick={() => setSenderExpanded(v => !v)}
              className="flex items-start gap-3 mb-1 w-full text-left rounded-xl hover:bg-muted/40 transition-colors p-2 -mx-2"
              data-testid="mail-sender-row"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ background: selectedEmail.color }}>
                {selectedEmail.from.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-primary underline-offset-2 hover:underline">{selectedEmail.from}</p>
                <p className="text-xs text-muted-foreground">{selectedEmail.email}</p>
                <p className="text-xs text-muted-foreground">Aan: ges@w€spr.eu · {selectedEmail.date}</p>
              </div>
              <ChevronDownIcon className={`w-4 h-4 text-muted-foreground mt-1 shrink-0 transition-transform ${senderExpanded ? "rotate-180" : ""}`} />
            </button>

            {senderExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 mb-4 px-2 pb-3 border-b border-border/30"
              >
                <button
                  onClick={startReply}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-xs font-semibold"
                  data-testid="mail-reply-btn-sender"
                >
                  <ArrowLeft className="w-3 h-3 rotate-[-45deg]" /> Beantwoorden
                </button>
                <button
                  onClick={startForward}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/80 transition-colors text-xs font-semibold"
                  data-testid="mail-forward-btn-sender"
                >
                  <Send className="w-3 h-3" /> Doorsturen
                </button>
              </motion.div>
            )}

            <p className="text-xl font-bold mb-4 mt-3">{selectedEmail.subject}</p>
            <div className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">{selectedEmail.body}</div>
          </div>
          <div className="px-4 py-3 border-t border-border/30 flex items-center gap-2">
            <button onClick={startReply} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-muted/60 hover:bg-muted transition-colors text-sm font-medium" data-testid="mail-reply-btn">
              <ArrowLeft className="w-3.5 h-3.5 rotate-[-45deg]" /> Beantwoorden
            </button>
            <button onClick={startForward} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-muted/60 hover:bg-muted transition-colors text-sm font-medium" data-testid="mail-forward-btn">
              <Send className="w-3.5 h-3.5" /> Doorsturen
            </button>
          </div>
        </motion.div>
      )}

      {!selectedEmail && !composing && (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/40 gap-3">
          <Mail className="w-12 h-12" />
          <p className="text-sm">Selecteer een e-mail</p>
        </div>
      )}
    </div>
  );
}

function WBrowserView() {
  const [loadedUrl, setLoadedUrl] = useState("");
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = (target: string) => {
    let u = target.trim();
    if (!u) return;
    if (!u.startsWith("http://") && !u.startsWith("https://")) u = "https://" + u;
    setLoadedUrl("/api/proxy?url=" + encodeURIComponent(u));
    setInputVal(u);
    setLoading(true);
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-background">
      <div className="flex items-center gap-1.5 px-2 py-2 border-b border-border/50 bg-muted/30 shrink-0">
        {loadedUrl && (
          <button onClick={() => { setLoadedUrl(""); setInputVal(""); }} className="p-1.5 rounded-full hover:bg-muted/80 transition-colors text-muted-foreground" data-testid="browser-back">
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        {loadedUrl && (
          <button onClick={() => { setLoading(true); setLoadedUrl(u => { const v = u; setTimeout(() => setLoadedUrl(v), 0); return ""; }); }} className="p-1.5 rounded-full hover:bg-muted/80 transition-colors text-muted-foreground" data-testid="browser-refresh">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
        <div className="flex-1 flex items-center gap-2 bg-background border border-border/60 rounded-xl px-3 py-1.5">
          {loading && loadedUrl ? (
            <RefreshCw className="w-3.5 h-3.5 text-muted-foreground shrink-0 animate-spin" />
          ) : (
            <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          )}
          <input
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") navigate(inputVal); }}
            onFocus={(e) => e.target.select()}
            placeholder="Typ een webadres en druk op Enter"
            className="flex-1 bg-transparent text-xs outline-none"
            data-testid="browser-url-input"
          />
          {inputVal && (
            <button onClick={() => navigate(inputVal)} className="text-muted-foreground hover:text-foreground">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {!loadedUrl ? (
        <div className="flex flex-col flex-1 items-center justify-center gap-3 text-center text-muted-foreground/50">
          <Globe className="w-10 h-10" />
          <p className="text-sm">Typ een adres om te beginnen</p>
        </div>
      ) : (
        <div className="flex-1 relative">
          {loading && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/20 z-10">
              <motion.div className="h-full bg-primary" initial={{ width: "0%" }} animate={{ width: "90%" }} transition={{ duration: 1.5 }} />
            </div>
          )}
          <iframe
            key={loadedUrl}
            src={loadedUrl}
            title="W€spr Browser"
            className="w-full h-full border-0"
            onLoad={() => setLoading(false)}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          />
        </div>
      )}
    </div>
  );
}

