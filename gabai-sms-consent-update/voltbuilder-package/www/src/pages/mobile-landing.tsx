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
  Star,
  Zap,
  Shield,
  Heart,
  ArrowRight,
  CheckCircle,
  Play
} from "lucide-react";

export function MobileLandingPage() {
  const quickFeatures = [
    { icon: Mic, title: "Voice Control", desc: "Just speak naturally" },
    { icon: ShoppingCart, title: "Smart Lists", desc: "AI organizes everything" },
    { icon: Bell, title: "Wake Up Calls", desc: "Custom AI personalities" },
    { icon: Calendar, title: "Easy Scheduling", desc: "Natural language commands" }
  ];

  const benefits = [
    "Lightning-fast voice interactions",
    "Learns your preferences",
    "Privacy-first design", 
    "Works offline"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white overflow-hidden">
      {/* Mobile App Header - Native Style */}
      <div className="pt-safe bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-white/20 rounded-full p-2">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <span className="ml-3 text-xl font-bold">GabAi</span>
          </div>
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
            Beta
          </Badge>
        </div>
      </div>

      {/* Hero Section - Mobile First */}
      <div className="px-6 py-8 text-center">
        {/* App Icon */}
        <div className="mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 w-32 h-32 mx-auto flex items-center justify-center border border-white/20">
            <Brain className="h-16 w-16 text-white" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold mb-3">
          Your AI Assistant
        </h1>
        <p className="text-lg opacity-90 mb-6 leading-relaxed">
          Voice-first AI that understands you, organizes your life, and gets smarter every day.
        </p>

        {/* Quick Benefits */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-center bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
              <CheckCircle className="h-4 w-4 text-green-300 mr-2 flex-shrink-0" />
              <span className="text-sm font-medium">{benefit}</span>
            </div>
          ))}
        </div>

        {/* Main CTA Button */}
        <Button 
          size="lg" 
          className="w-full bg-white text-blue-600 hover:bg-gray-100 font-semibold py-4 rounded-2xl mb-3 text-lg shadow-lg"
          onClick={() => window.location.href = "/api/login"}
        >
          <Play className="h-5 w-5 mr-2" />
          Sign in with Google
        </Button>

        {/* SMS Authentication Option */}
        <Button 
          size="lg" 
          variant="outline"
          className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20 font-semibold py-4 rounded-2xl mb-4 text-lg shadow-lg backdrop-blur-sm"
          onClick={() => window.location.href = "/phone-verification"}
        >
          <Smartphone className="h-5 w-5 mr-2" />
          Sign in with Phone
        </Button>

        {/* Pricing */}
        <p className="text-sm opacity-75 mb-8">
          7-day free trial • Then $14.95/month • Cancel anytime
        </p>
      </div>

      {/* Features Preview */}
      <div className="px-6 pb-8">
        <h3 className="text-xl font-bold mb-4 text-center">What You Get</h3>
        <div className="grid grid-cols-2 gap-4">
          {quickFeatures.map((feature, index) => (
            <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="bg-white/20 rounded-full w-12 h-12 flex items-center justify-center mb-3">
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-semibold mb-1">{feature.title}</h4>
              <p className="text-sm opacity-80">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Action Bar - Native Style */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 p-4 safe-area-bottom">
        <div className="flex flex-col space-y-3">
          <Button 
            size="lg" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-2xl text-lg shadow-lg mb-2"
            onClick={() => window.location.href = "/api/login"}
          >
            <ArrowRight className="h-5 w-5 mr-2" />
            Sign in with Google
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20 font-semibold py-4 rounded-2xl text-lg shadow-lg"
            onClick={() => window.location.href = "/phone-verification"}
          >
            <Smartphone className="h-5 w-5 mr-2" />
            Sign in with Phone
          </Button>
          <p className="text-center text-xs text-gray-500">
            Trusted by thousands • Rated 4.8/5 stars
          </p>
        </div>
      </div>

      {/* Bottom Padding for Fixed Bar */}
      <div className="h-24"></div>
    </div>
  );
}