import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bookmark, BookmarkCheck, Heart, Grid, List, Filter, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { NoteCard } from "@/components/note-card";
import { NoteCardSkeleton } from "@/components/ui/skeletons";
import { RequireAuth } from "@/components/protected-route";
import { useToast } from "@/hooks/use-toast";
import type { NoteWithUploader } from "@shared/schema";

// Mock bookmarked notes data
const mockBookmarks: NoteWithUploader[] = [
  {
    id: "1",
    title: "Advanced Calculus Notes",
    description: "Comprehensive notes covering integration techniques, series, and multivariable calculus",
    subject: "Mathematics",
    tags: ["calculus", "integration", "series"],
    course: "MATH 301",
    professor: "Dr. Johnson",
    semester: "Fall 2024",
    fileType: "pdf",
    fileName: "advanced-calculus.pdf",
    fileSize: 3145728,
    filePath: "/uploads/advanced-calculus.pdf",
    thumbnailPath: null,
    uploaderId: "user-2",
    downloads: 156,
    views: 423,
    rating: "4.8",
    ratingCount: 24,
    isFeatured: true,
    isPublic: true,
    createdAt: new Date("2024-10-15"),
    uploader: {
      id: "user-2",
      username: "mathexpert",
      avatar: undefined,
      reputation: 1200,
    }
  },
  {
    id: "2", 
    title: "Data Structures Implementation",
    description: "Complete implementation guide for common data structures in Python",
    subject: "Computer Science",
    tags: ["python", "data-structures", "algorithms"],
    course: "CS 201",
    professor: "Prof. Smith",
    semester: "Fall 2024",
    fileType: "pdf",
    fileName: "data-structures.pdf",
    fileSize: 2097152,
    filePath: "/uploads/data-structures.pdf",
    thumbnailPath: null,
    uploaderId: "user-3",
    downloads: 89,
    views: 234,
    rating: "4.5",
    ratingCount: 12,
    isFeatured: false,
    isPublic: true,
    createdAt: new Date("2024-10-10"),
    uploader: {
      id: "user-3",
      username: "coder123",
      avatar: undefined,
      reputation: 856,
    }
  }
];

export default function Bookmarks() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("recent");

  // Mock query - in real app this would fetch user's bookmarks
  const { data: bookmarks = mockBookmarks, isLoading } = useQuery({
    queryKey: ["/api/user/bookmarks", { search: searchQuery, subject: selectedSubject }],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return mockBookmarks.filter(note => 
        (!searchQuery || note.title.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (!selectedSubject || note.subject === selectedSubject)
      );
    },
  });

  const subjects = Array.from(new Set(mockBookmarks.map(note => note.subject)));

  const handleRemoveBookmark = async (noteId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: "Bookmark removed",
        description: "The note has been removed from your bookmarks.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove bookmark.",
        variant: "destructive",
      });
    }
  };

  const handleBulkRemove = async () => {
    if (selectedNotes.length === 0) return;

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Bookmarks removed",
        description: `${selectedNotes.length} bookmarks have been removed.`,
      });
      
      setSelectedNotes([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove bookmarks.",
        variant: "destructive",
      });
    }
  };

  const toggleNoteSelection = (noteId: string) => {
    setSelectedNotes(prev => 
      prev.includes(noteId) 
        ? prev.filter(id => id !== noteId)
        : [...prev, noteId]
    );
  };

  const selectAllNotes = () => {
    setSelectedNotes(bookmarks.map(note => note.id));
  };

  const clearSelection = () => {
    setSelectedNotes([]);
  };

  return (
    <RequireAuth>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Bookmark className="h-8 w-8 text-blue-600" />
              My Bookmarks
            </h1>
            <p className="text-gray-600">Manage your saved notes for quick access</p>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search your bookmarks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All subjects</SelectItem>
                {subjects.map(subject => (
                  <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recent</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="subject">Subject</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex rounded-lg border">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedNotes.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-blue-800">
                    {selectedNotes.length} note{selectedNotes.length === 1 ? "" : "s"} selected
                  </span>
                  <Button variant="outline" size="sm" onClick={clearSelection}>
                    Clear selection
                  </Button>
                </div>
                <Button variant="destructive" size="sm" onClick={handleBulkRemove}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove selected
                </Button>
              </div>
            </div>
          )}

          {/* Results Summary */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-600">
              {isLoading ? "Loading..." : `${bookmarks.length} bookmarked note${bookmarks.length === 1 ? "" : "s"}`}
              {searchQuery && ` matching "${searchQuery}"`}
              {selectedSubject && ` in ${selectedSubject}`}
            </p>
            
            {bookmarks.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectedNotes.length === bookmarks.length ? clearSelection : selectAllNotes}
                >
                  {selectedNotes.length === bookmarks.length ? "Deselect all" : "Select all"}
                </Button>
              </div>
            )}
          </div>

          {/* Bookmarks Grid/List */}
          {isLoading ? (
            <div className={viewMode === "grid" 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
              : "space-y-4"
            }>
              {Array.from({ length: 6 }).map((_, i) => (
                <NoteCardSkeleton key={i} />
              ))}
            </div>
          ) : bookmarks.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery || selectedSubject ? "No bookmarks found" : "No bookmarks yet"}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery || selectedSubject 
                    ? "Try adjusting your search criteria"
                    : "Start bookmarking notes you want to save for later"
                  }
                </p>
                <Button>Browse Notes</Button>
              </CardContent>
            </Card>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookmarks.map((note) => (
                <div key={note.id} className="relative group">
                  <div className="absolute top-3 left-3 z-10">
                    <Checkbox
                      checked={selectedNotes.includes(note.id)}
                      onCheckedChange={() => toggleNoteSelection(note.id)}
                      className="bg-white border-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                  <div className="absolute top-3 right-3 z-10">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveBookmark(note.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white"
                    >
                      <BookmarkCheck className="h-4 w-4 text-blue-600" />
                    </Button>
                  </div>
                  <NoteCard note={note} />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {bookmarks.map((note) => (
                <div key={note.id} className="flex items-center gap-4 p-4 bg-white rounded-lg border">
                  <Checkbox
                    checked={selectedNotes.includes(note.id)}
                    onCheckedChange={() => toggleNoteSelection(note.id)}
                  />
                  <div className="flex-1">
                    <NoteCard note={note} variant="compact" />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveBookmark(note.id)}
                  >
                    <BookmarkCheck className="h-4 w-4 text-blue-600" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </RequireAuth>
  );
}
