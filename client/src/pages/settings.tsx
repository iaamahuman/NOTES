import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Settings as SettingsIcon, User, Bell, Shield, Download, 
  Eye, Mail, Globe, Trash2, Save, AlertTriangle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { RequireAuth } from "@/components/protected-route";

// Form schemas
const profileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  university: z.string().optional(),
  major: z.string().optional(),
  year: z.string().optional(),
});

const securitySchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileForm = z.infer<typeof profileSchema>;
type SecurityForm = z.infer<typeof securitySchema>;

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  newComments: boolean;
  newRatings: boolean;
  newFollowers: boolean;
  weeklyDigest: boolean;
  marketingEmails: boolean;
}

interface PrivacySettings {
  profileVisibility: "public" | "private";
  showEmail: boolean;
  showUniversity: boolean;
  allowMessages: boolean;
  searchable: boolean;
}

export default function Settings() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [isDeleting, setIsDeleting] = useState(false);

  // Notification settings state
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: false,
    newComments: true,
    newRatings: true,
    newFollowers: false,
    weeklyDigest: true,
    marketingEmails: false,
  });

  // Privacy settings state
  const [privacy, setPrivacy] = useState<PrivacySettings>({
    profileVisibility: "public",
    showEmail: false,
    showUniversity: true,
    allowMessages: true,
    searchable: true,
  });

  // Profile form
  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username || "",
      email: user?.email || "",
      bio: user?.bio || "",
      university: user?.university || "",
      major: user?.major || "",
      year: user?.year || "",
    },
  });

  // Security form
  const securityForm = useForm<SecurityForm>({
    resolver: zodResolver(securitySchema),
  });

  const handleProfileSubmit = async (data: ProfileForm) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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
    }
  };

  const handleSecuritySubmit = async (data: SecurityForm) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Password updated",
        description: "Your password has been successfully changed.",
      });
      
      securityForm.reset();
    } catch (error) {
      toast({
        title: "Update failed",
        description: "There was an error changing your password.",
        variant: "destructive",
      });
    }
  };

  const handleNotificationUpdate = async (key: keyof NotificationSettings, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 200));
      
      toast({
        title: "Notification settings updated",
        description: "Your preferences have been saved.",
      });
    } catch (error) {
      // Revert on error
      setNotifications(prev => ({ ...prev, [key]: !value }));
      toast({
        title: "Update failed",
        description: "Failed to update notification settings.",
        variant: "destructive",
      });
    }
  };

  const handlePrivacyUpdate = async (key: keyof PrivacySettings, value: any) => {
    setPrivacy(prev => ({ ...prev, [key]: value }));
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 200));
      
      toast({
        title: "Privacy settings updated",
        description: "Your privacy preferences have been saved.",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update privacy settings.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
      });
      
      // Logout and redirect
      await logout();
    } catch (error) {
      toast({
        title: "Deletion failed",
        description: "There was an error deleting your account.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) return null;

  return (
    <RequireAuth>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
            <p className="text-gray-600">Manage your account settings and preferences</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-4 w-full lg:w-auto">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            {/* Profile Settings */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>
                    Update your personal information and academic details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-6">
                    {/* Avatar Section */}
                    <div className="flex items-center gap-6">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={user.avatar || undefined} />
                        <AvatarFallback className="text-2xl">
                          {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <Button variant="outline" type="button">
                          Change Avatar
                        </Button>
                        <p className="text-xs text-gray-500 mt-2">
                          JPG, PNG up to 2MB
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          {...profileForm.register("username")}
                        />
                        {profileForm.formState.errors.username && (
                          <p className="text-sm text-red-600">
                            {profileForm.formState.errors.username.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          {...profileForm.register("email")}
                        />
                        {profileForm.formState.errors.email && (
                          <p className="text-sm text-red-600">
                            {profileForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          placeholder="Tell others about yourself..."
                          {...profileForm.register("bio")}
                        />
                        <p className="text-xs text-gray-500">
                          {profileForm.watch("bio")?.length || 0}/500 characters
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="university">University</Label>
                        <Input
                          id="university"
                          placeholder="Your university"
                          {...profileForm.register("university")}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="major">Major</Label>
                        <Input
                          id="major"
                          placeholder="Your major"
                          {...profileForm.register("major")}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="year">Graduation Year</Label>
                        <Input
                          id="year"
                          placeholder="e.g., 2025"
                          {...profileForm.register("year")}
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full sm:w-auto">
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notification Settings */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>
                    Choose how you want to be notified about activity
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="email-notifications">Email Notifications</Label>
                        <p className="text-sm text-gray-500">Receive notifications via email</p>
                      </div>
                      <Switch
                        id="email-notifications"
                        checked={notifications.emailNotifications}
                        onCheckedChange={(checked) => handleNotificationUpdate("emailNotifications", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="push-notifications">Push Notifications</Label>
                        <p className="text-sm text-gray-500">Receive browser push notifications</p>
                      </div>
                      <Switch
                        id="push-notifications"
                        checked={notifications.pushNotifications}
                        onCheckedChange={(checked) => handleNotificationUpdate("pushNotifications", checked)}
                      />
                    </div>

                    <Separator />

                    <h4 className="font-medium">Activity Notifications</h4>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="new-comments">New Comments</Label>
                          <p className="text-sm text-gray-500">When someone comments on your notes</p>
                        </div>
                        <Switch
                          id="new-comments"
                          checked={notifications.newComments}
                          onCheckedChange={(checked) => handleNotificationUpdate("newComments", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="new-ratings">New Ratings</Label>
                          <p className="text-sm text-gray-500">When someone rates your notes</p>
                        </div>
                        <Switch
                          id="new-ratings"
                          checked={notifications.newRatings}
                          onCheckedChange={(checked) => handleNotificationUpdate("newRatings", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="new-followers">New Followers</Label>
                          <p className="text-sm text-gray-500">When someone follows you</p>
                        </div>
                        <Switch
                          id="new-followers"
                          checked={notifications.newFollowers}
                          onCheckedChange={(checked) => handleNotificationUpdate("newFollowers", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="weekly-digest">Weekly Digest</Label>
                          <p className="text-sm text-gray-500">Weekly summary of your activity</p>
                        </div>
                        <Switch
                          id="weekly-digest"
                          checked={notifications.weeklyDigest}
                          onCheckedChange={(checked) => handleNotificationUpdate("weeklyDigest", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="marketing-emails">Marketing Emails</Label>
                          <p className="text-sm text-gray-500">Updates about new features and tips</p>
                        </div>
                        <Switch
                          id="marketing-emails"
                          checked={notifications.marketingEmails}
                          onCheckedChange={(checked) => handleNotificationUpdate("marketingEmails", checked)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Privacy Settings */}
            <TabsContent value="privacy" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Privacy Settings
                  </CardTitle>
                  <CardDescription>
                    Control who can see your information and contact you
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="profile-visibility">Profile Visibility</Label>
                      <Select
                        value={privacy.profileVisibility}
                        onValueChange={(value: "public" | "private") => handlePrivacyUpdate("profileVisibility", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4" />
                              Public - Anyone can view
                            </div>
                          </SelectItem>
                          <SelectItem value="private">
                            <div className="flex items-center gap-2">
                              <Eye className="h-4 w-4" />
                              Private - Only you can view
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <h4 className="font-medium">Information Visibility</h4>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="show-email">Show Email Address</Label>
                          <p className="text-sm text-gray-500">Display your email on your profile</p>
                        </div>
                        <Switch
                          id="show-email"
                          checked={privacy.showEmail}
                          onCheckedChange={(checked) => handlePrivacyUpdate("showEmail", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="show-university">Show University</Label>
                          <p className="text-sm text-gray-500">Display your university on your profile</p>
                        </div>
                        <Switch
                          id="show-university"
                          checked={privacy.showUniversity}
                          onCheckedChange={(checked) => handlePrivacyUpdate("showUniversity", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="allow-messages">Allow Messages</Label>
                          <p className="text-sm text-gray-500">Let other users send you messages</p>
                        </div>
                        <Switch
                          id="allow-messages"
                          checked={privacy.allowMessages}
                          onCheckedChange={(checked) => handlePrivacyUpdate("allowMessages", checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="searchable">Searchable Profile</Label>
                          <p className="text-sm text-gray-500">Allow others to find you in search</p>
                        </div>
                        <Switch
                          id="searchable"
                          checked={privacy.searchable}
                          onCheckedChange={(checked) => handlePrivacyUpdate("searchable", checked)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Settings */}
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security Settings
                  </CardTitle>
                  <CardDescription>
                    Keep your account secure with strong passwords
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={securityForm.handleSubmit(handleSecuritySubmit)} className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input
                          id="current-password"
                          type="password"
                          {...securityForm.register("currentPassword")}
                        />
                        {securityForm.formState.errors.currentPassword && (
                          <p className="text-sm text-red-600">
                            {securityForm.formState.errors.currentPassword.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                          id="new-password"
                          type="password"
                          {...securityForm.register("newPassword")}
                        />
                        {securityForm.formState.errors.newPassword && (
                          <p className="text-sm text-red-600">
                            {securityForm.formState.errors.newPassword.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          {...securityForm.register("confirmPassword")}
                        />
                        {securityForm.formState.errors.confirmPassword && (
                          <p className="text-sm text-red-600">
                            {securityForm.formState.errors.confirmPassword.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <Button type="submit">
                      <Save className="h-4 w-4 mr-2" />
                      Update Password
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                    Danger Zone
                  </CardTitle>
                  <CardDescription>
                    Irreversible and destructive actions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert variant="destructive" className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Deleting your account will permanently remove all your data, including notes, 
                      comments, and profile information. This action cannot be undone.
                    </AlertDescription>
                  </Alert>

                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <Trash2 className="h-4 w-4 mr-2 animate-spin" />
                        Deleting Account...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Account
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </RequireAuth>
  );
}
