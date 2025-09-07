var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express3 from "express";

// server/routes.ts
import express from "express";
import { createServer } from "http";

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  attachments: () => attachments,
  forums: () => forums,
  insertAttachmentSchema: () => insertAttachmentSchema,
  insertForumSchema: () => insertForumSchema,
  insertPostSchema: () => insertPostSchema,
  insertReplySchema: () => insertReplySchema,
  insertUserSchema: () => insertUserSchema,
  loginSchema: () => loginSchema,
  posts: () => posts,
  registerSchema: () => registerSchema,
  replies: () => replies,
  sessions: () => sessions,
  users: () => users
});
import { pgTable, text, timestamp, integer, boolean, uuid, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: text("id").primaryKey(),
  username: text("username"),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  avatar: text("avatar"),
  profileImageUrl: text("profile_image_url"),
  password: text("password"),
  // For local authentication
  authType: text("auth_type").notNull().default("replit"),
  // 'replit' or 'local'
  emailVerified: boolean("email_verified").notNull().default(false),
  role: text("role").notNull().default("membro"),
  // membro, vip, moderador, admin
  banned: boolean("banned").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var forums = pgTable("forums", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  slug: text("slug").notNull().unique(),
  category: text("category").notNull().default("general"),
  icon: text("icon"),
  color: text("color").default("#3b82f6"),
  views: integer("views").notNull().default(0),
  postCount: integer("post_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  authorId: text("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  forumId: uuid("forum_id").notNull().references(() => forums.id, { onDelete: "cascade" }),
  views: integer("views").notNull().default(0),
  replyCount: integer("reply_count").notNull().default(0),
  pinned: boolean("pinned").notNull().default(false),
  locked: boolean("locked").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var replies = pgTable("replies", {
  id: uuid("id").primaryKey().defaultRandom(),
  content: text("content").notNull(),
  authorId: text("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  parentId: uuid("parent_id"),
  // For nested replies - will be set up after table creation
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var attachments = pgTable("attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var sessions = pgTable("session", {
  sid: varchar("sid", { length: 255 }).primaryKey(),
  sess: text("sess").notNull(),
  expire: timestamp("expire").notNull()
});
var insertUserSchema = createInsertSchema(users);
var insertForumSchema = createInsertSchema(forums);
var insertPostSchema = createInsertSchema(posts);
var insertReplySchema = createInsertSchema(replies);
var insertAttachmentSchema = createInsertSchema(attachments);
var loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters")
});
var registerSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required")
});

// server/db.ts
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, desc, asc, ilike, or, sql } from "drizzle-orm";
var Storage = class {
  // User operations
  async getUser(id) {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] || null;
  }
  async getUserByUsername(username) {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0] || null;
  }
  async getUserByEmail(email) {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0] || null;
  }
  async createUser(userData) {
    const result = await db.insert(users).values(userData).returning();
    return result[0];
  }
  async updateUser(id, userData) {
    await db.update(users).set({ ...userData, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id));
  }
  async updateUserRole(id, role) {
    await db.update(users).set({ role, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id));
  }
  async banUser(id) {
    await db.update(users).set({ banned: true, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id));
  }
  async unbanUser(id) {
    await db.update(users).set({ banned: false, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id));
  }
  async getAllUsers() {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }
  async createLocalUser(userData) {
    const result = await db.insert(users).values({
      ...userData,
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }).returning();
    return result[0];
  }
  async upsertUser(userData) {
    const existingUser = await this.getUser(userData.id);
    if (existingUser) {
      await this.updateUser(userData.id, userData);
      return await this.getUser(userData.id);
    } else {
      return await this.createUser(userData);
    }
  }
  // Forum operations
  async getForums() {
    return await db.select().from(forums).orderBy(asc(forums.title));
  }
  async getForumBySlug(slug) {
    const result = await db.select().from(forums).where(eq(forums.slug, slug)).limit(1);
    return result[0] || null;
  }
  async getForum(id) {
    const result = await db.select().from(forums).where(eq(forums.id, id)).limit(1);
    return result[0] || null;
  }
  async createForum(forumData) {
    const result = await db.insert(forums).values(forumData).returning();
    return result[0];
  }
  async updateForum(id, forumData) {
    await db.update(forums).set({ ...forumData, updatedAt: /* @__PURE__ */ new Date() }).where(eq(forums.id, id));
  }
  async deleteForum(id) {
    await db.delete(forums).where(eq(forums.id, id));
  }
  async incrementForumViews(slug) {
    await db.update(forums).set({ views: sql`${forums.views} + 1` }).where(eq(forums.slug, slug));
  }
  // Post operations
  async getPosts(forumId, limit = 20, offset = 0) {
    let baseQuery = db.select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      authorId: posts.authorId,
      forumId: posts.forumId,
      views: posts.views,
      replyCount: posts.replyCount,
      pinned: posts.pinned,
      locked: posts.locked,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      author: {
        id: users.id,
        username: users.username,
        avatar: users.avatar,
        role: users.role
      },
      forum: {
        id: forums.id,
        title: forums.title,
        slug: forums.slug
      }
    }).from(posts).leftJoin(users, eq(posts.authorId, users.id)).leftJoin(forums, eq(posts.forumId, forums.id)).orderBy(desc(posts.pinned), desc(posts.createdAt)).limit(limit).offset(offset);
    if (forumId) {
      baseQuery = baseQuery.where(eq(posts.forumId, forumId));
    }
    return await baseQuery;
  }
  async getPost(id) {
    const result = await db.select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      authorId: posts.authorId,
      forumId: posts.forumId,
      views: posts.views,
      replyCount: posts.replyCount,
      pinned: posts.pinned,
      locked: posts.locked,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      author: {
        id: users.id,
        username: users.username,
        avatar: users.avatar,
        role: users.role
      },
      forum: {
        id: forums.id,
        title: forums.title,
        slug: forums.slug
      }
    }).from(posts).leftJoin(users, eq(posts.authorId, users.id)).leftJoin(forums, eq(posts.forumId, forums.id)).where(eq(posts.id, id)).limit(1);
    if (result.length === 0) return null;
    const post = result[0];
    const postAttachments = await db.select().from(attachments).where(eq(attachments.postId, id));
    return {
      ...post,
      attachments: postAttachments
    };
  }
  async createPost(postData) {
    const result = await db.insert(posts).values(postData).returning();
    await db.update(forums).set({
      postCount: sql`${forums.postCount} + 1`,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(forums.id, postData.forumId));
    return result[0];
  }
  async updatePost(id, postData) {
    await db.update(posts).set({ ...postData, updatedAt: /* @__PURE__ */ new Date() }).where(eq(posts.id, id));
  }
  async deletePost(id) {
    const post = await db.select({ forumId: posts.forumId }).from(posts).where(eq(posts.id, id)).limit(1);
    if (post.length > 0) {
      await db.delete(posts).where(eq(posts.id, id));
      await db.update(forums).set({
        postCount: sql`GREATEST(0, ${forums.postCount} - 1)`,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(forums.id, post[0].forumId));
    }
  }
  async incrementPostViews(id) {
    await db.update(posts).set({ views: sql`${posts.views} + 1` }).where(eq(posts.id, id));
  }
  async searchPosts(query, offset = 0, limit = 20) {
    return await db.select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      authorId: posts.authorId,
      forumId: posts.forumId,
      views: posts.views,
      replyCount: posts.replyCount,
      createdAt: posts.createdAt,
      author: {
        id: users.id,
        username: users.username,
        avatar: users.avatar,
        role: users.role
      },
      forum: {
        id: forums.id,
        title: forums.title,
        slug: forums.slug
      }
    }).from(posts).leftJoin(users, eq(posts.authorId, users.id)).leftJoin(forums, eq(posts.forumId, forums.id)).where(
      or(
        ilike(posts.title, `%${query}%`),
        ilike(posts.content, `%${query}%`)
      )
    ).orderBy(desc(posts.createdAt)).limit(limit).offset(offset);
  }
  // Reply operations
  async getReplies(postId, offset = 0, limit = 50) {
    return await db.select({
      id: replies.id,
      content: replies.content,
      authorId: replies.authorId,
      postId: replies.postId,
      parentId: replies.parentId,
      createdAt: replies.createdAt,
      updatedAt: replies.updatedAt,
      author: {
        id: users.id,
        username: users.username,
        avatar: users.avatar,
        role: users.role
      }
    }).from(replies).leftJoin(users, eq(replies.authorId, users.id)).where(eq(replies.postId, postId)).orderBy(asc(replies.createdAt)).limit(limit).offset(offset);
  }
  async getReply(id) {
    const result = await db.select({
      id: replies.id,
      content: replies.content,
      authorId: replies.authorId,
      postId: replies.postId,
      parentId: replies.parentId,
      createdAt: replies.createdAt,
      updatedAt: replies.updatedAt,
      author: {
        id: users.id,
        username: users.username,
        avatar: users.avatar,
        role: users.role
      }
    }).from(replies).leftJoin(users, eq(replies.authorId, users.id)).where(eq(replies.id, id)).limit(1);
    return result[0] || null;
  }
  async createReply(replyData) {
    const result = await db.insert(replies).values(replyData).returning();
    await db.update(posts).set({
      replyCount: sql`${posts.replyCount} + 1`,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(posts.id, replyData.postId));
    return result[0];
  }
  async updateReply(id, replyData) {
    await db.update(replies).set({ ...replyData, updatedAt: /* @__PURE__ */ new Date() }).where(eq(replies.id, id));
  }
  async deleteReply(id) {
    const reply = await db.select({ postId: replies.postId }).from(replies).where(eq(replies.id, id)).limit(1);
    if (reply.length > 0) {
      await db.delete(replies).where(eq(replies.id, id));
      await db.update(posts).set({
        replyCount: sql`GREATEST(0, ${posts.replyCount} - 1)`,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(posts.id, reply[0].postId));
    }
  }
  // Attachment operations
  async createAttachment(attachmentData) {
    const result = await db.insert(attachments).values(attachmentData).returning();
    return result[0];
  }
  async getAttachments(postId) {
    return await db.select().from(attachments).where(eq(attachments.postId, postId));
  }
  async deleteAttachment(id) {
    await db.delete(attachments).where(eq(attachments.id, id));
  }
};
var storage = new Storage();

// server/replitAuth.ts
import * as client from "openid-client";
import { Strategy } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}
var getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID
    );
  },
  { maxAge: 3600 * 1e3 }
);
function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1e3;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions"
  });
  return session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl
    }
  });
}
function updateUserSession(user, tokens) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}
async function upsertUser(claims) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"]
  });
}
async function setupAuth(app2) {
  app2.set("trust proxy", 1);
  app2.use(getSession());
  app2.use(passport.initialize());
  app2.use(passport.session());
  const config = await getOidcConfig();
  const verify = async (tokens, verified) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };
  for (const domain of process.env.REPLIT_DOMAINS.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`
      },
      verify
    );
    passport.use(strategy);
  }
  passport.serializeUser((user, cb) => cb(null, user));
  passport.deserializeUser((user, cb) => cb(null, user));
  app2.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"]
    })(req, res, next);
  });
  app2.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login"
    })(req, res, next);
  });
  app2.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`
        }).href
      );
    });
  });
}

