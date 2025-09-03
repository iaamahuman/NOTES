// server/index.ts
import express3 from "express";

// server/routes.ts
import express from "express";
import { createServer } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";

// server/storage.ts
import { randomUUID } from "crypto";
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
    const sampleUser = {
      id: "sample-user-id",
      username: "alexchen",
      email: "alex@example.com",
      password: "hashedpassword",
      avatar: null,
      bio: null,
      university: null,
      major: null,
      year: null,
      reputation: 0,
      totalUploads: 0,
      totalDownloads: 0,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.users.set(sampleUser.id, sampleUser);
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
var storage = new MemStorage();

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
    const allowedTypes = /jpeg|jpg|png|gif|pdf|txt|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only PDF, images, and text files are allowed!"));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024
    // 10MB limit
  }
});
async function registerRoutes(app2) {
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
      res.json({ message: "Logout successful" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Logout failed" });
    }
  });
  app2.get("/api/notes", async (req, res) => {
    try {
      const { subject, search } = req.query;
      let notes2;
      if (search && typeof search === "string") {
        notes2 = await storage.searchNotes(search);
      } else if (subject && typeof subject === "string") {
        notes2 = await storage.getNotesBySubject(subject);
      } else {
        notes2 = await storage.getAllNotes();
      }
      res.json(notes2);
    } catch (error) {
      console.error("Error fetching notes:", error);
      res.status(500).json({ message: "Failed to fetch notes" });
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
  app2.post("/api/notes", upload.single("file"), async (req, res) => {
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
        uploaderId: "sample-user-id"
        // Using sample user for now
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
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
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
    allowedHosts: true
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
    server: serverOptions,
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
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
