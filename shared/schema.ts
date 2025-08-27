import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notes = pgTable("notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  subject: text("subject").notNull(),
  tags: text("tags").array(),
  course: text("course"),
  professor: text("professor"),
  semester: text("semester"),
  fileType: text("file_type").notNull(), // 'pdf', 'image', 'text'
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ratings = pgTable("ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  noteId: varchar("note_id").references(() => notes.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  review: text("review"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  noteId: varchar("note_id").references(() => notes.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  parentId: varchar("parent_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bookmarks = pgTable("bookmarks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  noteId: varchar("note_id").references(() => notes.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const follows = pgTable("follows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  followerId: varchar("follower_id").references(() => users.id).notNull(),
  followingId: varchar("following_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const collections = pgTable("collections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  userId: varchar("user_id").references(() => users.id).notNull(),
  isPublic: boolean("is_public").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const collectionNotes = pgTable("collection_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  collectionId: varchar("collection_id").references(() => collections.id).notNull(),
  noteId: varchar("note_id").references(() => notes.id).notNull(),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  reputation: true,
  totalUploads: true,
  totalDownloads: true,
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
  downloads: true,
  views: true,
  rating: true,
  ratingCount: true,
  isFeatured: true,
});

export const insertRatingSchema = createInsertSchema(ratings).omit({
  id: true,
  createdAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});

export const insertBookmarkSchema = createInsertSchema(bookmarks).omit({
  id: true,
  createdAt: true,
});

export const insertFollowSchema = createInsertSchema(follows).omit({
  id: true,
  createdAt: true,
});

export const insertCollectionSchema = createInsertSchema(collections).omit({
  id: true,
  createdAt: true,
});

export const insertCollectionNoteSchema = createInsertSchema(collectionNotes).omit({
  id: true,
  addedAt: true,
});

// Basic types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Note = typeof notes.$inferSelect;
export type InsertRating = z.infer<typeof insertRatingSchema>;
export type Rating = typeof ratings.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;
export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertFollow = z.infer<typeof insertFollowSchema>;
export type Follow = typeof follows.$inferSelect;
export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type Collection = typeof collections.$inferSelect;
export type InsertCollectionNote = z.infer<typeof insertCollectionNoteSchema>;
export type CollectionNote = typeof collectionNotes.$inferSelect;

// Extended types with relationships
export type NoteWithUploader = Note & {
  uploader: {
    username: string;
    id: string;
    avatar?: string;
    reputation: number;
  };
};

export type NoteWithDetails = NoteWithUploader & {
  commentsCount: number;
  isBookmarked?: boolean;
  userRating?: number;
};

export type CommentWithUser = Comment & {
  user: {
    username: string;
    avatar?: string;
    id: string;
  };
  replies?: CommentWithUser[];
};

export type RatingWithUser = Rating & {
  user: {
    username: string;
    avatar?: string;
    id: string;
  };
};

export type UserProfile = User & {
  followersCount: number;
  followingCount: number;
  notesCount: number;
  isFollowing?: boolean;
};

export type CollectionWithNotes = Collection & {
  notes: NoteWithUploader[];
  notesCount: number;
};