// server/localAuth.ts
import bcrypt from "bcryptjs";
function setupLocalAuth(app2) {
  app2.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email j\xE1 est\xE1 em uso" });
      }
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      const newUser = await storage.createLocalUser({
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email: validatedData.email,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        password: hashedPassword,
        authType: "local",
        emailVerified: false
      });
      req.session.userId = newUser.id;
      req.session.authType = "local";
      res.status(201).json({
        message: "Conta criada com sucesso",
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role
        }
      });
    } catch (error) {
      console.error("Erro no registro:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({
          message: "Dados inv\xE1lidos",
          errors: error.errors
        });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const user = await storage.getUserByEmail(validatedData.email);
      if (!user) {
        return res.status(401).json({ message: "Email ou senha incorretos" });
      }
      if (user.authType !== "local" || !user.password) {
        return res.status(401).json({
          message: "Este email est\xE1 associado a uma conta do Replit. Use o login do Replit."
        });
      }
      if (user.banned) {
        return res.status(403).json({ message: "Sua conta foi suspensa" });
      }
      const isPasswordValid = await bcrypt.compare(validatedData.password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Email ou senha incorretos" });
      }
      req.session.userId = user.id;
      req.session.authType = "local";
      res.json({
        message: "Login realizado com sucesso",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          profileImageUrl: user.profileImageUrl
        }
      });
    } catch (error) {
      console.error("Erro no login:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({
          message: "Dados inv\xE1lidos",
          errors: error.errors
        });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  app2.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Erro ao fazer logout" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logout realizado com sucesso" });
    });
  });
  app2.get("/api/auth/user", async (req, res) => {
    try {
      let user;
      const session2 = req.session;
      if (session2 && session2.userId && session2.authType === "local") {
        user = await storage.getUser(session2.userId);
      } else if (req.user && req.user.claims) {
        const userId = req.user.claims.sub;
        user = await storage.getUser(userId);
      }
      if (!user) {
        return res.status(401).json({ message: "N\xE3o autorizado" });
      }
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profileImageUrl: user.profileImageUrl,
        authType: user.authType,
        emailVerified: user.emailVerified
      });
    } catch (error) {
      console.error("Erro ao buscar usu\xE1rio:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
}
var isAuthenticated = async (req, res, next) => {
  try {
    const session2 = req.session;
    if (session2 && session2.userId && session2.authType === "local") {
      const user = await storage.getUser(session2.userId);
      if (user && !user.banned) {
        req.currentUser = user;
        return next();
      }
    }
    if (req.user && req.user.claims) {
      const now = Math.floor(Date.now() / 1e3);
      const userClaims = req.user;
      if (now <= userClaims.expires_at) {
        const user = await storage.getUser(userClaims.claims.sub);
        if (user && !user.banned) {
          req.currentUser = user;
          return next();
        }
      }
    }
    return res.status(401).json({ message: "N\xE3o autorizado" });
  } catch (error) {
    console.error("Erro na verifica\xE7\xE3o de autentica\xE7\xE3o:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

// server/routes.ts
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";
var upload = multer({
  storage: multer.memoryStorage(),
  // Use memory storage for Vercel
  limits: {
    fileSize: 10 * 1024 * 1024
    // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});
async function registerRoutes(app2) {
  await setupAuth(app2);
  setupLocalAuth(app2);
  app2.use("/uploads", express.static("uploads"));
  app2.post("/api/upload", isAuthenticated, upload.single("image"), async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || currentUser.banned) {
        return res.status(403).json({ message: "Access denied" });
      }
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const fileName = `${Date.now()}-${req.file.originalname}`;
      const filePath = path.join("uploads", fileName);
      await fs.rename(req.file.path, filePath);
      res.json({
        fileName: req.file.originalname,
        fileUrl: `/uploads/${fileName}`,
        fileType: req.file.mimetype,
        fileSize: req.file.size
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });
  app2.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  app2.get("/api/users", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      const users2 = await storage.getAllUsers();
      res.json(users2);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  app2.patch("/api/users/:id/role", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      const { role } = req.body;
      if (!["membro", "vip", "moderador", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      await storage.updateUserRole(req.params.id, role);
      res.json({ message: "Role updated successfully" });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });
  app2.patch("/api/users/:id/ban", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || !["admin", "moderador"].includes(currentUser.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      await storage.banUser(req.params.id);
      res.json({ message: "User banned successfully" });
    } catch (error) {
      console.error("Error banning user:", error);
      res.status(500).json({ message: "Failed to ban user" });
    }
  });
  app2.patch("/api/users/:id/unban", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || !["admin", "moderador"].includes(currentUser.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      await storage.unbanUser(req.params.id);
      res.json({ message: "User unbanned successfully" });
    } catch (error) {
      console.error("Error unbanning user:", error);
      res.status(500).json({ message: "Failed to unban user" });
    }
  });
  app2.get("/api/forums", async (req, res) => {
    try {
      const forums2 = await storage.getForums();
      res.json(forums2);
    } catch (error) {
      console.error("Error fetching forums:", error);
      res.status(500).json({ message: "Failed to fetch forums" });
    }
  });
  app2.get("/api/forums/:slug", async (req, res) => {
    try {
      await storage.incrementForumViews(req.params.slug);
      const forum = await storage.getForumBySlug(req.params.slug);
      if (!forum) {
        return res.status(404).json({ message: "Forum not found" });
      }
      res.json(forum);
    } catch (error) {
      console.error("Error fetching forum:", error);
      res.status(500).json({ message: "Failed to fetch forum" });
    }
  });
  app2.post("/api/forums", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || !["admin", "moderador"].includes(currentUser.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      const forumData = insertForumSchema.parse(req.body);
      const forum = await storage.createForum(forumData);
      res.status(201).json(forum);
    } catch (error) {
      console.error("Error creating forum:", error);
      res.status(500).json({ message: "Failed to create forum" });
    }
  });
  app2.delete("/api/forums/:id", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      await storage.deleteForum(req.params.id);
      res.json({ message: "Forum deleted successfully" });
    } catch (error) {
      console.error("Error deleting forum:", error);
      res.status(500).json({ message: "Failed to delete forum" });
    }
  });
  app2.get("/api/posts", async (req, res) => {
    try {
      const forumId = req.query.forumId;
      const limit = req.query.limit ? parseInt(req.query.limit) : void 0;
      const offset = req.query.offset ? parseInt(req.query.offset) : void 0;
      const posts2 = await storage.getPosts(forumId, limit, offset);
      res.json(posts2);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });
  app2.get("/api/search", async (req, res) => {
    try {
      const query = req.query.q;
      const limit = req.query.limit ? parseInt(req.query.limit) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset) : 0;
      if (!query || query.trim().length === 0) {
        return res.json([]);
      }
      const results = await storage.searchPosts(query.trim(), offset, limit);
      res.json(results);
    } catch (error) {
      console.error("Error searching posts:", error);
      res.status(500).json({ message: "Failed to search posts" });
    }
  });
  app2.get("/api/posts/:id", async (req, res) => {
    try {
      await storage.incrementPostViews(req.params.id);
      const post = await storage.getPost(req.params.id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Error fetching post:", error);
      res.status(500).json({ message: "Failed to fetch post" });
    }
  });
  app2.post("/api/posts", isAuthenticated, upload.array("attachments", 5), async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || currentUser.banned) {
        return res.status(403).json({ message: "Access denied" });
      }
      const postData = insertPostSchema.parse({
        ...req.body,
        authorId: currentUser.id
      });
      const post = await storage.createPost(postData);
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const fileName = `${Date.now()}-${file.originalname}`;
          const filePath = path.join("uploads", fileName);
          await fs.rename(file.path, filePath);
          await storage.createAttachment({
            postId: post.id,
            fileName: file.originalname,
            fileUrl: `/uploads/${fileName}`,
            fileType: file.mimetype,
            fileSize: file.size
          });
        }
      }
      const postWithDetails = await storage.getPost(post.id);
      res.status(201).json(postWithDetails);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });
  app2.put("/api/posts/:id", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      const post = await storage.getPost(req.params.id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      if (post.authorId !== currentUser?.id && (!currentUser || !["admin", "moderador"].includes(currentUser.role))) {
        return res.status(403).json({ message: "Access denied" });
      }
      const { title, content } = req.body;
      await storage.updatePost(req.params.id, { title, content });
      const updatedPost = await storage.getPost(req.params.id);
      res.json(updatedPost);
    } catch (error) {
      console.error("Error updating post:", error);
      res.status(500).json({ message: "Failed to update post" });
    }
  });
  app2.delete("/api/posts/:id", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      const post = await storage.getPost(req.params.id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      if (post.authorId !== currentUser?.id && (!currentUser || !["admin", "moderador"].includes(currentUser.role))) {
        return res.status(403).json({ message: "Access denied" });
      }
      await storage.deletePost(req.params.id);
      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ message: "Failed to delete post" });
    }
  });
  app2.get("/api/posts/:postId/replies", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset) : 0;
      const replies2 = await storage.getReplies(req.params.postId, offset, limit);
      res.json(replies2);
    } catch (error) {
      console.error("Error fetching replies:", error);
      res.status(500).json({ message: "Failed to fetch replies" });
    }
  });
  app2.post("/api/posts/:postId/replies", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || currentUser.banned) {
        return res.status(403).json({ message: "Access denied" });
      }
      const replyData = insertReplySchema.parse({
        ...req.body,
        postId: req.params.postId,
        authorId: currentUser.id
      });
      const reply = await storage.createReply(replyData);
      res.status(201).json(reply);
    } catch (error) {
      console.error("Error creating reply:", error);
      res.status(500).json({ message: "Failed to create reply" });
    }
  });
  app2.put("/api/replies/:id", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      const reply = await storage.getReply(req.params.id);
      if (!reply) {
        return res.status(404).json({ message: "Reply not found" });
      }
      if (reply.authorId !== currentUser?.id && (!currentUser || !["admin", "moderador"].includes(currentUser.role))) {
        return res.status(403).json({ message: "Access denied" });
      }
      const { content } = req.body;
      await storage.updateReply(req.params.id, { content });
      const updatedReply = await storage.getReply(req.params.id);
      res.json(updatedReply);
    } catch (error) {
      console.error("Error updating reply:", error);
      res.status(500).json({ message: "Failed to update reply" });
    }
  });
  app2.delete("/api/replies/:id", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      const reply = await storage.getReply(req.params.id);
      if (!reply) {
        return res.status(404).json({ message: "Reply not found" });
      }
      if (reply.authorId !== currentUser?.id && (!currentUser || !["admin", "moderador"].includes(currentUser.role))) {
        return res.status(403).json({ message: "Access denied" });
      }
      await storage.deleteReply(req.params.id);
      res.json({ message: "Reply deleted successfully" });
    } catch (error) {
      console.error("Error deleting reply:", error);
      res.status(500).json({ message: "Failed to delete reply" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import { createServer as createViteServer } from "vite";
import express2 from "express";
import path2 from "path";
function log(message) {
  const timestamp2 = (/* @__PURE__ */ new Date()).toISOString();
  console.log(`[${timestamp2}] ${message}`);
}
async function setupVite(app2, server) {
  if (process.env.NODE_ENV === "development") {
    log("Vite running separately on port 5000");
    return;
  }
  const vite = await createViteServer({
    configFile: path2.resolve(process.cwd(), "vite.config.ts"),
    server: { middlewareMode: true },
    appType: "spa"
  });
  app2.use(vite.ssrFixStacktrace);
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      if (url.startsWith("/api")) {
        return next();
      }
      const template = await vite.transformIndexHtml(
        url,
        `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>BlackByte Forum</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
      );
      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
  log("Vite development server configured");
}
function serveStatic(app2) {
  const distPath = path2.resolve(process.cwd(), "dist/public");
  app2.use(express2.static(distPath, {
    maxAge: "1y",
    setHeaders: (res, path3) => {
      if (path3.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      }
    }
  }));
  app2.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.sendFile(path2.join(distPath, "index.html"));
  });
  log("Static files configured");
}

// server/index.ts
var app = express3();
app.use(express3.json());
app.use(express3.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
async function startServer() {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  if (!process.env.VERCEL) {
    const port = parseInt(process.env.API_PORT || "3001", 10);
    server.listen({
      port,
      host: "localhost",
      // Backend uses localhost
      reusePort: true
    }, () => {
      log(`API server serving on port ${port}`);
    });
  }
  return app;
}
startServer();
