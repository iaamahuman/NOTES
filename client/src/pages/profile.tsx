import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  User, Edit3, Save, X, Upload, Download, Star, Calendar, 
  MapPin, GraduationCap, Building2, Mail, Settings, BookOpen 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { RequireAuth } from "@/components/protected-route";
import { UserProfileSkeleton } from "@/components/ui/skeletons";
import { NoteCard } from "@/components/note-card";
import { getUserStats, getUserNotes } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import type { User as UserType, NoteWithUploader } from "@shared/schema";

const profileUpdateSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  university: z.string().optional(),
  major: z.string().optional(),
  year: z.string().optional(),
});

type ProfileUpdateForm = z.infer<typeof profileUpdateSchema>;

// Mock data for demo
const mockUserStats = {
  notesUploaded: 12,
  totalDownloads: 1247,
  averageRating: 4.3,
  joinDate: new Date("2024-01-15"),
  reputation: 856,
};

const mockUserNotes: NoteWithUploader[] = [
  {
    id: "1",
    title: "Calculus Integration Techniques",
    description: "Comprehensive notes covering various integration methods including substitution, integration by parts, and partial fractions.",
    subject: "Mathematics",
    tags: ["calculus", "integration", "derivatives"],
    course: "MATH 201",
    professor: "Dr. Smith",
    semester: "Fall 2024",
    fileType: "pdf",
    fileName: "calculus-integration.pdf",
    fileSize: 2048576,
    filePath: "/uploads/calculus-integration.pdf",
    thumbnailPath: null,
    uploaderId: "user-1",
    downloads: 89,
    views: 234,
    rating: "4.5",
    ratingCount: 12,
    isFeatured: false,
    isPublic: true,
    createdAt: new Date("2024-02-01"),
    uploader: {
      id: "user-1",
      username: "alexchen",
      avatar: undefined,
      reputation: 856,
    }
  }
];

function ProfileStats({ user }: { user: UserType }) {
  const { data: stats } = useQuery({
    queryKey: ['/api/user/stats'],
    queryFn: getUserStats,
  });

  const statItems = [
    {
      label: "Notes Uploaded",
      value: stats?.thisMonthUploads || 0,
      icon: Upload,
      color: "text-blue-600",
    },
    {
      label: "Total Views",
      value: stats?.totalViews.toLocaleString() || "0",
      icon: Download,
      color: "text-green-600",
    },
    {
      label: "Average Rating",
      value: stats?.avgRating.toFixed(1) || "0.0",
      icon: Star,
      color: "text-yellow-600",
    },
    {
      label: "This Month Downloads",
      value: stats?.thisMonthDownloads || 0,
      icon: User,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statItems.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Icon className={`h-5 w-5 ${stat.color}`} />
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function ProfileHeader({ user, onEdit }: { user: UserType; onEdit: () => void }) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "long" 
    });
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.avatar || undefined} />
              <AvatarFallback className="text-2xl">
                {user.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold">{user.username}</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {user.email}
              </p>
              {user.bio && (
                <p className="text-sm text-muted-foreground max-w-md">
                  {user.bio}
                </p>
              )}
              <div className="flex items-center space-x-4 text-sm text-muted-foreground pt-2">
                {user.university && (
                  <div className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    <span>{user.university}</span>
                  </div>
                )}
                {user.major && (
                  <div className="flex items-center gap-1">
                    <GraduationCap className="h-4 w-4" />
                    <span>{user.major}</span>
                  </div>
                )}
                {user.year && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Class of {user.year}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Badge variant="secondary">
                  <Calendar className="h-3 w-3 mr-1" />
                  Joined {formatDate(mockUserStats.joinDate)}
                </Badge>
                <Badge variant="outline">
                  {mockUserStats.reputation} reputation
                </Badge>
              </div>
            </div>
          </div>
          <Button onClick={onEdit} variant="outline">
            <Edit3 className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EditProfileForm({ 
  user, 
  onSave, 
  onCancel 
}: { 
  user: UserType; 
  onSave: (data: ProfileUpdateForm) => void; 
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileUpdateForm>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      username: user.username,
      email: user.email,
      bio: user.bio || "",
      university: user.university || "",
      major: user.major || "",
      year: user.year || "",
    },
  });

  const onSubmit = async (data: ProfileUpdateForm) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      onSave(data);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "There was an error updating your profile.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
        <CardDescription>
          Update your profile information and academic details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                {...register("username")}
                disabled={isLoading}
              />
              {errors.username && (
                <p className="text-sm text-red-600">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell others about yourself..."
              {...register("bio")}
              disabled={isLoading}
            />
            {errors.bio && (
              <p className="text-sm text-red-600">{errors.bio.message}</p>
            )}
          </div>

          <Separator />

          <h4 className="font-medium">Academic Information</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="university">University</Label>
              <Input
                id="university"
                placeholder="Your university"
                {...register("university")}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="major">Major</Label>
              <Input
                id="major"
                placeholder="Your major"
                {...register("major")}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Graduation Year</Label>
              <Input
                id="year"
                placeholder="e.g., 2025"
                {...register("year")}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function UserNotesList() {
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['/api/user/notes'],
    queryFn: getUserNotes,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Your Notes</h3>
          <Badge variant="secondary">Loading...</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Your Notes</h3>
        <Badge variant="secondary">{notes.length} notes</Badge>
      </div>
      
      {notes.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">You haven't uploaded any notes yet.</p>
            <p className="text-sm text-gray-500 mt-2">
              Share your knowledge with the community by uploading your first note!
            </p>
            <Button className="mt-4">
              <Upload className="h-4 w-4 mr-2" />
              Upload Your First Note
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} variant="compact" />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Profile() {
  const { user, isLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <UserProfileSkeleton />
      </div>
    );
  }

  if (!user) {
    return null; // ProtectedRoute will handle this
  }

  const handleSave = (data: ProfileUpdateForm) => {
    // In a real app, this would update the user via API
    console.log("Saving profile:", data);
    setIsEditing(false);
  };

  return (
    <RequireAuth>
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Profile Header */}
          {isEditing ? (
            <EditProfileForm
              user={user}
              onSave={handleSave}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <ProfileHeader user={user} onEdit={() => setIsEditing(true)} />
          )}

          {/* Stats */}
          <ProfileStats user={user} />

          {/* Content Tabs */}
          <Tabs defaultValue="notes" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="notes">My Notes</TabsTrigger>
              <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>
            
            <TabsContent value="notes" className="mt-6">
              <UserNotesList />
            </TabsContent>
            
            <TabsContent value="bookmarks" className="mt-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No bookmarked notes yet.</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Bookmark notes you want to reference later.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="activity" className="mt-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Activity feed coming soon.</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Track your uploads, downloads, and community interactions.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </RequireAuth>
  );
}
