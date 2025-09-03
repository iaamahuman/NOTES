# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Quill is a full-stack note-sharing platform that allows users to upload, browse, and download academic notes. The platform features file upload capabilities with support for PDFs, images, and text documents, organized by academic subjects with search functionality and download tracking.

## Development Commands

### Starting Development
- `npm run dev` - Start development server with hot reloading (frontend + backend)
- Server runs on port specified by `PORT` environment variable (default 5000)

### Building & Production
- `npm run build` - Build frontend (Vite) and backend (esbuild) for production
- `npm run start` - Run production server from built files
- `npm run check` - TypeScript type checking

### Database Operations
- `npm run db:push` - Push schema changes to PostgreSQL database using Drizzle

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string for production
- `NODE_ENV` - Set to "production" for production builds
- `PORT` - Server port (defaults to 5000)

## Architecture Overview

### Monorepo Structure
The application uses a clear separation pattern:
- `client/` - React frontend with Vite build system
- `server/` - Express.js backend API
- `shared/` - Common TypeScript types and database schemas

### Frontend Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with hot module replacement
- **UI Components**: shadcn/ui built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state
- **Forms**: React Hook Form with Zod validation

### Backend Stack
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **File Uploads**: Multer middleware for handling multipart/form-data
- **Database**: Drizzle ORM with PostgreSQL (Neon Database)
- **Storage**: Currently using in-memory storage with database interface ready

### Path Aliases (Important for Navigation)
- `@/` → `client/src/`
- `@shared/` → `shared/`
- `@assets/` → `attached_assets/`

## Key Architecture Patterns

### Database Schema Design
The database schema in `shared/schema.ts` defines a comprehensive note-sharing platform with:
- **Users**: User profiles with reputation, upload/download tracking
- **Notes**: Core entity with metadata, file paths, ratings, and engagement metrics
- **Social Features**: Comments, ratings, bookmarks, follows, collections
- **Type Safety**: Drizzle ORM generates TypeScript types from schema

### Storage Layer Abstraction
The `IStorage` interface in `server/storage.ts` provides:
- Complete abstraction over data persistence
- In-memory implementation (`MemStorage`) for development
- Database implementation ready for production
- Comprehensive methods for all entity operations

### Type-Safe API Layer
- Shared TypeScript types between client and server
- Zod schemas for runtime validation
- API client with proper error handling in `client/src/lib/api.ts`

### Component Architecture
Frontend follows component composition patterns:
- Reusable UI components in `client/src/components/`
- Page-level components in `client/src/pages/`
- Custom hooks for common functionality
- TanStack Query for data fetching and caching

## File Upload System

### Configuration
- Upload directory: `uploads/` (created automatically)
- File size limit: 10MB
- Allowed types: PDF, images (jpeg, jpg, png, gif), text files (txt, doc, docx)
- Files stored with unique timestamp-based names

### File Serving
- Static file serving via Express: `/uploads/filename`
- Download endpoint: `/api/notes/:id/download` with download counting
- File metadata stored in database with original filename preservation

## Development Environment Features

### Replit Integration
When running in Replit (`REPL_ID` environment variable present):
- Cartographer plugin for enhanced development experience
- Runtime error overlay for better debugging
- Special development-only plugins loaded

### Hot Reloading & Development
- Vite handles frontend hot reloading
- tsx for TypeScript execution in development
- Comprehensive logging middleware for API requests
- Error boundaries and runtime error handling

## Database Migration Strategy

The project is designed for easy transition from development to production:
1. Development uses `MemStorage` with sample data
2. Production ready with Drizzle ORM + PostgreSQL
3. Schema defined once in `shared/schema.ts` with full type generation
4. Migration files generated in `migrations/` directory

## Important Notes

### Current State
- Authentication system is defined in schema but not yet implemented
- Using sample user "alexchen" (ID: "sample-user-id") for development
- All uploaded notes are associated with this sample user
- File storage is local filesystem (uploads directory)

### Production Considerations
- Replace `MemStorage` with database implementation
- Implement proper authentication/authorization
- Configure file storage for production (cloud storage recommended)
- Set up proper environment variables for database connection
- Configure proper CORS and security headers
