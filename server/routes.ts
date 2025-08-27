import express, { type Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { insertNoteSchema } from "@shared/schema";

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
  app.post("/api/notes", upload.single('file'), async (req, res) => {
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
        uploaderId: "sample-user-id", // Using sample user for now
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

  // Serve uploaded files
  app.use('/uploads', (req, res, next) => {
    // Add basic security check here if needed
    next();
  }, express.static(uploadDir));

  const httpServer = createServer(app);
  return httpServer;
}
