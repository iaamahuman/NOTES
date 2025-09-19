// server/index.ts
import express3 from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import { WebSocketServer } from "ws";

// server/routes.ts
import express from "express";
import { createServer } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";

// shared/schema.ts
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  avatar: text("avatar"),
  bio: text("bio"),
  university: text("university"),
  major: text("major"),
  year: text("year"),
  reputation: integer("reputation").default(0).notNull(),
  totalUploads: integer("total_uploads").default(0).notNull(),
  totalDownloads: integer("total_downloads").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var notes = pgTable("notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  subject: text("subject").notNull(),
  tags: text("tags").array(),
  course: text("course"),
  professor: text("professor"),
  semester: text("semester"),
  fileType: text("file_type").notNull(),
  // 'pdf', 'image', 'text'
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  filePath: text("file_path").notNull(),
  thumbnailPath: text("thumbnail_path"),
  uploaderId: varchar("uploader_id").references(() => users.id).notNull(),
  downloads: integer("downloads").default(0).notNull(),
  views: integer("views").default(0).notNull(),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  ratingCount: integer("rating_count").default(0).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  isPublic: boolean("is_public").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var ratings = pgTable("ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  noteId: varchar("note_id").references(() => notes.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  rating: integer("rating").notNull(),
  // 1-5 stars
  review: text("review"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  noteId: varchar("note_id").references(() => notes.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  parentId: varchar("parent_id"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var bookmarks = pgTable("bookmarks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  noteId: varchar("note_id").references(() => notes.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var follows = pgTable("follows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  followerId: varchar("follower_id").references(() => users.id).notNull(),
  followingId: varchar("following_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var collections = pgTable("collections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  userId: varchar("user_id").references(() => users.id).notNull(),
  isPublic: boolean("is_public").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var collectionNotes = pgTable("collection_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  collectionId: varchar("collection_id").references(() => collections.id).notNull(),
  noteId: varchar("note_id").references(() => notes.id).notNull(),
  addedAt: timestamp("added_at").defaultNow().notNull()
});
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  reputation: true,
  totalUploads: true,
  totalDownloads: true
});
var insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
  downloads: true,
  views: true,
  rating: true,
  ratingCount: true,
  isFeatured: true
});
var insertRatingSchema = createInsertSchema(ratings).omit({
  id: true,
  createdAt: true
});
var insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true
});
var insertBookmarkSchema = createInsertSchema(bookmarks).omit({
  id: true,
  createdAt: true
});
var insertFollowSchema = createInsertSchema(follows).omit({
  id: true,
  createdAt: true
});
var insertCollectionSchema = createInsertSchema(collections).omit({
  id: true,
  createdAt: true
});
var insertCollectionNoteSchema = createInsertSchema(collectionNotes).omit({
  id: true,
  addedAt: true
});

