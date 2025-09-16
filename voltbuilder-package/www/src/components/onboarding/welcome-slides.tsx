import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Mic, Brain, Calendar, ShoppingCart, Camera, MessageSquare, CheckCircle, Star } from "lucide-react";

interface WelcomeSlidesProps {
  onComplete: () => void;
}

const slides = [
  {
    id: 1,
    title: "Welcome to GabAi",
    subtitle: "Your Intelligent Personal Assistant",
    content: "GabAi is a voice-first AI assistant that learns your preferences and helps manage your daily life through smart conversations.",
    icon: <Brain className="w-16 h-16 text-blue-500" />,
    features: ["Voice & Text Interaction", "Personalized AI Responses", "Cross-Device Sync"]
  },
  {
    id: 2,
    title: "Smart Lists That Think",
    subtitle: "Beyond Simple To-Do Lists",
    content: "Create intelligent lists that automatically categorize items, suggest quantities, and adapt to your lifestyle and profession.",
    icon: <ShoppingCart className="w-16 h-16 text-green-500" />,
    features: ["Auto-Categorization", "Smart Suggestions", "Collaborative Sharing", "Professional Templates"]
  },
  {
    id: 3,
    title: "Voice-Powered Everything",
    subtitle: "Hands-Free Convenience",
    content: "Talk naturally to create reminders, add items to lists, schedule appointments, and get personalized responses.",
    icon: <Mic className="w-16 h-16 text-purple-500" />,
    features: ["Speech Recognition", "Natural Conversations", "Voice Reminders", "Multilingual Support"]
  },
  {
    id: 4,
    title: "Calendar & Reminders",
    subtitle: "Never Miss What Matters",
    content: "Seamlessly schedule appointments, set smart reminders, and sync with your device calendar for perfect time management.",
    icon: <Calendar className="w-16 h-16 text-orange-500" />,
    features: ["Device Calendar Sync", "Smart Scheduling", "Recurring Reminders", "Timezone Accuracy"]
  },
  {
    id: 5,
    title: "OCR & Document Scanning",
    subtitle: "Digitize Your World",
    content: "Scan business cards, receipts, and handwritten notes. Automatically extract text and create contacts or list items.",
    icon: <Camera className="w-16 h-16 text-teal-500" />,
    features: ["Business Card Scanning", "Text Extraction", "Auto Contact Creation", "Receipt Processing"]
  },
  {
    id: 6,
    title: "Why Personalization Matters",
    subtitle: "The Power of Tailored AI",
    content: "The more GabAi knows about your preferences, profession, and lifestyle, the more helpful and accurate it becomes.",
    icon: <Star className="w-16 h-16 text-yellow-500" />,
    features: ["Profession-Based Lists", "Dietary Preferences", "Communication Style", "Interest-Based Suggestions"]
  },
  {
    id: 7,
    title: "Ready to Get Started?",
    subtitle: "Complete Setup in 2 Minutes",
    content: "The next step will help GabAi learn about you so it can provide the most personalized and helpful experience.",
    icon: <CheckCircle className="w-16 h-16 text-green-600" />,
    features: ["Quick Setup Process", "Immediate Value", "Always Improving", "Your Data, Your Control"]
  }
];

export function WelcomeSlides({ onComplete }: WelcomeSlidesProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const slide = slides[currentSlide];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-2xl">
          <CardContent className="p-8 md:p-12">
            {/* Progress Indicators */}
            <div className="flex justify-center mb-8">
              <div className="flex space-x-2">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentSlide
                        ? 'bg-blue-500 w-8'
                        : index < currentSlide
                        ? 'bg-green-500'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Slide Content */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                {slide.icon}
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {slide.title}
              </h1>
              
              <h2 className="text-xl md:text-2xl text-blue-600 dark:text-blue-400 font-semibold mb-4">
                {slide.subtitle}
              </h2>
              
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed mb-8">
                {slide.content}
              </p>

              {/* Feature Highlights */}
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                {slide.features.map((feature, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="px-4 py-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-sm font-medium"
                  >
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <Button
                onClick={prevSlide}
                variant="outline"
                disabled={currentSlide === 0}
                className="flex items-center gap-2"
                data-testid="button-previous-slide"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              <div className="flex items-center gap-4">
                {currentSlide < slides.length - 1 && (
                  <Button
                    onClick={onComplete}
                    variant="ghost"
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    data-testid="button-skip-intro"
                  >
                    Skip Intro
                  </Button>
                )}
                
                <Button
                  onClick={nextSlide}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6"
                  data-testid={currentSlide === slides.length - 1 ? "button-start-setup" : "button-next-slide"}
                >
                  {currentSlide === slides.length - 1 ? "Start Setup" : "Next"}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Slide Counter */}
            <div className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400">
              {currentSlide + 1} of {slides.length}
            </div>
          </CardContent>
        </Card>

        {/* Bottom Hint */}
        {currentSlide === slides.length - 1 && (
          <div className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
            <MessageSquare className="w-4 h-4 inline mr-2" />
            The setup takes about 2 minutes and dramatically improves your GabAi experience
          </div>
        )}
      </div>
    </div>
  );
}