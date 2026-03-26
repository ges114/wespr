import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Home } from "@/pages/Home";
import { LoginScreen } from "@/components/LoginScreen";
import IconEditorPage from "@/components/IconEditorPage";
import NotFound from "@/pages/not-found";
import WesprConnectPage from "@/pages/WesprConnect";
import { useState, useEffect } from "react";
import { getSessionToken, setSessionToken } from "./lib/api";

function Router() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [location] = useLocation();

  useEffect(() => {
    const token = getSessionToken();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    fetch("/api/me", { credentials: "include", headers })
      .then((r) => {
        if (r.ok) setLoggedIn(true);
        else if (r.status === 401) setSessionToken(null); // clear stale token
      })
      .catch(() => {})
      .finally(() => setCheckingSession(false));
  }, []);

  if (location === "/editor") {
    return <IconEditorPage />;
  }

  if (location.startsWith("/wespr-connect")) {
    return <WesprConnectPage />;
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <div className="h-full bg-black">
        <div className="w-full h-full relative">
          <LoginScreen onLogin={() => { queryClient.clear(); setLoggedIn(true); }} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col min-h-0">
        <Switch>
          <Route path="/" component={() => <Home onLogout={() => setLoggedIn(false)} />} />
          <Route path="/:rest*" component={() => <Home onLogout={() => setLoggedIn(false)} />} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
