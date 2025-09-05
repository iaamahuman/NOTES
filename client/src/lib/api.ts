import { apiRequest } from "./queryClient";
import type { 
  NoteWithUploader, 
  NoteWithDetails, 
  CommentWithUser, 
  UserProfile,
  InsertComment 
} from "@shared/schema";

export async function uploadNote(formData: FormData) {
  const response = await apiRequest("POST", "/api/notes", formData);
  return response.json();
}

export async function downloadNote(id: string) {
  window.open(`/api/notes/${id}/download`, '_blank');
}

export async function getNotes(params?: { subject?: string; search?: string }): Promise<NoteWithUploader[]> {
  const searchParams = new URLSearchParams();
  if (params?.subject) searchParams.append('subject', params.subject);
  if (params?.search) searchParams.append('search', params.search);
  
  const response = await fetch(`/api/notes?${searchParams.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch notes');
  return response.json();
}

export async function getFeaturedNotes(): Promise<NoteWithUploader[]> {
  const response = await fetch('/api/notes/featured');
  if (!response.ok) throw new Error('Failed to fetch featured notes');
  return response.json();
}

export async function getRecentNotes(): Promise<NoteWithUploader[]> {
  const response = await fetch('/api/notes/recent');
  if (!response.ok) throw new Error('Failed to fetch recent notes');
  return response.json();
}

// Note details with user context (bookmarks, ratings, etc.)
export async function getNoteDetails(id: string): Promise<NoteWithDetails> {
  const response = await fetch(`/api/notes/${id}/details`);
  if (!response.ok) throw new Error('Failed to fetch note details');
  return response.json();
}

// Comments
export async function getNoteComments(noteId: string): Promise<CommentWithUser[]> {
  const response = await fetch(`/api/notes/${noteId}/comments`);
  if (!response.ok) throw new Error('Failed to fetch comments');
  return response.json();
}

export async function createComment(data: { noteId: string; content: string; parentId?: string }) {
  const response = await apiRequest("POST", "/api/comments", data);
  return response.json();
}

// User profile and data
export async function getUserProfile(): Promise<UserProfile> {
  const response = await fetch('/api/user/profile');
  if (!response.ok) throw new Error('Failed to fetch user profile');
  return response.json();
}

export async function getUserNotes(): Promise<NoteWithUploader[]> {
  const response = await fetch('/api/user/notes');
  if (!response.ok) throw new Error('Failed to fetch user notes');
  return response.json();
}

export async function getUserBookmarks(): Promise<NoteWithUploader[]> {
  const response = await fetch('/api/user/bookmarks');
  if (!response.ok) throw new Error('Failed to fetch user bookmarks');
  return response.json();
}

export async function getUserStats(): Promise<{
  totalViews: number;
  avgRating: number;
  thisMonthUploads: number;
  thisMonthDownloads: number;
}> {
  const response = await fetch('/api/user/stats');
  if (!response.ok) throw new Error('Failed to fetch user stats');
  return response.json();
}

// Bookmarks
export async function createBookmark(noteId: string) {
  const response = await apiRequest("POST", "/api/bookmarks", { noteId });
  return response.json();
}

export async function removeBookmark(noteId: string) {
  const response = await apiRequest("DELETE", `/api/bookmarks/${noteId}`);
  return response.json();
}

// Enhanced search with advanced filtering
export async function searchNotes(params: {
  search?: string;
  subject?: string;
  fileType?: string;
  professor?: string;
  course?: string;
  semester?: string;
  minRating?: number;
  sortBy?: string;
  tags?: string;
  page?: number;
  limit?: number;
}): Promise<{
  notes: NoteWithUploader[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value.toString());
    }
  });
  
  const response = await fetch(`/api/notes?${searchParams.toString()}`);
  if (!response.ok) throw new Error('Failed to search notes');
  return response.json();
}

// Search suggestions
export async function getSearchSuggestions(query: string): Promise<string[]> {
  if (query.length < 2) return [];
  
  const response = await fetch(`/api/search/suggestions?query=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error('Failed to fetch suggestions');
  return response.json();
}

// Trending notes
export async function getTrendingNotes(): Promise<NoteWithUploader[]> {
  const response = await fetch('/api/notes/trending');
  if (!response.ok) throw new Error('Failed to fetch trending notes');
  return response.json();
}

// Personalized recommendations
export async function getPersonalizedRecommendations(): Promise<NoteWithUploader[]> {
  const response = await fetch('/api/notes/recommendations');
  if (!response.ok) throw new Error('Failed to fetch recommendations');
  return response.json();
}

// Related notes for a specific note
export async function getRelatedNotes(noteId: string): Promise<NoteWithUploader[]> {
  const response = await fetch(`/api/notes/${noteId}/related`);
  if (!response.ok) throw new Error('Failed to fetch related notes');
  return response.json();
}
