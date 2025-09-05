import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  User, Upload, Download, Star, Heart, Folder, 
  TrendingUp, Calendar, BookOpen, Users
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NoteCard } from "@/components/note-card";
import { Header } from "@/components/header";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardAnalytics } from "@/components/analytics/dashboard-analytics";
import { 
  getUserProfile, 
  getUserNotes, 
  getUserBookmarks, 
  getUserStats 
} from "@/lib/api";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['/api/user/profile'],
    queryFn: getUserProfile,
  });

  const { data: userNotes = [], isLoading: isLoadingNotes } = useQuery({
    queryKey: ['/api/user/notes'],
    queryFn: getUserNotes,
  });

  const { data: bookmarks = [], isLoading: isLoadingBookmarks } = useQuery({
    queryKey: ['/api/user/bookmarks'],
    queryFn: getUserBookmarks,
  });

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/user/stats'],
    queryFn: getUserStats,
  });

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Header onSearchChange={() => {}} onUploadClick={() => {}} />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <Skeleton className="w-24 h-24 rounded-full mx-auto" />
                    <Skeleton className="h-6 w-32 mx-auto" />
                    <Skeleton className="h-4 w-40 mx-auto" />
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-3">
              <div className="space-y-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onSearchChange={() => {}} onUploadClick={() => {}} />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <Avatar className="w-24 h-24 mx-auto">
                    <AvatarImage src={profile?.avatar || undefined} />
                    <AvatarFallback className="text-2xl">
                      {profile?.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <h2 className="text-xl font-bold dark:text-white" data-testid="profile-username">
                      {profile?.username}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">{profile?.university}</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">{profile?.major} • {profile?.year}</p>
                  </div>

                  {profile?.bio && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 text-center" data-testid="profile-bio">
                      {profile.bio}
                    </p>
                  )}

                  <div className="flex justify-center">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      {profile?.reputation} Rep
                    </Badge>
                  </div>

                  <Button className="w-full" data-testid="edit-profile-button">
                    <User className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>

                  <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                    <p>Member since {formatDate(profile?.createdAt || new Date())}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4" />
                    Followers
                  </span>
                  <span className="font-medium" data-testid="followers-count">
                    {profile?.followersCount}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4" />
                    Following
                  </span>
                  <span className="font-medium" data-testid="following-count">
                    {profile?.followingCount}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2 text-sm">
                    <BookOpen className="h-4 w-4" />
                    Total Views
                  </span>
                  <span className="font-medium" data-testid="total-views">
                    {stats?.totalViews?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2 text-sm">
                    <Star className="h-4 w-4" />
                    Avg Rating
                  </span>
                  <span className="font-medium" data-testid="avg-rating">
                    {stats?.avgRating}/5.0
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
                <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
                <TabsTrigger value="notes" data-testid="tab-notes">My Notes</TabsTrigger>
                <TabsTrigger value="bookmarks" data-testid="tab-bookmarks">Bookmarks</TabsTrigger>
                <TabsTrigger value="activity" data-testid="tab-activity">Activity</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* Stats Cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Uploads</p>
                          <p className="text-2xl font-bold dark:text-white" data-testid="total-uploads">
                            {profile?.totalUploads}
                          </p>
                        </div>
                        <Upload className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Downloads</p>
                          <p className="text-2xl font-bold dark:text-white" data-testid="total-downloads">
                            {profile?.totalDownloads?.toLocaleString()}
                          </p>
                        </div>
                        <Download className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">This Month</p>
                          <p className="text-2xl font-bold dark:text-white" data-testid="month-uploads">
                            {stats?.thisMonthUploads}
                          </p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Month Downloads</p>
                          <p className="text-2xl font-bold dark:text-white" data-testid="month-downloads">
                            {stats?.thisMonthDownloads}
                          </p>
                        </div>
                        <Calendar className="h-8 w-8 text-orange-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                        <Upload className="h-5 w-5 text-blue-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Uploaded "Linear Algebra Notes"</p>
                          <p className="text-xs text-gray-600">2 hours ago</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <Star className="h-5 w-5 text-green-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Received 5-star rating on "Calculus Review"</p>
                          <p className="text-xs text-gray-600">1 day ago</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                        <Heart className="h-5 w-5 text-purple-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Your note was bookmarked 12 times</p>
                          <p className="text-xs text-gray-600">2 days ago</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
                  <Badge variant="outline">Updated in real-time</Badge>
                </div>
                <DashboardAnalytics />
              </TabsContent>

              {/* My Notes Tab */}
              <TabsContent value="notes" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">My Notes ({profile?.notesCount})</h2>
                  <Button data-testid="upload-new-note">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload New
                  </Button>
                </div>

                {isLoadingNotes ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="bg-white rounded-lg shadow p-4">
                        <Skeleton className="w-full h-32" />
                      </div>
                    ))}
                  </div>
                ) : userNotes.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Folder className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No notes yet</h3>
                      <p className="text-gray-600 mb-4">Start sharing your knowledge with the community</p>
                      <Button data-testid="upload-first-note">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Your First Note
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="user-notes-grid">
                    {userNotes.map((note: any) => (
                      <NoteCard key={note.id} note={note} variant="compact" />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Bookmarks Tab */}
              <TabsContent value="bookmarks" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Bookmarked Notes</h2>
                </div>

                {isLoadingBookmarks ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="bg-white rounded-lg shadow p-4">
                        <Skeleton className="w-full h-32" />
                      </div>
                    ))}
                  </div>
                ) : bookmarks.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No bookmarks yet</h3>
                      <p className="text-gray-600">Bookmark notes you want to save for later</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="bookmarks-grid">
                    {bookmarks.map((note: any) => (
                      <NoteCard key={note.id} note={note} variant="compact" />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity" className="space-y-6">
                <h2 className="text-2xl font-bold">Activity Timeline</h2>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      {/* Activity timeline items would go here */}
                      <div className="text-center py-12">
                        <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Activity coming soon</h3>
                        <p className="text-gray-600">Your activity timeline will appear here</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}