import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, Grid, List, BookOpen, TrendingUp, Star, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NoteCard } from "@/components/note-card";
import { EnhancedSearch, type SearchFilters } from "@/components/search/enhanced-search";
import { TrendingNotes } from "@/components/trending-notes";
import { PersonalizedRecommendations } from "@/components/personalized-recommendations";
import { NoteCardSkeleton } from "@/components/ui/skeletons";
import { searchNotes, getFeaturedNotes, getRecentNotes, getSearchSuggestions } from "@/lib/api";
import type { NoteWithUploader } from "@shared/schema";

const subjects = [
  "Mathematics", "Physics", "Chemistry", "Biology", "Computer Science",
  "Engineering", "Psychology", "Philosophy", "History", "Literature",
  "Economics", "Business", "Medicine", "Law", "Art", "Music"
];

const popularTags = [
  "calculus", "algebra", "programming", "algorithms", "chemistry", 
  "biology", "physics", "history", "literature", "psychology"
];

export default function Browse() {
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: "",
    subjects: [],
    fileTypes: [],
    dateRange: {},
    minRating: 0,
    minDownloads: 0,
    sortBy: "relevance",
    sortOrder: "desc",
  });
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState("all");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const selectedSubject = searchFilters.subjects.length > 0 ? searchFilters.subjects[0] : undefined;

  // Debounced search suggestions
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchFilters.query.length >= 2) {
        try {
          const newSuggestions = await getSearchSuggestions(searchFilters.query);
          setSuggestions(newSuggestions);
        } catch (error) {
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchFilters.query]);

  // Enhanced search query
  const { data: searchResults, isLoading: loadingSearch } = useQuery({
    queryKey: ["/api/notes/search", searchFilters],
    queryFn: () => searchNotes({
      search: searchFilters.query || undefined,
      subject: searchFilters.subjects.length > 0 ? searchFilters.subjects[0] : undefined,
      fileType: searchFilters.fileTypes.length > 0 ? searchFilters.fileTypes[0] : undefined,
      minRating: searchFilters.minRating > 0 ? searchFilters.minRating : undefined,
      sortBy: searchFilters.sortBy,
      page: 1,
      limit: 20
    }),
    enabled: activeTab === "all"
  });

  const { data: featuredNotes = [], isLoading: loadingFeatured } = useQuery({
    queryKey: ["/api/notes/featured"],
    queryFn: getFeaturedNotes,
    enabled: activeTab === "featured"
  });

  const { data: recentNotes = [], isLoading: loadingRecent } = useQuery({
    queryKey: ["/api/notes/recent"],
    queryFn: getRecentNotes,
    enabled: activeTab === "recent"
  });

  const handleSearch = (filters: SearchFilters) => {
    setSearchFilters(filters);
    setActiveTab("all");
  };

  const handleSubjectClick = (subject: string) => {
    const newFilters = {
      ...searchFilters,
      subjects: searchFilters.subjects.includes(subject) 
        ? searchFilters.subjects.filter(s => s !== subject)
        : [subject]
    };
    setSearchFilters(newFilters);
    setActiveTab("all");
  };

  const getCurrentNotes = () => {
    switch (activeTab) {
      case "featured":
        return { notes: featuredNotes, loading: loadingFeatured };
      case "recent":
        return { notes: recentNotes, loading: loadingRecent };
      case "trending":
        return { notes: [], loading: false }; // Handled separately by TrendingNotes component
      case "recommendations":
        return { notes: [], loading: false }; // Handled separately by PersonalizedRecommendations component
      default:
        return { notes: searchResults?.notes || [], loading: loadingSearch };
    }
  };

  const { notes, loading } = getCurrentNotes();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Discover Knowledge
            </h1>
            <p className="text-xl mb-8 text-blue-100">
              Browse thousands of study notes shared by students worldwide
            </p>
            
            {/* Search Section */}
            <div className="max-w-2xl mx-auto">
              <EnhancedSearch 
                onSearch={handleSearch}
                onClear={() => {
                  setSearchFilters({
                    query: "",
                    subjects: [],
                    fileTypes: [],
                    dateRange: {},
                    minRating: 0,
                    minDownloads: 0,
                    sortBy: "relevance",
                    sortOrder: "desc",
                  });
                  setSearchQuery("");
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-80 space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Platform Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Notes</span>
                  <span className="font-semibold">2,847</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active Users</span>
                  <span className="font-semibold">1,234</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Downloads</span>
                  <span className="font-semibold">45,678</span>
                </div>
              </CardContent>
            </Card>

            {/* Subject Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Browse by Subject</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {subjects.map((subject) => (
                    <button
                      key={subject}
                      onClick={() => handleSubjectClick(subject)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedSubject === subject
                          ? "bg-blue-100 text-blue-700 font-medium"
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Popular Tags */}
            <Card>
              <CardHeader>
                <CardTitle>Popular Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer hover:bg-blue-100 hover:text-blue-700"
                      onClick={() => {
                        const newFilters = {
                          ...searchFilters,
                          query: tag
                        };
                        setSearchFilters(newFilters);
                        setSearchQuery(tag);
                      }}
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Tabs and Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                <TabsList className="grid grid-cols-5">
                  <TabsTrigger value="all">All Notes</TabsTrigger>
                  <TabsTrigger value="featured">Featured</TabsTrigger>
                  <TabsTrigger value="recent">Recent</TabsTrigger>
                  <TabsTrigger value="trending">Trending</TabsTrigger>
                  <TabsTrigger value="recommendations">For You</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex items-center gap-2">
                <Select defaultValue="newest">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="popular">Popular</SelectItem>
                    <SelectItem value="rating">Top Rated</SelectItem>
                    <SelectItem value="downloads">Most Downloaded</SelectItem>
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
            </div>

            {/* Results Summary */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <p className="text-gray-600">
                  {loading ? "Loading..." : `${notes.length} notes found`}
                  {selectedSubject && ` in ${selectedSubject}`}
                  {searchQuery && ` for "${searchQuery}"`}
                </p>
                {(searchFilters.subjects.length > 0 || searchFilters.query) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchFilters({
                        ...searchFilters,
                        query: "",
                        subjects: []
                      });
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>

            {/* Notes Grid/List */}
            <TabsContent value="all" className="mt-0">
              {loading ? (
                <div className={viewMode === "grid" 
                  ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" 
                  : "space-y-4"
                }>
                  {Array.from({ length: 9 }).map((_, i) => (
                    <NoteCardSkeleton key={i} />
                  ))}
                </div>
              ) : notes.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No notes found
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {searchFilters.query || searchFilters.subjects.length > 0
                        ? "Try adjusting your search criteria"
                        : "Be the first to share notes in this category"
                      }
                    </p>
                    <Button>Upload Your First Note</Button>
                  </CardContent>
                </Card>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {notes.map((note) => (
                    <NoteCard key={note.id} note={note} />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {notes.map((note) => (
                    <NoteCard key={note.id} note={note} variant="compact" />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="featured" className="mt-0">
              {loadingFeatured ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <NoteCardSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {featuredNotes.map((note) => (
                    <NoteCard key={note.id} note={note} />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="recent" className="mt-0">
              {loadingRecent ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <NoteCardSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {recentNotes.map((note) => (
                    <NoteCard key={note.id} note={note} />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="trending" className="mt-0">
              <TrendingNotes limit={12} showHeader={false} />
            </TabsContent>
            
            <TabsContent value="recommendations" className="mt-0">
              <PersonalizedRecommendations limit={12} showHeader={false} />
            </TabsContent>
          </div>
        </div>
      </div>
    </div>
  );
}
