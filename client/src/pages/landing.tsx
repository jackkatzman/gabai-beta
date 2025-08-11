import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Brain, 
  Smartphone, 
  Calendar, 
  ShoppingCart, 
  Mic, 
  Users, 
  FileText,
  Bell,
  Download,
  Play,
  Apple,
  Globe,
  Star,
  Zap,
  Shield,
  Heart
} from "lucide-react";

export function LandingPage() {
  const features = [
    {
      icon: MessageSquare,
      title: "Voice-First AI Assistant",
      description: "Natural conversations with advanced AI that understands context and learns your preferences"
    },
    {
      icon: Bell,
      title: "Smart Alarms & Scheduling",
      description: "AI-powered wake-up calls with custom voices - drill sergeant, gentle, or funny personalities"
    },
    {
      icon: ShoppingCart,
      title: "Intelligent Lists",
      description: "Smart shopping lists, to-dos, and punch lists that organize themselves by category"
    },
    {
      icon: Calendar,
      title: "Calendar Integration", 
      description: "Seamless scheduling with natural language commands and timezone accuracy"
    },
    {
      icon: Users,
      title: "Contact Management",
      description: "OCR business card scanning and smart contact organization"
    },
    {
      icon: FileText,
      title: "Text Scanner",
      description: "AI-powered OCR to digitize handwritten notes, receipts, and documents"
    }
  ];

  const benefits = [
    { icon: Zap, text: "Lightning-fast voice interactions" },
    { icon: Brain, text: "Learns your preferences over time" },
    { icon: Shield, text: "Privacy-first design" },
    { icon: Smartphone, text: "Native mobile experience" },
    { icon: Heart, text: "Personalized AI personalities" },
    { icon: Globe, text: "Works anywhere, anytime" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            {/* Logo/Brand */}
            <div className="flex items-center justify-center mb-8">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-full p-4">
                <Brain className="h-12 w-12 text-white" />
              </div>
              <div className="ml-4">
                <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  GabAi
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300">Your Voice-First AI Assistant</p>
              </div>
            </div>

            {/* DOMAIN CONNECTION NOTICE */}
            <div className="bg-green-500 text-white p-8 rounded-lg mb-8 shadow-lg">
              <h2 className="text-3xl font-bold mb-4">✅ DEPLOYMENT CONFIRMED WORKING!</h2>
              <p className="text-xl">Deployment is live at: gabai-beta-jack741.replit.app</p>
              <p className="text-lg mt-2">Next step: Connect gabai.ai domain to this deployment</p>
            </div>

            {/* Main Headline */}
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              The AI Assistant That
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Actually Understands You
              </span>
            </h2>

            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Experience the future of personal assistance with voice-first AI that learns your preferences, 
              manages your life, and grows smarter with every interaction.
            </p>

            {/* Pricing Badge */}
            <div className="flex items-center justify-center mb-8">
              <Badge variant="secondary" className="text-lg px-6 py-2 bg-gradient-to-r from-green-100 to-blue-100 text-green-800 dark:from-green-900/30 dark:to-blue-900/30 dark:text-green-300">
                <Star className="h-4 w-4 mr-2" />
                $14.95/month • 7-day free trial
              </Badge>
            </div>

            {/* Download Buttons */}
            <div className="flex flex-col lg:flex-row items-center justify-center gap-4 mb-8">
              {/* App Store */}
              <Button 
                size="lg" 
                className="bg-black hover:bg-gray-800 text-white px-8 py-6 rounded-xl flex items-center space-x-3 min-w-[200px]"
                onClick={() => window.open('#', '_blank')}
              >
                <Apple className="h-6 w-6" />
                <div className="text-left">
                  <div className="text-xs">Download on the</div>
                  <div className="text-lg font-semibold">App Store</div>
                </div>
              </Button>

              {/* Google Play */}
              <Button 
                size="lg" 
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 rounded-xl flex items-center space-x-3 min-w-[200px]"
                onClick={() => window.open('#', '_blank')}
              >
                <Play className="h-6 w-6" />
                <div className="text-left">
                  <div className="text-xs">Get it on</div>
                  <div className="text-lg font-semibold">Google Play</div>
                </div>
              </Button>

              {/* Direct Access */}
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-8 py-6 rounded-xl flex items-center space-x-3 min-w-[200px]"
                onClick={() => window.location.href = "/api/auth/google"}
              >
                <Globe className="h-6 w-6" />
                <div className="text-left">
                  <div className="text-xs">Try now</div>
                  <div className="text-lg font-semibold">Web App</div>
                </div>
              </Button>
            </div>

            {/* Beta APK Download */}
            <div className="flex items-center justify-center mb-12">
              <div className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-700 rounded-xl p-8 max-w-lg">
                <div className="text-center">
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300 mb-4 text-sm px-3 py-1">
                    🧪 Beta Testing Program
                  </Badge>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    Get Early Access
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                    Help shape GabAi's future! Test cutting-edge features, provide feedback, 
                    and get the latest updates before anyone else.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
                    <Button 
                      size="lg" 
                      className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2"
                      onClick={() => window.open('https://github.com/jackkatzman/gabai-beta/releases/latest/download/gabai-final.apk', '_blank')}
                    >
                      <Download className="h-5 w-5" />
                      <span>Download Beta APK</span>
                    </Button>
                    
                    <Button 
                      size="lg" 
                      variant="outline"
                      className="border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-600 dark:text-orange-400 px-6 py-3 rounded-lg flex items-center space-x-2"
                      onClick={() => window.open('/downloads/README-BETA.md', '_blank')}
                    >
                      <FileText className="h-5 w-5" />
                      <span>Beta Guide</span>
                    </Button>
                  </div>
                  
                  <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <p>✓ Android 7.0+ required</p>
                    <p>✓ Version 1.0.0-beta.1 • Released Aug 8, 2025</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Benefits Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-16">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex flex-col items-center text-center">
                  <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-3 mb-2">
                    <benefit.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need in One AI Assistant
            </h3>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              From voice-controlled scheduling to intelligent list management, 
              GabAi handles your daily tasks so you can focus on what matters most.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardContent className="p-8">
                  <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    {feature.title}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Daily Routine?
          </h3>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of users who've revolutionized their productivity with GabAi's 
            voice-first AI assistant. Start your 7-day free trial today.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-xl"
              onClick={() => window.location.href = "/api/auth/google"}
            >
              <Download className="h-5 w-5 mr-2" />
              Start Free Trial
            </Button>
            <p className="text-blue-100 text-sm">
              No credit card required • Cancel anytime
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <Brain className="h-8 w-8 text-blue-400 mr-3" />
              <span className="text-2xl font-bold">GabAi</span>
            </div>
            <div className="text-gray-400">
              © 2025 GabAi. Revolutionizing personal assistance with AI.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}