// server/storage.ts
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, desc, asc, count, sql as sql2, and, or, ilike } from "drizzle-orm";
var MemStorage = class {
  users;
  notes;
  ratings;
  comments;
  bookmarks;
  follows;
  collections;
  collectionNotes;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.notes = /* @__PURE__ */ new Map();
    this.ratings = /* @__PURE__ */ new Map();
    this.comments = /* @__PURE__ */ new Map();
    this.bookmarks = /* @__PURE__ */ new Map();
    this.follows = /* @__PURE__ */ new Map();
    this.collections = /* @__PURE__ */ new Map();
    this.collectionNotes = /* @__PURE__ */ new Map();
  }
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  async getUserByEmail(email) {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }
  async createUser(insertUser) {
    const id = randomUUID();
    const user = {
      ...insertUser,
      avatar: insertUser.avatar ?? null,
      bio: insertUser.bio ?? null,
      university: insertUser.university ?? null,
      major: insertUser.major ?? null,
      year: insertUser.year ?? null,
      id,
      reputation: 0,
      totalUploads: 0,
      totalDownloads: 0,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.users.set(id, user);
    return user;
  }
  async getNote(id) {
    return this.notes.get(id);
  }
  async getNoteWithUploader(id) {
    const note = this.notes.get(id);
    if (!note) return void 0;
    const uploader = await this.getUser(note.uploaderId);
    if (!uploader) return void 0;
    return {
      ...note,
      uploader: {
        username: uploader.username,
        id: uploader.id,
        avatar: uploader.avatar ?? void 0,
        reputation: uploader.reputation
      }
    };
  }
  async getAllNotes() {
    const notesArray = Array.from(this.notes.values());
    const notesWithUploaders = [];
    for (const note of notesArray) {
      const uploader = await this.getUser(note.uploaderId);
      if (uploader) {
        notesWithUploaders.push({
          ...note,
          uploader: {
            username: uploader.username,
            id: uploader.id,
            avatar: uploader.avatar ?? void 0,
            reputation: uploader.reputation
          }
        });
      }
    }
    return notesWithUploaders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  async getNotesBySubject(subject) {
    const allNotes = await this.getAllNotes();
    return allNotes.filter((note) => note.subject.toLowerCase() === subject.toLowerCase());
  }
  async searchNotes(query) {
    const allNotes = await this.getAllNotes();
    const searchTerm = query.toLowerCase();
    return allNotes.filter(
      (note) => note.title.toLowerCase().includes(searchTerm) || note.description?.toLowerCase().includes(searchTerm) || note.subject.toLowerCase().includes(searchTerm)
    );
  }
  async getFeaturedNotes() {
    const allNotes = await this.getAllNotes();
    return allNotes.filter((note) => parseFloat(note.rating || "0") >= 4.5 || note.downloads > 100).slice(0, 6);
  }
  async getRecentNotes() {
    const allNotes = await this.getAllNotes();
    return allNotes.slice(0, 8);
  }
  async createNote(insertNote) {
    const id = randomUUID();
    const note = {
      ...insertNote,
      description: insertNote.description || null,
      tags: insertNote.tags || null,
      course: insertNote.course || null,
      professor: insertNote.professor || null,
      semester: insertNote.semester || null,
      thumbnailPath: insertNote.thumbnailPath || null,
      id,
      downloads: 0,
      views: 0,
      rating: "0.00",
      ratingCount: 0,
      isFeatured: false,
      isPublic: insertNote.isPublic ?? true,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.notes.set(id, note);
    return note;
  }
  async incrementDownloads(id) {
    const note = this.notes.get(id);
    if (note) {
      note.downloads = note.downloads + 1;
      this.notes.set(id, note);
    }
  }
  async incrementViews(id) {
    const note = this.notes.get(id);
    if (note) {
      note.views = note.views + 1;
      this.notes.set(id, note);
    }
  }
  async updateUserProfile(id, updates) {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    const updatedUser = {
      ...user,
      ...updates,
      avatar: updates.avatar ?? user.avatar,
      bio: updates.bio ?? user.bio,
      university: updates.university ?? user.university,
      major: updates.major ?? user.major,
      year: updates.year ?? user.year
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  async getUserProfile(id) {
    const user = await this.getUser(id);
    if (!user) return void 0;
    const followersCount = Array.from(this.follows.values()).filter((f) => f.followingId === id).length;
    const followingCount = Array.from(this.follows.values()).filter((f) => f.followerId === id).length;
    const notesCount = Array.from(this.notes.values()).filter((n) => n.uploaderId === id).length;
    return {
      ...user,
      followersCount,
      followingCount,
      notesCount,
      isFollowing: false
    };
  }
  async getNoteWithDetails(noteId, userId) {
    const noteWithUploader = await this.getNoteWithUploader(noteId);
    if (!noteWithUploader) return void 0;
    const commentsCount = Array.from(this.comments.values()).filter((c) => c.noteId === noteId).length;
    const isBookmarked = userId ? await this.isBookmarked(noteId, userId) : false;
    const userRating = userId ? (await this.getUserRating(noteId, userId))?.rating : void 0;
    return {
      ...noteWithUploader,
      commentsCount,
      isBookmarked,
      userRating
    };
  }
  async getNotesByUser(userId) {
    const allNotes = await this.getAllNotes();
    return allNotes.filter((note) => note.uploaderId === userId);
  }
  async updateNote(id, updates) {
    const note = this.notes.get(id);
    if (!note) throw new Error("Note not found");
    const updatedNote = { ...note, ...updates };
    this.notes.set(id, updatedNote);
    return updatedNote;
  }
  // Rating operations
  async createRating(insertRating) {
    const id = randomUUID();
    const rating = {
      ...insertRating,
      review: insertRating.review ?? null,
      id,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.ratings.set(id, rating);
    await this.updateNoteRating(insertRating.noteId);
    return rating;
  }
  async updateNoteRating(noteId) {
    const noteRatings = Array.from(this.ratings.values()).filter((r) => r.noteId === noteId);
    if (noteRatings.length === 0) return;
    const totalRating = noteRatings.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = (totalRating / noteRatings.length).toFixed(2);
    const note = this.notes.get(noteId);
    if (note) {
      note.rating = avgRating;
      note.ratingCount = noteRatings.length;
      this.notes.set(noteId, note);
    }
  }
  async getUserRating(noteId, userId) {
    return Array.from(this.ratings.values()).find((r) => r.noteId === noteId && r.userId === userId);
  }
  async getNoteRatings(noteId) {
    const noteRatings = Array.from(this.ratings.values()).filter((r) => r.noteId === noteId);
    const ratingsWithUsers = [];
    for (const rating of noteRatings) {
      const user = await this.getUser(rating.userId);
      if (user) {
        ratingsWithUsers.push({
          ...rating,
          user: {
            username: user.username,
            avatar: user.avatar ?? void 0,
            id: user.id
          }
        });
      }
    }
    return ratingsWithUsers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  async updateRating(id, rating, review) {
    const existingRating = this.ratings.get(id);
    if (!existingRating) throw new Error("Rating not found");
    const updatedRating = {
      ...existingRating,
      rating,
      review: review ?? existingRating.review
    };
    this.ratings.set(id, updatedRating);
    await this.updateNoteRating(existingRating.noteId);
    return updatedRating;
  }
  // Comment operations
  async createComment(insertComment) {
    const id = randomUUID();
    const comment = {
      ...insertComment,
      parentId: insertComment.parentId ?? null,
      id,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.comments.set(id, comment);
    return comment;
  }
  async getNoteComments(noteId) {
    const noteComments = Array.from(this.comments.values()).filter((c) => c.noteId === noteId && !c.parentId);
    const commentsWithUsers = [];
    for (const comment of noteComments) {
      const user = await this.getUser(comment.userId);
      if (user) {
        const replies = await this.getCommentReplies(comment.id);
        commentsWithUsers.push({
          ...comment,
          user: {
            username: user.username,
            avatar: user.avatar ?? void 0,
            id: user.id
          },
          replies
        });
      }
    }
    return commentsWithUsers.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  async getCommentReplies(parentId) {
    const replies = Array.from(this.comments.values()).filter((c) => c.parentId === parentId);
    const repliesWithUsers = [];
    for (const reply of replies) {
      const user = await this.getUser(reply.userId);
      if (user) {
        repliesWithUsers.push({
          ...reply,
          user: {
            username: user.username,
            avatar: user.avatar ?? void 0,
            id: user.id
          }
        });
      }
    }
    return repliesWithUsers.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  async updateComment(id, content) {
    const comment = this.comments.get(id);
    if (!comment) throw new Error("Comment not found");
    const updatedComment = { ...comment, content };
    this.comments.set(id, updatedComment);
    return updatedComment;
  }
  async deleteComment(id) {
    this.comments.delete(id);
    Array.from(this.comments.keys()).forEach((key) => {
      const comment = this.comments.get(key);
      if (comment && comment.parentId === id) {
        this.comments.delete(key);
      }
    });
  }
  // Bookmark operations
  async createBookmark(insertBookmark) {
    const id = randomUUID();
    const bookmark = {
      ...insertBookmark,
      id,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.bookmarks.set(id, bookmark);
    return bookmark;
  }
  async removeBookmark(noteId, userId) {
    const bookmarkToRemove = Array.from(this.bookmarks.entries()).find(
      ([_, bookmark]) => bookmark.noteId === noteId && bookmark.userId === userId
    );
    if (bookmarkToRemove) {
      this.bookmarks.delete(bookmarkToRemove[0]);
    }
  }
  async getUserBookmarks(userId) {
    const userBookmarks = Array.from(this.bookmarks.values()).filter((b) => b.userId === userId);
    const bookmarkedNotes = [];
    for (const bookmark of userBookmarks) {
      const note = await this.getNoteWithUploader(bookmark.noteId);
      if (note) {
        bookmarkedNotes.push(note);
      }
    }
    return bookmarkedNotes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  async isBookmarked(noteId, userId) {
    return Array.from(this.bookmarks.values()).some((b) => b.noteId === noteId && b.userId === userId);
  }
  // Collection operations (stub implementations)
  async createCollection(collection) {
    const id = randomUUID();
    const newCollection = {
      ...collection,
      description: collection.description ?? null,
      isPublic: collection.isPublic ?? false,
      id,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.collections.set(id, newCollection);
    return newCollection;
  }
  async getUserCollections(userId) {
    const userCollections = Array.from(this.collections.values()).filter((c) => c.userId === userId);
    return userCollections.map((collection) => ({
      ...collection,
      notes: [],
      notesCount: 0
    }));
  }
  async getCollection(id) {
    const collection = this.collections.get(id);
    if (!collection) return void 0;
    return {
      ...collection,
      notes: [],
      notesCount: 0
    };
  }
  async addNoteToCollection(collectionId, noteId) {
    const id = randomUUID();
    this.collectionNotes.set(id, { collectionId, noteId });
  }
  async removeNoteFromCollection(collectionId, noteId) {
    const entryToRemove = Array.from(this.collectionNotes.entries()).find(
      ([_, entry]) => entry.collectionId === collectionId && entry.noteId === noteId
    );
    if (entryToRemove) {
      this.collectionNotes.delete(entryToRemove[0]);
    }
  }
  async updateCollection(id, updates) {
    const collection = this.collections.get(id);
    if (!collection) throw new Error("Collection not found");
    const updatedCollection = { ...collection, ...updates };
    this.collections.set(id, updatedCollection);
    return updatedCollection;
  }
  async deleteCollection(id) {
    this.collections.delete(id);
    Array.from(this.collectionNotes.keys()).forEach((key) => {
      const entry = this.collectionNotes.get(key);
      if (entry && entry.collectionId === id) {
        this.collectionNotes.delete(key);
      }
    });
  }
  // Follow operations (stub implementations)
  async followUser(followerId, followingId) {
    const id = randomUUID();
    this.follows.set(id, { followerId, followingId });
  }
  async unfollowUser(followerId, followingId) {
    const entryToRemove = Array.from(this.follows.entries()).find(
      ([_, follow]) => follow.followerId === followerId && follow.followingId === followingId
    );
    if (entryToRemove) {
      this.follows.delete(entryToRemove[0]);
    }
  }
  async isFollowing(followerId, followingId) {
    return Array.from(this.follows.values()).some(
      (f) => f.followerId === followerId && f.followingId === followingId
    );
  }
  async getUserFollowers(userId) {
    const followerIds = Array.from(this.follows.values()).filter((f) => f.followingId === userId).map((f) => f.followerId);
    const followers = [];
    for (const followerId of followerIds) {
      const profile = await this.getUserProfile(followerId);
      if (profile) {
        followers.push(profile);
      }
    }
    return followers;
  }
  async getUserFollowing(userId) {
    const followingIds = Array.from(this.follows.values()).filter((f) => f.followerId === userId).map((f) => f.followingId);
    const following = [];
    for (const followingId of followingIds) {
      const profile = await this.getUserProfile(followingId);
      if (profile) {
        following.push(profile);
      }
    }
    return following;
  }
};
var db = null;
var connection = null;
if (process.env.NODE_ENV === "production" && process.env.DATABASE_URL) {
  try {
    connection = neon(process.env.DATABASE_URL);
    db = drizzle(connection);
    console.log("Connected to PostgreSQL database");
  } catch (error) {
    console.warn("Database connection failed, falling back to memory storage:", error);
    db = null;
  }
} else {
  console.log("Using memory storage for development");
}
var PostgresStorage = class {
  // User operations
  async getUser(id) {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }
  async getUserByUsername(username) {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }
  async getUserByEmail(email) {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }
  async createUser(insertUser) {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }
  async updateUserProfile(id, updates) {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    if (!result[0]) throw new Error("User not found");
    return result[0];
  }
  async getUserProfile(id) {
    const user = await this.getUser(id);
    if (!user) return void 0;
    const [followersResult, followingResult, notesResult] = await Promise.all([
      db.select({ count: count() }).from(follows).where(eq(follows.followingId, id)),
      db.select({ count: count() }).from(follows).where(eq(follows.followerId, id)),
      db.select({ count: count() }).from(notes).where(eq(notes.uploaderId, id))
    ]);
    return {
      ...user,
      followersCount: followersResult[0].count,
      followingCount: followingResult[0].count,
      notesCount: notesResult[0].count,
      isFollowing: false
    };
  }
  // Note operations
  async getNote(id) {
    const result = await db.select().from(notes).where(eq(notes.id, id)).limit(1);
    return result[0];
  }
  async getNoteWithUploader(id) {
    const result = await db.select({
      note: notes,
      uploader: {
        id: users.id,
        username: users.username,
        avatar: users.avatar,
        reputation: users.reputation
      }
    }).from(notes).leftJoin(users, eq(notes.uploaderId, users.id)).where(eq(notes.id, id)).limit(1);
    if (!result[0] || !result[0].uploader) return void 0;
    return {
      ...result[0].note,
      uploader: {
        ...result[0].uploader,
        avatar: result[0].uploader.avatar || void 0
      }
    };
  }
  async getNoteWithDetails(noteId, userId) {
    const noteWithUploader = await this.getNoteWithUploader(noteId);
    if (!noteWithUploader) return void 0;
    const [commentsResult, isBookmarkedResult, userRatingResult] = await Promise.all([
      db.select({ count: count() }).from(comments).where(eq(comments.noteId, noteId)),
      userId ? db.select().from(bookmarks).where(and(eq(bookmarks.noteId, noteId), eq(bookmarks.userId, userId))).limit(1) : Promise.resolve([]),
      userId ? db.select().from(ratings).where(and(eq(ratings.noteId, noteId), eq(ratings.userId, userId))).limit(1) : Promise.resolve([])
    ]);
    return {
      ...noteWithUploader,
      commentsCount: commentsResult[0].count,
      isBookmarked: isBookmarkedResult.length > 0,
      userRating: userRatingResult[0]?.rating
    };
  }
  async getAllNotes() {
    const result = await db.select({
      note: notes,
      uploader: {
        id: users.id,
        username: users.username,
        avatar: users.avatar,
        reputation: users.reputation
      }
    }).from(notes).leftJoin(users, eq(notes.uploaderId, users.id)).orderBy(desc(notes.createdAt));
    return result.map((row) => ({
      ...row.note,
      uploader: {
        ...row.uploader,
        avatar: row.uploader.avatar || void 0
      }
    }));
  }
  async getNotesBySubject(subject) {
    const result = await db.select({
      note: notes,
      uploader: {
        id: users.id,
        username: users.username,
        avatar: users.avatar,
        reputation: users.reputation
      }
    }).from(notes).leftJoin(users, eq(notes.uploaderId, users.id)).where(eq(notes.subject, subject)).orderBy(desc(notes.createdAt));
    return result.map((row) => ({
      ...row.note,
      uploader: {
        ...row.uploader,
        avatar: row.uploader.avatar || void 0
      }
    }));
  }
  async getNotesByUser(userId) {
    const result = await db.select({
      note: notes,
      uploader: {
        id: users.id,
        username: users.username,
        avatar: users.avatar,
        reputation: users.reputation
      }
    }).from(notes).leftJoin(users, eq(notes.uploaderId, users.id)).where(eq(notes.uploaderId, userId)).orderBy(desc(notes.createdAt));
    return result.map((row) => ({
      ...row.note,
      uploader: {
        ...row.uploader,
        avatar: row.uploader.avatar || void 0
      }
    }));
  }
  async searchNotes(query) {
    const result = await db.select({
      note: notes,
      uploader: {
        id: users.id,
        username: users.username,
        avatar: users.avatar,
        reputation: users.reputation
      }
    }).from(notes).leftJoin(users, eq(notes.uploaderId, users.id)).where(
      or(
        ilike(notes.title, `%${query}%`),
        ilike(notes.description, `%${query}%`),
        ilike(notes.subject, `%${query}%`)
      )
    ).orderBy(desc(notes.createdAt));
    return result.map((row) => ({
      ...row.note,
      uploader: {
        ...row.uploader,
        avatar: row.uploader.avatar || void 0
      }
    }));
  }
  async getFeaturedNotes() {
    const result = await db.select({
      note: notes,
      uploader: {
        id: users.id,
        username: users.username,
        avatar: users.avatar,
        reputation: users.reputation
      }
    }).from(notes).leftJoin(users, eq(notes.uploaderId, users.id)).where(
      or(
        eq(notes.isFeatured, true),
        sql2`CAST(${notes.rating} AS DECIMAL) >= 4.5`,
        sql2`${notes.downloads} > 50`
      )
    ).orderBy(desc(notes.downloads)).limit(6);
    return result.map((row) => ({
      ...row.note,
      uploader: {
        ...row.uploader,
        avatar: row.uploader.avatar || void 0
      }
    }));
  }
  async getRecentNotes() {
    const result = await db.select({
      note: notes,
      uploader: {
        id: users.id,
        username: users.username,
        avatar: users.avatar,
        reputation: users.reputation
      }
    }).from(notes).leftJoin(users, eq(notes.uploaderId, users.id)).orderBy(desc(notes.createdAt)).limit(8);
    return result.map((row) => ({
      ...row.note,
      uploader: {
        ...row.uploader,
        avatar: row.uploader.avatar || void 0
      }
    }));
  }
  async createNote(insertNote) {
    const result = await db.insert(notes).values(insertNote).returning();
    return result[0];
  }
  async updateNote(id, updates) {
    const result = await db.update(notes).set(updates).where(eq(notes.id, id)).returning();
    if (!result[0]) throw new Error("Note not found");
    return result[0];
  }
  async incrementDownloads(id) {
    await db.update(notes).set({ downloads: sql2`${notes.downloads} + 1` }).where(eq(notes.id, id));
  }
  async incrementViews(id) {
    await db.update(notes).set({ views: sql2`${notes.views} + 1` }).where(eq(notes.id, id));
  }
  // Rating operations
  async createRating(insertRating) {
    const result = await db.insert(ratings).values(insertRating).returning();
    await this.updateNoteRating(insertRating.noteId);
    return result[0];
  }
  async getUserRating(noteId, userId) {
    const result = await db.select().from(ratings).where(and(eq(ratings.noteId, noteId), eq(ratings.userId, userId))).limit(1);
    return result[0];
  }
  async getNoteRatings(noteId) {
    const result = await db.select({
      rating: ratings,
      user: {
        id: users.id,
        username: users.username,
        avatar: users.avatar
      }
    }).from(ratings).leftJoin(users, eq(ratings.userId, users.id)).where(eq(ratings.noteId, noteId)).orderBy(desc(ratings.createdAt));
    return result.map((row) => ({
      ...row.rating,
      user: {
        ...row.user,
        avatar: row.user.avatar || void 0
      }
    }));
  }
  async updateRating(id, rating, review) {
    const existingRating = await db.select().from(ratings).where(eq(ratings.id, id)).limit(1);
    if (!existingRating[0]) throw new Error("Rating not found");
    const result = await db.update(ratings).set({ rating, review: review ?? existingRating[0].review }).where(eq(ratings.id, id)).returning();
    await this.updateNoteRating(existingRating[0].noteId);
    return result[0];
  }
  async updateNoteRating(noteId) {
    const ratingStats = await db.select({
      avgRating: sql2`AVG(${ratings.rating})`,
      count: count()
    }).from(ratings).where(eq(ratings.noteId, noteId));
    if (ratingStats[0].count > 0) {
      await db.update(notes).set({
        rating: ratingStats[0].avgRating.toFixed(2),
        ratingCount: ratingStats[0].count
      }).where(eq(notes.id, noteId));
    }
  }
  // Comment operations
  async createComment(insertComment) {
    const result = await db.insert(comments).values(insertComment).returning();
    return result[0];
  }
  async getNoteComments(noteId) {
    const result = await db.select({
      comment: comments,
      user: {
        id: users.id,
        username: users.username,
        avatar: users.avatar
      }
    }).from(comments).leftJoin(users, eq(comments.userId, users.id)).where(and(eq(comments.noteId, noteId), sql2`${comments.parentId} IS NULL`)).orderBy(asc(comments.createdAt));
    const commentsWithReplies = await Promise.all(
      result.map(async (row) => ({
        ...row.comment,
        user: {
          ...row.user,
          avatar: row.user.avatar || void 0
        },
        replies: await this.getCommentReplies(row.comment.id)
      }))
    );
    return commentsWithReplies;
  }
  async getCommentReplies(parentId) {
    const result = await db.select({
      comment: comments,
      user: {
        id: users.id,
        username: users.username,
        avatar: users.avatar
      }
    }).from(comments).leftJoin(users, eq(comments.userId, users.id)).where(eq(comments.parentId, parentId)).orderBy(asc(comments.createdAt));
    return result.map((row) => ({
      ...row.comment,
      user: {
        ...row.user,
        avatar: row.user.avatar || void 0
      }
    }));
  }
  async updateComment(id, content) {
    const result = await db.update(comments).set({ content }).where(eq(comments.id, id)).returning();
    if (!result[0]) throw new Error("Comment not found");
    return result[0];
  }
  async deleteComment(id) {
    await db.delete(comments).where(eq(comments.parentId, id));
    await db.delete(comments).where(eq(comments.id, id));
  }
  // Bookmark operations
  async createBookmark(insertBookmark) {
    const result = await db.insert(bookmarks).values(insertBookmark).returning();
    return result[0];
  }
  async removeBookmark(noteId, userId) {
    await db.delete(bookmarks).where(and(eq(bookmarks.noteId, noteId), eq(bookmarks.userId, userId)));
  }
  async getUserBookmarks(userId) {
    const result = await db.select({
      note: notes,
      uploader: {
        id: users.id,
        username: users.username,
        avatar: users.avatar,
        reputation: users.reputation
      }
    }).from(bookmarks).leftJoin(notes, eq(bookmarks.noteId, notes.id)).leftJoin(users, eq(notes.uploaderId, users.id)).where(eq(bookmarks.userId, userId)).orderBy(desc(bookmarks.createdAt));
    return result.map((row) => ({
      ...row.note,
      uploader: {
        ...row.uploader,
        avatar: row.uploader.avatar || void 0
      }
    }));
  }
  async isBookmarked(noteId, userId) {
    const result = await db.select().from(bookmarks).where(and(eq(bookmarks.noteId, noteId), eq(bookmarks.userId, userId))).limit(1);
    return result.length > 0;
  }
  // Collection operations
  async createCollection(insertCollection) {
    const result = await db.insert(collections).values(insertCollection).returning();
    return result[0];
  }
  async getUserCollections(userId) {
    const userCollections = await db.select().from(collections).where(eq(collections.userId, userId));
    const collectionsWithNotes = await Promise.all(
      userCollections.map(async (collection) => {
        const notesCount = await db.select({ count: count() }).from(collectionNotes).where(eq(collectionNotes.collectionId, collection.id));
        return {
          ...collection,
          notes: [],
          // Could populate if needed
          notesCount: notesCount[0].count
        };
      })
    );
    return collectionsWithNotes;
  }
  async getCollection(id) {
    const collection = await db.select().from(collections).where(eq(collections.id, id)).limit(1);
    if (!collection[0]) return void 0;
    const notesCount = await db.select({ count: count() }).from(collectionNotes).where(eq(collectionNotes.collectionId, id));
    return {
      ...collection[0],
      notes: [],
      // Could populate if needed
      notesCount: notesCount[0].count
    };
  }
  async addNoteToCollection(collectionId, noteId) {
    await db.insert(collectionNotes).values({ collectionId, noteId });
  }
  async removeNoteFromCollection(collectionId, noteId) {
    await db.delete(collectionNotes).where(and(eq(collectionNotes.collectionId, collectionId), eq(collectionNotes.noteId, noteId)));
  }
  async updateCollection(id, updates) {
    const result = await db.update(collections).set(updates).where(eq(collections.id, id)).returning();
    if (!result[0]) throw new Error("Collection not found");
    return result[0];
  }
  async deleteCollection(id) {
    await db.delete(collectionNotes).where(eq(collectionNotes.collectionId, id));
    await db.delete(collections).where(eq(collections.id, id));
  }
  // Follow operations
  async followUser(followerId, followingId) {
    await db.insert(follows).values({ followerId, followingId });
  }
  async unfollowUser(followerId, followingId) {
    await db.delete(follows).where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
  }
  async isFollowing(followerId, followingId) {
    const result = await db.select().from(follows).where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId))).limit(1);
    return result.length > 0;
  }
  async getUserFollowers(userId) {
    const result = await db.select({
      user: users
    }).from(follows).leftJoin(users, eq(follows.followerId, users.id)).where(eq(follows.followingId, userId));
    const followers = await Promise.all(
      result.map(async (row) => {
        if (!row.user) return null;
        const profile = await this.getUserProfile(row.user.id);
        return profile;
      })
    );
    return followers.filter((profile) => profile !== null);
  }
  async getUserFollowing(userId) {
    const result = await db.select({
      user: users
    }).from(follows).leftJoin(users, eq(follows.followingId, users.id)).where(eq(follows.followerId, userId));
    const following = await Promise.all(
      result.map(async (row) => {
        if (!row.user) return null;
        const profile = await this.getUserProfile(row.user.id);
        return profile;
      })
    );
    return following.filter((profile) => profile !== null);
  }
};
var storage = db ? new PostgresStorage() : new MemStorage();

// server/routes.ts
import bcrypt from "bcryptjs";
var uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
var storageConfig = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  }
});
var upload = multer({
  storage: storageConfig,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|txt|md|doc|docx|ppt|pptx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const allowedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "text/plain",
      "text/markdown",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    ];
    const mimetypeValid = allowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith("text/");
    if (mimetypeValid && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Supported file types: PDF, Images (JPG, PNG, GIF, WebP), Text (TXT, MD), Documents (DOC, DOCX), Presentations (PPT, PPTX)"));
    }
  },
  limits: {
    fileSize: 25 * 1024 * 1024
    // 25MB limit
  }
});
async function registerRoutes(app2) {
  app2.get("/api/platform/stats", async (req, res) => {
    try {
      const allNotes = await storage.getAllNotes();
      let activeStudentsCount = 0;
      if (storage instanceof storage.constructor && storage.users) {
        activeStudentsCount = storage.users.size;
      }
      const uniqueSubjects = new Set(allNotes.map((note) => note.subject));
      const subjectsCount = uniqueSubjects.size;
      const uniqueUniversities = /* @__PURE__ */ new Set();
      for (const note of allNotes) {
        const uploader = note.uploader;
      }
      let universitiesCount = 0;
      if (storage instanceof storage.constructor && storage.users) {
        const users2 = Array.from(storage.users.values());
        const universities = new Set(
          users2.filter((user) => user.university).map((user) => user.university)
        );
        universitiesCount = universities.size;
      }
      res.json({
        notesShared: allNotes.length,
        activeStudents: activeStudentsCount,
        subjects: subjectsCount,
        universities: universitiesCount
      });
    } catch (error) {
      console.error("Error fetching platform stats:", error);
      res.status(500).json({ message: "Failed to fetch platform statistics" });
    }
  });
  app2.post("/api/auth/signup", async (req, res) => {
    try {
      const { username, email, password, university, major, year } = req.body;
      const userData = {
        username,
        email,
        password,
        university: university || void 0,
        major: major || void 0,
        year: year || void 0
      };
      const validatedData = insertUserSchema.parse(userData);
      const existingUserByEmail = await storage.getUserByEmail(validatedData.email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      const existingUserByUsername = await storage.getUserByUsername(validatedData.username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }
      const hashedPassword = await bcrypt.hash(validatedData.password, 12);
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword
      });
      req.session.userId = user.id;
      req.session.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar || void 0
      };
      const { password: _, ...userResponse } = user;
      res.status(201).json({
        message: "User created successfully",
        user: userResponse
      });
    } catch (error) {
      console.error("Signup error:", error);
      if (error instanceof Error && error.message.includes("validation")) {
        return res.status(400).json({ message: "Invalid input data" });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      req.session.userId = user.id;
      req.session.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar || void 0
      };
      const { password: _, ...userResponse } = user;
      res.json({
        message: "Login successful",
        user: userResponse
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });
  app2.post("/api/auth/logout", async (req, res) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destroy error:", err);
          return res.status(500).json({ message: "Logout failed" });
        }
        res.clearCookie("quill.sid");
        res.json({ message: "Logout successful" });
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Logout failed" });
    }
  });
  app2.get("/api/auth/me", async (req, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        req.session.destroy(() => {
        });
        return res.status(401).json({ message: "User not found" });
      }
      const { password: _, ...userResponse } = user;
      res.json({
        user: userResponse
      });
    } catch (error) {
      console.error("Me endpoint error:", error);
      res.status(500).json({ message: "Failed to get user info" });
    }
  });
  const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };
  app2.get("/api/notes", async (req, res) => {
    try {
      const {
        search,
        subject,
        fileType,
        professor,
        course,
        semester,
        minRating,
        sortBy,
        tags,
        page = "1",
        limit = "20"
      } = req.query;
      let notes2 = await storage.getAllNotes();
      if (search && typeof search === "string") {
        const searchTerm = search.toLowerCase();
        notes2 = notes2.filter(
          (note) => note.title.toLowerCase().includes(searchTerm) || note.description?.toLowerCase().includes(searchTerm) || note.subject.toLowerCase().includes(searchTerm) || note.course?.toLowerCase().includes(searchTerm) || note.professor?.toLowerCase().includes(searchTerm) || note.tags && note.tags.some((tag) => tag.toLowerCase().includes(searchTerm))
        );
      }
      if (subject && typeof subject === "string" && subject !== "All Subjects") {
        notes2 = notes2.filter((note) => note.subject === subject);
      }
      if (fileType && typeof fileType === "string" && fileType !== "All Types") {
        const typeMap = {
          "PDF": "pdf",
          "Image": "image",
          "Document": "text",
          "Presentation": "pdf",
          "Text": "text"
        };
        const mappedType = typeMap[fileType];
        if (mappedType) {
          notes2 = notes2.filter((note) => note.fileType === mappedType);
        }
      }
      if (professor && typeof professor === "string") {
        notes2 = notes2.filter(
          (note) => note.professor?.toLowerCase().includes(professor.toLowerCase())
        );
      }
      if (course && typeof course === "string") {
        notes2 = notes2.filter(
          (note) => note.course?.toLowerCase().includes(course.toLowerCase())
        );
      }
      if (semester && typeof semester === "string" && semester !== "All Semesters") {
        notes2 = notes2.filter((note) => note.semester === semester);
      }
      if (minRating && typeof minRating === "string") {
        const minRatingNum = parseFloat(minRating);
        notes2 = notes2.filter((note) => parseFloat(note.rating || "0") >= minRatingNum);
      }
      if (tags && typeof tags === "string") {
        const tagArray = tags.split(",").map((tag) => tag.trim().toLowerCase());
        notes2 = notes2.filter(
          (note) => note.tags && tagArray.some(
            (tag) => note.tags.some((noteTag) => noteTag.toLowerCase().includes(tag))
          )
        );
      }
      if (sortBy && typeof sortBy === "string") {
        switch (sortBy) {
          case "date":
            notes2.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            break;
          case "rating":
            notes2.sort((a, b) => parseFloat(b.rating || "0") - parseFloat(a.rating || "0"));
            break;
          case "downloads":
            notes2.sort((a, b) => b.downloads - a.downloads);
            break;
          case "views":
            notes2.sort((a, b) => b.views - a.views);
            break;
          default:
            break;
        }
      }
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const paginatedNotes = notes2.slice(startIndex, endIndex);
      res.json({
        notes: paginatedNotes,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: notes2.length,
          totalPages: Math.ceil(notes2.length / limitNum)
        }
      });
    } catch (error) {
      console.error("Error fetching notes:", error);
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });
  app2.get("/api/search/suggestions", async (req, res) => {
    try {
      const { query } = req.query;
      if (!query || typeof query !== "string" || query.length < 2) {
        return res.json([]);
      }
      const allNotes = await storage.getAllNotes();
      const suggestions = /* @__PURE__ */ new Set();
      allNotes.forEach((note) => {
        const searchTerm = query.toLowerCase();
        if (note.title.toLowerCase().includes(searchTerm)) {
          suggestions.add(note.title);
        }
        if (note.subject.toLowerCase().includes(searchTerm)) {
          suggestions.add(note.subject);
        }
        if (note.course && note.course.toLowerCase().includes(searchTerm)) {
          suggestions.add(note.course);
        }
        if (note.professor && note.professor.toLowerCase().includes(searchTerm)) {
          suggestions.add(note.professor);
        }
        if (note.tags) {
          note.tags.forEach((tag) => {
            if (tag.toLowerCase().includes(searchTerm)) {
              suggestions.add(tag);
            }
          });
        }
      });
      res.json(Array.from(suggestions).slice(0, 8));
    } catch (error) {
      console.error("Error fetching search suggestions:", error);
      res.status(500).json({ message: "Failed to fetch suggestions" });
    }
  });
  app2.get("/api/notes/featured", async (req, res) => {
    try {
      const notes2 = await storage.getFeaturedNotes();
      res.json(notes2);
    } catch (error) {
      console.error("Error fetching featured notes:", error);
      res.status(500).json({ message: "Failed to fetch featured notes" });
    }
  });
  app2.get("/api/notes/trending", async (req, res) => {
    try {
      const allNotes = await storage.getAllNotes();
      const trendingNotes = allNotes.map((note) => ({
        ...note,
        trendingScore: note.downloads * 2 + note.views + parseFloat(note.rating || "0") * 10
      })).sort((a, b) => b.trendingScore - a.trendingScore).slice(0, 12);
      res.json(trendingNotes);
    } catch (error) {
      console.error("Error fetching trending notes:", error);
      res.status(500).json({ message: "Failed to fetch trending notes" });
    }
  });
  app2.get("/api/notes/recommendations", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const userNotes = await storage.getNotesByUser(userId);
      const allNotes = await storage.getAllNotes();
      const userSubjects = Array.from(new Set(userNotes.map((note) => note.subject)));
      const userTags = Array.from(new Set(userNotes.flatMap((note) => note.tags || [])));
      const recommendations = allNotes.filter((note) => note.uploaderId !== userId).map((note) => {
        let score = 0;
        if (userSubjects.includes(note.subject)) {
          score += 10;
        }
        const noteTagsLower = (note.tags || []).map((tag) => tag.toLowerCase());
        const userTagsLower = userTags.map((tag) => tag.toLowerCase());
        const tagMatches = noteTagsLower.filter(
          (tag) => userTagsLower.some((userTag) => userTag.includes(tag) || tag.includes(userTag))
        ).length;
        score += tagMatches * 5;
        score += parseFloat(note.rating || "0") * 2;
        score += Math.log(note.downloads + 1) + Math.log(note.views + 1);
        return { ...note, recommendationScore: score };
      }).filter((note) => note.recommendationScore > 0).sort((a, b) => b.recommendationScore - a.recommendationScore).slice(0, 15);
      res.json(recommendations);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });
  app2.get("/api/notes/:id/related", async (req, res) => {
    try {
      const noteId = req.params.id;
      const currentNote = await storage.getNote(noteId);
      if (!currentNote) {
        return res.status(404).json({ message: "Note not found" });
      }
      const allNotes = await storage.getAllNotes();
      const relatedNotes = allNotes.filter((note) => note.id !== noteId).map((note) => {
        let similarity = 0;
        if (note.subject === currentNote.subject) similarity += 5;
        if (note.course && currentNote.course && note.course === currentNote.course) similarity += 8;
        if (note.professor && currentNote.professor && note.professor === currentNote.professor) similarity += 6;
        if (note.tags && currentNote.tags) {
          const noteTagsLower = note.tags.map((tag) => tag.toLowerCase());
          const currentTagsLower = currentNote.tags.map((tag) => tag.toLowerCase());
          const commonTags = noteTagsLower.filter((tag) => currentTagsLower.includes(tag)).length;
          similarity += commonTags * 3;
        }
        const noteTitleWords = note.title.toLowerCase().split(" ");
        const currentTitleWords = currentNote.title.toLowerCase().split(" ");
        const commonWords = noteTitleWords.filter(
          (word) => word.length > 3 && currentTitleWords.includes(word)
        ).length;
        similarity += commonWords * 2;
        return { ...note, similarity };
      }).filter((note) => note.similarity > 0).sort((a, b) => b.similarity - a.similarity).slice(0, 6);
      res.json(relatedNotes);
    } catch (error) {
      console.error("Error fetching related notes:", error);
      res.status(500).json({ message: "Failed to fetch related notes" });
    }
  });
  app2.get("/api/notes/recent", async (req, res) => {
    try {
      const notes2 = await storage.getRecentNotes();
      res.json(notes2);
    } catch (error) {
      console.error("Error fetching recent notes:", error);
      res.status(500).json({ message: "Failed to fetch recent notes" });
    }
  });
  app2.get("/api/notes/:id", async (req, res) => {
    try {
      const note = await storage.getNoteWithUploader(req.params.id);
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      res.json(note);
    } catch (error) {
      console.error("Error fetching note:", error);
      res.status(500).json({ message: "Failed to fetch note" });
    }
  });
  app2.post("/api/notes", requireAuth, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const { title, description, subject } = req.body;
      if (!title || !subject) {
        return res.status(400).json({ message: "Title and subject are required" });
      }
      let fileType = "text";
      const ext = path.extname(req.file.originalname).toLowerCase();
      if (ext === ".pdf") {
        fileType = "pdf";
      } else if ([".jpg", ".jpeg", ".png", ".gif"].includes(ext)) {
        fileType = "image";
      }
      const noteData = {
        title,
        description: description || null,
        subject,
        fileType,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        filePath: req.file.path,
        uploaderId: req.session.userId
        // Use authenticated user
      };
      const validatedData = insertNoteSchema.parse(noteData);
      const note = await storage.createNote(validatedData);
      res.status(201).json(note);
    } catch (error) {
      console.error("Error uploading note:", error);
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ message: "Failed to upload note" });
    }
  });
  app2.get("/api/notes/:id/download", async (req, res) => {
    try {
      const note = await storage.getNote(req.params.id);
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      await storage.incrementDownloads(req.params.id);
      res.download(note.filePath, note.fileName);
    } catch (error) {
      console.error("Error downloading note:", error);
      res.status(500).json({ message: "Failed to download note" });
    }
  });
  app2.get("/api/notes/:id/details", async (req, res) => {
    try {
      const userId = req.session.userId;
      const noteWithDetails = await storage.getNoteWithDetails(req.params.id, userId);
      if (!noteWithDetails) {
        return res.status(404).json({ message: "Note not found" });
      }
      await storage.incrementViews(req.params.id);
      res.json(noteWithDetails);
    } catch (error) {
      console.error("Error fetching note details:", error);
      res.status(500).json({ message: "Failed to fetch note details" });
    }
  });
  app2.get("/api/notes/:id/comments", async (req, res) => {
    try {
      const comments2 = await storage.getNoteComments(req.params.id);
      res.json(comments2);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });
  app2.post("/api/comments", requireAuth, async (req, res) => {
    try {
      const { noteId, content, parentId } = req.body;
      if (!noteId || !content) {
        return res.status(400).json({ message: "Note ID and content are required" });
      }
      const comment = await storage.createComment({
        noteId,
        userId: req.session.userId,
        content,
        parentId: parentId || void 0
      });
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });
  app2.get("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const profile = await storage.getUserProfile(req.session.userId);
      if (!profile) {
        return res.status(404).json({ message: "User profile not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });
  app2.get("/api/user/notes", requireAuth, async (req, res) => {
    try {
      const notes2 = await storage.getNotesByUser(req.session.userId);
      res.json(notes2);
    } catch (error) {
      console.error("Error fetching user notes:", error);
      res.status(500).json({ message: "Failed to fetch user notes" });
    }
  });
  app2.get("/api/user/bookmarks", requireAuth, async (req, res) => {
    try {
      const bookmarks2 = await storage.getUserBookmarks(req.session.userId);
      res.json(bookmarks2);
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
      res.status(500).json({ message: "Failed to fetch bookmarks" });
    }
  });
  app2.get("/api/user/stats", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const userNotes = await storage.getNotesByUser(userId);
      const totalViews = userNotes.reduce((sum, note) => sum + note.views, 0);
      const ratingsSum = userNotes.reduce((sum, note) => sum + parseFloat(note.rating || "0"), 0);
      const avgRating = userNotes.length > 0 ? ratingsSum / userNotes.length : 0;
      const thisMonthUploads = userNotes.filter((note) => {
        const noteDate = new Date(note.createdAt);
        const now = /* @__PURE__ */ new Date();
        return noteDate.getMonth() === now.getMonth() && noteDate.getFullYear() === now.getFullYear();
      }).length;
      const thisMonthDownloads = Math.floor(userNotes.reduce((sum, note) => sum + note.downloads, 0) * 0.1);
      const stats = {
        totalViews,
        avgRating: Number(avgRating.toFixed(1)),
        thisMonthUploads,
        thisMonthDownloads
      };
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });
  app2.post("/api/bookmarks", requireAuth, async (req, res) => {
    try {
      const { noteId } = req.body;
      if (!noteId) {
        return res.status(400).json({ message: "Note ID is required" });
      }
      const isBookmarked = await storage.isBookmarked(noteId, req.session.userId);
      if (isBookmarked) {
        return res.status(400).json({ message: "Note already bookmarked" });
      }
      const bookmark = await storage.createBookmark({
        noteId,
        userId: req.session.userId
      });
      res.status(201).json(bookmark);
    } catch (error) {
      console.error("Error creating bookmark:", error);
      res.status(500).json({ message: "Failed to create bookmark" });
    }
  });
  app2.delete("/api/bookmarks/:noteId", requireAuth, async (req, res) => {
    try {
      await storage.removeBookmark(req.params.noteId, req.session.userId);
      res.json({ message: "Bookmark removed" });
    } catch (error) {
      console.error("Error removing bookmark:", error);
      res.status(500).json({ message: "Failed to remove bookmark" });
    }
  });
  app2.use("/uploads", (req, res, next) => {
    next();
  }, express.static(uploadDir));
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express2 from "express";
import fs2 from "fs";
import path3 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path2 from "path";
import { fileURLToPath } from "url";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var __dirname = path2.dirname(fileURLToPath(import.meta.url));
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path2.resolve(__dirname, "client", "src"),
      "@shared": path2.resolve(__dirname, "shared"),
      "@assets": path2.resolve(__dirname, "attached_assets")
    }
  },
  root: path2.resolve(__dirname, "client"),
  build: {
    outDir: path2.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: "0.0.0.0",
    port: 5e3,
    allowedHosts: true,
    hmr: {
      port: 5e3
    },
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid/non-secure";
var __filename = fileURLToPath2(import.meta.url);
var __dirname2 = path3.dirname(__filename);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    host: "0.0.0.0",
    allowedHosts: "all"
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: {
      ...serverOptions,
      allowedHosts: true
    },
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(__dirname2, "public");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express3();
var MemStore = MemoryStore(session);
app.use(session({
  store: new MemStore({
    checkPeriod: 864e5
    // prune expired entries every 24h
  }),
  name: "quill.sid",
  secret: process.env.SESSION_SECRET || "fallback-secret-key-for-development",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    // Allow non-HTTPS in development
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1e3
    // 30 days
  }
}));
app.use(express3.json());
app.use(express3.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
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
(async () => {
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
  const port = parseInt(process.env.PORT || "5000", 10);
  const wss = new WebSocketServer({ server });
  const connectedClients = /* @__PURE__ */ new Map();
  wss.on("connection", (ws, request) => {
    log("WebSocket client connected");
    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === "authenticate" && data.userId) {
          connectedClients.set(data.userId, ws);
          ws.send(JSON.stringify({ type: "authenticated", userId: data.userId }));
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });
    ws.on("close", () => {
      connectedClients.forEach((client, userId) => {
        if (client === ws) {
          connectedClients.delete(userId);
        }
      });
      log("WebSocket client disconnected");
    });
  });
  app.wss = wss;
  app.connectedClients = connectedClients;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
