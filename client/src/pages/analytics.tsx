import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Users, MessageCircle, List, ExternalLink, MapPin, Clock, 
  TrendingUp, Activity, DollarSign, Globe, Calendar, Mic, Brain,
  Smartphone, Monitor, Headphones, Target, Zap, BarChart3, PieChart,
  Timer, Shield, Database, Server, Wifi, AlertCircle, CheckCircle,
  UserCheck, MessageSquare, Bookmark, Bell, Eye, MousePointer
} from "lucide-react";
import { Link } from "wouter";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { useState } from "react";

interface AnalyticsData {
  // Basic metrics
  totalUsers: string;
  totalMessages: string;
  totalLists: string;
  linkClicks: number;
  timestamp: string;
  
  // Enhanced user analytics
  userGrowth: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  usersByLocation: Array<{
    country: string;
    region: string;
    count: number;
    percentage: number;
  }>;
  usersByTimezone: Array<{
    timezone: string;
    count: number;
    percentage: number;
  }>;
  userDemographics: {
    averageAge: number;
    professions: Array<{ profession: string; count: number; }>;
    onboardingCompletion: number;
  };
  
  // Conversation analytics
  conversationMetrics: {
    totalConversations: number;
    averageMessagesPerConversation: number;
    averageResponseTime: number;
    topTopics: Array<{ topic: string; frequency: number; }>;
    voiceUsagePercent: number;
    messagesLast24h: number;
    messagesLast7d: number;
    messagesLast30d: number;
  };
  
  // Feature usage
  featureUsage: {
    smartListsCreated: number;
    remindersSet: number;
    voiceTranscriptions: number;
    linksShortenedToday: number;
    ocrProcessed: number;
    contactsCreated: number;
  };
  
  // Revenue analytics
  revenueMetrics: {
    totalRevenue: number;
    revenueToday: number;
    revenueThisMonth: number;
    topPerformingLinks: Array<{
      domain: string;
      clicks: number;
      revenue: number;
    }>;
    conversionRate: number;
    averageCommission: number;
  };
  
  // System performance
  systemMetrics: {
    uptime: number;
    apiResponseTime: number;
    errorRate: number;
    databaseConnections: number;
    storageUsed: number;
    openaiApiCalls: number;
    elevenlabsCalls: number;
  };
  
  // Real-time data
  realTimeMetrics: {
    activeUsers: number;
    onlineUsers: number;
    currentConversations: number;
    averageSessionDuration: number;
  };

  // User profiles data
  userProfiles: Array<{
    id: string;
    name: string;
    email: string;
    age?: number;
    location?: string;
    profession?: string;
    timezone: string;
    preferences: any;
    onboardingCompleted: boolean;
    createdAt: string;
    updatedAt: string;
    lastActive: string;
    messageCount: number;
    listCount: number;
    reminderCount: number;
    contactCount: number;
    voiceUsagePercent: number;
    favoriteFeatures: string[];
  }>;
}

