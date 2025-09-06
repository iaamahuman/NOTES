import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { TrendingUp, Download, Eye, Star, Users, BookOpen, Calendar, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/auth-context";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

interface UserAnalyticsProps {
  className?: string;
}

export function UserAnalytics({ className = "" }: UserAnalyticsProps) {
  const { user } = useAuth();

  // Mock analytics data - in a real app, this would come from your API
  const analyticsData = {
    overview: {
      totalNotes: 47,
      totalDownloads: 2847,
      totalViews: 15423,
      averageRating: 4.3,
      followers: 189,
      reputation: 1240
    },
    downloadsTrend: [
      { month: 'Jan', downloads: 120, views: 890 },
      { month: 'Feb', downloads: 180, views: 1200 },
      { month: 'Mar', downloads: 240, views: 1500 },
      { month: 'Apr', downloads: 320, views: 2100 },
      { month: 'May', downloads: 290, views: 1950 },
      { month: 'Jun', downloads: 380, views: 2400 },
    ],
    subjectDistribution: [
      { subject: 'Computer Science', notes: 15, percentage: 32 },
      { subject: 'Mathematics', notes: 12, percentage: 26 },
      { subject: 'Physics', notes: 8, percentage: 17 },
      { subject: 'Chemistry', notes: 7, percentage: 15 },
      { subject: 'Biology', notes: 5, percentage: 10 },
    ],
    topPerformingNotes: [
      { title: 'Advanced Algorithms Study Guide', downloads: 342, views: 1240, rating: 4.8 },
      { title: 'Calculus II Complete Notes', downloads: 298, views: 1120, rating: 4.7 },
      { title: 'Organic Chemistry Lab Reports', downloads: 267, views: 890, rating: 4.6 },
      { title: 'Data Structures Implementation', downloads: 234, views: 780, rating: 4.5 },
      { title: 'Linear Algebra Solutions', downloads: 198, views: 650, rating: 4.4 },
    ],
    recentActivity: [
      { action: 'Note uploaded', detail: 'Machine Learning Basics', time: '2 hours ago' },
      { action: 'Received rating', detail: '5 stars on Calculus Notes', time: '4 hours ago' },
      { action: 'New follower', detail: 'Sarah Chen started following you', time: '6 hours ago' },
      { action: 'Note downloaded', detail: 'Your Physics Lab was downloaded', time: '8 hours ago' },
      { action: 'Comment received', detail: 'Great notes! Very helpful', time: '1 day ago' },
    ]
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (!user) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <p className="text-gray-500">Please sign in to view your analytics</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Notes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.totalNotes}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analyticsData.overview.totalDownloads)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+23%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analyticsData.overview.totalViews)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+18%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.averageRating}/5</div>
            <div className="flex items-center space-x-1 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-3 w-3 ${
                    star <= analyticsData.overview.averageRating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Followers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.followers}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+5</span> this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reputation Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analyticsData.overview.reputation)}</div>
            <Progress value={65} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">65% to next level</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Downloads and Views Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Downloads & Views Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.downloadsTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="downloads" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Downloads"
                />
                <Line 
                  type="monotone" 
                  dataKey="views" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  name="Views"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Subject Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Notes by Subject</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analyticsData.subjectDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ subject, percentage }) => `${subject}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="notes"
                >
                  {analyticsData.subjectDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Performing Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.topPerformingNotes.map((note, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium line-clamp-1">{note.title}</h4>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        {note.downloads}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {note.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {note.rating}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{activity.action}:</span> {activity.detail}
                  </p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievement Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Your Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl mb-2">🏆</div>
              <p className="text-sm font-medium">Top Contributor</p>
              <p className="text-xs text-gray-500">100+ downloads</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl mb-2">⭐</div>
              <p className="text-sm font-medium">Highly Rated</p>
              <p className="text-xs text-gray-500">4.5+ avg rating</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl mb-2">📚</div>
              <p className="text-sm font-medium">Knowledge Sharer</p>
              <p className="text-xs text-gray-500">25+ notes uploaded</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl mb-2">👥</div>
              <p className="text-sm font-medium">Community Builder</p>
              <p className="text-xs text-gray-500">50+ followers</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}