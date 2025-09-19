import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

interface ProcessedFile {
  path: string;
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
  thumbnailPath?: string;
}

interface FileProcessorOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  createThumbnail?: boolean;
  thumbnailSize?: number;
}

export class FileProcessor {
  private uploadDir: string;
  private thumbnailDir: string;

  constructor(uploadDir: string) {
    this.uploadDir = uploadDir;
    this.thumbnailDir = path.join(uploadDir, 'thumbnails');
  }

  async ensureDirectories() {
    await fs.mkdir(this.uploadDir, { recursive: true });
    await fs.mkdir(this.thumbnailDir, { recursive: true });
  }

  // Enhanced file validation using actual file content
  async validateFile(filePath: string, originalName: string): Promise<boolean> {
    try {
      const buffer = await fs.readFile(filePath);
      const fileType = await fileTypeFromBuffer(buffer);
      
      if (!fileType) {
        // Allow text files that might not have detectable mime types
        const ext = path.extname(originalName).toLowerCase();
        return ['.txt', '.md', '.csv'].includes(ext);
      }

      const allowedMimeTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ];

      return allowedMimeTypes.includes(fileType.mime);
    } catch (error) {
      console.error('File validation error:', error);
      return false;
    }
  }

  // Process uploaded file (compress images, create thumbnails, etc.)
  async processFile(
    filePath: string, 
    originalName: string, 
    options: FileProcessorOptions = {}
  ): Promise<ProcessedFile> {
    await this.ensureDirectories();

    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 85,
      createThumbnail = true,
      thumbnailSize = 200
    } = options;

    // Generate secure filename
    const fileHash = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(originalName).toLowerCase();
    const filename = `${fileHash}${ext}`;
    const finalPath = path.join(this.uploadDir, filename);

    let thumbnailPath: string | undefined;

    try {
      const buffer = await fs.readFile(filePath);
      const fileType = await fileTypeFromBuffer(buffer);

      // Check if it's an image that can be processed
      const isProcessableImage = fileType && 
        ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(fileType.mime);

      if (isProcessableImage) {
        // Process and compress image
        const processedBuffer = await sharp(buffer)
          .resize(maxWidth, maxHeight, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({ quality, mozjpeg: true }) // Convert to JPEG for better compression
          .toBuffer();

        await fs.writeFile(finalPath.replace(ext, '.jpg'), processedBuffer);

        // Create thumbnail if requested
        if (createThumbnail) {
          const thumbnailFilename = `thumb_${fileHash}.jpg`;
          thumbnailPath = path.join(this.thumbnailDir, thumbnailFilename);
          
          const thumbnailBuffer = await sharp(buffer)
            .resize(thumbnailSize, thumbnailSize, {
              fit: 'cover',
              position: 'center'
            })
            .jpeg({ quality: 80 })
            .toBuffer();

          await fs.writeFile(thumbnailPath, thumbnailBuffer);
        }

        // Update filename if converted to JPEG
        const finalFilename = filename.replace(ext, '.jpg');
        
        return {
          path: path.join(this.uploadDir, finalFilename),
          filename: finalFilename,
          originalName,
          size: (await fs.stat(path.join(this.uploadDir, finalFilename))).size,
          mimetype: 'image/jpeg',
          thumbnailPath: thumbnailPath ? `thumbnails/${path.basename(thumbnailPath)}` : undefined
        };
      } else {
        // For non-image files, just move to final location
        await fs.copyFile(filePath, finalPath);
        
        // Create a generic thumbnail for PDFs (placeholder for now)
        if (fileType?.mime === 'application/pdf' && createThumbnail) {
          // TODO: Implement PDF thumbnail generation using pdf-poppler or similar
          // For now, just indicate that thumbnail could be created
          thumbnailPath = undefined;
        }

        const stats = await fs.stat(finalPath);
        
        return {
          path: finalPath,
          filename,
          originalName,
          size: stats.size,
          mimetype: fileType?.mime || 'application/octet-stream',
          thumbnailPath
        };
      }
    } catch (error) {
      console.error('File processing error:', error);
      throw new Error('Failed to process file');
    } finally {
      // Clean up temporary file
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.warn('Failed to clean up temporary file:', filePath);
      }
    }
  }

  // Generate file hash for deduplication
  async generateFileHash(filePath: string): Promise<string> {
    const buffer = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  // Clean up old files (for maintenance)
  async cleanupOldFiles(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    let cleanedCount = 0;
    
    try {
      const files = await fs.readdir(this.uploadDir);
      
      for (const file of files) {
        const filePath = path.join(this.uploadDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          cleanedCount++;
        }
      }
    } catch (error) {
      console.error('File cleanup error:', error);
    }
    
    return cleanedCount;
  }
}