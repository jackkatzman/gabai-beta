import { Trash2, Shield, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLocation } from "wouter";
import { useUser } from "@/context/user-context";

export default function AccountDeletionPage() {
  const [, setLocation] = useLocation();
  const { user } = useUser();

  const handleDeleteAccount = () => {
    if (!user) {
      setLocation("/login?redirect=/account-deletion");
    } else {
      setLocation("/settings");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <Trash2 className="h-8 w-8 mr-3 text-red-600" />
              Account Deletion
            </h1>
            <Button 
              variant="outline"
              onClick={() => window.history.back()}
            >
              Back
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 pb-32">
        <Alert className="mb-8 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            Account deletion is permanent and cannot be undone. All your data will be permanently removed.
          </AlertDescription>
        </Alert>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <Shield className="h-5 w-5 mr-2 text-blue-600" />
              How to Delete Your Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3 text-lg">Option 1: Delete from Mobile App</h3>
              <ol className="space-y-2 ml-4">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2 font-semibold">1.</span>
                  <span className="text-gray-700 dark:text-gray-300">Open the GabAi mobile app</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2 font-semibold">2.</span>
                  <span className="text-gray-700 dark:text-gray-300">Navigate to Settings (gear icon)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2 font-semibold">3.</span>
                  <span className="text-gray-700 dark:text-gray-300">Scroll down to "Privacy & Data" section</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2 font-semibold">4.</span>
                  <span className="text-gray-700 dark:text-gray-300">Click "Delete Account" (red button at bottom)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2 font-semibold">5.</span>
                  <span className="text-gray-700 dark:text-gray-300">Confirm deletion in the dialog</span>
                </li>
              </ol>
            </div>

            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-3 text-lg">Option 2: Delete from Web</h3>
              <div className="space-y-4">
                <p className="text-gray-700 dark:text-gray-300">
                  If you're logged in, you can delete your account directly from this page by clicking the button below.
                </p>
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={handleDeleteAccount}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {user ? "Go to Settings to Delete Account" : "Login to Delete Account"}
                </Button>
                {!user && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    You must be logged in to delete your account.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">What Gets Deleted</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              When you delete your account, the following data will be permanently removed:
            </p>
            <ul className="space-y-2">
              {[
                "All conversations and chat messages",
                "Smart lists and list items",
                "Reminders and calendar events",
                "Groups and group members",
                "Contacts and scanned information",
                "User preferences and settings",
                "Account credentials and authentication data"
              ].map((item, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-red-600 mr-2">•</span>
                  <span className="text-gray-700 dark:text-gray-300">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-8 border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-orange-600" />
              Important Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-gray-700 dark:text-gray-300">
              • Account deletion is immediate and cannot be reversed
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              • You will be logged out immediately after deletion
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              • If you have an active subscription, it will be cancelled
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              • Some data may be retained for legal compliance (30 days maximum)
            </p>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              If you're having trouble deleting your account or have questions about data deletion, 
              please contact our support team:
            </p>
            <a 
              href="mailto:support@gabaiapp.com" 
              className="text-blue-600 hover:underline flex items-center"
            >
              support@gabaiapp.com
            </a>
          </CardContent>
        </Card>

        <div className="text-center py-8">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            © 2025 GabAi. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
