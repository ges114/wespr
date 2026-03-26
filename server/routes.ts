import type { Express, Request } from "express";
import { type Server } from "http";

import { storage, db } from "./storage";
import { insertPayCategorySchema, users, transactions } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import pg from "pg";

const _sessionPool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function getCurrentUser(req: Request) {
  if (req.session?.userId) {
    return storage.getUser(req.session.userId);
  }
  // Fallback: token-based auth via Authorization header (for browsers blocking iframe cookies)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const sessionId = authHeader.substring(7).trim();
    if (sessionId) {
      try {
        const result = await _sessionPool.query(
          "SELECT sess FROM session WHERE sid = $1 AND expire > NOW()",
          [sessionId]
        );
        if (result.rows.length > 0) {
          const data =
            typeof result.rows[0].sess === "string"
              ? JSON.parse(result.rows[0].sess)
              : result.rows[0].sess;
          if (data?.userId) return storage.getUser(data.userId);
        }
      } catch {}
    }
  }
  return undefined;
}

interface PaymentRequest {
  session: string;
  merchantName: string;
  merchantLocation: string;
  merchantKvk: string;
  amount: number;
  currency: string;
  items: { name: string; quantity: number; price: number }[];
  status: "pending" | "approved" | "rejected" | "expired";
  createdAt: Date;
}

const pendingPaymentRequests = new Map<string, PaymentRequest>();

