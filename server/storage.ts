import {
  type User, type InsertUser, type Contact, type Chat, type ChatMember,
  type Message, type Post, type PostLike, type PostComment, type Transaction,
  type ServiceItem, type InsertServiceItem,
  type ServiceCategory, type InsertServiceCategory,
  type PayCategory, type InsertPayCategory,
  users, contacts, chats, chatMembers, messages, posts, postLikes, postComments, transactions, serviceItems, serviceCategories, payCategories,
} from "@shared/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool);

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByAuraId(auraId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getPreferences(userId: string): Promise<Record<string, any>>;
  updatePreferences(userId: string, prefs: Record<string, any>): Promise<void>;
  // Contacts
  getContacts(userId: string): Promise<(Contact & { contact: User })[]>;
  addContact(userId: string, contactId: string): Promise<Contact>;
  removeContact(userId: string, contactId: string): Promise<void>;
  // Chats
  getChatsForUser(userId: string): Promise<any[]>;
  getChat(id: string): Promise<Chat | undefined>;
  createChat(data: { isGroup: boolean; name?: string; avatar?: string; isOfficial?: boolean; memberIds: string[] }): Promise<Chat>;
  // Messages
  getMessages(chatId: string): Promise<(Message & { sender: User })[]>;
  sendMessage(chatId: string, senderId: string, content: string): Promise<Message>;
  // Posts (Moments)
  getPosts(): Promise<any[]>;
  createPost(userId: string, content: string, image?: string): Promise<Post>;
  deletePost(postId: string, userId: string): Promise<void>;
  likePost(postId: string, userId: string): Promise<void>;
  unlikePost(postId: string, userId: string): Promise<void>;
  addComment(postId: string, userId: string, content: string): Promise<PostComment>;
  // Transactions / Wallet
  getTransactions(userId: string): Promise<Transaction[]>;
  createTransaction(userId: string, type: string, amount: number, description: string, receiptData?: string): Promise<Transaction>;
  // Service Items
  getServiceItems(category: string): Promise<ServiceItem[]>;
  getAllServiceItems(): Promise<ServiceItem[]>;
  createServiceItem(item: InsertServiceItem): Promise<ServiceItem>;
  updateServiceItem(id: string, data: Partial<InsertServiceItem>): Promise<ServiceItem>;
  deleteServiceItem(id: string): Promise<void>;
  // Service Categories
  getServiceCategories(): Promise<ServiceCategory[]>;
  createServiceCategory(cat: InsertServiceCategory): Promise<ServiceCategory>;
  updateServiceCategory(id: string, data: Partial<InsertServiceCategory>): Promise<ServiceCategory>;
  deleteServiceCategory(id: string): Promise<void>;
  // Pay Categories
  getPayCategories(): Promise<PayCategory[]>;
  createPayCategory(cat: InsertPayCategory): Promise<PayCategory>;
  updatePayCategory(id: string, data: Partial<InsertPayCategory>): Promise<PayCategory>;
  deletePayCategory(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByAuraId(auraId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.auraId, auraId));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async getPreferences(userId: string): Promise<Record<string, any>> {
    const [user] = await db.select({ preferences: users.preferences }).from(users).where(eq(users.id, userId));
    try { return JSON.parse(user?.preferences || "{}"); } catch { return {}; }
  }

  async updatePreferences(userId: string, prefs: Record<string, any>): Promise<void> {
    await db.update(users).set({ preferences: JSON.stringify(prefs) }).where(eq(users.id, userId));
  }

  // Contacts
  async getContacts(userId: string): Promise<(Contact & { contact: User })[]> {
    const rows = await db
      .select()
      .from(contacts)
      .where(eq(contacts.userId, userId));

    const results: (Contact & { contact: User })[] = [];
    for (const row of rows) {
      const [contactUser] = await db.select().from(users).where(eq(users.id, row.contactId));
      if (contactUser) {
        results.push({ ...row, contact: contactUser });
      }
    }
    return results;
  }

  async addContact(userId: string, contactId: string): Promise<Contact> {
    const [contact] = await db.insert(contacts).values({ userId, contactId }).returning();
    return contact;
  }

  async removeContact(userId: string, contactId: string): Promise<void> {
    await db.delete(contacts).where(and(eq(contacts.userId, userId), eq(contacts.contactId, contactId)));
  }

  // Chats
  async getChatsForUser(userId: string): Promise<any[]> {
    const memberships = await db.select().from(chatMembers).where(eq(chatMembers.userId, userId));
    const chatIds = memberships.map(m => m.chatId);
    if (chatIds.length === 0) return [];

    const chatRows = await db.select().from(chats).where(inArray(chats.id, chatIds));

    const results = [];
    for (const chat of chatRows) {
      // Get last message
      const [lastMsg] = await db
        .select()
        .from(messages)
        .where(eq(messages.chatId, chat.id))
        .orderBy(desc(messages.sentAt))
        .limit(1);

      // Count unread (simplified: all messages not from this user)
      const unreadMsgs = await db
        .select()
        .from(messages)
        .where(eq(messages.chatId, chat.id));
      const unread = unreadMsgs.filter(m => m.senderId !== userId).length;

      // For 1:1 chats, get the other user's info
      let otherUser: User | undefined;
      if (!chat.isGroup) {
        const otherMember = memberships.find(m => m.chatId === chat.id);
        const allMembers = await db.select().from(chatMembers).where(eq(chatMembers.chatId, chat.id));
        const otherId = allMembers.find(m => m.userId !== userId)?.userId;
        if (otherId) {
          const [u] = await db.select().from(users).where(eq(users.id, otherId));
          otherUser = u;
        }
      }

      results.push({
        ...chat,
        name: chat.isGroup ? chat.name : otherUser?.displayName || "Unknown",
        avatar: chat.isGroup ? chat.avatar : otherUser?.avatar || null,
        lastMessage: lastMsg?.content || "",
        lastMessageTime: lastMsg?.sentAt || null,
        unread: Math.min(unread, 9),
      });
    }

    // Sort by last message time
    results.sort((a, b) => {
      if (!a.lastMessageTime) return 1;
      if (!b.lastMessageTime) return -1;
      return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
    });

    return results;
  }

  async getChat(id: string): Promise<Chat | undefined> {
    const [chat] = await db.select().from(chats).where(eq(chats.id, id));
    return chat;
  }

  async createChat(data: { isGroup: boolean; name?: string; avatar?: string; isOfficial?: boolean; memberIds: string[] }): Promise<Chat> {
    const [chat] = await db.insert(chats).values({
      isGroup: data.isGroup,
      name: data.name || null,
      avatar: data.avatar || null,
      isOfficial: data.isOfficial || false,
    }).returning();

    for (const memberId of data.memberIds) {
      await db.insert(chatMembers).values({ chatId: chat.id, userId: memberId });
    }

    return chat;
  }

  // Messages
  async getMessages(chatId: string): Promise<(Message & { sender: User })[]> {
    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(messages.sentAt);

    const results: (Message & { sender: User })[] = [];
    for (const msg of msgs) {
      const [sender] = await db.select().from(users).where(eq(users.id, msg.senderId));
      if (sender) results.push({ ...msg, sender });
    }
    return results;
  }

  async sendMessage(chatId: string, senderId: string, content: string): Promise<Message> {
    const [msg] = await db.insert(messages).values({ chatId, senderId, content }).returning();
    return msg;
  }

  // Posts (Moments)
  async getPosts(): Promise<any[]> {
    const allPosts = await db.select().from(posts).orderBy(desc(posts.createdAt));

    const results = [];
    for (const post of allPosts) {
      const [user] = await db.select().from(users).where(eq(users.id, post.userId));
      const likes = await db.select().from(postLikes).where(eq(postLikes.postId, post.id));
      const comments = await db.select().from(postComments).where(eq(postComments.postId, post.id));

      const likeUsers: string[] = [];
      for (const like of likes) {
        const [u] = await db.select().from(users).where(eq(users.id, like.userId));
        if (u) likeUsers.push(u.displayName);
      }

      const commentData = [];
      for (const comment of comments) {
        const [u] = await db.select().from(users).where(eq(users.id, comment.userId));
        if (u) commentData.push({ user: u.displayName, text: comment.content });
      }

      results.push({
        ...post,
        user: { name: user?.displayName || "Unknown", avatar: user?.avatar || null },
        likes: likeUsers,
        likedUserIds: likes.map(l => l.userId),
        comments: commentData,
      });
    }

    return results;
  }

  async createPost(userId: string, content: string, image?: string): Promise<Post> {
    const [post] = await db.insert(posts).values({ userId, content, image: image || null }).returning();
    return post;
  }

  async deletePost(postId: string, userId: string): Promise<void> {
    const [post] = await db.select({ id: posts.id }).from(posts).where(and(eq(posts.id, postId), eq(posts.userId, userId)));
    if (!post) return;
    await db.delete(postLikes).where(eq(postLikes.postId, postId));
    await db.delete(postComments).where(eq(postComments.postId, postId));
    await db.delete(posts).where(eq(posts.id, postId));
  }

  async likePost(postId: string, userId: string): Promise<void> {
    const existing = await db.select({ id: postLikes.id }).from(postLikes).where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));
    if (existing.length === 0) {
      await db.insert(postLikes).values({ postId, userId });
    }
  }

  async unlikePost(postId: string, userId: string): Promise<void> {
    await db.delete(postLikes).where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));
  }

  async addComment(postId: string, userId: string, content: string): Promise<PostComment> {
    const [comment] = await db.insert(postComments).values({ postId, userId, content }).returning();
    return comment;
  }

  // Transactions
  async getTransactions(userId: string): Promise<Transaction[]> {
    return db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.createdAt));
  }

  async createTransaction(userId: string, type: string, amount: number, description: string, receiptData?: string): Promise<Transaction> {
    const [tx] = await db.insert(transactions).values({ userId, type, amount, description, receiptData: receiptData || null }).returning();
    // Update wallet balance
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (user) {
      const newBalance = type === "credit" ? user.walletBalance + amount : user.walletBalance - amount;
      await db.update(users).set({ walletBalance: newBalance }).where(eq(users.id, userId));
    }
    return tx;
  }

  // Service Items
  async getServiceItems(category: string): Promise<ServiceItem[]> {
    return db.select().from(serviceItems).where(eq(serviceItems.category, category)).orderBy(serviceItems.createdAt);
  }

  async getAllServiceItems(): Promise<ServiceItem[]> {
    return db.select().from(serviceItems).orderBy(serviceItems.createdAt);
  }

  async createServiceItem(item: InsertServiceItem): Promise<ServiceItem> {
    const [created] = await db.insert(serviceItems).values(item).returning();
    return created;
  }

  async updateServiceItem(id: string, data: Partial<InsertServiceItem>): Promise<ServiceItem> {
    const [updated] = await db.update(serviceItems).set(data).where(eq(serviceItems.id, id)).returning();
    return updated;
  }

  async deleteServiceItem(id: string): Promise<void> {
    await db.delete(serviceItems).where(eq(serviceItems.id, id));
  }

  // Service Categories
  async getServiceCategories(): Promise<ServiceCategory[]> {
    return db.select().from(serviceCategories).orderBy(serviceCategories.sortOrder);
  }

  async createServiceCategory(cat: InsertServiceCategory): Promise<ServiceCategory> {
    const [created] = await db.insert(serviceCategories).values(cat).returning();
    return created;
  }

  async updateServiceCategory(id: string, data: Partial<InsertServiceCategory>): Promise<ServiceCategory> {
    const [updated] = await db.update(serviceCategories).set(data).where(eq(serviceCategories.id, id)).returning();
    return updated;
  }

  async deleteServiceCategory(id: string): Promise<void> {
    const [cat] = await db.select().from(serviceCategories).where(eq(serviceCategories.id, id));
    if (cat) {
      await db.delete(serviceItems).where(eq(serviceItems.category, cat.key));
      await db.delete(serviceCategories).where(eq(serviceCategories.id, id));
    }
  }

  async getPayCategories(): Promise<PayCategory[]> {
    return db.select().from(payCategories).orderBy(payCategories.sortOrder);
  }

  async createPayCategory(cat: InsertPayCategory): Promise<PayCategory> {
    const [created] = await db.insert(payCategories).values(cat).returning();
    return created;
  }

  async updatePayCategory(id: string, data: Partial<InsertPayCategory>): Promise<PayCategory> {
    const [updated] = await db.update(payCategories).set(data).where(eq(payCategories.id, id)).returning();
    return updated;
  }

  async deletePayCategory(id: string): Promise<void> {
    await db.delete(payCategories).where(eq(payCategories.id, id));
  }
}

export const storage = new DatabaseStorage();