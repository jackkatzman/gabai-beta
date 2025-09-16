import { Shield, Lock, Eye, Database, UserCheck, Globe, Mail, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
  const sections = [
    {
      icon: Shield,
      title: "Information We Collect",
      content: [
        "Profile information (name, phone number, email when provided)",
        "Voice recordings and transcriptions for AI interactions",
        "Calendar events, reminders, and lists you create",
        "Contact information you add or scan",
        "Usage data to improve personalization"
      ]
    },
    {
      icon: Lock,
      title: "How We Protect Your Data",
      content: [
        "End-to-end encryption for sensitive data",
        "Secure authentication via SMS verification or Google OAuth",
        "Regular security audits and updates",
        "Minimal data retention policies",
        "No sharing with third parties for advertising"
      ]
    },
    {
      icon: Eye,
      title: "How We Use Your Information",
      content: [
        "Provide personalized AI assistant services",
        "Process voice commands and generate responses",
        "Send reminders and notifications you request",
        "Improve app functionality and user experience",
        "Comply with legal requirements"
      ]
    },
    {
      icon: Database,
      title: "Data Storage & Retention",
      content: [
        "Data stored on secure cloud servers",
        "Voice recordings deleted after processing",
        "Account data retained while account is active",
        "You can request data deletion at any time",
        "Automatic data purging for inactive accounts after 1 year"
      ]
    },
    {
      icon: UserCheck,
      title: "Your Rights & Choices",
      content: [
        "Access your personal data anytime",
        "Request data correction or deletion",
        "Opt-out of non-essential data collection",
        "Export your data in standard formats",
        "Close your account and delete all data"
      ]
    },
    {
      icon: Globe,
      title: "Third-Party Services",
      content: [
        "OpenAI for AI language processing",
        "Google OAuth for authentication (optional)",
        "Twilio for SMS verification",
        "All partners comply with strict privacy standards",
        "No data sold to advertisers or data brokers"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <Shield className="h-8 w-8 mr-3 text-blue-600" />
              Privacy Policy
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

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Last Updated */}
        <div className="mb-8 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Last Updated: January 2025
          </p>
        </div>

        {/* Introduction */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              At GabAi, we take your privacy seriously. This Privacy Policy explains how we collect, 
              use, and protect your personal information when you use our AI personal assistant app. 
              We believe in transparency and giving you control over your data.
            </p>
          </CardContent>
        </Card>

        {/* Main Sections */}
        {sections.map((section, index) => {
          const Icon = section.icon;
          return (
            <Card key={index} className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Icon className="h-5 w-5 mr-2 text-blue-600" />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {section.content.map((item, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      <span className="text-gray-700 dark:text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}

        {/* Contact Section */}
        <Card className="mb-8 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <Mail className="h-5 w-5 mr-2 text-blue-600" />
              Questions or Concerns?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              If you have any questions about this Privacy Policy or how we handle your data, 
              please don't hesitate to contact us:
            </p>
            <div className="space-y-2">
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-blue-600" />
                <a href="mailto:privacy@gabaiapp.com" className="text-blue-600 hover:underline">
                  privacy@gabaiapp.com
                </a>
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-blue-600" />
                <span className="text-gray-700 dark:text-gray-300">1-800-GABAI-AI</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CCPA/GDPR Notice */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">California & European Residents</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              If you are a California resident, you have specific rights under the California Consumer 
              Privacy Act (CCPA). European residents have rights under the General Data Protection 
              Regulation (GDPR). These include the right to access, delete, and opt-out of the sale 
              of your personal information. We do not sell personal information to third parties.
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            © 2025 Booah LLC. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}