import { 
  type User, type InsertUser, type Note, type InsertNote, type NoteWithUploader,
  type Rating, type InsertRating, type Comment, type InsertComment,
  type Bookmark, type InsertBookmark, type Collection, type InsertCollection,
  type NoteWithDetails, type CommentWithUser, type RatingWithUser,
  type UserProfile, type CollectionWithNotes
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserProfile(id: string, updates: Partial<InsertUser>): Promise<User>;
  getUserProfile(id: string): Promise<UserProfile | undefined>;
  
  // Note operations
  getNote(id: string): Promise<Note | undefined>;
  getNoteWithUploader(id: string): Promise<NoteWithUploader | undefined>;
  getNoteWithDetails(noteId: string, userId?: string): Promise<NoteWithDetails | undefined>;
  getAllNotes(): Promise<NoteWithUploader[]>;
  getNotesBySubject(subject: string): Promise<NoteWithUploader[]>;
  getNotesByUser(userId: string): Promise<NoteWithUploader[]>;
  searchNotes(query: string): Promise<NoteWithUploader[]>;
  getFeaturedNotes(): Promise<NoteWithUploader[]>;
  getRecentNotes(): Promise<NoteWithUploader[]>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: string, updates: Partial<InsertNote>): Promise<Note>;
  incrementDownloads(id: string): Promise<void>;
  incrementViews(id: string): Promise<void>;
  
  // Rating operations
  createRating(rating: InsertRating): Promise<Rating>;
  getUserRating(noteId: string, userId: string): Promise<Rating | undefined>;
  getNoteRatings(noteId: string): Promise<RatingWithUser[]>;
  updateRating(id: string, rating: number, review?: string): Promise<Rating>;
  
  // Comment operations
  createComment(comment: InsertComment): Promise<Comment>;
  getNoteComments(noteId: string): Promise<CommentWithUser[]>;
  getCommentReplies(parentId: string): Promise<CommentWithUser[]>;
  updateComment(id: string, content: string): Promise<Comment>;
  deleteComment(id: string): Promise<void>;
  
  // Bookmark operations
  createBookmark(bookmark: InsertBookmark): Promise<Bookmark>;
  removeBookmark(noteId: string, userId: string): Promise<void>;
  getUserBookmarks(userId: string): Promise<NoteWithUploader[]>;
  isBookmarked(noteId: string, userId: string): Promise<boolean>;
  
  // Collection operations
  createCollection(collection: InsertCollection): Promise<Collection>;
  getUserCollections(userId: string): Promise<CollectionWithNotes[]>;
  getCollection(id: string): Promise<CollectionWithNotes | undefined>;
  addNoteToCollection(collectionId: string, noteId: string): Promise<void>;
  removeNoteFromCollection(collectionId: string, noteId: string): Promise<void>;
  updateCollection(id: string, updates: Partial<InsertCollection>): Promise<Collection>;
  deleteCollection(id: string): Promise<void>;
  
  // Follow operations
  followUser(followerId: string, followingId: string): Promise<void>;
  unfollowUser(followerId: string, followingId: string): Promise<void>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  getUserFollowers(userId: string): Promise<UserProfile[]>;
  getUserFollowing(userId: string): Promise<UserProfile[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private notes: Map<string, Note>;
  private ratings: Map<string, Rating>;
  private comments: Map<string, Comment>;
  private bookmarks: Map<string, Bookmark>;
  private follows: Map<string, { followerId: string; followingId: string; }>;
  private collections: Map<string, Collection>;
  private collectionNotes: Map<string, { collectionId: string; noteId: string; }>;

  constructor() {
    this.users = new Map();
    this.notes = new Map();
    this.ratings = new Map();
    this.comments = new Map();
    this.bookmarks = new Map();
    this.follows = new Map();
    this.collections = new Map();
    this.collectionNotes = new Map();
    
    // Create a sample user for development
    const sampleUser: User = {
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
      createdAt: new Date(),
    };
    this.users.set(sampleUser.id, sampleUser);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
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
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getNote(id: string): Promise<Note | undefined> {
    return this.notes.get(id);
  }

  async getNoteWithUploader(id: string): Promise<NoteWithUploader | undefined> {
    const note = this.notes.get(id);
    if (!note) return undefined;

    const uploader = await this.getUser(note.uploaderId);
    if (!uploader) return undefined;

    return {
      ...note,
      uploader: {
        username: uploader.username,
        id: uploader.id,
        avatar: uploader.avatar ?? undefined,
        reputation: uploader.reputation,
      },
    };
  }

  async getAllNotes(): Promise<NoteWithUploader[]> {
    const notesArray = Array.from(this.notes.values());
    const notesWithUploaders: NoteWithUploader[] = [];

    for (const note of notesArray) {
      const uploader = await this.getUser(note.uploaderId);
      if (uploader) {
        notesWithUploaders.push({
          ...note,
          uploader: {
            username: uploader.username,
            id: uploader.id,
            avatar: uploader.avatar ?? undefined,
            reputation: uploader.reputation,
          },
        });
      }
    }

    return notesWithUploaders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getNotesBySubject(subject: string): Promise<NoteWithUploader[]> {
    const allNotes = await this.getAllNotes();
    return allNotes.filter(note => note.subject.toLowerCase() === subject.toLowerCase());
  }

  async searchNotes(query: string): Promise<NoteWithUploader[]> {
    const allNotes = await this.getAllNotes();
    const searchTerm = query.toLowerCase();
    
    return allNotes.filter(note => 
      note.title.toLowerCase().includes(searchTerm) ||
      note.description?.toLowerCase().includes(searchTerm) ||
      note.subject.toLowerCase().includes(searchTerm)
    );
  }

  async getFeaturedNotes(): Promise<NoteWithUploader[]> {
    const allNotes = await this.getAllNotes();
    return allNotes
      .filter(note => parseFloat(note.rating || '0') >= 4.5 || note.downloads > 100)
      .slice(0, 6);
  }

  async getRecentNotes(): Promise<NoteWithUploader[]> {
    const allNotes = await this.getAllNotes();
    return allNotes.slice(0, 8);
  }

  async createNote(insertNote: InsertNote): Promise<Note> {
    const id = randomUUID();
    const note: Note = {
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
      createdAt: new Date(),
    };
    this.notes.set(id, note);
    return note;
  }

  async incrementDownloads(id: string): Promise<void> {
    const note = this.notes.get(id);
    if (note) {
      note.downloads = note.downloads + 1;
      this.notes.set(id, note);
    }
  }

  async incrementViews(id: string): Promise<void> {
    const note = this.notes.get(id);
    if (note) {
      note.views = note.views + 1;
      this.notes.set(id, note);
    }
  }

  async updateUserProfile(id: string, updates: Partial<InsertUser>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    
    const updatedUser: User = {
      ...user,
      ...updates,
      avatar: updates.avatar ?? user.avatar,
      bio: updates.bio ?? user.bio,
      university: updates.university ?? user.university,
      major: updates.major ?? user.major,
      year: updates.year ?? user.year,
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getUserProfile(id: string): Promise<UserProfile | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const followersCount = Array.from(this.follows.values()).filter(f => f.followingId === id).length;
    const followingCount = Array.from(this.follows.values()).filter(f => f.followerId === id).length;
    const notesCount = Array.from(this.notes.values()).filter(n => n.uploaderId === id).length;
    
    return {
      ...user,
      followersCount,
      followingCount,
      notesCount,
      isFollowing: false,
    };
  }

  async getNoteWithDetails(noteId: string, userId?: string): Promise<NoteWithDetails | undefined> {
    const noteWithUploader = await this.getNoteWithUploader(noteId);
    if (!noteWithUploader) return undefined;
    
    const commentsCount = Array.from(this.comments.values()).filter(c => c.noteId === noteId).length;
    const isBookmarked = userId ? await this.isBookmarked(noteId, userId) : false;
    const userRating = userId ? (await this.getUserRating(noteId, userId))?.rating : undefined;
    
    return {
      ...noteWithUploader,
      commentsCount,
      isBookmarked,
      userRating,
    };
  }

  async getNotesByUser(userId: string): Promise<NoteWithUploader[]> {
    const allNotes = await this.getAllNotes();
    return allNotes.filter(note => note.uploaderId === userId);
  }

  async updateNote(id: string, updates: Partial<InsertNote>): Promise<Note> {
    const note = this.notes.get(id);
    if (!note) throw new Error("Note not found");
    
    const updatedNote: Note = { ...note, ...updates };
    this.notes.set(id, updatedNote);
    return updatedNote;
  }

  // Rating operations
  async createRating(insertRating: InsertRating): Promise<Rating> {
    const id = randomUUID();
    const rating: Rating = {
      ...insertRating,
      review: insertRating.review ?? null,
      id,
      createdAt: new Date(),
    };
    this.ratings.set(id, rating);
    
    // Update note rating
    await this.updateNoteRating(insertRating.noteId);
    
    return rating;
  }

  private async updateNoteRating(noteId: string): Promise<void> {
    const noteRatings = Array.from(this.ratings.values()).filter(r => r.noteId === noteId);
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

  async getUserRating(noteId: string, userId: string): Promise<Rating | undefined> {
    return Array.from(this.ratings.values()).find(r => r.noteId === noteId && r.userId === userId);
  }

  async getNoteRatings(noteId: string): Promise<RatingWithUser[]> {
    const noteRatings = Array.from(this.ratings.values()).filter(r => r.noteId === noteId);
    const ratingsWithUsers: RatingWithUser[] = [];
    
    for (const rating of noteRatings) {
      const user = await this.getUser(rating.userId);
      if (user) {
        ratingsWithUsers.push({
          ...rating,
          user: {
            username: user.username,
            avatar: user.avatar ?? undefined,
            id: user.id,
          },
        });
      }
    }
    
    return ratingsWithUsers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateRating(id: string, rating: number, review?: string): Promise<Rating> {
    const existingRating = this.ratings.get(id);
    if (!existingRating) throw new Error("Rating not found");
    
    const updatedRating: Rating = {
      ...existingRating,
      rating,
      review: review ?? existingRating.review,
    };
    
    this.ratings.set(id, updatedRating);
    await this.updateNoteRating(existingRating.noteId);
    
    return updatedRating;
  }

  // Comment operations
  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = randomUUID();
    const comment: Comment = {
      ...insertComment,
      parentId: insertComment.parentId ?? null,
      id,
      createdAt: new Date(),
    };
    this.comments.set(id, comment);
    return comment;
  }

  async getNoteComments(noteId: string): Promise<CommentWithUser[]> {
    const noteComments = Array.from(this.comments.values())
      .filter(c => c.noteId === noteId && !c.parentId);
    
    const commentsWithUsers: CommentWithUser[] = [];
    
    for (const comment of noteComments) {
      const user = await this.getUser(comment.userId);
      if (user) {
        const replies = await this.getCommentReplies(comment.id);
        commentsWithUsers.push({
          ...comment,
          user: {
            username: user.username,
            avatar: user.avatar ?? undefined,
            id: user.id,
          },
          replies,
        });
      }
    }
    
    return commentsWithUsers.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async getCommentReplies(parentId: string): Promise<CommentWithUser[]> {
    const replies = Array.from(this.comments.values()).filter(c => c.parentId === parentId);
    const repliesWithUsers: CommentWithUser[] = [];
    
    for (const reply of replies) {
      const user = await this.getUser(reply.userId);
      if (user) {
        repliesWithUsers.push({
          ...reply,
          user: {
            username: user.username,
            avatar: user.avatar ?? undefined,
            id: user.id,
          },
        });
      }
    }
    
    return repliesWithUsers.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async updateComment(id: string, content: string): Promise<Comment> {
    const comment = this.comments.get(id);
    if (!comment) throw new Error("Comment not found");
    
    const updatedComment: Comment = { ...comment, content };
    this.comments.set(id, updatedComment);
    return updatedComment;
  }

  async deleteComment(id: string): Promise<void> {
    this.comments.delete(id);
    // Also delete all replies
    Array.from(this.comments.keys()).forEach(key => {
      const comment = this.comments.get(key);
      if (comment && comment.parentId === id) {
        this.comments.delete(key);
      }
    });
  }

  // Bookmark operations
  async createBookmark(insertBookmark: InsertBookmark): Promise<Bookmark> {
    const id = randomUUID();
    const bookmark: Bookmark = {
      ...insertBookmark,
      id,
      createdAt: new Date(),
    };
    this.bookmarks.set(id, bookmark);
    return bookmark;
  }

  async removeBookmark(noteId: string, userId: string): Promise<void> {
    const bookmarkToRemove = Array.from(this.bookmarks.entries()).find(([_, bookmark]) => 
      bookmark.noteId === noteId && bookmark.userId === userId
    );
    
    if (bookmarkToRemove) {
      this.bookmarks.delete(bookmarkToRemove[0]);
    }
  }

  async getUserBookmarks(userId: string): Promise<NoteWithUploader[]> {
    const userBookmarks = Array.from(this.bookmarks.values()).filter(b => b.userId === userId);
    const bookmarkedNotes: NoteWithUploader[] = [];
    
    for (const bookmark of userBookmarks) {
      const note = await this.getNoteWithUploader(bookmark.noteId);
      if (note) {
        bookmarkedNotes.push(note);
      }
    }
    
    return bookmarkedNotes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async isBookmarked(noteId: string, userId: string): Promise<boolean> {
    return Array.from(this.bookmarks.values()).some(b => b.noteId === noteId && b.userId === userId);
  }

  // Collection operations (stub implementations)
  async createCollection(collection: InsertCollection): Promise<Collection> {
    const id = randomUUID();
    const newCollection: Collection = {
      ...collection,
      description: collection.description ?? null,
      isPublic: collection.isPublic ?? false,
      id,
      createdAt: new Date(),
    };
    this.collections.set(id, newCollection);
    return newCollection;
  }

  async getUserCollections(userId: string): Promise<CollectionWithNotes[]> {
    const userCollections = Array.from(this.collections.values()).filter(c => c.userId === userId);
    return userCollections.map(collection => ({
      ...collection,
      notes: [],
      notesCount: 0,
    }));
  }

  async getCollection(id: string): Promise<CollectionWithNotes | undefined> {
    const collection = this.collections.get(id);
    if (!collection) return undefined;
    
    return {
      ...collection,
      notes: [],
      notesCount: 0,
    };
  }

  async addNoteToCollection(collectionId: string, noteId: string): Promise<void> {
    const id = randomUUID();
    this.collectionNotes.set(id, { collectionId, noteId });
  }

  async removeNoteFromCollection(collectionId: string, noteId: string): Promise<void> {
    const entryToRemove = Array.from(this.collectionNotes.entries()).find(([_, entry]) => 
      entry.collectionId === collectionId && entry.noteId === noteId
    );
    
    if (entryToRemove) {
      this.collectionNotes.delete(entryToRemove[0]);
    }
  }

  async updateCollection(id: string, updates: Partial<InsertCollection>): Promise<Collection> {
    const collection = this.collections.get(id);
    if (!collection) throw new Error("Collection not found");
    
    const updatedCollection: Collection = { ...collection, ...updates };
    this.collections.set(id, updatedCollection);
    return updatedCollection;
  }

  async deleteCollection(id: string): Promise<void> {
    this.collections.delete(id);
    // Remove all notes from this collection
    Array.from(this.collectionNotes.keys()).forEach(key => {
      const entry = this.collectionNotes.get(key);
      if (entry && entry.collectionId === id) {
        this.collectionNotes.delete(key);
      }
    });
  }

  // Follow operations (stub implementations)
  async followUser(followerId: string, followingId: string): Promise<void> {
    const id = randomUUID();
    this.follows.set(id, { followerId, followingId });
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    const entryToRemove = Array.from(this.follows.entries()).find(([_, follow]) => 
      follow.followerId === followerId && follow.followingId === followingId
    );
    
    if (entryToRemove) {
      this.follows.delete(entryToRemove[0]);
    }
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    return Array.from(this.follows.values()).some(f => 
      f.followerId === followerId && f.followingId === followingId
    );
  }

  async getUserFollowers(userId: string): Promise<UserProfile[]> {
    const followerIds = Array.from(this.follows.values())
      .filter(f => f.followingId === userId)
      .map(f => f.followerId);
    
    const followers: UserProfile[] = [];
    for (const followerId of followerIds) {
      const profile = await this.getUserProfile(followerId);
      if (profile) {
        followers.push(profile);
      }
    }
    
    return followers;
  }

  async getUserFollowing(userId: string): Promise<UserProfile[]> {
    const followingIds = Array.from(this.follows.values())
      .filter(f => f.followerId === userId)
      .map(f => f.followingId);
    
    const following: UserProfile[] = [];
    for (const followingId of followingIds) {
      const profile = await this.getUserProfile(followingId);
      if (profile) {
        following.push(profile);
      }
    }
    
    return following;
  }
}

export const storage = new MemStorage();
