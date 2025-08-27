import { apiRequest } from "./queryClient";
import type { NoteWithUploader } from "@shared/schema";

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
