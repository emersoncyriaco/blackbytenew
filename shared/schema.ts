import { pgTable, text, timestamp, integer, boolean, uuid, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Users table
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  username: text('username'),
  email: text('email').notNull().unique(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  avatar: text('avatar'),
  profileImageUrl: text('profile_image_url'),
  password: text('password'), // For local authentication
  authType: text('auth_type').notNull().default('replit'), // 'replit' or 'local'
  emailVerified: boolean('email_verified').notNull().default(false),
  role: text('role').notNull().default('membro'), // membro, vip, moderador, admin
  banned: boolean('banned').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Forums table
export const forums = pgTable('forums', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  slug: text('slug').notNull().unique(),
  category: text('category').notNull().default('general'),
  icon: text('icon'),
  color: text('color').default('#3b82f6'),
  views: integer('views').notNull().default(0),
  postCount: integer('post_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Posts table
export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  authorId: text('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  forumId: uuid('forum_id').notNull().references(() => forums.id, { onDelete: 'cascade' }),
  views: integer('views').notNull().default(0),
  replyCount: integer('reply_count').notNull().default(0),
  pinned: boolean('pinned').notNull().default(false),
  locked: boolean('locked').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Replies table
export const replies = pgTable('replies', {
  id: uuid('id').primaryKey().defaultRandom(),
  content: text('content').notNull(),
  authorId: text('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  parentId: uuid('parent_id'), // For nested replies - will be set up after table creation
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Attachments table
export const attachments = pgTable('attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  fileName: text('file_name').notNull(),
  fileUrl: text('file_url').notNull(),
  fileType: text('file_type').notNull(),
  fileSize: integer('file_size').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Sessions table for express-session
export const sessions = pgTable('session', {
  sid: varchar('sid', { length: 255 }).primaryKey(),
  sess: text('sess').notNull(),
  expire: timestamp('expire').notNull(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const insertForumSchema = createInsertSchema(forums);
export const insertPostSchema = createInsertSchema(posts);
export const insertReplySchema = createInsertSchema(replies);
export const insertAttachmentSchema = createInsertSchema(attachments);

// Authentication schemas
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});

// Export types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Forum = typeof forums.$inferSelect;
export type NewForum = typeof forums.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type Reply = typeof replies.$inferSelect;
export type NewReply = typeof replies.$inferInsert;
export type Attachment = typeof attachments.$inferSelect;
export type NewAttachment = typeof attachments.$inferInsert;