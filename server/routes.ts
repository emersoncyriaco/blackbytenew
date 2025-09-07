import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { setupLocalAuth, isAuthenticated } from "./localAuth.js";
import { insertForumSchema, insertPostSchema, insertReplySchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(), // Use memory storage for Vercel
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup only local authentication
  setupLocalAuth(app);

  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));

  // Upload route for better file handling
  app.post('/api/upload', isAuthenticated, upload.single('image'), async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || currentUser.banned) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileName = `${Date.now()}-${req.file.originalname}`;
      const filePath = path.join('uploads', fileName);
      
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

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
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

  // User management routes (admin only)
  app.get('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch('/api/users/:id/role', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const { role } = req.body;
      if (!['membro', 'vip', 'moderador', 'admin'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      await storage.updateUserRole(req.params.id, role);
      res.json({ message: "Role updated successfully" });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.patch('/api/users/:id/ban', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || !['admin', 'moderador'].includes(currentUser.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.banUser(req.params.id);
      res.json({ message: "User banned successfully" });
    } catch (error) {
      console.error("Error banning user:", error);
      res.status(500).json({ message: "Failed to ban user" });
    }
  });

  app.patch('/api/users/:id/unban', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || !['admin', 'moderador'].includes(currentUser.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.unbanUser(req.params.id);
      res.json({ message: "User unbanned successfully" });
    } catch (error) {
      console.error("Error unbanning user:", error);
      res.status(500).json({ message: "Failed to unban user" });
    }
  });

  // Forum routes
  app.get('/api/forums', async (req, res) => {
    try {
      const forums = await storage.getForums();
      res.json(forums);
    } catch (error) {
      console.error("Error fetching forums:", error);
      res.status(500).json({ message: "Failed to fetch forums" });
    }
  });

  app.get('/api/forums/:slug', async (req, res) => {
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

  app.post('/api/forums', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || !['admin', 'moderador'].includes(currentUser.role)) {
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

  app.delete('/api/forums/:id', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteForum(req.params.id);
      res.json({ message: "Forum deleted successfully" });
    } catch (error) {
      console.error("Error deleting forum:", error);
      res.status(500).json({ message: "Failed to delete forum" });
    }
  });

  // Post routes
  app.get('/api/posts', async (req, res) => {
    try {
      const forumId = req.query.forumId as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
      const posts = await storage.getPosts(forumId, limit, offset);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  // Search route
  app.get('/api/search', async (req, res) => {
    try {
      const query = req.query.q as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
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

  app.get('/api/posts/:id', async (req, res) => {
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

  app.post('/api/posts', isAuthenticated, upload.array('attachments', 5), async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || currentUser.banned) {
        return res.status(403).json({ message: "Access denied" });
      }

      const postData = insertPostSchema.parse({
        ...req.body,
        authorId: currentUser.id,
      });

      const post = await storage.createPost(postData);

      // Handle file uploads
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const fileName = `${Date.now()}-${file.originalname}`;
          const filePath = path.join('uploads', fileName);
          
          await fs.rename(file.path, filePath);
          
          await storage.createAttachment({
            postId: post.id,
            fileName: file.originalname,
            fileUrl: `/uploads/${fileName}`,
            fileType: file.mimetype,
            fileSize: file.size,
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

  app.put('/api/posts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      const post = await storage.getPost(req.params.id);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      // Only allow editing by author, moderators, or admins
      if (post.authorId !== currentUser?.id && 
          (!currentUser || 
          !['admin', 'moderador'].includes(currentUser.role))) {
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

  app.delete('/api/posts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      const post = await storage.getPost(req.params.id);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      // Only allow deletion by author, moderators, or admins
      if (post.authorId !== currentUser?.id && 
          (!currentUser || 
          !['admin', 'moderador'].includes(currentUser.role))) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deletePost(req.params.id);
      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  // Reply routes
  app.get('/api/posts/:postId/replies', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const replies = await storage.getReplies(req.params.postId, offset, limit);
      res.json(replies);
    } catch (error) {
      console.error("Error fetching replies:", error);
      res.status(500).json({ message: "Failed to fetch replies" });
    }
  });

  app.post('/api/posts/:postId/replies', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (!currentUser || currentUser.banned) {
        return res.status(403).json({ message: "Access denied" });
      }

      const replyData = insertReplySchema.parse({
        ...req.body,
        postId: req.params.postId,
        authorId: currentUser.id,
      });

      const reply = await storage.createReply(replyData);
      res.status(201).json(reply);
    } catch (error) {
      console.error("Error creating reply:", error);
      res.status(500).json({ message: "Failed to create reply" });
    }
  });

  app.put('/api/replies/:id', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      const reply = await storage.getReply(req.params.id);
      
      if (!reply) {
        return res.status(404).json({ message: "Reply not found" });
      }

      // Only allow editing by author, moderators, or admins
      if (reply.authorId !== currentUser?.id && 
          (!currentUser || 
          !['admin', 'moderador'].includes(currentUser.role))) {
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

  app.delete('/api/replies/:id', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      const reply = await storage.getReply(req.params.id);
      
      if (!reply) {
        return res.status(404).json({ message: "Reply not found" });
      }

      // Only allow deletion by author, moderators, or admins
      if (reply.authorId !== currentUser?.id && 
          (!currentUser || 
          !['admin', 'moderador'].includes(currentUser.role))) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteReply(req.params.id);
      res.json({ message: "Reply deleted successfully" });
    } catch (error) {
      console.error("Error deleting reply:", error);
      res.status(500).json({ message: "Failed to delete reply" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
