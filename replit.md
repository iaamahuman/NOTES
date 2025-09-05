# Overview

Quill is a note-sharing platform built as a full-stack web application that allows users to upload, browse, and download academic notes. The platform features file upload capabilities with support for PDFs, images, and text documents, organized by academic subjects with search functionality and download tracking.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with a custom design system using CSS variables
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling

## Backend Architecture
- **Runtime**: Node.js with Express.js server framework
- **Language**: TypeScript with ES modules
- **Development**: tsx for TypeScript execution in development
- **File Uploads**: Multer middleware for handling multipart/form-data
- **Storage**: In-memory storage implementation with interface for future database integration
- **API**: RESTful API design with JSON responses

## Data Storage Solutions
- **Database ORM**: Drizzle ORM configured for PostgreSQL
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Schema Management**: Shared schema definitions between client and server
- **Current Implementation**: Memory-based storage for development with database migration path ready

## Recent Changes: Latest modifications with dates

### September 5, 2025 - Initial Replit Setup
- Configured the application to work in Replit environment
- Modified session store from PostgreSQL to memory-based using memorystore for development
- Set up proper workflow configuration for frontend on port 5000 with webview output
- Configured deployment settings for autoscale deployment target
- Verified that both frontend (React/Vite) and backend (Express) are working properly
- Application successfully running with in-memory storage for all data operations

## Authentication and Authorization
- **Session Management**: PostgreSQL session store (connect-pg-simple) configured but not yet implemented
- **Current State**: Basic user structure defined in schema without active authentication

## External Dependencies
- **Database**: Neon Database (PostgreSQL) via @neondatabase/serverless
- **File Storage**: Local file system with configurable upload directory
- **UI Framework**: Extensive Radix UI component ecosystem
- **Development Tools**: Replit integration with cartographer and runtime error overlay
- **Validation**: Zod for runtime type checking and schema validation
- **Date Handling**: date-fns for date manipulation and formatting

## Key Design Decisions

### Monorepo Structure
The application uses a monorepo pattern with clear separation:
- `client/` - React frontend application
- `server/` - Express backend API
- `shared/` - Common TypeScript types and schemas
- Path aliases configured for clean imports across the application

### Type Safety
- End-to-end TypeScript with strict configuration
- Shared schema definitions using Drizzle and Zod
- Type-safe API client with proper error handling

### Scalability Considerations
- Interface-based storage layer allows easy migration from memory to database
- Drizzle ORM configuration ready for PostgreSQL deployment
- Component-based architecture with reusable UI elements
- Proper separation of concerns between data access, business logic, and presentation

### Development Experience
- Hot module replacement with Vite
- Comprehensive UI component library
- Form validation with immediate feedback
- Error boundary and runtime error handling
- Mobile-responsive design patterns