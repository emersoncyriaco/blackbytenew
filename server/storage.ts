import { db } from './db.js';
import { users, forums, posts, replies, attachments, type User, type NewUser, type Forum, type NewForum, type Post, type NewPost, type Reply, type NewReply, type Attachment, type NewAttachment } from '@shared/schema';
import { eq, and, desc, asc, ilike, or, count, sql } from 'drizzle-orm';

export class Storage {
  // User operations
  async getUser(id: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] || null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0] || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0] || null;
  }

  async createUser(userData: NewUser): Promise<User> {
    const result = await db.insert(users).values(userData).returning();
    return result[0];
  }

  async updateUser(id: string, userData: Partial<NewUser>): Promise<void> {
    await db.update(users).set({ ...userData, updatedAt: new Date() }).where(eq(users.id, id));
  }

  async updateUserRole(id: string, role: string): Promise<void> {
    await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, id));
  }

  async banUser(id: string): Promise<void> {
    await db.update(users).set({ banned: true, updatedAt: new Date() }).where(eq(users.id, id));
  }

  async unbanUser(id: string): Promise<void> {
    await db.update(users).set({ banned: false, updatedAt: new Date() }).where(eq(users.id, id));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async createLocalUser(userData: NewUser): Promise<User> {
    const result = await db.insert(users).values({
      ...userData,
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }).returning();
    return result[0];
  }

  async upsertUser(userData: Partial<NewUser & {id: string}>): Promise<User> {
    const existingUser = await this.getUser(userData.id!);
    if (existingUser) {
      await this.updateUser(userData.id!, userData);
      return await this.getUser(userData.id!) as User;
    } else {
      return await this.createUser(userData as NewUser);
    }
  }

  // Forum operations
  async getForums(): Promise<Forum[]> {
    return await db.select().from(forums).orderBy(asc(forums.title));
  }

  async getForumBySlug(slug: string): Promise<Forum | null> {
    const result = await db.select().from(forums).where(eq(forums.slug, slug)).limit(1);
    return result[0] || null;
  }

  async getForum(id: string): Promise<Forum | null> {
    const result = await db.select().from(forums).where(eq(forums.id, id)).limit(1);
    return result[0] || null;
  }

  async createForum(forumData: NewForum): Promise<Forum> {
    const result = await db.insert(forums).values(forumData).returning();
    return result[0];
  }

  async updateForum(id: string, forumData: Partial<NewForum>): Promise<void> {
    await db.update(forums).set({ ...forumData, updatedAt: new Date() }).where(eq(forums.id, id));
  }

  async deleteForum(id: string): Promise<void> {
    await db.delete(forums).where(eq(forums.id, id));
  }

  async incrementForumViews(slug: string): Promise<void> {
    await db.update(forums).set({ views: sql`${forums.views} + 1` }).where(eq(forums.slug, slug));
  }

  // Post operations
  async getPosts(forumId?: string, limit: number = 20, offset: number = 0): Promise<any[]> {
    let baseQuery = db
      .select({
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
          role: users.role,
        },
        forum: {
          id: forums.id,
          title: forums.title,
          slug: forums.slug,
        },
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .leftJoin(forums, eq(posts.forumId, forums.id))
      .orderBy(desc(posts.pinned), desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    if (forumId) {
      baseQuery = baseQuery.where(eq(posts.forumId, forumId));
    }

    return await baseQuery;
  }

  async getPost(id: string): Promise<any | null> {
    const result = await db
      .select({
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
          role: users.role,
        },
        forum: {
          id: forums.id,
          title: forums.title,
          slug: forums.slug,
        },
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .leftJoin(forums, eq(posts.forumId, forums.id))
      .where(eq(posts.id, id))
      .limit(1);

    if (result.length === 0) return null;

    const post = result[0];
    
    // Get attachments
    const postAttachments = await db.select().from(attachments).where(eq(attachments.postId, id));
    
    return {
      ...post,
      attachments: postAttachments,
    };
  }

  async createPost(postData: NewPost): Promise<Post> {
    const result = await db.insert(posts).values(postData).returning();
    
    // Increment forum post count
    await db.update(forums).set({ 
      postCount: sql`${forums.postCount} + 1`,
      updatedAt: new Date()
    }).where(eq(forums.id, postData.forumId));
    
    return result[0];
  }

  async updatePost(id: string, postData: Partial<NewPost>): Promise<void> {
    await db.update(posts).set({ ...postData, updatedAt: new Date() }).where(eq(posts.id, id));
  }

  async deletePost(id: string): Promise<void> {
    // Get the post to get forum ID
    const post = await db.select({ forumId: posts.forumId }).from(posts).where(eq(posts.id, id)).limit(1);
    
    if (post.length > 0) {
      // Delete the post (cascades to replies and attachments)
      await db.delete(posts).where(eq(posts.id, id));
      
      // Decrement forum post count
      await db.update(forums).set({ 
        postCount: sql`GREATEST(0, ${forums.postCount} - 1)`,
        updatedAt: new Date()
      }).where(eq(forums.id, post[0].forumId));
    }
  }

  async incrementPostViews(id: string): Promise<void> {
    await db.update(posts).set({ views: sql`${posts.views} + 1` }).where(eq(posts.id, id));
  }

  async searchPosts(query: string, offset: number = 0, limit: number = 20): Promise<any[]> {
    return await db
      .select({
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
          role: users.role,
        },
        forum: {
          id: forums.id,
          title: forums.title,
          slug: forums.slug,
        },
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .leftJoin(forums, eq(posts.forumId, forums.id))
      .where(
        or(
          ilike(posts.title, `%${query}%`),
          ilike(posts.content, `%${query}%`)
        )
      )
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);
  }

  // Reply operations
  async getReplies(postId: string, offset: number = 0, limit: number = 50): Promise<any[]> {
    return await db
      .select({
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
          role: users.role,
        },
      })
      .from(replies)
      .leftJoin(users, eq(replies.authorId, users.id))
      .where(eq(replies.postId, postId))
      .orderBy(asc(replies.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getReply(id: string): Promise<any | null> {
    const result = await db
      .select({
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
          role: users.role,
        },
      })
      .from(replies)
      .leftJoin(users, eq(replies.authorId, users.id))
      .where(eq(replies.id, id))
      .limit(1);

    return result[0] || null;
  }

  async createReply(replyData: NewReply): Promise<Reply> {
    const result = await db.insert(replies).values(replyData).returning();
    
    // Increment post reply count
    await db.update(posts).set({ 
      replyCount: sql`${posts.replyCount} + 1`,
      updatedAt: new Date()
    }).where(eq(posts.id, replyData.postId));
    
    return result[0];
  }

  async updateReply(id: string, replyData: Partial<NewReply>): Promise<void> {
    await db.update(replies).set({ ...replyData, updatedAt: new Date() }).where(eq(replies.id, id));
  }

  async deleteReply(id: string): Promise<void> {
    // Get the reply to get post ID
    const reply = await db.select({ postId: replies.postId }).from(replies).where(eq(replies.id, id)).limit(1);
    
    if (reply.length > 0) {
      // Delete the reply
      await db.delete(replies).where(eq(replies.id, id));
      
      // Decrement post reply count
      await db.update(posts).set({ 
        replyCount: sql`GREATEST(0, ${posts.replyCount} - 1)`,
        updatedAt: new Date()
      }).where(eq(posts.id, reply[0].postId));
    }
  }

  // Attachment operations
  async createAttachment(attachmentData: NewAttachment): Promise<Attachment> {
    const result = await db.insert(attachments).values(attachmentData).returning();
    return result[0];
  }

  async getAttachments(postId: string): Promise<Attachment[]> {
    return await db.select().from(attachments).where(eq(attachments.postId, postId));
  }

  async deleteAttachment(id: string): Promise<void> {
    await db.delete(attachments).where(eq(attachments.id, id));
  }
}

export const storage = new Storage();