function cleanExpiredRequests() {
  const now = Date.now();
  for (const [key, req] of pendingPaymentRequests.entries()) {
    if (now - req.createdAt.getTime() > 5 * 60 * 1000) {
      pendingPaymentRequests.delete(key);
    }
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ===== BROWSER PROXY =====
  app.get("/api/proxy", async (req, res) => {
    const target = req.query.url as string;
    if (!target) return res.status(400).send("Missing url parameter");

    let url: URL;
    try {
      url = new URL(target);
    } catch {
      return res.status(400).send("Invalid URL");
    }

    if (!["http:", "https:"].includes(url.protocol)) {
      return res.status(400).send("Only http/https allowed");
    }

    try {
      const response = await fetch(url.toString(), {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "nl-NL,nl;q=0.9,en;q=0.8",
        },
        redirect: "follow",
      });

      const contentType = response.headers.get("content-type") || "text/html";
      const finalUrl = response.url || url.toString();

      res.set("Content-Type", contentType);
      res.removeHeader("X-Frame-Options");
      res.removeHeader("Content-Security-Policy");
      res.set("Access-Control-Allow-Origin", "*");

      if (contentType.includes("text/html")) {
        let html = await response.text();
        const baseTag = `<base href="${finalUrl}">`;
        if (html.includes("<head>")) {
          html = html.replace("<head>", `<head>${baseTag}`);
        } else if (html.includes("<head ")) {
          html = html.replace(/<head[^>]*>/, (m) => `${m}${baseTag}`);
        } else {
          html = baseTag + html;
        }
        res.send(html);
      } else {
        const body = await response.arrayBuffer();
        res.send(Buffer.from(body));
      }
    } catch (err: any) {
      res.status(502).send(`Kan de pagina niet laden: ${err.message}`);
    }
  });

  // ===== AUTH =====
  app.post("/api/auth/register", async (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !password || !name) return res.status(400).json({ message: "Vul alle velden in" });
    const emailLower = email.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) return res.status(400).json({ message: "Ongeldig e-mailadres" });
    if (password.length < 6) return res.status(400).json({ message: "Wachtwoord moet minimaal 6 tekens zijn" });
    const existing = await storage.getUserByEmail(emailLower);
    if (existing) return res.status(409).json({ message: "Dit e-mailadres is al geregistreerd" });
    const hashedPassword = await bcrypt.hash(password, 10);
    const base = emailLower.split("@")[0].replace(/[^a-z0-9]/g, "");
    let username = base + Math.floor(Math.random() * 10000);
    for (let i = 0; i < 5; i++) {
      const dup = await storage.getUserByUsername(username);
      if (!dup) break;
      username = base + Math.floor(Math.random() * 100000);
    }
    const auraId = "WSPR-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    const user = await storage.createUser({
      username,
      email: emailLower,
      password: hashedPassword,
      displayName: name,
      auraId,
    });
    req.session.userId = user.id;
    await new Promise<void>((resolve, reject) => req.session.save(err => err ? reject(err) : resolve()));
    res.json({ id: user.id, email: user.email, displayName: user.displayName, auraId: user.auraId, sessionToken: req.sessionID });
  });

  const handleLogin = async (req: any, res: any) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Vul alle velden in" });
    const emailLower = email.toLowerCase().trim();
    console.log(`Login attempt: email="${emailLower}"`);
    let user = await storage.getUserByEmail(emailLower);
    if (!user) user = await storage.getUserByUsername(emailLower);
    if (!user) {
      console.log(`Login failed: user not found for "${emailLower}"`);
      return res.status(401).json({ message: "Ongeldig e-mailadres of wachtwoord" });
    }
    console.log(`Login: user found id=${user.id}, email=${user.email}`);
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Ongeldig e-mailadres of wachtwoord" });
    req.session.userId = user.id;
    await new Promise<void>((resolve, reject) => req.session.save(err => err ? reject(err) : resolve()));
    console.log(`Login: session saved, userId=${user.id}`);
    res.json({ id: user.id, email: user.email, displayName: user.displayName, auraId: user.auraId, sessionToken: req.sessionID });
  };
  // Both routes do the same — /api/login kept for backward compat with cached browser JS
  app.post("/api/login", handleLogin);
  app.post("/api/auth/login", handleLogin);

  app.post("/api/auth/biometric-login", async (req: any, res: any) => {
    const demoEmail = process.env.BIOMETRIC_DEMO_EMAIL;
    const demoPassword = process.env.BIOMETRIC_DEMO_PASSWORD || "password";
    if (!demoEmail) return res.status(503).json({ message: "Biometric login not configured" });
    req.body = { email: demoEmail, password: demoPassword };
    return handleLogin(req, res);
  });

  app.post("/api/auth/logout", async (req, res) => {
    req.session.destroy(() => {});
    res.json({ success: true });
  });

  // ===== CURRENT USER =====
  app.get("/api/me", async (req, res) => {
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json({ message: "Niet ingelogd" });
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  });

  app.patch("/api/me", async (req, res) => {
    const user = await getCurrentUser(req);
    if (!user) return res.status(404).json({ message: "No user" });
    const updated = await storage.updateUser(user.id, req.body);
    res.json(updated);
  });

  // ===== PREFERENCES =====
  app.get("/api/preferences", async (req, res) => {
    const user = await getCurrentUser(req);
    if (!user) return res.json({});
    const prefs = await storage.getPreferences(user.id);
    res.json(prefs);
  });

  app.put("/api/preferences", async (req, res) => {
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json({ message: "Niet ingelogd" });
    await storage.updatePreferences(user.id, req.body);
    res.json({ success: true });
  });

  // ===== EUDI VERIFIED =====
  app.post("/api/eudi/verify", async (req, res) => {
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json({ message: "Niet ingelogd" });
    await db.update(users).set({
      eudiVerified: true,
      eudiVerifiedAt: new Date(),
    }).where(eq(users.id, user.id));
    res.json({ success: true, eudiVerified: true, eudiVerifiedAt: new Date() });
  });

  // ===== USERS =====
  app.get("/api/users", async (_req, res) => {
    const allUsers = await storage.getAllUsers();
    res.json(allUsers);
  });

  // ===== USER SEARCH =====
  app.get("/api/users/search", async (req, res) => {
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json([]);
    const q = (req.query.q as string || "").toLowerCase().trim();
    if (!q || q.length < 2) return res.json([]);
    const allUsers = await storage.getAllUsers();
    const myContacts = await storage.getContacts(user.id);
    const contactIds = new Set(myContacts.map((c: any) => c.contactId));
    const results = allUsers
      .filter(u =>
        u.id !== user.id &&
        (u.displayName.toLowerCase().includes(q) || u.auraId.toLowerCase().includes(q))
      )
      .map(u => ({
        id: u.id,
        displayName: u.displayName,
        auraId: u.auraId,
        avatar: u.avatar,
        bio: u.bio,
        isContact: contactIds.has(u.id),
      }));
    res.json(results);
  });

  // ===== USER SEARCH =====
  app.get("/api/users/search", async (req, res) => {
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json({ message: "Not authenticated" });
    const q = (req.query.q as string || "").trim().toLowerCase();
    if (q.length < 2) return res.json([]);
    const allUsers = await storage.getAllUsers();
    const results = allUsers
      .filter(u => u.id !== user.id)
      .filter(u =>
        u.displayName.toLowerCase().includes(q) ||
        u.auraId.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q)
      )
      .map(u => ({ id: u.id, displayName: u.displayName, avatar: u.avatar, auraId: u.auraId }));
    res.json(results);
  });

  // ===== CONTACTS =====
  app.get("/api/contacts", async (req, res) => {
    res.set("Cache-Control", "no-store");
    const user = await getCurrentUser(req);
    if (!user) return res.json([]);
    const contactList = await storage.getContacts(user.id);
    res.json(contactList);
  });

  app.post("/api/contacts", async (req, res) => {
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json({ message: "Not authenticated" });
    const { contactId } = req.body;
    if (!contactId) return res.status(400).json({ message: "contactId required" });
    if (contactId === user.id) return res.status(400).json({ message: "Cannot add yourself" });
    const existing = await storage.getContacts(user.id);
    const alreadyAdded = existing.some((c: any) => c.contactId === contactId);
    if (alreadyAdded) return res.status(200).json({ already: true });
    const contact = await storage.addContact(user.id, contactId);
    res.json(contact);
  });

  app.delete("/api/contacts/:contactId", async (req, res) => {
    const user = await getCurrentUser(req);
    if (!user) return res.status(400).json({ message: "No user" });
    await storage.removeContact(user.id, req.params.contactId);
    res.json({ success: true });
  });

  // ===== CHATS =====
  app.get("/api/chats", async (req, res) => {
    res.set("Cache-Control", "no-store");
    const user = await getCurrentUser(req);
    if (!user) return res.json([]);
    const chatList = await storage.getChatsForUser(user.id);
    res.json(chatList);
  });

  app.post("/api/chats", async (req, res) => {
    const user = await getCurrentUser(req);
    if (!user) return res.status(400).json({ message: "No user" });
    const { isGroup, name, memberIds } = req.body;
    const chat = await storage.createChat({
      isGroup: isGroup || false,
      name,
      memberIds: [user.id, ...memberIds],
    });
    res.json(chat);
  });

  // ===== MESSAGES =====
  app.get("/api/chats/:chatId/messages", async (req, res) => {
    const msgs = await storage.getMessages(req.params.chatId);
    res.json(msgs);
  });

  app.post("/api/chats/:chatId/messages", async (req, res) => {
    const user = await getCurrentUser(req);
    if (!user) return res.status(400).json({ message: "No user" });
    const msg = await storage.sendMessage(req.params.chatId, user.id, req.body.content);
    res.json(msg);
  });

  // ===== POSTS (MOMENTS) =====
  app.get("/api/posts", async (_req, res) => {
    const allPosts = await storage.getPosts();
    res.json(allPosts);
  });

  app.post("/api/posts", async (req, res) => {
    const user = await getCurrentUser(req);
    if (!user) return res.status(400).json({ message: "No user" });
    const post = await storage.createPost(user.id, req.body.content, req.body.image);
    res.json(post);
  });

  app.delete("/api/posts/:postId", async (req, res) => {
    const user = await getCurrentUser(req);
    if (!user) return res.status(400).json({ message: "No user" });
    await storage.deletePost(req.params.postId, user.id);
    res.json({ ok: true });
  });

  app.post("/api/posts/:postId/like", async (req, res) => {
    const user = await getCurrentUser(req);
    if (!user) return res.status(400).json({ message: "No user" });
    await storage.likePost(req.params.postId, user.id);
    res.json({ success: true });
  });

  app.delete("/api/posts/:postId/like", async (req, res) => {
    const user = await getCurrentUser(req);
    if (!user) return res.status(400).json({ message: "No user" });
    await storage.unlikePost(req.params.postId, user.id);
    res.json({ success: true });
  });

  app.post("/api/posts/:postId/comments", async (req, res) => {
    const user = await getCurrentUser(req);
    if (!user) return res.status(400).json({ message: "No user" });
    const comment = await storage.addComment(req.params.postId, user.id, req.body.content);
    res.json(comment);
  });

  // ===== MOCK WALLET API (Stap 3) =====
  // Merchant terminal stuurt betaalverzoek naar W€spr
  app.post("/api/mock-merchant/send", (req, res) => {
    cleanExpiredRequests();
    const sessionId = "pay-" + Math.random().toString(36).substring(2, 10);
    const {
      merchantName = "Demo Kassa NL",
      merchantLocation = "Den Haag Centrum · Kassa 1",
      merchantKvk = "35012085",
      amount = 2495,
      currency = "EUR",
      items = [
        { name: "Boodschappen", quantity: 1, price: 1850 },
        { name: "Kaas 500g", quantity: 1, price: 345 },
        { name: "Brood", quantity: 1, price: 175 },
        { name: "Melk 1L", quantity: 1, price: 125 },
      ],
    } = req.body || {};

    const payReq: PaymentRequest = {
      session: sessionId,
      merchantName,
      merchantLocation,
      merchantKvk,
      amount,
      currency,
      items,
      status: "pending",
      createdAt: new Date(),
    };
    pendingPaymentRequests.set(sessionId, payReq);
    console.log(`Mock-merchant: betaalverzoek aangemaakt session=${sessionId} bedrag=${amount} merchant="${merchantName}"`);
    res.json({ session: sessionId, qrData: `wespr://eudi-pay?session=${sessionId}&merchant=${encodeURIComponent(merchantName)}&amount=${amount}&version=eidas2`, status: "pending" });
  });

  // App pollt: zijn er inkomende betaalverzoeken?
  app.get("/api/pay-request/incoming", async (req, res) => {
    const user = await getCurrentUser(req);
    if (!user) return res.json(null);
    cleanExpiredRequests();
    const pending = [...pendingPaymentRequests.values()].find(r => r.status === "pending");
    res.json(pending || null);
  });

  // Gebruiker keurt betaling goed
  app.post("/api/pay-request/:session/approve", async (req, res) => {
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json({ message: "Niet ingelogd" });
    const payReq = pendingPaymentRequests.get(req.params.session);
    if (!payReq) return res.status(404).json({ message: "Betaalverzoek niet gevonden" });
    if (payReq.status !== "pending") return res.status(400).json({ message: "Verzoek is al verwerkt" });

    payReq.status = "approved";
    const tx = await storage.createTransaction(
      user.id,
      "debit",
      payReq.amount,
      `${payReq.merchantName} · EUDI Pay`,
      JSON.stringify({
        merchant: payReq.merchantName,
        location: payReq.merchantLocation,
        total: payReq.amount,
        items: payReq.items,
        paidWith: "EUDI Wallet · eIDAS 2.0",
        session: payReq.session,
      })
    );
    console.log(`Pay-request: goedgekeurd session=${req.params.session} user=${user.id}`);
    res.json({ success: true, transaction: tx });
  });

  // Gebruiker weigert betaling
  app.post("/api/pay-request/:session/reject", async (req, res) => {
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json({ message: "Niet ingelogd" });
    const payReq = pendingPaymentRequests.get(req.params.session);
    if (!payReq) return res.status(404).json({ message: "Betaalverzoek niet gevonden" });
    payReq.status = "rejected";
    console.log(`Pay-request: geweigerd session=${req.params.session}`);
    res.json({ success: true });
  });

  // Status van een specifiek verzoek
  app.get("/api/pay-request/:session/status", (req, res) => {
    const payReq = pendingPaymentRequests.get(req.params.session);
    if (!payReq) return res.json({ status: "expired" });
    res.json({ status: payReq.status });
  });

  // ===== WALLET / TRANSACTIONS =====
  app.get("/api/transactions", async (req, res) => {
    const user = await getCurrentUser(req);
    if (!user) return res.json([]);
    const txs = await storage.getTransactions(user.id);
    res.json(txs);
  });

  app.post("/api/transactions", async (req, res) => {
    const user = await getCurrentUser(req);
    if (!user) return res.status(400).json({ message: "No user" });
    const { type, amount, description, receiptData } = req.body;
    const tx = await storage.createTransaction(user.id, type, amount, description, receiptData ? JSON.stringify(receiptData) : undefined);
    res.json(tx);
  });

  app.patch("/api/transactions/:id/receipt", async (req, res) => {
    const user = await getCurrentUser(req);
    if (!user) return res.status(400).json({ message: "No user" });
    const { receiptData } = req.body;
    if (!receiptData || typeof receiptData !== "object") return res.status(400).json({ message: "Invalid receipt data" });
    if (!receiptData.items || !Array.isArray(receiptData.items)) return res.status(400).json({ message: "Receipt must have items array" });
    const txId = req.params.id;
    const [existing] = await db.select().from(transactions).where(eq(transactions.id, txId));
    if (!existing || existing.userId !== user.id) return res.status(404).json({ message: "Transaction not found" });
    const [updated] = await db.update(transactions).set({ receiptData: JSON.stringify(receiptData) }).where(eq(transactions.id, txId)).returning();
    res.json(updated);
  });

  // ===== SERVICE ITEMS =====
  app.get("/api/services", async (_req, res) => {
    const items = await storage.getAllServiceItems();
    res.json(items);
  });

  app.get("/api/services/:category", async (req, res) => {
    const items = await storage.getServiceItems(req.params.category);
    res.json(items);
  });

  app.post("/api/services", async (req, res) => {
    const item = await storage.createServiceItem(req.body);
    res.json(item);
  });

  app.patch("/api/services/:id", async (req, res) => {
    const updated = await storage.updateServiceItem(req.params.id, req.body);
    res.json(updated);
  });

  app.delete("/api/services/:id", async (req, res) => {
    await storage.deleteServiceItem(req.params.id);
    res.json({ success: true });
  });

  // ===== SERVICE CATEGORIES =====
  app.get("/api/service-categories", async (_req, res) => {
    const cats = await storage.getServiceCategories();
    res.json(cats);
  });

  app.post("/api/service-categories", async (req, res) => {
    try {
      const cat = await storage.createServiceCategory(req.body);
      res.json(cat);
    } catch (err: any) {
      if (err?.code === '23505') {
        return res.status(409).json({ message: "Een domein met deze naam bestaat al" });
      }
      throw err;
    }
  });

  app.patch("/api/service-categories/:id", async (req, res) => {
    const updated = await storage.updateServiceCategory(req.params.id, req.body);
    res.json(updated);
  });

  app.delete("/api/service-categories/:id", async (req, res) => {
    await storage.deleteServiceCategory(req.params.id);
    res.json({ success: true });
  });

  // ===== PAY CATEGORIES =====
  app.get("/api/pay-categories", async (_req, res) => {
    const cats = await storage.getPayCategories();
    res.json(cats);
  });

  app.post("/api/pay-categories", async (req, res) => {
    try {
      const parsed = insertPayCategorySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Ongeldige invoer", errors: parsed.error.flatten() });
      const cat = await storage.createPayCategory(parsed.data);
      res.json(cat);
    } catch (err: any) {
      if (err?.code === '23505') {
        return res.status(409).json({ message: "Een domein met deze sleutel bestaat al" });
      }
      throw err;
    }
  });

  app.patch("/api/pay-categories/:id", async (req, res) => {
    const partial = insertPayCategorySchema.partial().safeParse(req.body);
    if (!partial.success) return res.status(400).json({ message: "Ongeldige invoer", errors: partial.error.flatten() });
    const updated = await storage.updatePayCategory(req.params.id, partial.data);
    res.json(updated);
  });

  app.delete("/api/pay-categories/:id", async (req, res) => {
    await storage.deletePayCategory(req.params.id);
    res.json({ success: true });
  });

  // ===== SEED DATA =====
  app.post("/api/seed", async (_req, res) => {
    try {
      const existing = await storage.getUserByUsername("ges");

      // Always ensure service items exist, even if users are already seeded
      const defaultItems = [
        { category: "services", subcategory: "Gezondheid & Medisch", label: "W€spr Medisch Dossier", icon: "HeartPulse", colorBg: "bg-teal-100", colorText: "text-teal-600", isDefault: true },
        { category: "services", subcategory: "Overheid & Belastingen", label: "DigiD", icon: "Fingerprint", colorBg: "bg-orange-100", colorText: "text-orange-600", isDefault: true },
        { category: "services", subcategory: "Overheid & Belastingen", label: "Mijn Overheid", icon: "Building2", colorBg: "bg-blue-100", colorText: "text-blue-600", isDefault: true },
        { category: "services", subcategory: "Overheid & Belastingen", label: "Berichtenbox", icon: "Mail", colorBg: "bg-indigo-100", colorText: "text-indigo-600", isDefault: true },
        { category: "services", subcategory: "Overheid & Belastingen", label: "Aangifte", icon: "FileText", colorBg: "bg-teal-100", colorText: "text-teal-600", isDefault: true },
        { category: "services", subcategory: "Energie", label: "Enlighten", icon: "Sun", colorBg: "bg-orange-100", colorText: "text-orange-500", isDefault: true },
        { category: "services", subcategory: "Energie", label: "Zonneplan", icon: "Zap", colorBg: "bg-cyan-100", colorText: "text-cyan-600", isDefault: true },
        { category: "services", subcategory: "Energie", label: "Dunea", icon: "Droplets", colorBg: "bg-sky-100", colorText: "text-sky-600", isDefault: true },
        { category: "services", subcategory: "Overheid & Belastingen", label: "Gem. Belastingen", icon: "Receipt", colorBg: "bg-blue-100", colorText: "text-blue-800", isDefault: true },
        { category: "services", subcategory: "Financiën & Verzekeringen", label: "UWV / Pensioen", icon: "Landmark", colorBg: "bg-emerald-100", colorText: "text-emerald-600", isDefault: true },
        { category: "services", subcategory: "Financiën & Verzekeringen", label: "Rabobank", icon: "Landmark", colorBg: "bg-orange-100", colorText: "text-orange-600", isDefault: true },
        { category: "services", subcategory: "Financiën & Verzekeringen", label: "SPMS Pensioen", icon: "Stethoscope", colorBg: "bg-blue-100", colorText: "text-blue-800", isDefault: true },
        { category: "services", subcategory: "Financiën & Verzekeringen", label: "PFZW", icon: "HeartPulse", colorBg: "bg-green-100", colorText: "text-green-600", isDefault: true },
        { category: "services", subcategory: "Financiën & Verzekeringen", label: "ABP", icon: "Landmark", colorBg: "bg-blue-100", colorText: "text-blue-700", isDefault: true },
        { category: "services", subcategory: "Financiën & Verzekeringen", label: "OHRA", icon: "ShieldCheck", colorBg: "bg-orange-100", colorText: "text-orange-600", isDefault: true },
        { category: "services", subcategory: "Financiën & Verzekeringen", label: "IZZ", icon: "HeartPulse", colorBg: "bg-sky-100", colorText: "text-sky-600", isDefault: true },
        { category: "services", subcategory: "Security", label: "Ring", icon: "Shield", colorBg: "bg-blue-100", colorText: "text-blue-600", isDefault: true },
        { category: "services", subcategory: "Security", label: "UltraSync+", icon: "ShieldCheck", colorBg: "bg-slate-100", colorText: "text-slate-700", isDefault: true },
        { category: "services", subcategory: "Security", label: "Keeper", icon: "Lock", colorBg: "bg-blue-100", colorText: "text-blue-600", isDefault: true },
        { category: "admin", subcategory: "Kantoor", label: "MS Office", icon: "FileText", colorBg: "bg-orange-100", colorText: "text-orange-600", isDefault: true },
        { category: "admin", subcategory: "Kantoor", label: "Agenda", icon: "Calendar", colorBg: "bg-blue-100", colorText: "text-blue-600", isDefault: true },
        { category: "admin", subcategory: "Kantoor", label: "Klok", icon: "Clock", colorBg: "bg-gray-100", colorText: "text-gray-700", isDefault: true },
        { category: "admin", subcategory: "Kantoor", label: "Rekenmachine", icon: "Calculator", colorBg: "bg-orange-100", colorText: "text-orange-700", isDefault: true },
        { category: "admin", subcategory: "Bestanden", label: "Bestanden", icon: "FolderOpen", colorBg: "bg-blue-100", colorText: "text-blue-600", isDefault: true },
        { category: "admin", subcategory: "Bestanden", label: "PDF Viewer", icon: "FileText", colorBg: "bg-red-100", colorText: "text-red-600", isDefault: true },
        { category: "admin", subcategory: "Bestanden", label: "Box", icon: "FolderOpen", colorBg: "bg-blue-100", colorText: "text-blue-600", isDefault: true },
        { category: "interests", subcategory: "Kunst", label: "Artsy", icon: "Star", colorBg: "bg-gray-100", colorText: "text-gray-800", isDefault: true },
        { category: "interests", subcategory: "Kunst", label: "Saatchi Art", icon: "Star", colorBg: "bg-gray-100", colorText: "text-gray-700", isDefault: true },
        { category: "interests", subcategory: "Kunst", label: "Kunstveiling.nl", icon: "Star", colorBg: "bg-slate-100", colorText: "text-slate-700", isDefault: true },
        { category: "interests", subcategory: "Kunst", label: "Catawiki", icon: "Star", colorBg: "bg-amber-100", colorText: "text-amber-600", isDefault: true },
        { category: "interests", subcategory: "Kunst", label: "Middelheim", icon: "Star", colorBg: "bg-green-100", colorText: "text-green-700", isDefault: true },
        { category: "interests", subcategory: "Kunst", label: "Depot", icon: "Star", colorBg: "bg-gray-100", colorText: "text-gray-600", isDefault: true },
        { category: "interests", subcategory: "Kunst", label: "Smartify", icon: "Star", colorBg: "bg-purple-100", colorText: "text-purple-600", isDefault: true },
        { category: "interests", subcategory: "Kunst", label: "Arts & Culture", icon: "Star", colorBg: "bg-yellow-100", colorText: "text-yellow-600", isDefault: true },
        { category: "interests", subcategory: "Kunst", label: "Museumtijdschrift", icon: "Star", colorBg: "bg-indigo-100", colorText: "text-indigo-700", isDefault: true },
        { category: "interests", subcategory: "Kunst", label: "Google Lens", icon: "Globe", colorBg: "bg-blue-100", colorText: "text-blue-600", isDefault: true },
        { category: "interests", subcategory: "Kunst", label: "Time to Momo", icon: "Star", colorBg: "bg-rose-100", colorText: "text-rose-500", isDefault: true },
        { category: "interests", subcategory: "Vastgoed", label: "Funda", icon: "Home", colorBg: "bg-amber-100", colorText: "text-amber-600", isDefault: true },
        { category: "interests", subcategory: "Vastgoed", label: "Pararius", icon: "Home", colorBg: "bg-green-100", colorText: "text-green-600", isDefault: true },
        { category: "interests", subcategory: "Vastgoed", label: "Idealista", icon: "Home", colorBg: "bg-green-100", colorText: "text-green-600", isDefault: true },
        { category: "interests", subcategory: "Vastgoed", label: "Yaencontre", icon: "Home", colorBg: "bg-orange-100", colorText: "text-orange-600", isDefault: true },
        { category: "interests", subcategory: "Vastgoed", label: "Pisos.com", icon: "Home", colorBg: "bg-blue-100", colorText: "text-blue-600", isDefault: true },
        { category: "interests", subcategory: "Vastgoed", label: "Habitaclia", icon: "Home", colorBg: "bg-red-100", colorText: "text-red-600", isDefault: true },
        { category: "social", subcategory: "Browsers", label: "Safari", icon: "Globe", colorBg: "bg-blue-100", colorText: "text-blue-600", isDefault: true },
        { category: "social", subcategory: "Browsers", label: "Chrome", icon: "Globe", colorBg: "bg-blue-100", colorText: "text-blue-500", isDefault: true },
        { category: "transport", subcategory: "Klimaat & Weer", label: "Buienradar", icon: "Globe", colorBg: "bg-blue-100", colorText: "text-blue-600", isDefault: true },
        { category: "transport", subcategory: "Klimaat & Weer", label: "Weer.nl", icon: "Sun", colorBg: "bg-orange-100", colorText: "text-orange-500", isDefault: true },
        { category: "transport", subcategory: "Klimaat & Weer", label: "AccuWeather", icon: "Globe", colorBg: "bg-orange-100", colorText: "text-orange-600", isDefault: true },
        { category: "transport", subcategory: "Navigatie & Kaarten", label: "Google Maps", icon: "MapPin", colorBg: "bg-green-100", colorText: "text-green-600", isDefault: true },
        { category: "transport", subcategory: "Navigatie & Kaarten", label: "Kaarten", icon: "MapPin", colorBg: "bg-green-100", colorText: "text-green-600", isDefault: true },
        { category: "transport", subcategory: "Navigatie & Kaarten", label: "ANWB", icon: "Shield", colorBg: "bg-yellow-100", colorText: "text-yellow-700", isDefault: true },
        { category: "transport", subcategory: "Parkeren", label: "EasyPark NL", icon: "Car", colorBg: "bg-green-100", colorText: "text-green-600", isDefault: true },
        { category: "transport", subcategory: "Parkeren", label: "Parkeren Den Haag", icon: "Car", colorBg: "bg-blue-100", colorText: "text-blue-600", isDefault: true },
        { category: "transport", subcategory: "Parkeren", label: "Q-Park", icon: "Car", colorBg: "bg-red-100", colorText: "text-red-600", isDefault: true },
        { category: "transport", subcategory: "Parkeren", label: "Flitsmeister", icon: "Zap", colorBg: "bg-orange-100", colorText: "text-orange-600", isDefault: true },
        { category: "transport", subcategory: "Openbaar Vervoer", label: "NS", icon: "Train", colorBg: "bg-yellow-100", colorText: "text-yellow-700", isDefault: true },
        { category: "transport", subcategory: "Openbaar Vervoer", label: "9292", icon: "Bus", colorBg: "bg-sky-100", colorText: "text-sky-600", isDefault: true },
        { category: "transport", subcategory: "Openbaar Vervoer", label: "GVB", icon: "Train", colorBg: "bg-blue-100", colorText: "text-blue-700", isDefault: true },
        { category: "transport", subcategory: "Openbaar Vervoer", label: "RET", icon: "Train", colorBg: "bg-red-100", colorText: "text-red-600", isDefault: true },
        { category: "transport", subcategory: "Openbaar Vervoer", label: "HTM", icon: "Train", colorBg: "bg-red-100", colorText: "text-red-600", isDefault: true },
        { category: "transport", subcategory: "Openbaar Vervoer", label: "OV-chipkaart", icon: "CreditCard", colorBg: "bg-red-100", colorText: "text-red-600", isDefault: true },
        { category: "transport", subcategory: "Openbaar Vervoer", label: "Metro Guangzhou", icon: "Train", colorBg: "bg-red-100", colorText: "text-red-600", isDefault: true },
        { category: "transport", subcategory: "Openbaar Vervoer", label: "Railway 12306", icon: "Train", colorBg: "bg-blue-100", colorText: "text-blue-700", isDefault: true },
        { category: "transport", subcategory: "Vliegreizen", label: "Schiphol", icon: "Plane", colorBg: "bg-blue-100", colorText: "text-blue-800", isDefault: true },
        { category: "transport", subcategory: "Vliegreizen", label: "KLM", icon: "Plane", colorBg: "bg-sky-100", colorText: "text-sky-600", isDefault: true },
        { category: "transport", subcategory: "Vliegreizen", label: "Transavia", icon: "Plane", colorBg: "bg-green-100", colorText: "text-green-600", isDefault: true },
        { category: "transport", subcategory: "Vliegreizen", label: "Ryanair", icon: "Plane", colorBg: "bg-blue-100", colorText: "text-blue-700", isDefault: true },
        { category: "transport", subcategory: "Vliegreizen", label: "easyJet", icon: "Plane", colorBg: "bg-orange-100", colorText: "text-orange-600", isDefault: true },
        { category: "transport", subcategory: "Taxi & Ridesharing", label: "Uber", icon: "Car", colorBg: "bg-gray-100", colorText: "text-gray-800", isDefault: true },
        { category: "transport", subcategory: "Taxi & Ridesharing", label: "Bolt", icon: "Car", colorBg: "bg-green-100", colorText: "text-green-600", isDefault: true },
        { category: "transport", subcategory: "Taxi & Ridesharing", label: "Cabify", icon: "Car", colorBg: "bg-purple-100", colorText: "text-purple-600", isDefault: true },
        { category: "transport", subcategory: "Deelvervoer", label: "Swapfiets", icon: "Bike", colorBg: "bg-blue-100", colorText: "text-blue-800", isDefault: true },
        { category: "transport", subcategory: "Deelvervoer", label: "OV-fiets", icon: "Bike", colorBg: "bg-yellow-100", colorText: "text-yellow-600", isDefault: true },
        { category: "transport", subcategory: "Deelvervoer", label: "Felyx", icon: "Zap", colorBg: "bg-teal-100", colorText: "text-teal-600", isDefault: true },
        { category: "transport", subcategory: "Deelvervoer", label: "CHECK", icon: "Zap", colorBg: "bg-pink-100", colorText: "text-pink-600", isDefault: true },
        { category: "transport", subcategory: "Accommodatie & Vakanties", label: "Booking.com", icon: "Building", colorBg: "bg-blue-100", colorText: "text-blue-700", isDefault: true },
        { category: "transport", subcategory: "Accommodatie & Vakanties", label: "Airbnb", icon: "Home", colorBg: "bg-rose-100", colorText: "text-rose-500", isDefault: true },
        { category: "transport", subcategory: "Accommodatie & Vakanties", label: "TUI", icon: "Plane", colorBg: "bg-red-100", colorText: "text-red-600", isDefault: true },
        { category: "transport", subcategory: "Accommodatie & Vakanties", label: "Corendon", icon: "Plane", colorBg: "bg-orange-100", colorText: "text-orange-600", isDefault: true },
        { category: "mini_apps", subcategory: "Winkelen & Bestellen", label: "Klarna", icon: "CreditCard", colorBg: "bg-pink-100", colorText: "text-pink-600", isDefault: true },
        { category: "mini_apps", subcategory: "Winkelen & Bestellen", label: "Bol.com", icon: "ShoppingBag", colorBg: "bg-blue-100", colorText: "text-blue-800", isDefault: true },
        { category: "health", subcategory: "Gezondheid", label: "MijnZorgApp", icon: "HeartPulse", colorBg: "bg-teal-100", colorText: "text-teal-600", isDefault: true },
        { category: "health", subcategory: "Gezondheid", label: "VAXY", icon: "ShieldCheck", colorBg: "bg-blue-100", colorText: "text-blue-500", isDefault: true },
        { category: "health", subcategory: "Gezondheid", label: "Huisarts", icon: "Stethoscope", colorBg: "bg-rose-100", colorText: "text-rose-600", isDefault: true },
        { category: "health", subcategory: "Gezondheid", label: "Apotheek", icon: "Pill", colorBg: "bg-emerald-100", colorText: "text-emerald-600", isDefault: true },
        { category: "health", subcategory: "Gezondheid", label: "Zorgverzekeraar", icon: "ShieldCheck", colorBg: "bg-blue-100", colorText: "text-blue-600", isDefault: true },
        { category: "health", subcategory: "Artsen & Afspraken", label: "Doctolib Connect", icon: "Stethoscope", colorBg: "bg-blue-100", colorText: "text-blue-500", isDefault: true },
        { category: "health", subcategory: "Artsen & Afspraken", label: "BeterDichtbij", icon: "HeartPulse", colorBg: "bg-blue-100", colorText: "text-blue-700", isDefault: true },
        { category: "health", subcategory: "Artsen & Afspraken", label: "Thuisarts", icon: "Stethoscope", colorBg: "bg-orange-100", colorText: "text-orange-600", isDefault: true },
        { category: "health", subcategory: "Medicijnen & Informatie", label: "Medgemak", icon: "Pill", colorBg: "bg-green-100", colorText: "text-green-600", isDefault: true },
        { category: "health", subcategory: "Medicijnen & Informatie", label: "AboutHerbs", icon: "HeartPulse", colorBg: "bg-green-100", colorText: "text-green-700", isDefault: true },
        { category: "health", subcategory: "Medicijnen & Informatie", label: "Richtlijnen", icon: "FileText", colorBg: "bg-indigo-100", colorText: "text-indigo-600", isDefault: true },
        { category: "health", subcategory: "Patiënten & Community", label: "PatientsLikeMe", icon: "Users2", colorBg: "bg-teal-100", colorText: "text-teal-600", isDefault: true },
        { category: "hobbies", subcategory: "Sport & Golf", label: "Golf.nl", icon: "Target", colorBg: "bg-green-100", colorText: "text-green-800", isDefault: true },
        { category: "hobbies", subcategory: "Sport & Golf", label: "ClubApp", icon: "Users2", colorBg: "bg-orange-100", colorText: "text-orange-600", isDefault: true },
        { category: "hobbies", subcategory: "Sport & Golf", label: "Meet & Play", icon: "HeartPulse", colorBg: "bg-purple-100", colorText: "text-purple-600", isDefault: true },
        { category: "mini_apps", subcategory: "Winkelen & Bestellen", label: "Albert Heijn", icon: "Apple", colorBg: "bg-blue-100", colorText: "text-blue-600", isDefault: true },
        { category: "mini_apps", subcategory: "Winkelen & Bestellen", label: "Starbucks EU", icon: "Coffee", colorBg: "bg-green-100", colorText: "text-green-700", isDefault: true },
        { category: "mini_apps", subcategory: "Winkelen & Bestellen", label: "Zalando", icon: "ShoppingBag", colorBg: "bg-orange-100", colorText: "text-orange-600", isDefault: true },
        { category: "mini_apps", subcategory: "Winkelen & Bestellen", label: "Alibaba.com", icon: "ShoppingBag", colorBg: "bg-orange-100", colorText: "text-orange-600", isDefault: true },
        { category: "mini_apps", subcategory: "Winkelen & Bestellen", label: "Temu", icon: "ShoppingBag", colorBg: "bg-orange-100", colorText: "text-orange-500", isDefault: true },
        { category: "mini_apps", subcategory: "Winkelen & Bestellen", label: "HEMA", icon: "ShoppingBag", colorBg: "bg-red-100", colorText: "text-red-600", isDefault: true },
        { category: "mini_apps", subcategory: "Winkelen & Bestellen", label: "Kruidvat", icon: "ShoppingBag", colorBg: "bg-red-100", colorText: "text-red-600", isDefault: true },
        { category: "mini_apps", subcategory: "Winkelen & Bestellen", label: "Lokale Bakker", icon: "Coffee", colorBg: "bg-amber-100", colorText: "text-amber-700", isDefault: true },
        { category: "food", subcategory: "Bezorgdiensten", label: "Thuisbezorgd.nl", icon: "Pizza", colorBg: "bg-orange-100", colorText: "text-orange-600", isDefault: true },
        { category: "food", subcategory: "Bezorgdiensten", label: "Flink", icon: "Apple", colorBg: "bg-pink-100", colorText: "text-pink-600", isDefault: true },
        { category: "food", subcategory: "Bezorgdiensten", label: "Jamezz", icon: "Utensils", colorBg: "bg-slate-100", colorText: "text-slate-800", isDefault: true },
        { category: "food", subcategory: "Bezorgdiensten", label: "Vivino", icon: "Coffee", colorBg: "bg-red-100", colorText: "text-red-800", isDefault: true },
        { category: "social", subcategory: "Artificial Intelligence", label: "Gemini", icon: "Sparkles", colorBg: "bg-blue-100", colorText: "text-blue-600", isDefault: true },
        { category: "social", subcategory: "Artificial Intelligence", label: "ChatGPT", icon: "Bot", colorBg: "bg-green-100", colorText: "text-green-600", isDefault: true },
        { category: "social", subcategory: "Artificial Intelligence", label: "DeepSeek", icon: "Brain", colorBg: "bg-indigo-100", colorText: "text-indigo-600", isDefault: true },
        { category: "social", subcategory: "Artificial Intelligence", label: "Replit", icon: "Code", colorBg: "bg-orange-100", colorText: "text-orange-600", isDefault: true },
        { category: "social", subcategory: "Artificial Intelligence", label: "Claude", icon: "MessageSquare", colorBg: "bg-amber-100", colorText: "text-amber-600", isDefault: true },
        { category: "social", subcategory: "Artificial Intelligence", label: "Kimi", icon: "Brain", colorBg: "bg-purple-100", colorText: "text-purple-600", isDefault: true },
        { category: "social", subcategory: "Sociale Media", label: "Signal", icon: "Shield", colorBg: "bg-blue-100", colorText: "text-blue-500", isDefault: true },
        { category: "social", subcategory: "Beveiliging & Telecom", label: "NordVPN", icon: "Shield", colorBg: "bg-blue-100", colorText: "text-blue-500", isDefault: true },
        { category: "social", subcategory: "Beveiliging & Telecom", label: "Authenticator", icon: "ShieldCheck", colorBg: "bg-blue-100", colorText: "text-blue-600", isDefault: true },
        { category: "social", subcategory: "Beveiliging & Telecom", label: "KPN", icon: "Globe", colorBg: "bg-green-100", colorText: "text-green-600", isDefault: true },
        { category: "media", subcategory: "Muziek & Film", label: "YouTube", icon: "Film", colorBg: "bg-red-100", colorText: "text-red-600", isDefault: true },
        { category: "media", subcategory: "Muziek & Film", label: "Shazam", icon: "Music", colorBg: "bg-blue-100", colorText: "text-blue-500", isDefault: true },
        { category: "media", subcategory: "Muziek & Film", label: "Spotify", icon: "Headphones", colorBg: "bg-green-100", colorText: "text-green-600", isDefault: true },
        { category: "media", subcategory: "Muziek & Film", label: "Netflix", icon: "Film", colorBg: "bg-red-100", colorText: "text-red-800", isDefault: true },
        { category: "news", subcategory: "Nieuws", label: "NOS", icon: "Tv", colorBg: "bg-red-100", colorText: "text-red-600", isDefault: true },
        { category: "news", subcategory: "Nieuws", label: "NU.nl", icon: "Globe", colorBg: "bg-red-100", colorText: "text-red-700", isDefault: true },
        { category: "news", subcategory: "Nieuws", label: "RTL Nieuws", icon: "Tv", colorBg: "bg-blue-100", colorText: "text-blue-700", isDefault: true },
        { category: "news", subcategory: "Nieuws", label: "de Volkskrant", icon: "FileText", colorBg: "bg-slate-100", colorText: "text-slate-800", isDefault: true },
        { category: "news", subcategory: "Nieuws", label: "El País", icon: "Newspaper", colorBg: "bg-blue-100", colorText: "text-blue-800", isDefault: true },
        { category: "news", subcategory: "Nieuws", label: "Podcasts", icon: "Headphones", colorBg: "bg-purple-100", colorText: "text-purple-600", isDefault: true },
        { category: "news", subcategory: "Financieel", label: "FD", icon: "Landmark", colorBg: "bg-amber-100", colorText: "text-amber-600", isDefault: true },
        { category: "news", subcategory: "Financieel", label: "BNR", icon: "Radio", colorBg: "bg-blue-100", colorText: "text-blue-800", isDefault: true },
        { category: "news", subcategory: "TV & Streaming", label: "KPN TV+", icon: "Tv", colorBg: "bg-green-100", colorText: "text-green-600", isDefault: true },
        { category: "news", subcategory: "TV & Streaming", label: "NPO Start", icon: "Film", colorBg: "bg-orange-100", colorText: "text-orange-600", isDefault: true },
        { category: "investing", subcategory: "Banken & Beleggen", label: "Rabobank", icon: "Landmark", colorBg: "bg-orange-100", colorText: "text-orange-600", isDefault: true },
        { category: "investing", subcategory: "Banken & Beleggen", label: "Saxo Investor", icon: "TrendingUp", colorBg: "bg-blue-100", colorText: "text-blue-900", isDefault: true },
        { category: "investing", subcategory: "Banken & Beleggen", label: "Santander", icon: "Landmark", colorBg: "bg-red-100", colorText: "text-red-600", isDefault: true },
        { category: "investing", subcategory: "Banken & Beleggen", label: "Revolut", icon: "CreditCard", colorBg: "bg-blue-100", colorText: "text-blue-600", isDefault: true },
        { category: "investing", subcategory: "Banken & Beleggen", label: "Alipay", icon: "Wallet", colorBg: "bg-blue-100", colorText: "text-blue-600", isDefault: true },
        { category: "investing", subcategory: "Banken & Beleggen", label: "Raisin", icon: "PiggyBank", colorBg: "bg-teal-100", colorText: "text-teal-700", isDefault: true },
        { category: "investing", subcategory: "Beurzen & Marktdata", label: "Bloomberg", icon: "BarChart3", colorBg: "bg-gray-100", colorText: "text-gray-800", isDefault: true },
        { category: "investing", subcategory: "Beurzen & Marktdata", label: "MarketWatch", icon: "TrendingUp", colorBg: "bg-green-100", colorText: "text-green-700", isDefault: true },
        { category: "investing", subcategory: "Beurzen & Marktdata", label: "Euronext", icon: "Landmark", colorBg: "bg-blue-100", colorText: "text-blue-800", isDefault: true },
        { category: "investing", subcategory: "Beurzen & Marktdata", label: "Valuta", icon: "DollarSign", colorBg: "bg-green-100", colorText: "text-green-600", isDefault: true },
        { category: "investing", subcategory: "Crypto & DeFi", label: "Bitvavo", icon: "Coins", colorBg: "bg-blue-100", colorText: "text-blue-700", isDefault: true },
        { category: "investing", subcategory: "Crypto & DeFi", label: "Binance", icon: "Coins", colorBg: "bg-yellow-100", colorText: "text-yellow-700", isDefault: true },
        { category: "investing", subcategory: "Crypto & DeFi", label: "Coinbase", icon: "Coins", colorBg: "bg-blue-100", colorText: "text-blue-600", isDefault: true },
        { category: "investing", subcategory: "Crypto & DeFi", label: "Base", icon: "Zap", colorBg: "bg-blue-100", colorText: "text-blue-600", isDefault: true },
        { category: "investing", subcategory: "Crypto & DeFi", label: "Uniswap", icon: "ArrowLeftRight", colorBg: "bg-pink-100", colorText: "text-pink-600", isDefault: true },
        { category: "events", subcategory: "Tickets", label: "Datumprikker", icon: "Ticket", colorBg: "bg-orange-100", colorText: "text-orange-600", isDefault: true },
        { category: "events", subcategory: "Tickets", label: "Ticketmaster", icon: "Music", colorBg: "bg-blue-100", colorText: "text-blue-600", isDefault: true },
        { category: "events", subcategory: "Tickets", label: "Pathé Bioscopen", icon: "Film", colorBg: "bg-yellow-100", colorText: "text-yellow-600", isDefault: true },
        { category: "events", subcategory: "Tickets", label: "Museumkaart", icon: "Tv", colorBg: "bg-fuchsia-100", colorText: "text-fuchsia-600", isDefault: true },
        { category: "health", subcategory: "Gezondheid", label: "ZorgKlik", icon: "HeartPulse", colorBg: "bg-rose-100", colorText: "text-rose-600", isDefault: true, image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=800" },

        { category: "social", subcategory: "Sociale Media", label: "LinkedIn", icon: "Briefcase", colorBg: "bg-blue-100", colorText: "text-blue-600", isDefault: true },
        { category: "social", subcategory: "Sociale Media", label: "X", icon: "Radio", colorBg: "bg-gray-100", colorText: "text-gray-800", isDefault: true },
        { category: "social", subcategory: "Sociale Media", label: "Gmail", icon: "Mail", colorBg: "bg-red-100", colorText: "text-red-500", isDefault: true },
        { category: "social", subcategory: "Sociale Media", label: "Instagram", icon: "Heart", colorBg: "bg-pink-100", colorText: "text-pink-600", isDefault: true },
        { category: "social", subcategory: "Videobellen", label: "Zoom", icon: "Video", colorBg: "bg-blue-100", colorText: "text-blue-500", isDefault: true },
        { category: "social", subcategory: "Videobellen", label: "Teams", icon: "Users2", colorBg: "bg-indigo-100", colorText: "text-indigo-600", isDefault: true },
        { category: "social", subcategory: "Videobellen", label: "Chat", icon: "MessageCircle", colorBg: "bg-green-100", colorText: "text-green-600", isDefault: true },
        { category: "social", subcategory: "Videobellen", label: "FaceTime", icon: "Video", colorBg: "bg-green-100", colorText: "text-green-600", isDefault: true },
        { category: "social", subcategory: "Artificial Intelligence", label: "Wix", icon: "Globe", colorBg: "bg-blue-100", colorText: "text-blue-600", isDefault: true },
        { category: "social", subcategory: "Sociale Media", label: "WeChat", icon: "MessageSquare", colorBg: "bg-green-100", colorText: "text-green-600", isDefault: true },
        { category: "social", subcategory: "Studie", label: "Duolingo", icon: "GraduationCap", colorBg: "bg-green-100", colorText: "text-green-600", isDefault: true },
        { category: "social", subcategory: "Studie", label: "Studielink", icon: "GraduationCap", colorBg: "bg-blue-100", colorText: "text-blue-600", isDefault: true },
        { category: "social", subcategory: "Studie", label: "Coursera", icon: "BookOpen", colorBg: "bg-blue-100", colorText: "text-blue-500", isDefault: true },
        { category: "social", subcategory: "Studie", label: "DeepL", icon: "Globe", colorBg: "bg-slate-100", colorText: "text-slate-700", isDefault: true },
        { category: "social", subcategory: "Studie", label: "Google Translate", icon: "Languages", colorBg: "bg-blue-100", colorText: "text-blue-500", isDefault: true },
        { category: "social", subcategory: "Camera & Foto's", label: "Camera", icon: "Camera", colorBg: "bg-gray-100", colorText: "text-gray-800", isDefault: true },
        { category: "social", subcategory: "Camera & Foto's", label: "Foto's", icon: "Image", colorBg: "bg-green-100", colorText: "text-green-500", isDefault: true },
      ];

      // Remove unwanted apps and deduplicate
      await db.execute(sql`DELETE FROM service_items WHERE label IN ('Zorgtoeslag', 'DUO / Studie', 'DUO', 'Waze', 'Google Earth', 'Skyview Lite', 'Uber Eats', 'Gorillas / Flink', 'Designklik', 'DesignKlik')`);
      await db.execute(sql`DELETE FROM service_items WHERE label ILIKE 'designklik'`);
      await db.execute(sql`DELETE FROM service_items WHERE label = 'UWV / Pensioen' AND id NOT IN (SELECT id FROM service_items WHERE label = 'UWV / Pensioen' ORDER BY created_at LIMIT 1)`);
      await db.execute(sql`DELETE FROM service_items WHERE label = 'SPMS Pensioen' AND id NOT IN (SELECT id FROM service_items WHERE label = 'SPMS Pensioen' ORDER BY created_at LIMIT 1)`);

      const allCategories = [...new Set(defaultItems.map(i => i.category))];
      const allExisting: any[] = [];
      for (const cat of allCategories) {
        const items = await storage.getServiceItems(cat);
        allExisting.push(...items);
      }
      const existingLabels = new Set(allExisting.map((i: any) => `${i.category}::${i.label}`));
      let insertedCount = 0;
      for (const item of defaultItems) {
        if (!existingLabels.has(`${item.category}::${item.label}`)) {
          await storage.createServiceItem(item);
          insertedCount++;
        }
      }
      if (insertedCount > 0) {
        console.log(`Service items seeded: ${insertedCount} new items added`);
      }

      // Fix W€spr branding in all existing users
      await db.execute(sql`UPDATE users SET display_name = REPLACE(display_name, 'Wespr', 'W€spr') WHERE display_name LIKE '%Wespr%'`);
      await db.execute(sql`UPDATE users SET bio = REPLACE(REPLACE(bio, 'Wespr', 'W€spr'), 'wespr', 'w€spr') WHERE bio LIKE '%espr%'`);
      await db.execute(sql`UPDATE users SET aura_id = REPLACE(aura_id, 'wespr_', 'w€spr_') WHERE aura_id LIKE 'wespr_%'`);
      await db.execute(sql`UPDATE users SET email = REPLACE(email, 'wespr.eu', 'w€spr.eu') WHERE email LIKE '%wespr.eu'`);
      await db.execute(sql`UPDATE chats SET name = REPLACE(REPLACE(name, 'Wespr', 'W€spr'), 'wespr', 'w€spr') WHERE name LIKE '%espr%'`);
      await db.execute(sql`UPDATE messages SET content = REPLACE(REPLACE(content, 'Wespr', 'W€spr'), 'wespr', 'w€spr') WHERE content LIKE '%espr%'`);
      console.log("Seed: W€spr branding fix applied to database");

      if (existing) {
        const freshHash = await bcrypt.hash("password", 10);
        await db.update(users).set({ password: freshHash, email: "ges@w€spr.eu" }).where(eq(users.id, existing.id));
        console.log(`Seed: reset password+email for user ${existing.id}, email=${existing.email}, new hash_prefix=${freshHash.substring(0, 10)}`);

        // Ensure demo users exist — multi-fallback lookup then safe create
        const demoHash = await bcrypt.hash("password", 10);
        const ensureUser = async (username: string, email: string, oldEmail: string, oldAuraId: string, newAuraId: string, data: any) => {
          let u = await storage.getUserByUsername(username)
            || await storage.getUserByEmail(email)
            || await storage.getUserByEmail(oldEmail)
            || await storage.getUserByAuraId(oldAuraId)
            || await storage.getUserByAuraId(newAuraId);
          if (!u) {
            try { u = await storage.createUser({ username, email, password: demoHash, auraId: newAuraId, ...data }); }
            catch (e: any) {
              console.log(`Seed: create ${username} failed (${e?.message}), retrying lookups`);
              u = await storage.getUserByEmail(email) || await storage.getUserByEmail(oldEmail)
                || await storage.getUserByAuraId(oldAuraId) || await storage.getUserByAuraId(newAuraId);
            }
          }
          if (!u) console.error(`Seed: COULD NOT find or create user ${username}`);
          return u;
        };

        const sophie = await ensureUser("sophie", "sophie@w€spr.eu", "sophie@wespr.eu", "wespr_eu_1042", "w€spr_eu_1042_s", { displayName: "Sophie Laurent", avatar: "/images/avatar-2.png", bio: "Creative designer in Paris" });
        const max    = await ensureUser("maximilian", "max@w€spr.eu", "max@wespr.eu", "wespr_eu_3387", "w€spr_eu_3387_m", { displayName: "Maximilian Becker", avatar: "/images/avatar-3.png", bio: "Tech executive in Berlin" });
        const lukas  = await ensureUser("lukas", "lukas@w€spr.eu", "lukas@wespr.eu", "wespr_eu_7765", "w€spr_eu_7765_l", { displayName: "Lukas Van Der Berg", avatar: "/images/avatar-1.png", bio: "Consultant in Amsterdam" });
        const auraBot = await ensureUser("w€spr_team", "team@w€spr.eu", "team@wespr.eu", "w€spr_official_001", "w€spr_official_001_t", { displayName: "W€spr Team", avatar: "/favicon.png", bio: "Official W€spr support" });
        await ensureUser("emma", "emma@w€spr.eu", "emma@wespr.eu", "wespr_eu_4491", "w€spr_eu_4491_e", { displayName: "Emma de Vries", avatar: "/images/avatar-4.png", bio: "Ondernemer in Rotterdam" });

        console.log(`Seed: demo users — sophie=${sophie?.id?.slice(0,8)}, max=${max?.id?.slice(0,8)}, lukas=${lukas?.id?.slice(0,8)}, team=${auraBot?.id?.slice(0,8)}`);

        // Ensure contacts exist
        const contacts = await storage.getContacts(existing.id);
        console.log(`Seed: contacts for ges = ${contacts.length}`);
        try {
          if (contacts.length === 0) {
            if (sophie) await storage.addContact(existing.id, sophie.id);
            if (max) await storage.addContact(existing.id, max.id);
            if (lukas) await storage.addContact(existing.id, lukas.id);
            console.log("Seed: contacts created");
          }
        } catch (e: any) { console.error("Seed: contact creation error:", e?.message); }

        // Ensure chats exist and are richly populated
        const chats = await storage.getChatsForUser(existing.id);
        console.log(`Seed: chats for ges = ${chats.length}`);
        try {
          // Helper: get message count for a chat
          const msgCount = async (chatId: string) => {
            const msgs = await storage.getMessages(chatId);
            return msgs.length;
          };

          // --- W€spr Team (official) ---
          let officialChat = chats.find((c: any) => c.isOfficial);
          if (!officialChat && auraBot) {
            officialChat = await storage.createChat({ isGroup: false, isOfficial: true, name: "W€spr Team", avatar: "/favicon.png", memberIds: [existing.id, auraBot.id] });
          }
          if (officialChat && auraBot && await msgCount(officialChat.id) < 5) {
            await storage.sendMessage(officialChat.id, auraBot.id, "Welkom bij W€spr — jouw Europese super app! 🇪🇺");
            await storage.sendMessage(officialChat.id, auraBot.id, "Met W€spr Pay betaal je veilig bij duizenden Europese winkels en webshops.");
            await storage.sendMessage(officialChat.id, auraBot.id, "Je EUDI Wallet is gekoppeld en klaar voor gebruik. Jouw gegevens blijven altijd privé.");
            await storage.sendMessage(officialChat.id, auraBot.id, "Nieuw: Medisch Dossier via HagaZiekenhuis is nu beschikbaar in Ontdekken.");
            await storage.sendMessage(officialChat.id, auraBot.id, "Tip: Houd je app up-to-date voor de nieuwste beveiligingsupdates en functies.");
          }

          // --- Sophie ---
          let sophieChat = chats.find((c: any) => c.name === "Sophie Laurent");
          if (!sophieChat && sophie) {
            sophieChat = await storage.createChat({ isGroup: false, memberIds: [existing.id, sophie.id] });
          }
          if (sophieChat && sophie && await msgCount(sophieChat.id) < 9) {
            await storage.sendMessage(sophieChat.id, sophie.id, "Hé! Hoe was jouw weekend? 😊");
            await storage.sendMessage(sophieChat.id, existing.id, "Super! Lekker niks gedaan, even bijgeladen. Jij?");
            await storage.sendMessage(sophieChat.id, sophie.id, "Ik was in Parijs voor een expo. Ongelooflijk mooi werk gezien.");
            await storage.sendMessage(sophieChat.id, existing.id, "Jaloers! Welke expo?");
            await storage.sendMessage(sophieChat.id, sophie.id, "Centre Pompidou — overzichtstentoonstelling van Matisse. Echt een aanrader.");
            await storage.sendMessage(sophieChat.id, existing.id, "Ik ga dat zeker plannen. Wanneer gaat die expo dicht?");
            await storage.sendMessage(sophieChat.id, sophie.id, "Nog tot eind april. We kunnen er samen heen als je wil!");
            await storage.sendMessage(sophieChat.id, existing.id, "Dat lijkt me geweldig. Ik stuur je bericht via W€spr zodra ik mijn agenda check 📅");
            await storage.sendMessage(sophieChat.id, sophie.id, "Top! Dan spreken we snel af. Merci!");
          }

          // --- Maximilian ---
          let maxChat = chats.find((c: any) => c.name === "Maximilian Becker");
          if (!maxChat && max) {
            maxChat = await storage.createChat({ isGroup: false, memberIds: [existing.id, max.id] });
          }
          if (maxChat && max && await msgCount(maxChat.id) < 8) {
            await storage.sendMessage(maxChat.id, max.id, "Goedemorgen! Heb je de presentatie al kunnen bekijken?");
            await storage.sendMessage(maxChat.id, existing.id, "Ja, gisteravond doorgelezen. Ziet er sterk uit.");
            await storage.sendMessage(maxChat.id, max.id, "Mooi. De investeerders in Frankfurt zijn enthousiast. We hebben een afspraak voor 15 april.");
            await storage.sendMessage(maxChat.id, existing.id, "Dat is snel! Moet ik daarvoor naar Berlijn komen?");
            await storage.sendMessage(maxChat.id, max.id, "Nee, we doen het hybride. Jij kunt gewoon online meedoen via W€spr Meet.");
            await storage.sendMessage(maxChat.id, existing.id, "Perfect, dat scheelt me een treinreis. Ik zorg dat ik er klaar voor ben.");
            await storage.sendMessage(maxChat.id, max.id, "Stuur me nog even de definitieve cijfers voor maandag?");
            await storage.sendMessage(maxChat.id, existing.id, "Doe ik. Ik stuur ze uiterlijk vrijdagmiddag via W€spr Transfer.");
          }

          // --- Lukas ---
          let lukasChat = chats.find((c: any) => c.name === "Lukas Van Der Berg");
          if (!lukasChat && lukas) {
            lukasChat = await storage.createChat({ isGroup: false, memberIds: [existing.id, lukas.id] });
          }
          if (lukasChat && lukas && await msgCount(lukasChat.id) < 8) {
            await storage.sendMessage(lukasChat.id, lukas.id, "Hey! Was gisteren echt een fijn etentje. We moeten dat vaker doen.");
            await storage.sendMessage(lukasChat.id, existing.id, "Absoluut, heel gezellig. Dat restaurant in de Jordaan was ook echt top.");
            await storage.sendMessage(lukasChat.id, lukas.id, "Die ceviche... 😍 Ik ga dat recept proberen te achterhalen.");
            await storage.sendMessage(lukasChat.id, existing.id, "Haha succes! Trouwens, had jij al nagedacht over dat consultancy voorstel?");
            await storage.sendMessage(lukasChat.id, lukas.id, "Ja, ik heb er wat op papier staan. Kunnen we volgende week afspreken?");
            await storage.sendMessage(lukasChat.id, existing.id, "Dinsdag of woensdag lukt me het best.");
            await storage.sendMessage(lukasChat.id, lukas.id, "Woensdag 10u? Dan kunnen we daarna ook nog even lunchen.");
            await storage.sendMessage(lukasChat.id, existing.id, "Staat in de agenda! Tot dan 👍");
          }

          // --- Groepschat: Europa Vrienden ---
          const groupChats = chats.filter((c: any) => c.isGroup && c.name === "Europa Vrienden");
          if (groupChats.length === 0 && sophie && max && lukas) {
            const groupChat = await storage.createChat({ isGroup: true, name: "Europa Vrienden", memberIds: [existing.id, sophie.id, max.id, lukas.id] });
            await storage.sendMessage(groupChat.id, sophie.id, "Hallo iedereen! 👋 Leuk dat we allemaal op W€spr zitten.");
            await storage.sendMessage(groupChat.id, max.id, "Eindelijk een fatsoenlijke Europese app. Hoog tijd.");
            await storage.sendMessage(groupChat.id, lukas.id, "Helemaal mee eens. Geen Amerikaanse big tech meer nodig 💪");
            await storage.sendMessage(groupChat.id, existing.id, "Wie heeft er zin in een etentje volgende maand? Amsterdam of Brussel?");
            await storage.sendMessage(groupChat.id, sophie.id, "Amsterdam! Ik kom er graag naartoe.");
            await storage.sendMessage(groupChat.id, max.id, "Ik ook. Berlijn–Amsterdam is maar 6 uur met de trein.");
            await storage.sendMessage(groupChat.id, lukas.id, "Dan regel ik wel een goed restaurant. Ik ken de stad als mijn broekzak 😄");
          }

          console.log("Seed: chats content verified");
        } catch (e: any) { console.error("Seed: chat creation error:", e?.message); }

        await db.update(users).set({ walletBalance: 423050 }).where(eq(users.id, existing.id));

        const receiptMap: Record<string, any> = {
          "Albert Heijn Nijmegen": {
            merchant: { name: "Albert Heijn", address: "Marikenstraat 12", city: "Nijmegen", kvk: "35012085", btw: "NL001606080B01" },
            items: [
              { description: "AH Halfvolle melk 1L", qty: 2, unitPrice: 119, total: 238 },
              { description: "AH Pindakaas naturel 350g", qty: 1, unitPrice: 239, total: 239 },
              { description: "Brinta volkoren 500g", qty: 1, unitPrice: 269, total: 269 },
              { description: "AH Appels Elstar 1kg", qty: 1, unitPrice: 249, total: 249 },
              { description: "AH Toiletpapier 8 rollen", qty: 1, unitPrice: 255, total: 255 },
            ],
            subtotal: 1033, vatRate: 9, vatAmount: 217, total: 1250,
            note: "AH Bonuskaart toegepast. Bedankt voor uw bezoek!"
          },
          "Shell Tankstation A73": {
            merchant: { name: "Shell Nederland B.V.", address: "A73 Afrit Nijmegen-Zuid", city: "Nijmegen", kvk: "24259856", btw: "NL004770532B01" },
            items: [
              { description: "Euro 95 E10 (18,42L x \u20AC1,899/L)", qty: 1, unitPrice: 3499, total: 3499 },
            ],
            subtotal: 2892, vatRate: 21, vatAmount: 607, total: 3499,
            note: "Pompnummer: 4. Shell ClubSmart punten: +35"
          },
          "Sophie Laurent": {
            merchant: { name: "Sophie Laurent", address: "", city: "" },
            items: [
              { description: "Tikkie: Etentje vorige week vrijdag", qty: 1, unitPrice: 15000, total: 15000 },
            ],
            subtotal: 15000, vatRate: 0, vatAmount: 0, total: 15000,
            note: "Betaling ontvangen via W€spr Pay. Merci Sophie!"
          },
          "Starbucks Arnhem": {
            merchant: { name: "Starbucks Coffee", address: "Ketelstraat 2", city: "Arnhem", kvk: "34188961", btw: "NL812093761B01" },
            items: [
              { description: "Caramel Macchiato Grande", qty: 1, unitPrice: 520, total: 520 },
              { description: "Chocolate Chip Cookie", qty: 1, unitPrice: 295, total: 295 },
              { description: "Extra shot espresso", qty: 1, unitPrice: 80, total: 80 },
            ],
            subtotal: 740, vatRate: 21, vatAmount: 155, total: 895,
            note: "Starbucks Rewards: 12 sterren verdiend"
          },
          "Bol.com Bestelling": {
            merchant: { name: "bol.com b.v.", address: "Papendorpseweg 100", city: "Utrecht", kvk: "30118240", btw: "NL805625069B01" },
            items: [
              { description: "Sony WH-1000XM5 Over-Ear Koptelefoon - Zwart", qty: 1, unitPrice: 4999, total: 4999 },
              { description: "Beschermhoes koptelefoon hard case", qty: 1, unitPrice: 799, total: 799 },
              { description: "Verzendkosten (Select voordeel)", qty: 1, unitPrice: 0, total: 0 },
              { description: "Welkomstkorting -5%", qty: 1, unitPrice: -299, total: -299 },
            ],
            subtotal: 4953, vatRate: 21, vatAmount: 1037, total: 5990,
            note: "Bestelnr: 2026-0301-8842. Verwachte levering: 02-03-2026. bol.com Select actief."
          },
          "Salaris Februari": {
            merchant: { name: "Werkgever B.V.", address: "Zuidas 100", city: "Amsterdam", kvk: "12345678", btw: "NL123456789B01" },
            items: [
              { description: "Netto salaris februari 2026", qty: 1, unitPrice: 210000, total: 210000 },
              { description: "Reiskostenvergoeding", qty: 1, unitPrice: 21500, total: 21500 },
              { description: "Thuiswerkvergoeding (20 dgn)", qty: 20, unitPrice: 300, total: 6000 },
              { description: "Vakantiegeld reserve", qty: 1, unitPrice: 12500, total: 12500 },
            ],
            subtotal: 250000, vatRate: 0, vatAmount: 0, total: 250000,
            note: "Salarisbetaling periode februari 2026. Loonheffing en premies reeds verrekend."
          },
          "Thuisbezorgd.nl": {
            merchant: { name: "Thuisbezorgd.nl", address: "Oosterdoksstraat 80", city: "Amsterdam", kvk: "27185806", btw: "NL819515498B01" },
            items: [
              { description: "Pizza Margherita (La Dolce Vita)", qty: 1, unitPrice: 1050, total: 1050 },
              { description: "Tiramisu huisgemaakt", qty: 1, unitPrice: 550, total: 550 },
              { description: "Coca-Cola 330ml", qty: 2, unitPrice: 150, total: 300 },
              { description: "Bezorgkosten", qty: 1, unitPrice: 200, total: 200 },
            ],
            subtotal: 1736, vatRate: 21, vatAmount: 364, total: 2100,
            note: "Bestelling bij La Dolce Vita, Nijmegen. Bezorgd om 19:32."
          },
          "Sportschool Berg & Dal": {
            merchant: { name: "Sportschool Berg & Dal", address: "Oude Kleefsebaan 15", city: "Berg en Dal", kvk: "09876543", btw: "NL987654321B01" },
            items: [
              { description: "Maandabonnement fitness (maart 2026)", qty: 1, unitPrice: 3500, total: 3500 },
              { description: "Groepsles spinning (4x)", qty: 4, unitPrice: 250, total: 1000 },
            ],
            subtotal: 3719, vatRate: 21, vatAmount: 781, total: 4500,
            note: "Lidmaatschap verlengd t/m 31-03-2026. Strippenkaart: 6 lessen resterend."
          },
          "Jumbo Supermarkt": {
            merchant: { name: "Jumbo Supermarkten B.V.", address: "St. Annastraat 78", city: "Nijmegen", kvk: "17155837", btw: "NL009921165B01" },
            items: [
              { description: "Jumbo Kiloknaller kipfilet 1kg", qty: 1, unitPrice: 499, total: 499 },
              { description: "Jumbo Verse pasta penne 500g", qty: 1, unitPrice: 179, total: 179 },
              { description: "Barilla pastasaus arrabiata", qty: 1, unitPrice: 219, total: 219 },
              { description: "Jumbo Geraspte kaas 200g", qty: 1, unitPrice: 249, total: 249 },
              { description: "Hertog Jan pils 6-pack", qty: 1, unitPrice: 429, total: 429 },
            ],
            subtotal: 1302, vatRate: 9, vatAmount: 273, total: 1575,
            note: "Extra's gespaard: 2 zegels voor gratis pannenset"
          },
          "Max van der Berg": {
            merchant: { name: "Max van der Berg", address: "", city: "" },
            items: [
              { description: "Terugbetaling: Gedeelde Uber naar concert", qty: 1, unitPrice: 5000, total: 5000 },
            ],
            subtotal: 5000, vatRate: 0, vatAmount: 0, total: 5000,
            note: "Bedrag ontvangen via W€spr Pay"
          },
          "Ziggo Abonnement": {
            merchant: { name: "VodafoneZiggo Group B.V.", address: "Boven Vredenburgpassage 128", city: "Utrecht", kvk: "65820525", btw: "NL856487645B01" },
            items: [
              { description: "Ziggo Internet Start (200 Mbit/s)", qty: 1, unitPrice: 4000, total: 4000 },
              { description: "Ziggo TV Standaard pakket", qty: 1, unitPrice: 3500, total: 3500 },
              { description: "Ziggo Alles-in-1 bundel korting", qty: 1, unitPrice: -1500, total: -1500 },
              { description: "Interactieve TV+ module", qty: 1, unitPrice: 600, total: 600 },
              { description: "Mediabox Next huur", qty: 1, unitPrice: 0, total: 0 },
              { description: "WiFi versterker huur", qty: 1, unitPrice: 300, total: 300 },
            ],
            subtotal: 10331, vatRate: 21, vatAmount: 2169, total: 12500,
            note: "Factuur maart 2026. Contractperiode: 12 maanden (6 resterend). Klantnr: ZG-2841992."
          },
          "Restaurant De Hemel": {
            merchant: { name: "Restaurant De Hemel", address: "Franseplaats 1", city: "Nijmegen", kvk: "41054782", btw: "NL814876329B01" },
            items: [
              { description: "Amuse: Tonijn tartaar met yuzu", qty: 2, unitPrice: 0, total: 0 },
              { description: "Voorgerecht: Gamba's in knoflookolie", qty: 1, unitPrice: 1450, total: 1450 },
              { description: "Voorgerecht: Carpaccio van ree", qty: 1, unitPrice: 1550, total: 1550 },
              { description: "Hoofdgerecht: Ossenhaas met truffel jus", qty: 1, unitPrice: 3250, total: 3250 },
              { description: "Hoofdgerecht: Zeebaars met saffraan risotto", qty: 1, unitPrice: 2850, total: 2850 },
              { description: "Dessert: Cr\u00E8me br\u00FBl\u00E9e", qty: 2, unitPrice: 850, total: 1700 },
              { description: "Fles Sancerre Loire 2024", qty: 1, unitPrice: 3800, total: 3800 },
              { description: "Espresso", qty: 2, unitPrice: 300, total: 600 },
              { description: "Service (niet inbegrepen)", qty: 1, unitPrice: -6250, total: -6250 },
            ],
            subtotal: 7397, vatRate: 21, vatAmount: 1553, total: 8950,
            note: "Tafel 7 | 2 personen | Ober: Jan. Bedankt voor uw bezoek aan De Hemel!"
          },
        };

        const existingTxs = await storage.getTransactions(existing.id);
        if (existingTxs.length === 0) {
          const demoTxs = [
            { type: "debit", amount: 1250, description: "Albert Heijn Nijmegen", daysAgo: 0 },
            { type: "debit", amount: 3499, description: "Shell Tankstation A73", daysAgo: 1 },
            { type: "credit", amount: 15000, description: "Sophie Laurent", daysAgo: 1 },
            { type: "debit", amount: 895, description: "Starbucks Arnhem", daysAgo: 2 },
            { type: "debit", amount: 5990, description: "Bol.com Bestelling", daysAgo: 3 },
            { type: "credit", amount: 250000, description: "Salaris Februari", daysAgo: 5 },
            { type: "debit", amount: 2100, description: "Thuisbezorgd.nl", daysAgo: 6 },
            { type: "debit", amount: 4500, description: "Sportschool Berg & Dal", daysAgo: 7 },
            { type: "debit", amount: 1575, description: "Jumbo Supermarkt", daysAgo: 8 },
            { type: "credit", amount: 5000, description: "Max van der Berg", daysAgo: 10 },
            { type: "debit", amount: 12500, description: "Ziggo Abonnement", daysAgo: 14 },
            { type: "debit", amount: 8950, description: "Restaurant De Hemel", daysAgo: 18 },
          ];
          for (const t of demoTxs) {
            const [tx] = await db.insert(transactions).values({
              userId: existing.id,
              type: t.type,
              amount: t.amount,
              description: t.description,
              receiptData: receiptMap[t.description] ? JSON.stringify(receiptMap[t.description]) : null,
            }).returning();
            if (tx && t.daysAgo > 0) {
              const pastDate = new Date(Date.now() - t.daysAgo * 86400000);
              await db.update(transactions).set({ createdAt: pastDate }).where(eq(transactions.id, tx.id));
            }
          }
          console.log("Demo transactions seeded");
        } else {
          for (const etx of existingTxs) {
            if (!etx.receiptData && receiptMap[etx.description]) {
              await db.update(transactions).set({ receiptData: JSON.stringify(receiptMap[etx.description]) }).where(eq(transactions.id, etx.id));
            }
          }
          console.log("Demo transactions receipt data updated");
        }

        return res.json({ message: "Seed updated (contacts and chats checked)" });
      }

      const seedHash = await bcrypt.hash("password", 10);

      const ges = await storage.createUser({
        username: "ges",
        email: "ges@w€spr.eu",
        password: seedHash,
        displayName: "Ges",
        auraId: "w€spr_eu_8291_" + Date.now(),
        avatar: "/images/avatar-1.png",
        bio: "W€spr gebruiker in Europa",
      });

      const sophie = await storage.createUser({
        username: "sophie",
        email: "sophie@w€spr.eu",
        password: seedHash,
        displayName: "Sophie Laurent",
        auraId: "w€spr_eu_1042",
        avatar: "/images/avatar-2.png",
        bio: "Creative designer in Paris",
      });

      const max = await storage.createUser({
        username: "maximilian",
        email: "max@w€spr.eu",
        password: seedHash,
        displayName: "Maximilian Becker",
        auraId: "w€spr_eu_3387",
        avatar: "/images/avatar-3.png",
        bio: "Tech executive in Berlin",
      });

      const lukas = await storage.createUser({
        username: "lukas",
        email: "lukas@w€spr.eu",
        password: seedHash,
        displayName: "Lukas Van Der Berg",
        auraId: "w€spr_eu_7765",
        avatar: "/images/avatar-1.png",
        bio: "Consultant in Amsterdam",
      });

      const auraBot = await storage.createUser({
        username: "w€spr_team",
        email: "team@w€spr.eu",
        password: seedHash,
        displayName: "W€spr Team",
        auraId: "w€spr_official_001",
        avatar: "/favicon.png",
        bio: "Official W€spr support",
      });

      await storage.addContact(ges.id, sophie.id);
      await storage.addContact(ges.id, max.id);
      await storage.addContact(ges.id, lukas.id);

      const officialChat = await storage.createChat({
        isGroup: false,
        isOfficial: true,
        name: "W€spr Team",
        avatar: "/favicon.png",
        memberIds: [ges.id, auraBot.id],
      });

      const sophieChat = await storage.createChat({
        isGroup: false,
        memberIds: [ges.id, sophie.id],
      });

      const maxChat = await storage.createChat({
        isGroup: false,
        memberIds: [ges.id, max.id],
      });

      const lukasChat = await storage.createChat({
        isGroup: false,
        memberIds: [ges.id, lukas.id],
      });

      await storage.sendMessage(officialChat.id, auraBot.id, "Welcome to W€spr, your secure European super app!");
      await storage.sendMessage(officialChat.id, auraBot.id, "Privacy en veiligheid staan bij ons centraal. Ontdek alle mogelijkheden!");
      await storage.sendMessage(sophieChat.id, sophie.id, "Hey! Hoe gaat het?");
      await storage.sendMessage(sophieChat.id, ges.id, "Goed! En met jou?");
      await storage.sendMessage(sophieChat.id, sophie.id, "Are we still meeting at the café in Le Marais?");
      await storage.sendMessage(maxChat.id, max.id, "I've sent you the files via W€spr Transfer.");
      await storage.sendMessage(maxChat.id, ges.id, "Got them, thanks Maximilian!");
      await storage.sendMessage(lukasChat.id, lukas.id, "Great catching up yesterday! Let's do it again soon.");

      const post1 = await storage.createPost(
        sophie.id,
        "Autumn in Paris never gets old. Grabbed a coffee at my favorite spot in Le Marais before heading to the design agency. Hope everyone is having a productive week!"
      );
      await storage.likePost(post1.id, lukas.id);
      await storage.likePost(post1.id, max.id);
      await storage.addComment(post1.id, max.id, "Looks beautiful! We should catch up soon.");

      const post2 = await storage.createPost(
        max.id,
        "Just wrapped up our Q3 strategic review. Proud of the team's resilience and focus on European data sovereignty. Building the future of secure tech."
      );
      await storage.likePost(post2.id, sophie.id);
      await storage.likePost(post2.id, lukas.id);

      await storage.createTransaction(ges.id, "credit", 500000, "Salaristorting", JSON.stringify({
        merchant: { name: "Werkgever B.V.", address: "Zuidas 100", city: "Amsterdam", kvk: "12345678", btw: "NL123456789B01" },
        items: [
          { description: "Netto salaris maart 2026", qty: 1, unitPrice: 380000, total: 380000 },
          { description: "Vakantiegeld reserve", qty: 1, unitPrice: 30000, total: 30000 },
          { description: "Reiskostenvergoeding", qty: 1, unitPrice: 21500, total: 21500 },
          { description: "Thuiswerkvergoeding", qty: 22, unitPrice: 300, total: 6600 },
          { description: "Pensioen werkgeversdeel", qty: 1, unitPrice: 61900, total: 61900 },
        ],
        subtotal: 500000, vatRate: 0, vatAmount: 0, total: 500000,
        note: "Salarisbetaling periode maart 2026. Loonheffing en premies zijn reeds verrekend."
      }));
      await storage.createTransaction(ges.id, "debit", 2499, "Albert Heijn betaling", JSON.stringify({
        merchant: { name: "Albert Heijn", address: "Overtoom 412", city: "Amsterdam", kvk: "35012085", btw: "NL001606080B01" },
        items: [
          { description: "AH Verse jus d'orange 1L", qty: 1, unitPrice: 269, total: 269 },
          { description: "AH Brood volkoren", qty: 2, unitPrice: 179, total: 358 },
          { description: "AH Kaas jong belegen plakken", qty: 1, unitPrice: 329, total: 329 },
          { description: "Chiquita bananen 1kg", qty: 1, unitPrice: 199, total: 199 },
          { description: "Optimel drinkyoghurt aardbei", qty: 2, unitPrice: 149, total: 298 },
          { description: "Douwe Egberts koffie 500g", qty: 1, unitPrice: 549, total: 549 },
          { description: "AH Scharrelei 10st", qty: 1, unitPrice: 289, total: 289 },
          { description: "Ariel wasmiddel pods 16st", qty: 1, unitPrice: 208, total: 208 },
        ],
        subtotal: 2065, vatRate: 9, vatAmount: 434, total: 2499,
        note: "AH Bonuskaart toegepast. Bedankt voor uw bezoek!"
      }));
      await storage.createTransaction(ges.id, "debit", 1500, "NS Treinkaart", JSON.stringify({
        merchant: { name: "NS - Nederlandse Spoorwegen", address: "Laan van Puntenburg 100", city: "Utrecht", kvk: "30012558", btw: "NL001119782B01" },
        items: [
          { description: "Enkele reis Amsterdam Centraal → Den Haag Centraal", qty: 1, unitPrice: 1290, total: 1290 },
          { description: "Toeslag Dal Voordeel korting (40%)", qty: 1, unitPrice: -516, total: -516 },
          { description: "OV-chipkaart transactiekosten", qty: 1, unitPrice: 0, total: 0 },
        ],
        subtotal: 1274, vatRate: 9, vatAmount: 226, total: 1500,
        note: "Reis op 01-03-2026, vertrek 08:15 aankomst 09:02. NS Dal Voordeel abonnement actief.",
        travelDetails: { from: "Amsterdam Centraal", to: "Den Haag Centraal", date: "01-03-2026", departure: "08:15", arrival: "09:02", class: "2e klasse" }
      }));

      for (const item of defaultItems) {
        await storage.createServiceItem(item);
      }

      res.json({ message: "Seed data created successfully" });
    } catch (err: any) {
      console.error("Seed error:", err);
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/proxy", async (req, res) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).json({ message: "Missing url parameter" });
    }

    try {
      let url = new URL(targetUrl);
      const allowedDomains = [
        "ns.nl", "9292.nl", "gvb.nl", "ret.nl", "htm.nl", "ov-chipkaart.nl",
        "schiphol.nl", "klm.nl", "transavia.com", "ryanair.com", "easyjet.com",
        "booking.com", "airbnb.nl", "airbnb.com", "uber.com",
        "bolt.eu", "swapfiets.nl", "felyx.com", "ridecheck.app",
        "tui.nl", "corendon.nl", "anwb.nl",
        "waze.com", "easypark.nl", "flitsmeister.nl", "denhaag.nl",
        "google.com", "google.nl", "q-park.nl", "stellarium-web.org",
        "earth.google.com", "maps.google.com",
        "digid.nl", "overheid.nl", "belastingdienst.nl",
        "uwv.nl", "duo.nl", "thuisarts.nl", "apotheek.nl", "zorgwijzer.nl", "zorgkaartnederland.nl",
        "ah.nl", "starbucks.nl", "zalando.nl", "hema.nl", "kruidvat.nl", "brood.net", "canva.com",
        "thuisbezorgd.nl", "ubereats.com", "flink.com",
        "ticketmaster.nl", "pathe.nl", "museumkaart.nl",
        "chess.com", "boardgamearena.com", "puzzlegarage.com",
        "bol.com", "mijngezondheid.net", "rivm.nl",
        "goflink.com", "jamezz.com", "vivino.com",
        "nordvpn.com", "kpn.com", "datumprikker.nl", "signal.org",
        "nos.nl", "nu.nl", "fd.nl", "bnr.nl", "rtlnieuws.nl", "tv.kpn.com", "npo.nl", "volkskrant.nl", "klarna.com",
        "home.saxo", "santander.com", "bloomberg.com", "marketwatch.com", "euronext.com", "revolut.com", "bitvavo.com", "binance.com", "coinbase.com", "base.org", "xe.com", "raisin.nl", "uniswap.org",
        "doctolib.nl", "patientslikeme.com", "medgemak.nl", "thuisarts.nl", "mskcc.org", "beterdichtbij.nl", "richtlijnendatabase.nl",
        "golf.nl", "clubapp.nl", "meetandplay.nl",
        "youtube.com", "shazam.com", "spotify.com", "netflix.com",
        "linkedin.com", "x.com", "twitter.com", "instagram.com", "zoom.us", "microsoft.com",
        "dunea.nl", "belastingen.nl",
        "spms.nl", "pfzw.nl", "abp.nl", "ohra.nl", "izzdoorvgz.nl", "ultrasync.com",
        "enphaseenergy.com", "zonneplan.nl", "rabobank.nl",
        "gemini.google.com", "chat.openai.com", "chat.deepseek.com", "replit.com", "claude.ai",
        "duolingo.com", "studielink.nl", "coursera.org", "translate.google.com", "kimi.ai",
        "elpais.com", "podcasts.apple.com", "apple.com", "deepl.com",
        "gzmtr.com", "12306.cn", "wechat.com", "alipay.com",
        "wix.com", "alibaba.com", "temu.com",
        "ring.com", "interoconnect.com", "keepersecurity.com", "box.com",
        "artsy.net", "saatchiart.com", "funda.nl", "pararius.nl",
        "idealista.com", "yaencontre.com", "pisos.com", "habitaclia.com",
        "kunstveiling.nl", "catawiki.com", "middelheimmuseum.be", "boijmans.nl",
        "buienradar.nl", "weer.nl", "accuweather.com",
        "smartify.org", "artsandculture.google.com", "museumtijdschrift.nl",
        "lens.google.com", "timetomomo.com",
        "apple.com/safari", "google.com/chrome",
        "office.com",
        "haaglandenmc.nl", "mijn.haaglandenmc.nl", "lumc.nl", "mijn.lumc.nl", "erasmusmc.nl", "amsterdamumc.nl", "radboudumc.nl", "mijnradboudumc.nl", "umcg.nl", "mijn.umcg.nl", "umcutrecht.nl", "mijn.umcutrecht.nl", "mumc.nl", "catharinaziekenhuis.nl", "mijn.catharinaziekenhuis.nl", "isala.nl", "mijnisala.nl", "mst.nl", "mijn.mst.nl", "reinierdegraaf.nl", "mijn.reinierdegraaf.nl", "langeland.nl", "hagaziekenhuis.nl", "mijn.hagaziekenhuis.nl", "olvg.nl", "mijnolvg.nl", "antoniusziekenhuis.nl", "rijnstate.nl", "mijn.rijnstate.nl", "jeroenboschziekenhuis.nl", "cwz.nl", "diakonessenhuis.nl", "hix365.nl", "alrijne.nl", "mijn.alrijne.nl", "spaarnegasthuis.nl", "mijnspaarnegasthuis.nl", "dijklander.nl", "nwz.nl", "tergooimc.nl", "tergooi.nl", "bravis.nl", "mijnbravis.nl", "amphia.nl", "mijn.amphia.nl", "etz.nl", "mijnetz.nl", "mcl.nl", "mijnmcl.nl", "meandermc.nl", "mijnmeander.nl", "gelreziekenhuizen.nl", "mijn.gelreziekenhuizen.nl", "franciscus.nl", "bernhoven.nl", "mijn.bernhoven.nl", "ikazia.nl", "zaansmc.nl", "zmc.nl", "zuyderland.nl", "mijn.zuyderland.nl", "mmc.nl", "mijn.mmc.nl", "treant.nl", "mijntreant.nl", "dz.nl", "mijn.dz.nl", "mijnantonius.nl", "florence.com.tr",
        "charite.de", "uk-koeln.de", "lmu-klinikum.de", "mhh.de", "uke.de", "uniklinik-freiburg.de", "klinikum.uni-heidelberg.de", "medizin.uni-tuebingen.de", "ukbonn.de", "uniklinikum-dresden.de",
        "clinicbarcelona.org", "comunidad.madrid", "vallhebron.com", "hospitaluvrocio.es",
        "pitiesalpetriere.aphp.fr", "hegp.aphp.fr", "chu-toulouse.fr", "chu-lyon.fr", "chu-lille.fr", "chu-bordeaux.fr", "chu-nantes.fr", "chru-strasbourg.fr", "ap-hm.fr",
        "uzleuven.be", "uzgent.be", "uzbrussel.be", "uza.be", "saintluc.be", "chuliege.be",
        "karolinska.se", "sahlgrenska.se", "1177.se",
        "rigshospitalet.dk", "auh.dk", "sundhed.dk",
        "oslo-universitetssykehus.no", "helse-bergen.no", "helsenorge.no",
        "hus.fi", "tays.fi", "maisa.fi",
        "hsr.it", "policlinicogemelli.it", "humanitas.it", "meyer.it", "ospedaleniguarda.it", "ospedalesanmartino.it",
        "usz.ch", "insel.ch", "unispital-basel.ch", "chuv.ch", "hug.ch",
        "akhwien.at", "klinikum-graz.at", "tirol-kliniken.at", "gesundheit.gv.at",
        "hopkinsmedicine.org", "mayoclinic.org", "massgeneral.org", "clevelandclinic.org", "my.clevelandclinic.org", "mountsinai.org", "stanfordhealthcare.org", "uclahealth.org", "ucsfhealth.org", "nyulangone.org", "pennmedicine.org", "nm.org", "cedars-sinai.org",
        "bumrungrad.com", "gleneagles.com.sg", "h.u-tokyo.ac.jp", "apollohospitals.com", "mountelizabeth.com.sg", "fortishealthcare.com", "snuh.org", "eng.amc.seoul.kr", "hosp.keio.ac.jp", "ha.org.hk", "www3.ha.org.hk",
        "einstein.br", "hospitalsiriolibanes.org.br",
        "westerncape.gov.za",
        "thermh.org.au", "slhd.nsw.gov.au",
        "stjames.ie", "beaumont.ie", "mater.ie",
        "chln.min-saude.pt", "portal-chsj.min-saude.pt", "servicos.min-saude.pt",
        "acibadem.com.tr", "memorial.com.tr",
        "semmelweis.hu", "fnmotol.cz", "vfn.cz", "su.krakow.pl", "wim.mil.pl", "pacjent.gov.pl", "icfundeni.ro",
        "cuh.nhs.uk", "guysandstthomas.nhs.uk", "ouh.nhs.uk", "royalfree.nhs.uk", "kch.nhs.uk",
        "muhc.ca", "uhn.ca", "sunnybrook.ca",
        "clevelandclinicabudhabi.ae", "kfshrc.edu.sa",
        "rambam.org.il", "eng.sheba.co.il",
        "openstreetmap.org", "tile.openstreetmap.org",
        "googleapis.com", "gstatic.com", "google-analytics.com", "googletagmanager.com", "google.com", "google.nl",
        "fonts.googleapis.com", "fonts.gstatic.com",
        "cdnjs.cloudflare.com", "cdn.jsdelivr.net", "unpkg.com",
        "cookiebot.com", "cookieinformation.com", "onetrust.com", "cookielaw.org",
        "siteimproveanalytics.com", "siteimprove.com",
        "youtube.com", "youtube-nocookie.com", "youtu.be", "ytimg.com",
        "vimeo.com", "vimeocdn.com",
        "cloudflare.com", "cloudflareinsights.com",
        "hotjar.com", "mouseflow.com",
        "jquery.com", "bootstrapcdn.com",
        "chipsoft.com", "chipsoft.nl",
        "apps.hagaziekenhuis.nl", "mijn-services.hagaziekenhuis.nl", "mijn-auth.hagaziekenhuis.nl",
        "typekit.net", "use.typekit.net", "p.typekit.net",
        "facebook.net", "facebook.com", "fbcdn.net",
        "twitter.com", "twimg.com",
        "linkedin.com",
        "bing.com",
        "doubleclick.net",
        "ibm.com",
      ];

      const hostname = url.hostname.replace(/^www\./, "").replace(/^m\./, "");
      const isAllowed = allowedDomains.some(d => hostname === d || hostname.endsWith("." + d));
      if (!isAllowed) {
        console.log(`[proxy] BLOCKED domain: ${hostname} (full url: ${targetUrl})`);
        return res.status(403).json({ message: "Domain not allowed" });
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const baseHeaders: Record<string, string> = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "nl-NL,nl;q=0.9,en-US;q=0.8,en;q=0.7",
        "Accept-Encoding": "identity",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
      };

      let currentUrl = targetUrl;
      let response: Response;
      let cookies: string[] = [];
      let maxRedirects = 10;

      while (true) {
        const hdrs = { ...baseHeaders } as Record<string, string>;
        if (cookies.length > 0) {
          hdrs["Cookie"] = cookies.join("; ");
        }
        response = await fetch(currentUrl, {
          headers: hdrs,
          redirect: "manual",
          signal: controller.signal,
        });
        const setCookies = response.headers.getSetCookie?.() || [];
        for (const sc of setCookies) {
          const nameVal = sc.split(";")[0];
          const name = nameVal.split("=")[0];
          cookies = cookies.filter(c => !c.startsWith(name + "="));
          cookies.push(nameVal);
        }
        const location = response.headers.get("location");
        if (location && (response.status >= 300 && response.status < 400) && maxRedirects > 0) {
          maxRedirects--;
          currentUrl = new URL(location, currentUrl).href;
          continue;
        }
        break;
      }

      clearTimeout(timeout);
      const finalUrl = new URL(currentUrl);
      url = finalUrl;

      const contentType = response.headers.get("content-type") || "text/html";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.setHeader("X-Frame-Options", "ALLOWALL");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.removeHeader("Content-Security-Policy");
      res.removeHeader("X-Content-Type-Options");
      res.removeHeader("X-XSS-Protection");

      if (contentType.includes("text/html")) {
        let html = await response.text();
        const baseUrl = `${url.protocol}//${url.host}`;
        const proxyPrefix = `/api/proxy?url=`;

        const pageDir = targetUrl.substring(0, targetUrl.lastIndexOf("/") + 1) || baseUrl + "/";
        const toProxyUrl = (resourceUrl: string) => {
          if (!resourceUrl || resourceUrl.startsWith("data:") || resourceUrl.startsWith("blob:") || resourceUrl.startsWith("#") || resourceUrl.startsWith("javascript:")) return resourceUrl;
          resourceUrl = resourceUrl.replace(/&amp;/g, "&");
          if (resourceUrl.startsWith("//")) resourceUrl = "https:" + resourceUrl;
          if (resourceUrl.startsWith("/") && !resourceUrl.startsWith("//")) {
            resourceUrl = baseUrl + resourceUrl;
          } else if (!resourceUrl.startsWith("http")) {
            try { resourceUrl = new URL(resourceUrl, pageDir).href; } catch { return resourceUrl; }
          }
          if (resourceUrl.startsWith("http")) {
            return proxyPrefix + encodeURIComponent(resourceUrl);
          }
          return resourceUrl;
        };

        html = html.replace(/<meta[^>]*http-equiv\s*=\s*["']?Content-Security-Policy["']?[^>]*>/gi, "");
        html = html.replace(/<meta[^>]*http-equiv\s*=\s*["']?X-Frame-Options["']?[^>]*>/gi, "");

        html = html.replace(
          /(<link[^>]*\shref\s*=\s*["'])([^"']+)(["'][^>]*>)/gi,
          (_m, pre, href, post) => pre + toProxyUrl(href) + post
        );
        html = html.replace(
          /(<script[^>]*\ssrc\s*=\s*["'])([^"']+)(["'][^>]*>)/gi,
          (_m, pre, src, post) => pre + toProxyUrl(src) + post
        );
        html = html.replace(
          /(<img[^>]*\ssrc\s*=\s*["'])([^"']+)(["'][^>]*>)/gi,
          (_m, pre, src, post) => pre + toProxyUrl(src) + post
        );
        html = html.replace(
          /(<source[^>]*\ssrc\s*=\s*["'])([^"']+)(["'][^>]*>)/gi,
          (_m, pre, src, post) => pre + toProxyUrl(src) + post
        );
        html = html.replace(
          /(<a[^>]*\shref\s*=\s*["'])(\/?(?!#|javascript:|mailto:|tel:|data:|blob:)([^"']+))(["'])/gi,
          (_m, pre, href, _inner, post) => {
            if (href.startsWith("/api/proxy")) return pre + href + post;
            return pre + toProxyUrl(href) + post;
          }
        );
        html = html.replace(
          /(<form[^>]*\saction\s*=\s*["'])([^"']+)(["'])/gi,
          (_m, pre, action, post) => pre + toProxyUrl(action) + post
        );

        html = html.replace(/<base[^>]*>/gi, "");

        html = html.replace(
          /(<style[^>]*>)([\s\S]*?)(<\/style>)/gi,
          (_m, open, css, close) => {
            const rewritten = css.replace(
              /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi,
              (_um: string, q: string, rawUrl: string) => {
                if (rawUrl.startsWith("data:") || rawUrl.startsWith("blob:") || rawUrl.startsWith("#")) return _um;
                const decoded = rawUrl.replace(/&amp;/g, "&");
                if (decoded.startsWith("http")) return `url(${q}${proxyPrefix}${encodeURIComponent(decoded)}${q})`;
                if (decoded.startsWith("/")) return `url(${q}${proxyPrefix}${encodeURIComponent(baseUrl + decoded)}${q})`;
                if (!decoded.startsWith("http")) {
                  try { return `url(${q}${proxyPrefix}${encodeURIComponent(new URL(decoded, pageDir).href)}${q})`; } catch { return _um; }
                }
                return _um;
              }
            );
            return open + rewritten + close;
          }
        );

        html = html.replace(
          /(<[^>]+\s)style\s*=\s*(["'])([\s\S]*?)\2/gi,
          (_m, tagStart, quote, styleContent) => {
            const rewritten = styleContent.replace(
              /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi,
              (_um: string, q: string, rawUrl: string) => {
                if (rawUrl.startsWith("data:") || rawUrl.startsWith("blob:") || rawUrl.startsWith("#") || rawUrl.startsWith("http")) return _um;
                const decoded = rawUrl.replace(/&amp;/g, "&");
                const absUrl = decoded.startsWith("/") ? baseUrl + decoded : (() => { try { return new URL(decoded, pageDir).href; } catch { return decoded; } })();
                return `url(${q}${proxyPrefix}${encodeURIComponent(absUrl)}${q})`;
              }
            );
            return `${tagStart}style=${quote}${rewritten}${quote}`;
          }
        );

        html = html.replace(
          /(<[^>]+\ssrcset\s*=\s*["'])([^"']+)(["'])/gi,
          (_m, pre, srcsetVal, post) => {
            const rewritten = srcsetVal.replace(/(^|,\s*)(\/?(?!data:|blob:|http)[^\s,]+)/g,
              (_sm: string, sep: string, srcUrl: string) => {
                if (srcUrl.startsWith("/")) return sep + proxyPrefix + encodeURIComponent(baseUrl + srcUrl);
                if (!srcUrl.startsWith("http")) {
                  try { return sep + proxyPrefix + encodeURIComponent(new URL(srcUrl, pageDir).href); } catch { return sep + srcUrl; }
                }
                return sep + proxyPrefix + encodeURIComponent(srcUrl);
              }
            );
            return pre + rewritten + post;
          }
        );

        html = html.replace(/<head([^>]*)>/i, `<head$1>
          <script>
            (function() {
              var PROXY = '/api/proxy?url=';
              var BASE = '${baseUrl}';
              var PAGE = '${url.href}';
              try {
                Object.defineProperty(window, 'top', { get: function() { return window; } });
                Object.defineProperty(window, 'parent', { get: function() { return window; } });
                Object.defineProperty(window, 'frameElement', { get: function() { return null; } });
              } catch(e) {}
              try {
                var _pageUrl = new URL(PAGE);
                var _locObj = {
                  href: PAGE, protocol: _pageUrl.protocol, host: _pageUrl.host,
                  hostname: _pageUrl.hostname, port: _pageUrl.port,
                  pathname: _pageUrl.pathname, search: _pageUrl.search,
                  hash: _pageUrl.hash, origin: _pageUrl.origin,
                  assign: function(u) { window.location.href = PROXY + encodeURIComponent(u); },
                  replace: function(u) { window.location.href = PROXY + encodeURIComponent(u); },
                  reload: function() {}, toString: function() { return PAGE; }
                };
                Object.defineProperty(window, 'location', { get: function() { return _locObj; }, configurable: true });
              } catch(e) {}
              function toProxy(u) {
                if (!u || typeof u !== 'string') return u;
                if (u.startsWith('data:') || u.startsWith('blob:') || u.startsWith('javascript:') || u.startsWith('#') || u.startsWith('about:')) return u;
                if (u.startsWith(PROXY) || u.startsWith('/api/proxy')) return u;
                if (u.startsWith('//')) u = 'https:' + u;
                else if (u.startsWith('/') && !u.startsWith('//')) u = BASE + u;
                else if (!u.startsWith('http')) {
                  try { u = new URL(u, PAGE).href; } catch(e) { return u; }
                }
                if (u.startsWith('http')) return PROXY + encodeURIComponent(u);
                return u;
              }
              var origFetch = window.fetch;
              window.fetch = function(input, init) {
                if (typeof input === 'string') {
                  input = toProxy(input);
                } else if (input instanceof Request) {
                  var newUrl = toProxy(input.url);
                  if (newUrl !== input.url) {
                    input = new Request(newUrl, input);
                  }
                }
                return origFetch.call(this, input, init);
              };
              var origXHROpen = XMLHttpRequest.prototype.open;
              XMLHttpRequest.prototype.open = function(method, url) {
                if (typeof url === 'string') arguments[1] = toProxy(url);
                return origXHROpen.apply(this, arguments);
              };
              var origImage = window.Image;
              window.Image = function(w, h) {
                var img = new origImage(w, h);
                var origSrc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
                if (origSrc && origSrc.set) {
                  Object.defineProperty(img, 'src', {
                    set: function(v) { origSrc.set.call(this, toProxy(v)); },
                    get: function() { return origSrc.get.call(this); }
                  });
                }
                return img;
              };
              window.addEventListener('error', function(e) { e.preventDefault(); }, true);
              window.addEventListener('unhandledrejection', function(e) { e.preventDefault(); }, true);
            })();
          </script>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <style>
            body { overflow-x: hidden; max-width: 100vw; }
            img, video, iframe, table { max-width: 100% !important; }
          </style>
          <script>
            document.addEventListener('DOMContentLoaded', function() {
              if (location.href.indexOf('hagaziekenhuis') !== -1 || PAGE.indexOf('hagaziekenhuis') !== -1) {
                setTimeout(function() {
                  var hero = document.querySelector('.hero, [class*="hero"], [class*="banner"], [class*="slider"], .swiper, [class*="carousel"]');
                  if (!hero) {
                    var imgs = document.querySelectorAll('img');
                    for (var i = 0; i < imgs.length; i++) {
                      if (imgs[i].offsetHeight > 150 && imgs[i].offsetWidth > 200) {
                        hero = imgs[i];
                        break;
                      }
                    }
                  }
                  if (hero) {
                    var rect = hero.getBoundingClientRect();
                    var scrollY = window.scrollY || document.documentElement.scrollTop;
                    window.scrollTo({ top: scrollY + rect.top - 10, behavior: 'instant' });
                  }
                }, 800);
              }
            });
          </script>`);

        html = html.replace(/if\s*\(top\s*!==\s*self\)\s*[\{]?[^}]*[\}]?/gi, "/* blocked */");
        html = html.replace(/if\s*\(parent\s*!==\s*self\)\s*[\{]?[^}]*[\}]?/gi, "/* blocked */");
        html = html.replace(/if\s*\(window\s*!==\s*window\.top\)[^;{]*[;{][^}]*\}?/gi, "/* blocked */");
        html = html.replace(/if\s*\(self\s*!==\s*top\)[^;{]*[;{][^}]*\}?/gi, "/* blocked */");
        html = html.replace(/if\s*\(top\.location\s*!==\s*self\.location\)[^;{]*[;{][^}]*\}?/gi, "/* blocked */");
        html = html.replace(/if\s*\(window\.top\s*!==\s*window\.self\)[^;{]*[;{][^}]*\}?/gi, "/* blocked */");
        html = html.replace(/if\s*\(window\.self\s*!==\s*window\.top\)[^;{]*[;{][^}]*\}?/gi, "/* blocked */");
        html = html.replace(/if\s*\(!?\s*window\.frameElement\)[^;{]*[;{][^}]*\}?/gi, "/* blocked */");
        html = html.replace(/top\.location\s*=\s*self\.location/gi, "/* blocked */");
        html = html.replace(/top\.location\s*=\s*location/gi, "/* blocked */");
        html = html.replace(/top\.location\.href\s*=/gi, "/* blocked */ //");
        html = html.replace(/parent\.location\s*=/gi, "/* blocked */ //");
        html = html.replace(/window\.top\.location/gi, "window.location");
        html = html.replace(/top\.location\.replace/gi, "/* blocked */ //");
        html = html.replace(/window\.parent\.location/gi, "window.location");

        res.send(html);
      } else if (contentType.includes("text/css")) {
        let css = await response.text();
        const cssDir = targetUrl.substring(0, targetUrl.lastIndexOf("/") + 1);
        css = css.replace(
          /url\(\s*["']?((?!data:|blob:|#)[^"')]+)["']?\s*\)/gi,
          (_m, rawPath) => {
            if (rawPath.startsWith("data:") || rawPath.startsWith("blob:") || rawPath.startsWith("#")) return _m;
            let resolved: string;
            if (rawPath.startsWith("//")) {
              resolved = "https:" + rawPath;
            } else if (rawPath.startsWith("http")) {
              resolved = rawPath;
            } else if (rawPath.startsWith("/")) {
              resolved = `${url.protocol}//${url.host}${rawPath}`;
            } else {
              try { resolved = new URL(rawPath, cssDir).href; } catch { return _m; }
            }
            return `url(/api/proxy?url=${encodeURIComponent(resolved)})`;
          }
        );
        res.send(css);
      } else if (contentType.includes("javascript") || contentType.includes("text/javascript") || contentType.includes("application/javascript")) {
        let js = await response.text();
        res.setHeader("Content-Type", "application/javascript; charset=utf-8");
        res.send(js);
      } else {
        const buffer = Buffer.from(await response.arrayBuffer());
        res.send(buffer);
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        return res.status(504).json({ message: "Request timeout" });
      }
      res.status(502).json({ message: err.message || "Proxy error" });
    }
  });


  app.post("/api/icon-positions", async (req, res) => {
    try {
      const positions = req.body;
      if (!Array.isArray(positions)) return res.status(400).json({ message: "Invalid data" });
      const fs = await import("fs");
      const path = await import("path");
      const filePath = path.default.resolve("icon-positions.json");
      fs.default.writeFileSync(filePath, JSON.stringify(positions, null, 2));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/icon-positions", async (_req, res) => {
    try {
      const fs = await import("fs");
      const path = await import("path");
      const filePath = path.default.resolve("icon-positions.json");
      if (fs.default.existsSync(filePath)) {
        const data = JSON.parse(fs.default.readFileSync(filePath, "utf-8"));
        res.json(data);
      } else {
        res.json(null);
      }
    } catch {
      res.json(null);
    }
  });

  return httpServer;
}