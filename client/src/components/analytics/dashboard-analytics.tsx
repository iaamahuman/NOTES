import { TrendingUp, TrendingDown, BarChart3, PieChart, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

// Mock data for analytics
const mockAnalyticsData = {
  uploads: {
    thisMonth: 12,
    lastMonth: 8,
    trend: "up" as const,
    change: 50
  },
  downloads: {
    thisMonth: 234,
    lastMonth: 189,
    trend: "up" as const,
    change: 24
  },
  views: {
    thisMonth: 1567,
    lastMonth: 1234,
    trend: "up" as const,
    change: 27
  },
  ratings: {
    average: 4.6,
    total: 89,
    distribution: [
      { rating: 5, count: 52, percentage: 58 },
      { rating: 4, count: 28, percentage: 31 },
      { rating: 3, count: 7, percentage: 8 },
      { rating: 2, count: 2, percentage: 2 },
      { rating: 1, count: 0, percentage: 0 },
    ]
  },
  monthlyData: [
    { month: "Jan", uploads: 5, downloads: 89 },
    { month: "Feb", uploads: 8, downloads: 123 },
    { month: "Mar", uploads: 12, downloads: 156 },
    { month: "Apr", uploads: 15, downloads: 189 },
    { month: "May", uploads: 18, downloads: 234 },
    { month: "Jun", uploads: 22, downloads: 267 },
  ],
  popularSubjects: [
    { subject: "Mathematics", uploads: 8, percentage: 35 },
    { subject: "Computer Science", uploads: 6, percentage: 26 },
    { subject: "Physics", uploads: 4, percentage: 17 },
    { subject: "Chemistry", uploads: 3, percentage: 13 },
    { subject: "Biology", uploads: 2, percentage: 9 },
  ]
};

function MetricCard({ 
  title, 
  value, 
  change, 
  trend, 
  icon: Icon,
  subtitle 
}: {
  title: string;
  value: string | number;
  change: number;
  trend: "up" | "down";
  icon: React.ElementType;
  subtitle?: string;
}) {
  const isPositive = trend === "up";
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{value}</p>
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <div className={`p-2 rounded-full ${isPositive ? 'bg-green-100' : 'bg-red-100'}`}>
              <Icon className={`h-4 w-4 ${isPositive ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <div className="flex items-center space-x-1 text-xs">
              {isPositive ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {change}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SimpleBarChart({ data }: { data: Array<{ month: string; uploads: number; downloads: number; }> }) {
  const maxValue = Math.max(...data.flatMap(d => [d.uploads, d.downloads]));
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Monthly Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium">{item.month}</span>
                <div className="flex gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    {item.uploads} uploads
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    {item.downloads} downloads
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex gap-1 h-2">
                  <div 
                    className="bg-blue-500 rounded-sm"
                    style={{ width: `${(item.uploads / maxValue) * 100}%` }}
                  />
                  <div 
                    className="bg-green-500 rounded-sm"
                    style={{ width: `${(item.downloads / maxValue) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RatingDistribution({ ratings }: { ratings: typeof mockAnalyticsData.ratings }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          Rating Distribution
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center pb-4">
          <div className="text-3xl font-bold">{ratings.average}</div>
          <div className="text-sm text-muted-foreground">
            Average rating from {ratings.total} reviews
          </div>
        </div>
        
        <div className="space-y-3">
          {ratings.distribution.map((item) => (
            <div key={item.rating} className="flex items-center gap-3">
              <div className="text-sm font-medium w-6">
                {item.rating}★
              </div>
              <div className="flex-1">
                <Progress value={item.percentage} className="h-2" />
              </div>
              <div className="text-xs text-muted-foreground w-12 text-right">
                {item.count}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PopularSubjects({ subjects }: { subjects: typeof mockAnalyticsData.popularSubjects }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Popular Subjects</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {subjects.map((subject, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                {subject.subject.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-sm">{subject.subject}</p>
                <p className="text-xs text-muted-foreground">
                  {subject.uploads} notes
                </p>
              </div>
            </div>
            <Badge variant="secondary">{subject.percentage}%</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function QuickInsights() {
  const insights = [
    {
      icon: TrendingUp,
      title: "Growing Popularity",
      description: "Your notes received 27% more views this month",
      color: "text-green-600 bg-green-50"
    },
    {
      icon: Activity,
      title: "High Engagement",
      description: "Average rating improved to 4.6 stars",
      color: "text-blue-600 bg-blue-50"
    },
    {
      icon: BarChart3,
      title: "Top Performer",
      description: "Mathematics notes are your most popular",
      color: "text-purple-600 bg-purple-50"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          return (
            <div key={index} className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${insight.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-sm">{insight.title}</p>
                <p className="text-xs text-muted-foreground">
                  {insight.description}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function DashboardAnalytics() {
  const data = mockAnalyticsData;
  
  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Monthly Uploads"
          value={data.uploads.thisMonth}
          change={data.uploads.change}
          trend={data.uploads.trend}
          icon={TrendingUp}
          subtitle={`${data.uploads.change}% from last month`}
        />
        <MetricCard
          title="Monthly Downloads"
          value={data.downloads.thisMonth.toLocaleString()}
          change={data.downloads.change}
          trend={data.downloads.trend}
          icon={Activity}
          subtitle="Total this month"
        />
        <MetricCard
          title="Monthly Views"
          value={data.views.thisMonth.toLocaleString()}
          change={data.views.change}
          trend={data.views.trend}
          icon={BarChart3}
          subtitle="Unique views"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimpleBarChart data={data.monthlyData} />
        <RatingDistribution ratings={data.ratings} />
      </div>

      {/* Additional Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PopularSubjects subjects={data.popularSubjects} />
        <QuickInsights />
      </div>
    </div>
  );
}
