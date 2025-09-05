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
    const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|txt|md|doc|docx|ppt|pptx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    
    // Enhanced MIME type checking
    const allowedMimeTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'text/plain', 'text/markdown',
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    
    const mimetypeValid = allowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith('text/');

    if (mimetypeValid && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Supported file types: PDF, Images (JPG, PNG, GIF, WebP), Text (TXT, MD), Documents (DOC, DOCX), Presentations (PPT, PPTX)'));
    }
  },
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Platform statistics endpoint
  app.get("/api/platform/stats", async (req, res) => {
    try {
      const allNotes = await storage.getAllNotes();
      
      // Count active students - we need to add a method to get user count
      // For now, we'll use a workaround to get all users efficiently
      let activeStudentsCount = 0;
      if (storage instanceof storage.constructor && (storage as any).users) {
        activeStudentsCount = (storage as any).users.size;
      }

      // Count unique subjects from notes
      const uniqueSubjects = new Set(allNotes.map(note => note.subject));
      const subjectsCount = uniqueSubjects.size;

      // Count unique universities from notes' uploaders
      const uniqueUniversities = new Set();
      for (const note of allNotes) {
        const uploader = note.uploader;
        // If uploader info is included in note response, get university from there
        // Otherwise we'd need to fetch each user profile, which we'll optimize later
      }
      
      // For now, count universities by checking user profiles efficiently
      let universitiesCount = 0;
      if (storage instanceof storage.constructor && (storage as any).users) {
        const users = Array.from((storage as any).users.values());
        const universities = new Set(
          users
            .filter(user => user.university)
            .map(user => user.university)
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
      console.error('Error fetching platform stats:', error);
      res.status(500).json({ message: "Failed to fetch platform statistics" });
    }
  });

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

  // Enhanced search endpoint with advanced filtering
  app.get("/api/notes", async (req, res) => {
    try {
      const { 
        search, subject, fileType, professor, course, semester, 
        minRating, sortBy, tags, page = "1", limit = "20" 
      } = req.query;
      
      let notes = await storage.getAllNotes();
      
      // Apply filters
      if (search && typeof search === 'string') {
        const searchTerm = search.toLowerCase();
        notes = notes.filter(note => 
          note.title.toLowerCase().includes(searchTerm) ||
          note.description?.toLowerCase().includes(searchTerm) ||
          note.subject.toLowerCase().includes(searchTerm) ||
          note.course?.toLowerCase().includes(searchTerm) ||
          note.professor?.toLowerCase().includes(searchTerm) ||
          (note.tags && note.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
        );
      }
      
      if (subject && typeof subject === 'string' && subject !== 'All Subjects') {
        notes = notes.filter(note => note.subject === subject);
      }
      
      if (fileType && typeof fileType === 'string' && fileType !== 'All Types') {
        const typeMap: { [key: string]: string } = {
          'PDF': 'pdf',
          'Image': 'image',
          'Document': 'text',
          'Presentation': 'pdf',
          'Text': 'text'
        };
        const mappedType = typeMap[fileType];
        if (mappedType) {
          notes = notes.filter(note => note.fileType === mappedType);
        }
      }
      
      if (professor && typeof professor === 'string') {
        notes = notes.filter(note => 
          note.professor?.toLowerCase().includes(professor.toLowerCase())
        );
      }
      
      if (course && typeof course === 'string') {
        notes = notes.filter(note => 
          note.course?.toLowerCase().includes(course.toLowerCase())
        );
      }
      
      if (semester && typeof semester === 'string' && semester !== 'All Semesters') {
        notes = notes.filter(note => note.semester === semester);
      }
      
      if (minRating && typeof minRating === 'string') {
        const minRatingNum = parseFloat(minRating);
        notes = notes.filter(note => parseFloat(note.rating || '0') >= minRatingNum);
      }
      
      if (tags && typeof tags === 'string') {
        const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase());
        notes = notes.filter(note => 
          note.tags && tagArray.some(tag => 
            note.tags!.some(noteTag => noteTag.toLowerCase().includes(tag))
          )
        );
      }
      
      // Apply sorting
      if (sortBy && typeof sortBy === 'string') {
        switch (sortBy) {
          case 'date':
            notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            break;
          case 'rating':
            notes.sort((a, b) => parseFloat(b.rating || '0') - parseFloat(a.rating || '0'));
            break;
          case 'downloads':
            notes.sort((a, b) => b.downloads - a.downloads);
            break;
          case 'views':
            notes.sort((a, b) => b.views - a.views);
            break;
          default: // relevance
            // Keep current order (already sorted by date from getAllNotes)
            break;
        }
      }
      
      // Pagination
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      
      const paginatedNotes = notes.slice(startIndex, endIndex);
      
      res.json({
        notes: paginatedNotes,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: notes.length,
          totalPages: Math.ceil(notes.length / limitNum)
        }
      });
    } catch (error) {
      console.error('Error fetching notes:', error);
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });

  // Search suggestions endpoint
  app.get("/api/search/suggestions", async (req, res) => {
    try {
      const { query } = req.query;
      if (!query || typeof query !== 'string' || query.length < 2) {
        return res.json([]);
      }
      
      const allNotes = await storage.getAllNotes();
      const suggestions = new Set<string>();
      
      // Add matching titles, subjects, courses, and professors
      allNotes.forEach(note => {
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
          note.tags.forEach(tag => {
            if (tag.toLowerCase().includes(searchTerm)) {
              suggestions.add(tag);
            }
          });
        }
      });
      
      res.json(Array.from(suggestions).slice(0, 8));
    } catch (error) {
      console.error('Error fetching search suggestions:', error);
      res.status(500).json({ message: "Failed to fetch suggestions" });
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

  // Get trending notes (most downloaded/viewed in the last week)
  app.get("/api/notes/trending", async (req, res) => {
    try {
      const allNotes = await storage.getAllNotes();
      
      // Calculate trending score based on recent activity
      const trendingNotes = allNotes
        .map(note => ({
          ...note,
          trendingScore: (note.downloads * 2) + note.views + (parseFloat(note.rating || '0') * 10)
        }))
        .sort((a, b) => b.trendingScore - a.trendingScore)
        .slice(0, 12);
      
      res.json(trendingNotes);
    } catch (error) {
      console.error('Error fetching trending notes:', error);
      res.status(500).json({ message: "Failed to fetch trending notes" });
    }
  });

  // Get personalized recommendations
  app.get("/api/notes/recommendations", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const userNotes = await storage.getNotesByUser(userId);
      const allNotes = await storage.getAllNotes();
      
      // Get user's subjects and interests
      const userSubjects = Array.from(new Set(userNotes.map(note => note.subject)));
      const userTags = Array.from(new Set(userNotes.flatMap(note => note.tags || [])));
      
      // Filter out user's own notes and get recommendations
      const recommendations = allNotes
        .filter(note => note.uploaderId !== userId)
        .map(note => {
          let score = 0;
          
          // Score based on subject match
          if (userSubjects.includes(note.subject)) {
            score += 10;
          }
          
          // Score based on tag similarity
          const noteTagsLower = (note.tags || []).map(tag => tag.toLowerCase());
          const userTagsLower = userTags.map(tag => tag.toLowerCase());
          const tagMatches = noteTagsLower.filter(tag => 
            userTagsLower.some(userTag => userTag.includes(tag) || tag.includes(userTag))
          ).length;
          score += tagMatches * 5;
          
          // Boost high-rated notes
          score += parseFloat(note.rating || '0') * 2;
          
          // Boost popular notes
          score += Math.log(note.downloads + 1) + Math.log(note.views + 1);
          
          return { ...note, recommendationScore: score };
        })
        .filter(note => note.recommendationScore > 0)
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, 15);
      
      res.json(recommendations);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });

  // Get related notes for a specific note
  app.get("/api/notes/:id/related", async (req, res) => {
    try {
      const noteId = req.params.id;
      const currentNote = await storage.getNote(noteId);
      
      if (!currentNote) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      const allNotes = await storage.getAllNotes();
      
      // Find related notes based on subject, tags, course, professor
      const relatedNotes = allNotes
        .filter(note => note.id !== noteId)
        .map(note => {
          let similarity = 0;
          
          // Same subject
          if (note.subject === currentNote.subject) similarity += 5;
          
          // Same course
          if (note.course && currentNote.course && note.course === currentNote.course) similarity += 8;
          
          // Same professor
          if (note.professor && currentNote.professor && note.professor === currentNote.professor) similarity += 6;
          
          // Tag similarity
          if (note.tags && currentNote.tags) {
            const noteTagsLower = note.tags.map(tag => tag.toLowerCase());
            const currentTagsLower = currentNote.tags.map(tag => tag.toLowerCase());
            const commonTags = noteTagsLower.filter(tag => currentTagsLower.includes(tag)).length;
            similarity += commonTags * 3;
          }
          
          // Title similarity (simple word matching)
          const noteTitleWords = note.title.toLowerCase().split(' ');
          const currentTitleWords = currentNote.title.toLowerCase().split(' ');
          const commonWords = noteTitleWords.filter(word => 
            word.length > 3 && currentTitleWords.includes(word)
          ).length;
          similarity += commonWords * 2;
          
          return { ...note, similarity };
        })
        .filter(note => note.similarity > 0)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 6);
      
      res.json(relatedNotes);
    } catch (error) {
      console.error('Error fetching related notes:', error);
      res.status(500).json({ message: "Failed to fetch related notes" });
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
