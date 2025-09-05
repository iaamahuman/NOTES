import express, { type Express, type Request, type Response } from "express";
import { createServer, type Server } from "http";

// Extend Express Request to include session user
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    user?: {
      id: string;
      username: string;
      email: string;
      avatar?: string;
    };
  }
}
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { insertNoteSchema, insertUserSchema } from "@shared/schema";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storageConfig = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storageConfig,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|txt|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, images, and text files are allowed!'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { username, email, password, university, major, year } = req.body;
      
      // Validate input
      const userData = {
        username,
        email,
        password,
        university: university || undefined,
        major: major || undefined,
        year: year || undefined,
      };
      
      const validatedData = insertUserSchema.parse(userData);
      
      // Check if user already exists
      const existingUserByEmail = await storage.getUserByEmail(validatedData.email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      
      const existingUserByUsername = await storage.getUserByUsername(validatedData.username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 12);
      
      // Create user
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
      });
      
      // Create session for new user
      req.session.userId = user.id;
      req.session.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar || undefined,
      };
      
      // Don't return password
      const { password: _, ...userResponse } = user;
      
      res.status(201).json({
        message: "User created successfully",
        user: userResponse,
      });
    } catch (error) {
      console.error('Signup error:', error);
      if (error instanceof Error && error.message.includes('validation')) {
        return res.status(400).json({ message: "Invalid input data" });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });
  
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Create session
      req.session.userId = user.id;
      req.session.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar || undefined,
      };
      
      // Don't return password
      const { password: _, ...userResponse } = user;
      
      res.json({
        message: "Login successful",
        user: userResponse,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: "Login failed" });
    }
  });
  
  app.post("/api/auth/logout", async (req, res) => {
    try {
      // Clear the session
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destroy error:', err);
          return res.status(500).json({ message: "Logout failed" });
        }
        res.clearCookie('quill.sid');
        res.json({ message: "Logout successful" });
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: "Logout failed" });
    }
  });

  // Get current user session
  app.get("/api/auth/me", async (req, res) => {
    try {
      if (!req.session.userId || !req.session.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Optionally refresh user data from storage
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ message: "User not found" });
      }

      const { password: _, ...userResponse } = user;
      res.json({
        user: userResponse,
      });
    } catch (error) {
      console.error('Me endpoint error:', error);
      res.status(500).json({ message: "Failed to get user info" });
    }
  });

  // Authentication middleware
  const requireAuth = (req: Request, res: Response, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  // Get all notes
  app.get("/api/notes", async (req, res) => {
    try {
      const { subject, search } = req.query;
      
      let notes;
      if (search && typeof search === 'string') {
        notes = await storage.searchNotes(search);
      } else if (subject && typeof subject === 'string') {
        notes = await storage.getNotesBySubject(subject);
      } else {
        notes = await storage.getAllNotes();
      }
      
      res.json(notes);
    } catch (error) {
      console.error('Error fetching notes:', error);
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });

  // Get featured notes
  app.get("/api/notes/featured", async (req, res) => {
    try {
      const notes = await storage.getFeaturedNotes();
      res.json(notes);
    } catch (error) {
      console.error('Error fetching featured notes:', error);
      res.status(500).json({ message: "Failed to fetch featured notes" });
    }
  });

  // Get recent notes
  app.get("/api/notes/recent", async (req, res) => {
    try {
      const notes = await storage.getRecentNotes();
      res.json(notes);
    } catch (error) {
      console.error('Error fetching recent notes:', error);
      res.status(500).json({ message: "Failed to fetch recent notes" });
    }
  });

  // Get single note
  app.get("/api/notes/:id", async (req, res) => {
    try {
      const note = await storage.getNoteWithUploader(req.params.id);
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      res.json(note);
    } catch (error) {
      console.error('Error fetching note:', error);
      res.status(500).json({ message: "Failed to fetch note" });
    }
  });

  // Upload note
  app.post("/api/notes", requireAuth, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { title, description, subject } = req.body;

      // Validate required fields
      if (!title || !subject) {
        return res.status(400).json({ message: "Title and subject are required" });
      }

      // Determine file type
      let fileType = 'text';
      const ext = path.extname(req.file.originalname).toLowerCase();
      if (ext === '.pdf') {
        fileType = 'pdf';
      } else if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
        fileType = 'image';
      }

      const noteData = {
        title,
        description: description || null,
        subject,
        fileType,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        filePath: req.file.path,
        uploaderId: req.session.userId!, // Use authenticated user
      };

      const validatedData = insertNoteSchema.parse(noteData);
      const note = await storage.createNote(validatedData);

      res.status(201).json(note);
    } catch (error) {
      console.error('Error uploading note:', error);
      if (req.file) {
        fs.unlinkSync(req.file.path); // Clean up uploaded file on error
      }
      res.status(500).json({ message: "Failed to upload note" });
    }
  });

  // Download note file
  app.get("/api/notes/:id/download", async (req, res) => {
    try {
      const note = await storage.getNote(req.params.id);
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }

      // Increment download count
      await storage.incrementDownloads(req.params.id);

      // Serve the file
      res.download(note.filePath, note.fileName);
    } catch (error) {
      console.error('Error downloading note:', error);
      res.status(500).json({ message: "Failed to download note" });
    }
  });

  // Get note with details (includes user context like bookmarks, ratings)
  app.get("/api/notes/:id/details", async (req, res) => {
    try {
      const userId = req.session.userId;
      const noteWithDetails = await storage.getNoteWithDetails(req.params.id, userId);
      if (!noteWithDetails) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      // Increment view count
      await storage.incrementViews(req.params.id);
      
      res.json(noteWithDetails);
    } catch (error) {
      console.error('Error fetching note details:', error);
      res.status(500).json({ message: "Failed to fetch note details" });
    }
  });

  // Get note comments
  app.get("/api/notes/:id/comments", async (req, res) => {
    try {
      const comments = await storage.getNoteComments(req.params.id);
      res.json(comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // Create comment
  app.post("/api/comments", requireAuth, async (req, res) => {
    try {
      const { noteId, content, parentId } = req.body;
      
      if (!noteId || !content) {
        return res.status(400).json({ message: "Note ID and content are required" });
      }
      
      const comment = await storage.createComment({
        noteId,
        userId: req.session.userId!,
        content,
        parentId: parentId || undefined,
      });
      
      res.status(201).json(comment);
    } catch (error) {
      console.error('Error creating comment:', error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Get user profile
  app.get("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const profile = await storage.getUserProfile(req.session.userId!);
      if (!profile) {
        return res.status(404).json({ message: "User profile not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  // Get user's notes
  app.get("/api/user/notes", requireAuth, async (req, res) => {
    try {
      const notes = await storage.getNotesByUser(req.session.userId!);
      res.json(notes);
    } catch (error) {
      console.error('Error fetching user notes:', error);
      res.status(500).json({ message: "Failed to fetch user notes" });
    }
  });

  // Get user's bookmarks
  app.get("/api/user/bookmarks", requireAuth, async (req, res) => {
    try {
      const bookmarks = await storage.getUserBookmarks(req.session.userId!);
      res.json(bookmarks);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      res.status(500).json({ message: "Failed to fetch bookmarks" });
    }
  });

  // Get user stats
  app.get("/api/user/stats", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const userNotes = await storage.getNotesByUser(userId);
      
      // Calculate stats from user's notes
      const totalViews = userNotes.reduce((sum, note) => sum + note.views, 0);
      const ratingsSum = userNotes.reduce((sum, note) => sum + parseFloat(note.rating || '0'), 0);
      const avgRating = userNotes.length > 0 ? (ratingsSum / userNotes.length) : 0;
      
      // For monthly stats, we'll just use simplified calculations for now
      const thisMonthUploads = userNotes.filter(note => {
        const noteDate = new Date(note.createdAt);
        const now = new Date();
        return noteDate.getMonth() === now.getMonth() && 
               noteDate.getFullYear() === now.getFullYear();
      }).length;
      
      const thisMonthDownloads = Math.floor(userNotes.reduce((sum, note) => sum + note.downloads, 0) * 0.1); // Estimate

      const stats = {
        totalViews,
        avgRating: Number(avgRating.toFixed(1)),
        thisMonthUploads,
        thisMonthDownloads,
      };
      
      res.json(stats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // Create bookmark
  app.post("/api/bookmarks", requireAuth, async (req, res) => {
    try {
      const { noteId } = req.body;
      
      if (!noteId) {
        return res.status(400).json({ message: "Note ID is required" });
      }
      
      // Check if already bookmarked
      const isBookmarked = await storage.isBookmarked(noteId, req.session.userId!);
      if (isBookmarked) {
        return res.status(400).json({ message: "Note already bookmarked" });
      }
      
      const bookmark = await storage.createBookmark({
        noteId,
        userId: req.session.userId!,
      });
      
      res.status(201).json(bookmark);
    } catch (error) {
      console.error('Error creating bookmark:', error);
      res.status(500).json({ message: "Failed to create bookmark" });
    }
  });

  // Remove bookmark
  app.delete("/api/bookmarks/:noteId", requireAuth, async (req, res) => {
    try {
      await storage.removeBookmark(req.params.noteId, req.session.userId!);
      res.json({ message: "Bookmark removed" });
    } catch (error) {
      console.error('Error removing bookmark:', error);
      res.status(500).json({ message: "Failed to remove bookmark" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', (req, res, next) => {
    // Add basic security check here if needed
    next();
  }, express.static(uploadDir));

  const httpServer = createServer(app);
  return httpServer;
}
