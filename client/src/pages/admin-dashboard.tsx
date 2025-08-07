import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  MessageSquare, 
  List, 
  ExternalLink, 
  TrendingUp, 
  DollarSign,
  Calendar,
  Eye,
  BarChart3
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface DashboardStats {
  totalUsers: number;
  totalConversations: number;
  totalMessages: number;
  totalLists: number;
  totalListItems: number;
  totalReminders: number;
  totalContacts: number;
  linkStats: {
    totalLinks: number;
    totalClicks: number;
    topDomains: Array<{ domain: string; clicks: number }>;
  };
  userActivity: Array<{
    date: string;
    newUsers: number;
    activeUsers: number;
    messages: number;
  }>;
  recentUsers: Array<{
    id: string;
    name: string;
    email: string;
    createdAt: string;
    lastActive: string;
    messageCount: number;
  }>;
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              GabAi Admin Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Monitor users, analytics, and revenue performance
            </p>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Live Data
          </Badge>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">
                Registered users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversations</CardTitle>
              <MessageSquare className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalConversations || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.totalMessages || 0} total messages
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Smart Lists</CardTitle>
              <List className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalLists || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.totalListItems || 0} total items
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Link Clicks</CardTitle>
              <ExternalLink className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.linkStats?.totalClicks || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.linkStats?.totalLinks || 0} short links created
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Recent User Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Users</CardTitle>
                  <CardDescription>Latest user registrations and activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats?.recentUsers?.slice(0, 5).map((user) => (
                      <div key={user.id} className="flex items-center justify-between border-b pb-2">
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{user.messageCount} messages</div>
                          <div className="text-xs text-muted-foreground">
                            Last active: {new Date(user.lastActive).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    )) || <div className="text-muted-foreground">No users yet</div>}
                  </div>
                </CardContent>
              </Card>

              {/* Top Affiliate Domains */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Affiliate Domains</CardTitle>
                  <CardDescription>Most clicked affiliate links</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats?.linkStats?.topDomains?.map((domain, index) => (
                      <div key={domain.domain} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </div>
                          <span className="font-medium">{domain.domain}</span>
                        </div>
                        <Badge variant="outline">{domain.clicks} clicks</Badge>
                      </div>
                    )) || <div className="text-muted-foreground">No affiliate clicks yet</div>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Detailed user information and activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Name</th>
                        <th className="text-left p-2">Email</th>
                        <th className="text-left p-2">Joined</th>
                        <th className="text-left p-2">Messages</th>
                        <th className="text-left p-2">Lists</th>
                        <th className="text-left p-2">Last Active</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats?.recentUsers?.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="p-2 font-medium">{user.name}</td>
                          <td className="p-2 text-muted-foreground">{user.email}</td>
                          <td className="p-2">{new Date(user.createdAt).toLocaleDateString()}</td>
                          <td className="p-2">{user.messageCount}</td>
                          <td className="p-2">-</td>
                          <td className="p-2">{new Date(user.lastActive).toLocaleDateString()}</td>
                        </tr>
                      )) || (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-muted-foreground">
                            No users to display
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Estimated Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${((stats?.linkStats?.totalClicks || 0) * 2.5).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Based on $2.50 avg per click
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Click-Through Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.linkStats?.totalLinks ? 
                      ((stats.linkStats.totalClicks / stats.linkStats.totalLinks) * 100).toFixed(1) : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Clicks per link created
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.totalMessages ? 
                      ((stats.linkStats?.totalClicks || 0) / stats.totalMessages * 100).toFixed(1) : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Links clicked per message
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Analytics</CardTitle>
                <CardDescription>Performance metrics and usage patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Feature Usage</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Voice Messages:</span>
                        <span className="font-medium">{stats?.totalMessages || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Smart Lists:</span>
                        <span className="font-medium">{stats?.totalLists || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Reminders:</span>
                        <span className="font-medium">{stats?.totalReminders || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Contacts:</span>
                        <span className="font-medium">{stats?.totalContacts || 0}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold">Revenue Tracking</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Total Links:</span>
                        <span className="font-medium">{stats?.linkStats?.totalLinks || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Clicks:</span>
                        <span className="font-medium">{stats?.linkStats?.totalClicks || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Est. Revenue:</span>
                        <span className="font-medium text-green-600">
                          ${((stats?.linkStats?.totalClicks || 0) * 2.5).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}