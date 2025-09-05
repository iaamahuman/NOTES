import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Upload, Search, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { NoteCard } from "@/components/note-card";
import { UploadModal } from "@/components/upload-modal";
import { getFeaturedNotes, getRecentNotes, getNotes } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data: featuredNotes = [], isLoading: isLoadingFeatured } = useQuery({
    queryKey: ["/api/notes/featured"],
    queryFn: getFeaturedNotes,
  });

  const { data: recentNotes = [], isLoading: isLoadingRecent } = useQuery({
    queryKey: ["/api/notes/recent"],
    queryFn: getRecentNotes,
  });

  const { data: allNotesResponse, isLoading: isLoadingAll } = useQuery({
    queryKey: ["/api/notes", { subject: selectedSubject !== "All" ? selectedSubject : undefined, search: searchQuery || undefined }],
    queryFn: () => getNotes({
      subject: selectedSubject !== "All" ? selectedSubject : undefined,
      search: searchQuery || undefined,
    }),
  });

  const allNotes = allNotesResponse?.notes || [];

  const subjects = [
    "All",
    "Mathematics",
    "Computer Science",
    "Physics",
    "Chemistry",
    "Biology",
    "Literature",
  ];

  const handleSubjectFilter = (subject: string) => {
    setSelectedSubject(subject);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const NoteSkeleton = () => (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <Skeleton className="w-16 h-6" />
        <Skeleton className="w-12 h-6" />
      </div>
      <Skeleton className="w-full h-32 mb-4" />
      <Skeleton className="w-3/4 h-6 mb-2" />
      <Skeleton className="w-full h-4 mb-3" />
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="w-20 h-4" />
        <Skeleton className="w-16 h-4" />
      </div>
      <div className="flex items-center space-x-3 mb-4">
        <Skeleton className="w-6 h-6 rounded-full" />
        <Skeleton className="w-20 h-4" />
        <Skeleton className="w-24 h-4" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="flex-1 h-10" />
        <Skeleton className="w-10 h-10" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header 
        onSearchChange={handleSearchChange}
        onUploadClick={() => setIsUploadModalOpen(true)}
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Share Knowledge,<br />Ace Your Studies
              </h1>
              <p className="text-xl text-purple-100 mb-6">
                Upload your notes and access thousands of study materials shared by students worldwide.
              </p>
            </div>
            <div className="hidden md:block">
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600"
                alt="Students studying together"
                className="rounded-xl shadow-2xl w-full"
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 pt-8 border-t border-purple-400">
            <div className="text-center" data-testid="stat-notes">
              <div className="text-3xl font-bold">{allNotes.length.toLocaleString()}</div>
              <div className="text-purple-200">Notes Shared</div>
            </div>
            <div className="text-center" data-testid="stat-users">
              <div className="text-3xl font-bold">3,291</div>
              <div className="text-purple-200">Active Students</div>
            </div>
            <div className="text-center" data-testid="stat-subjects">
              <div className="text-3xl font-bold">156</div>
              <div className="text-purple-200">Subjects</div>
            </div>
            <div className="text-center" data-testid="stat-universities">
              <div className="text-3xl font-bold">89</div>
              <div className="text-purple-200">Universities</div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Subject Filters */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Filter by subject:</span>
              {subjects.map((subject) => (
                <Button
                  key={subject}
                  onClick={() => handleSubjectFilter(subject)}
                  variant={selectedSubject === subject ? "default" : "outline"}
                  size="sm"
                  className="rounded-full"
                  data-testid={`filter-${subject.toLowerCase().replace(' ', '-')}`}
                >
                  {subject}
                </Button>
              ))}
            </div>

            {/* View and Sort Controls */}
            <div className="flex items-center gap-4">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  data-testid="view-grid"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  data-testid="view-list"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Featured Notes Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="featured-notes-title">
              Featured Notes
            </h2>
          </div>

          {isLoadingFeatured ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <NoteSkeleton key={i} />
              ))}
            </div>
          ) : featuredNotes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500" data-testid="no-featured-notes">
                No featured notes available.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="featured-notes-grid">
              {featuredNotes.map((note) => (
                <NoteCard key={note.id} note={note} variant="featured" />
              ))}
            </div>
          )}
        </section>

        {/* Recent Uploads Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="recent-notes-title">
              Recent Uploads
            </h2>
          </div>

          {isLoadingRecent ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow p-4 border border-gray-100">
                  <Skeleton className="w-full h-20" />
                </div>
              ))}
            </div>
          ) : recentNotes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500" data-testid="no-recent-notes">
                No recent notes available.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="recent-notes-grid">
              {recentNotes.map((note) => (
                <NoteCard key={note.id} note={note} variant="compact" />
              ))}
            </div>
          )}
        </section>

        {/* All Notes Section */}
        {(searchQuery || selectedSubject !== "All") && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="search-results-title">
                {searchQuery ? `Search results for "${searchQuery}"` : `${selectedSubject} Notes`}
              </h2>
              <div className="text-sm text-gray-500" data-testid="results-count">
                {allNotes.length} results
              </div>
            </div>

            {isLoadingAll ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow p-4 border border-gray-100">
                    <Skeleton className="w-full h-32" />
                  </div>
                ))}
              </div>
            ) : allNotes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500" data-testid="no-search-results">
                  No notes found matching your criteria.
                </p>
              </div>
            ) : (
              <div 
                className={`grid gap-4 ${viewMode === 'grid' 
                  ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                  : 'grid-cols-1'
                }`}
                data-testid="search-results-grid"
              >
                {allNotes.map((note) => (
                  <NoteCard key={note.id} note={note} variant="compact" />
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Brand */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="text-primary text-2xl">✒️</div>
                <span className="text-2xl font-bold">Quill</span>
              </div>
              <p className="text-gray-400 mb-4">
                Empowering students worldwide through collaborative note sharing and knowledge exchange.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Browse Notes</a></li>
                <li><a href="#" className="hover:text-white">Upload Notes</a></li>
                <li><a href="#" className="hover:text-white">My Library</a></li>
                <li><a href="#" className="hover:text-white">Popular Subjects</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Community Guidelines</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">Report Content</a></li>
              </ul>
            </div>

            {/* Academic Resources */}
            <div>
              <h4 className="font-semibold mb-4">Academic Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Study Tips</a></li>
                <li><a href="#" className="hover:text-white">Citation Guide</a></li>
                <li><a href="#" className="hover:text-white">University Partners</a></li>
                <li><a href="#" className="hover:text-white">Academic Integrity</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Quill. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </div>
  );
}