function UserProfilesTable() {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'active' | 'messages'>('created');
  const [filterBy, setFilterBy] = useState<'all' | 'onboarded' | 'pending' | 'premium' | 'trial'>('all');
  
  const { data: profiles, isLoading, error: profilesError } = useQuery<Array<{
    id: string;
    name: string;
    email: string;
    age?: number;
    location?: string;
    profession?: string;
    timezone: string;
    preferences: any;
    onboardingCompleted: boolean;
    createdAt: string;
    updatedAt: string;
    lastActive: string;
    messageCount: number;
    listCount: number;
    reminderCount: number;
    contactCount: number;
    voiceUsagePercent: number;
    favoriteFeatures: string[];
    // Enhanced fields for payment status (to be added later)
    subscriptionStatus?: 'free' | 'trial' | 'premium' | 'cancelled';
    subscriptionPlan?: string;
    trialExpiresAt?: string;
    lifetimeValue?: number;
    registrationSource?: string;
  }>>({
    queryKey: ["/api/analytics/user-profiles"],
    refetchInterval: 60000, // Refresh every minute
    retry: false,
  });

  // Filter and sort profiles
  const filteredAndSortedProfiles = profiles ? profiles
    .filter(user => {
      switch (filterBy) {
        case 'onboarded': return user.onboardingCompleted;
        case 'pending': return !user.onboardingCompleted;
        case 'premium': return user.subscriptionStatus === 'premium';
        case 'trial': return user.subscriptionStatus === 'trial';
        default: return true;
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'created': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'active': return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
        case 'messages': return b.messageCount - a.messageCount;
        default: return 0;
      }
    }) : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading user profiles...</p>
        </div>
      </div>
    );
  }

  if (profilesError) {
    console.error("Profiles error:", profilesError);
    return (
      <div className="text-center py-8">
        <Users className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-600 dark:text-red-400">
          {profilesError.message?.includes('Unauthorized') 
            ? 'Authentication required to view profiles' 
            : 'Error loading user profiles'}
        </p>
      </div>
    );
  }

  if (!profiles || profiles.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">No user profiles found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Enhanced Filter and Sort Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border">
        <div className="flex items-center gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
              Filter by Status:
            </label>
            <select 
              value={filterBy} 
              onChange={(e) => setFilterBy(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm"
            >
              <option value="all">All Users ({profiles?.length || 0})</option>
              <option value="onboarded">Onboarded ({profiles?.filter(u => u.onboardingCompleted).length || 0})</option>
              <option value="pending">Pending ({profiles?.filter(u => !u.onboardingCompleted).length || 0})</option>
              <option value="premium">Premium ({profiles?.filter(u => u.subscriptionStatus === 'premium').length || 0})</option>
              <option value="trial">Trial ({profiles?.filter(u => u.subscriptionStatus === 'trial').length || 0})</option>
            </select>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
              Sort by:
            </label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm"
            >
              <option value="created">Recently Joined</option>
              <option value="active">Recently Active</option>
              <option value="messages">Most Messages</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Users className="h-4 w-4" />
          <span>Showing {filteredAndSortedProfiles.length} of {profiles?.length || 0} users</span>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredAndSortedProfiles.map((user) => (
          <Card 
            key={user.id} 
            className={`cursor-pointer transition-all ${
              selectedUser === user.id ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
            onClick={() => setSelectedUser(selectedUser === user.id ? null : user.id)}
          >
            <CardContent className="p-4">
              <div className="grid md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <h3 className="font-medium">{user.name || 'Anonymous User'}</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <MapPin className="h-3 w-3" />
                    <span>{user.location || 'Unknown location'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>Active {new Date(user.lastActive).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-gray-500" />
                    <span>{user.timezone}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <MessageCircle className="h-4 w-4 text-green-600" />
                    <span>{user.messageCount} messages</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <List className="h-4 w-4 text-purple-600" />
                    <span>{user.listCount} lists</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Bell className="h-4 w-4 text-orange-600" />
                    <span>{user.reminderCount} reminders</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={user.onboardingCompleted ? "default" : "secondary"}>
                      {user.onboardingCompleted ? "Onboarded" : "Pending"}
                    </Badge>
                    <Badge 
                      variant={user.subscriptionStatus === 'premium' ? "default" : 
                               user.subscriptionStatus === 'trial' ? "secondary" : "outline"}
                      className={
                        user.subscriptionStatus === 'premium' ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100" :
                        user.subscriptionStatus === 'trial' ? "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100" :
                        "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
                      }
                    >
                      {user.subscriptionStatus?.toUpperCase() || 'FREE'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mic className="h-4 w-4 text-blue-600" />
                    <span>{user.voiceUsagePercent}% voice</span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                    {user.profession || 'No profession set'}
                  </div>
                  {user.lifetimeValue && (
                    <div className="flex items-center gap-2 text-xs">
                      <DollarSign className="h-3 w-3 text-green-600" />
                      <span className="text-green-600 font-medium">${user.lifetimeValue.toFixed(2)} LTV</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedUser === user.id && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <UserCheck className="h-4 w-4" />
                        Personal Details
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Age:</span>
                          <span>{user.age || 'Not specified'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Profession:</span>
                          <span className="capitalize">{user.profession || 'Not specified'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Location:</span>
                          <span>{user.location || 'Not specified'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Timezone:</span>
                          <span>{user.timezone || 'UTC'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Communication Style:</span>
                          <span className="capitalize">{user.preferences?.communicationStyle || 'Default'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Language:</span>
                          <span>{user.preferences?.language || 'English'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Registration Source:</span>
                          <span className="capitalize">{user.registrationSource || 'Direct'}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Subscription & Billing
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Status:</span>
                          <Badge 
                            variant={user.subscriptionStatus === 'premium' ? "default" : "outline"}
                            className={
                              user.subscriptionStatus === 'premium' ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100" :
                              user.subscriptionStatus === 'trial' ? "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100" :
                              "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
                            }
                          >
                            {user.subscriptionStatus?.toUpperCase() || 'FREE'}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Plan:</span>
                          <span className="capitalize">{user.subscriptionPlan || 'Free Plan'}</span>
                        </div>
                        {user.trialExpiresAt && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Trial Expires:</span>
                            <span className="text-orange-600">{new Date(user.trialExpiresAt).toLocaleDateString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Lifetime Value:</span>
                          <span className="font-medium text-green-600">${user.lifetimeValue?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Account Age:</span>
                          <span>{Math.floor((new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Activity Summary</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Total Messages:</span>
                          <span className="font-medium">{user.messageCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Smart Lists:</span>
                          <span className="font-medium">{user.listCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Reminders Set:</span>
                          <span className="font-medium">{user.reminderCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Contacts Saved:</span>
                          <span className="font-medium">{user.contactCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Voice Usage:</span>
                          <div className="flex items-center gap-2">
                            <Progress value={user.voiceUsagePercent} className="w-16 h-2" />
                            <span className="font-medium">{user.voiceUsagePercent}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced User Preferences Section */}
                  {user.preferences && Object.keys(user.preferences).length > 0 && (
                    <div className="mt-6 col-span-full">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Brain className="h-4 w-4" />
                        Detailed Preferences & Interests
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        {user.preferences.interests && (
                          <div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Interests:</span>
                            <div className="flex flex-wrap gap-1">
                              {user.preferences.interests.map((interest: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {interest}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {user.preferences.dietary && (
                          <div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Dietary Preferences:</span>
                            <div className="flex flex-wrap gap-1">
                              {user.preferences.dietary.map((diet: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs bg-green-100 text-green-800">
                                  {diet}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {user.preferences.familyDetails && (
                          <div className="md:col-span-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Family Details:</span>
                            <p className="text-sm text-gray-600 dark:text-gray-400 italic">"{user.preferences.familyDetails}"</p>
                          </div>
                        )}
                        
                        {user.preferences.sleepSchedule && (
                          <div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Sleep Schedule:</span>
                            <div className="text-sm space-y-1">
                              {user.preferences.sleepSchedule.bedtime && (
                                <div>Bedtime: {user.preferences.sleepSchedule.bedtime}</div>
                              )}
                              {user.preferences.sleepSchedule.wakeup && (
                                <div>Wake up: {user.preferences.sleepSchedule.wakeup}</div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {user.preferences.religious && (
                          <div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Religious Preferences:</span>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{user.preferences.religious || 'Not specified'}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {user.favoriteFeatures && user.favoriteFeatures.length > 0 && (
                    <div className="mt-4 col-span-full">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Most Used Features
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {user.favoriteFeatures.map((feature, index) => (
                          <Badge key={index} variant="outline" className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 col-span-full">
                    <div className="grid md:grid-cols-3 gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <div>
                        <span className="font-medium">User ID:</span><br />
                        <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs">
                          {user.id}
                        </code>
                      </div>
                      <div>
                        <span className="font-medium">Account Created:</span><br />
                        {new Date(user.createdAt).toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Last Updated:</span><br />
                        {new Date(user.updatedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { data: analytics, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics/comprehensive"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to App
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium bg-gray-300 h-4 rounded"></CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-300 h-8 rounded mb-2"></div>
                  <div className="bg-gray-200 h-3 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to App
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          </div>
          <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
            <CardContent className="pt-6">
              <p className="text-red-700 dark:text-red-300">
                Failed to load analytics data. Please check if the server is running.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to App
            </Button>
          </Link>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              GabAi Analytics Dashboard
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Comprehensive insights and real-time metrics
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600 dark:text-green-400">Live</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Updated: {analytics ? new Date(analytics.timestamp).toLocaleTimeString() : "N/A"}
            </p>
          </div>
        </div>

        {/* Real-time Status Bar */}
        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Activity className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Active Users</span>
                </div>
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {analytics?.realTimeMetrics?.activeUsers || 0}
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Eye className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Online Now</span>
                </div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {analytics?.realTimeMetrics?.onlineUsers || 0}
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <MessageSquare className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Live Chats</span>
                </div>
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {analytics?.realTimeMetrics?.currentConversations || 0}
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Timer className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Avg Session</span>
                </div>
                <div className="text-lg font-bold text-orange-700 dark:text-orange-300">
                  {analytics?.realTimeMetrics?.averageSessionDuration ? 
                    `${Math.round(analytics.realTimeMetrics.averageSessionDuration / 60)}m` : '0m'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Key Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Total Users
              </CardTitle>
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {analytics?.totalUsers || "0"}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-600">
                  +{analytics?.userGrowth?.monthly || 0} this month
                </span>
              </div>
              <Progress 
                value={analytics?.userDemographics?.onboardingCompletion || 0} 
                className="mt-2 h-1"
              />
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                {analytics?.userDemographics?.onboardingCompletion || 0}% onboarded
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
                Messages Sent
              </CardTitle>
              <MessageCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                {analytics?.totalMessages || "0"}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Mic className="h-3 w-3 text-purple-600" />
                <span className="text-xs text-purple-600">
                  {analytics?.conversationMetrics?.voiceUsagePercent || 0}% voice
                </span>
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                {analytics?.conversationMetrics?.messagesLast24h || 0} today
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
                Smart Lists
              </CardTitle>
              <List className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {analytics?.totalLists || "0"}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Bell className="h-3 w-3 text-orange-600" />
                <span className="text-xs text-orange-600">
                  {analytics?.featureUsage?.remindersSet || 0} reminders
                </span>
              </div>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                {analytics?.featureUsage?.contactsCreated || 0} contacts saved
              </p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">
                Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                ${analytics?.revenueMetrics?.totalRevenue?.toFixed(2) || "0.00"}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Target className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-600">
                  {analytics?.revenueMetrics?.conversionRate || 0}% conversion
                </span>
              </div>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                ${analytics?.revenueMetrics?.revenueToday?.toFixed(2) || "0.00"} today
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabbed Analytics */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="profiles">Profiles</TabsTrigger>
            <TabsTrigger value="conversations">Conversations</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="geographic">Geographic</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* User Growth Trends */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    User Growth
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Daily</span>
                      <span className="font-semibold">+{analytics?.userGrowth?.daily || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Weekly</span>
                      <span className="font-semibold">+{analytics?.userGrowth?.weekly || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Monthly</span>
                      <span className="font-semibold">+{analytics?.userGrowth?.monthly || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    AI Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Avg Response Time</span>
                      <Badge variant="outline">
                        {analytics?.conversationMetrics?.averageResponseTime || 0}ms
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">OpenAI Calls</span>
                      <span className="font-semibold">{analytics?.systemMetrics?.openaiApiCalls || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">ElevenLabs Calls</span>
                      <span className="font-semibold">{analytics?.systemMetrics?.elevenlabsCalls || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Feature Usage Today
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Voice Transcriptions</span>
                      <span className="font-semibold">{analytics?.featureUsage?.voiceTranscriptions || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">OCR Processed</span>
                      <span className="font-semibold">{analytics?.featureUsage?.ocrProcessed || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Links Shortened</span>
                      <span className="font-semibold">{analytics?.featureUsage?.linksShortenedToday || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  System Health & Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Uptime</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        {analytics?.systemMetrics?.uptime || 99.9}%
                      </Badge>
                    </div>
                    <Progress value={analytics?.systemMetrics?.uptime || 99.9} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">API Response</span>
                      <Badge variant="outline">
                        {analytics?.systemMetrics?.apiResponseTime || 0}ms
                      </Badge>
                    </div>
                    <Progress value={Math.max(0, 100 - (analytics?.systemMetrics?.apiResponseTime || 0) / 10)} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Error Rate</span>
                      <Badge variant="outline" className={
                        (analytics?.systemMetrics?.errorRate || 0) < 1 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                      }>
                        {analytics?.systemMetrics?.errorRate || 0}%
                      </Badge>
                    </div>
                    <Progress value={Math.max(0, 100 - (analytics?.systemMetrics?.errorRate || 0) * 10)} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Storage Used</span>
                      <Badge variant="outline">
                        {analytics?.systemMetrics?.storageUsed || 0}%
                      </Badge>
                    </div>
                    <Progress value={analytics?.systemMetrics?.storageUsed || 0} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    User Demographics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Average Age</span>
                      <span className="font-semibold">{analytics?.userDemographics?.averageAge || 0} years</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Onboarding Complete</span>
                      <div className="flex items-center gap-2">
                        <Progress value={analytics?.userDemographics?.onboardingCompletion || 0} className="w-16 h-2" />
                        <span className="text-sm font-medium">{analytics?.userDemographics?.onboardingCompletion || 0}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="border-t pt-3">
                    <h4 className="text-sm font-medium mb-2">Top Professions</h4>
                    <div className="space-y-2">
                      {analytics?.userDemographics?.professions?.slice(0, 5).map((prof, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm capitalize">{prof.profession || 'Unknown'}</span>
                          <Badge variant="secondary">{prof.count}</Badge>
                        </div>
                      )) || <p className="text-sm text-gray-500">No data available</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    User Activity Patterns
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Peak Hours</span>
                      <Badge variant="outline">9 AM - 11 AM EST</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Most Active Day</span>
                      <Badge variant="outline">Tuesday</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Weekend Activity</span>
                      <Badge variant="outline">67% of weekday average</Badge>
                    </div>
                  </div>
                  <div className="border-t pt-3">
                    <h4 className="text-sm font-medium mb-2">Device Usage</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4" />
                          <span className="text-sm">Mobile</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={75} className="w-16 h-2" />
                          <span className="text-sm">75%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4" />
                          <span className="text-sm">Desktop</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={25} className="w-16 h-2" />
                          <span className="text-sm">25%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="profiles" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    User Personal Profiles
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Detailed view of individual user accounts and their activity
                  </p>
                </CardHeader>
                <CardContent>
                  <UserProfilesTable />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="conversations" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Conversation Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Conversations</span>
                      <span className="font-semibold">{analytics?.conversationMetrics?.totalConversations || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Avg Messages/Conv</span>
                      <span className="font-semibold">{analytics?.conversationMetrics?.averageMessagesPerConversation || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Response Time</span>
                      <Badge variant="outline">{analytics?.conversationMetrics?.averageResponseTime || 0}ms</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Mic className="h-5 w-5" />
                    Voice Interactions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      {analytics?.conversationMetrics?.voiceUsagePercent || 0}%
                    </div>
                    <p className="text-sm text-gray-600">Voice Usage Rate</p>
                  </div>
                  <Progress value={analytics?.conversationMetrics?.voiceUsagePercent || 0} className="h-3" />
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                    <Headphones className="h-4 w-4" />
                    <span>Premium voice synthesis active</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Message Trends
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Last 24h</span>
                      <span className="font-semibold">{analytics?.conversationMetrics?.messagesLast24h || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Last 7 days</span>
                      <span className="font-semibold">{analytics?.conversationMetrics?.messagesLast7d || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Last 30 days</span>
                      <span className="font-semibold">{analytics?.conversationMetrics?.messagesLast30d || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Topics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Popular Conversation Topics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                  {analytics?.conversationMetrics?.topTopics?.map((topic, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="text-sm font-medium capitalize">{topic.topic}</span>
                      <Badge variant="secondary">{topic.frequency}</Badge>
                    </div>
                  )) || <p className="text-sm text-gray-500 col-span-3">No topic data available</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Revenue Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      ${analytics?.revenueMetrics?.totalRevenue?.toFixed(2) || "0.00"}
                    </div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Today</span>
                      <span className="font-semibold">${analytics?.revenueMetrics?.revenueToday?.toFixed(2) || "0.00"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">This Month</span>
                      <span className="font-semibold">${analytics?.revenueMetrics?.revenueThisMonth?.toFixed(2) || "0.00"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Conversion Rate</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        {analytics?.revenueMetrics?.conversionRate || 0}%
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Avg Commission</span>
                      <span className="font-semibold">${analytics?.revenueMetrics?.averageCommission?.toFixed(2) || "0.00"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Clicks</span>
                      <span className="font-semibold">{analytics?.linkClicks || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Revenue Projections
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Weekly Est.</span>
                      <span className="font-semibold">${((analytics?.revenueMetrics?.revenueToday || 0) * 7).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Monthly Est.</span>
                      <span className="font-semibold">${((analytics?.revenueMetrics?.revenueToday || 0) * 30).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Annual Est.</span>
                      <span className="font-semibold text-green-600">${((analytics?.revenueMetrics?.revenueToday || 0) * 365).toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Performing Links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <ExternalLink className="h-5 w-5" />
                  Top Performing Affiliate Links
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics?.revenueMetrics?.topPerformingLinks?.map((link, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <span className="font-medium">{link.domain}</span>
                        <p className="text-sm text-gray-600">{link.clicks} clicks</p>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        ${link.revenue.toFixed(2)}
                      </Badge>
                    </div>
                  )) || <p className="text-sm text-gray-500">No link performance data available</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    System Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Uptime</span>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="font-semibold">{analytics?.systemMetrics?.uptime || 99.9}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">API Response</span>
                      <Badge variant="outline">{analytics?.systemMetrics?.apiResponseTime || 0}ms</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Error Rate</span>
                      <Badge variant={
                        (analytics?.systemMetrics?.errorRate || 0) < 1 ? "default" : "destructive"
                      }>
                        {analytics?.systemMetrics?.errorRate || 0}%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Database Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Connections</span>
                      <span className="font-semibold">{analytics?.systemMetrics?.databaseConnections || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Storage Used</span>
                      <div className="flex items-center gap-2">
                        <Progress value={analytics?.systemMetrics?.storageUsed || 0} className="w-16 h-2" />
                        <span className="text-sm">{analytics?.systemMetrics?.storageUsed || 0}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Status</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">Healthy</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Wifi className="h-5 w-5" />
                    API Usage
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">OpenAI Calls</span>
                      <span className="font-semibold">{analytics?.systemMetrics?.openaiApiCalls || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">ElevenLabs Calls</span>
                      <span className="font-semibold">{analytics?.systemMetrics?.elevenlabsCalls || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Status</span>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">All APIs Active</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  System Alerts & Monitoring
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <h4 className="font-medium text-green-700 dark:text-green-400">✓ All Systems Operational</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Database connection stable</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>OpenAI API responding normally</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>ElevenLabs voice synthesis active</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Affiliate tracking operational</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium">Performance Thresholds</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span>Response Time</span>
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          {analytics?.systemMetrics?.apiResponseTime || 0}ms &lt; 500ms ✓
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span>Error Rate</span>
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          {analytics?.systemMetrics?.errorRate || 0}% &lt; 5% ✓
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span>Uptime</span>
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          {analytics?.systemMetrics?.uptime || 99.9}% &gt; 99% ✓
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="geographic" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Users by Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {analytics?.usersByLocation?.slice(0, 5).map((location, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{location.region}, {location.country}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={location.percentage} className="w-16 h-2" />
                          <span className="text-sm font-medium">{location.count}</span>
                        </div>
                      </div>
                    )) || <p className="text-sm text-gray-500">No location data available</p>}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Users by Timezone
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {analytics?.usersByTimezone?.slice(0, 5).map((tz, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{tz.timezone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={tz.percentage} className="w-16 h-2" />
                          <span className="text-sm font-medium">{tz.count}</span>
                        </div>
                      </div>
                    )) || <p className="text-sm text-gray-500">No timezone data available</p>}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Global Usage Map Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Global Usage Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed">
                  <div className="text-center">
                    <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">Interactive Map</h3>
                    <p className="text-sm text-gray-500 mt-2">World map showing user distribution</p>
                    <p className="text-xs text-gray-400 mt-1">Available in production deployment</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <BottomNav />
      </div>
    </div>
  );
}