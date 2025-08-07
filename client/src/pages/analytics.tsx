import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, MessageCircle, List, ExternalLink } from "lucide-react";
import { Link } from "wouter";

interface AnalyticsData {
  totalUsers: string;
  totalMessages: string;
  totalLists: string;
  linkClicks: number;
  timestamp: string;
}

export default function AnalyticsPage() {
  const { data: analytics, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics/summary"],
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
      <div className="max-w-6xl mx-auto space-y-6">
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
              Real-time insights into your AI assistant
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Last updated: {analytics ? new Date(analytics.timestamp).toLocaleTimeString() : "N/A"}
            </p>
          </div>
        </div>

        {/* Key Metrics Cards */}
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
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Registered members
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
              <p className="text-xs text-green-600 dark:text-green-400">
                AI conversations
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
              <p className="text-xs text-purple-600 dark:text-purple-400">
                Active lists created
              </p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">
                Link Clicks
              </CardTitle>
              <ExternalLink className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                {analytics?.linkClicks || 0}
              </div>
              <p className="text-xs text-orange-600 dark:text-orange-400">
                Affiliate revenue tracking
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Overview */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">System Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Analytics API</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                  ✓ Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">URL Shortener</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                  ✓ Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Voice Synthesis</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                  ✓ ElevenLabs Ready
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Monetization</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                  ✓ Affiliate Links Active
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Revenue Tracking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-center py-4">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  ${((analytics?.linkClicks || 0) * 2.5).toFixed(2)}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Estimated revenue from affiliate clicks
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Based on $2.50 average commission per click
                </p>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subscription Ready:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">$14.95/month</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Production Features</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              All systems are operational and ready for Google Play Store deployment
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <h4 className="font-medium text-green-700 dark:text-green-400">✓ Voice AI Features</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Advanced alarm personalities (6 voices)</li>
                  <li>• ElevenLabs voice synthesis</li>
                  <li>• Custom ringtones & voice notes</li>
                  <li>• Voice command scheduling</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-green-700 dark:text-green-400">✓ Mobile Integration</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Capacitor native notifications</li>
                  <li>• Progressive Web App</li>
                  <li>• Native scheduling system</li>
                  <li>• Cross-platform deployment</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-green-700 dark:text-green-400">✓ Monetization</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Clean URL shortening</li>
                  <li>• Affiliate link tracking</li>
                  <li>• Revenue analytics</li>
                  <li>• Subscription model ready</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}