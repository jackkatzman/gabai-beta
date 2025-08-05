import { NotificationSettings } from "@/components/settings/notification-settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Settings as SettingsIcon, User, Bell } from "lucide-react";
import { Link } from "wouter";
import type { User as UserType } from "@shared/schema";

interface SettingsPageProps {
  user: UserType;
}

export function SettingsPage({ user }: SettingsPageProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Chat
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <SettingsIcon className="h-6 w-6" />
              Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Customize your GabAi experience
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* User Profile Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium">{user.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {user.email || "No email set"}
                  </p>
                  {user.location && (
                    <p className="text-sm text-gray-500">{user.location}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <NotificationSettings user={user} />

          {/* Additional Settings Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>More Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Additional settings and preferences will be available here in future updates.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}