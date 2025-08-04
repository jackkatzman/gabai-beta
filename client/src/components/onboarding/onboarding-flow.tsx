import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Mic, X, ArrowLeft, ArrowRight } from "lucide-react";
import type { OnboardingData } from "@/types";

interface OnboardingFlowProps {
  onComplete: (data: OnboardingData) => void;
  onClose: () => void;
}

const TOTAL_STEPS = 6;

export function OnboardingFlow({ onComplete, onClose }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    name: "",
    age: undefined,
    location: "",
    profession: "",
    religious: "",
    dietary: [],
    sleepSchedule: { bedtime: "", wakeup: "" },
    communicationStyle: "",
    interests: [],
    familyDetails: "",
  });

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete(data);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const progress = (currentStep / TOTAL_STEPS) * 100;

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col">
      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Step {currentStep} of {TOTAL_STEPS}
          </span>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {currentStep === 1 && (
          <WelcomeStep onNext={nextStep} />
        )}
        
        {currentStep === 2 && (
          <BasicInfoStep
            data={data}
            updateData={updateData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        )}
        
        {currentStep === 3 && (
          <PreferencesStep
            data={data}
            updateData={updateData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        )}
        
        {currentStep === 4 && (
          <LifestyleStep
            data={data}
            updateData={updateData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        )}
        
        {currentStep === 5 && (
          <InterestsStep
            data={data}
            updateData={updateData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        )}
        
        {currentStep === 6 && (
          <FinalStep
            data={data}
            updateData={updateData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        )}
      </div>
    </div>
  );
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <Mic className="h-12 w-12 text-white" />
      </div>
      
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
        Welcome to GabAi
      </h1>
      
      <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-8 max-w-md">
        Your personal voice assistant that learns about you to provide better, more personalized help.
      </p>

      <div className="space-y-4 mb-8 text-left">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <span className="text-green-600 dark:text-green-400 text-sm">🧠</span>
          </div>
          <span className="text-gray-700 dark:text-gray-300">Smart conversations that remember your preferences</span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <span className="text-green-600 dark:text-green-400 text-sm">📝</span>
          </div>
          <span className="text-gray-700 dark:text-gray-300">Personalized shopping lists and reminders</span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <span className="text-green-600 dark:text-green-400 text-sm">📅</span>
          </div>
          <span className="text-gray-700 dark:text-gray-300">Calendar integration and smart scheduling</span>
        </div>
      </div>

      <Button onClick={onNext} className="w-full max-w-sm">
        Let's Get Started
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

function BasicInfoStep({ data, updateData, onNext, onPrev }: {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Tell me about yourself
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          This helps me personalize our conversations
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="name">What should I call you? *</Label>
          <Input
            id="name"
            value={data.name}
            onChange={(e) => updateData({ name: e.target.value })}
            placeholder="Your name"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="age">Age (optional)</Label>
          <Input
            id="age"
            type="number"
            value={data.age || ""}
            onChange={(e) => updateData({ age: e.target.value ? parseInt(e.target.value) : undefined })}
            placeholder="25"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={data.location}
            onChange={(e) => updateData({ location: e.target.value })}
            placeholder="City, Country"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="profession">Profession (optional)</Label>
          <Input
            id="profession"
            value={data.profession}
            onChange={(e) => updateData({ profession: e.target.value })}
            placeholder="Software Engineer"
            className="mt-1"
          />
        </div>
      </div>

      <div className="flex space-x-4 pt-4">
        <Button variant="outline" onClick={onPrev} className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button 
          onClick={onNext} 
          className="flex-1"
          disabled={!data.name.trim()}
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function PreferencesStep({ data, updateData, onNext, onPrev }: {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const dietaryOptions = [
    "Vegetarian", "Vegan", "Gluten-free", "Dairy-free", "Keto", 
    "Paleo", "Halal", "Kosher", "Nut-free", "Low-sodium"
  ];

  const toggleDietary = (option: string) => {
    const current = data.dietary || [];
    const updated = current.includes(option)
      ? current.filter(item => item !== option)
      : [...current, option];
    updateData({ dietary: updated });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Dietary & Religious Preferences
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Help me suggest appropriate options for you
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="religious">Religious beliefs (optional)</Label>
          <Input
            id="religious"
            value={data.religious}
            onChange={(e) => updateData({ religious: e.target.value })}
            placeholder="e.g., Christian, Muslim, Jewish, Hindu, Buddhist, etc."
            className="mt-1"
          />
        </div>

        <div>
          <Label>Dietary restrictions (select all that apply)</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {dietaryOptions.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={option}
                  checked={data.dietary?.includes(option) || false}
                  onCheckedChange={() => toggleDietary(option)}
                />
                <Label htmlFor={option} className="text-sm">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex space-x-4 pt-4">
        <Button variant="outline" onClick={onPrev} className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={onNext} className="flex-1">
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function LifestyleStep({ data, updateData, onNext, onPrev }: {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const commStyles = [
    "Casual and friendly",
    "Professional and formal",
    "Direct and to-the-point",
    "Supportive and encouraging",
    "Humorous and lighthearted"
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Lifestyle & Communication
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Help me adapt to your daily routine and communication style
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Sleep Schedule (optional)</Label>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div>
              <Label htmlFor="bedtime" className="text-sm">Bedtime</Label>
              <Input
                id="bedtime"
                type="time"
                value={data.sleepSchedule?.bedtime || ""}
                onChange={(e) => updateData({ 
                  sleepSchedule: { 
                    bedtime: e.target.value,
                    wakeup: data.sleepSchedule?.wakeup || ""
                  } 
                })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="wakeup" className="text-sm">Wake up</Label>
              <Input
                id="wakeup"
                type="time"
                value={data.sleepSchedule?.wakeup || ""}
                onChange={(e) => updateData({ 
                  sleepSchedule: { 
                    bedtime: data.sleepSchedule?.bedtime || "",
                    wakeup: e.target.value 
                  } 
                })}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <div>
          <Label>How would you like me to communicate with you?</Label>
          <div className="space-y-2 mt-2">
            {commStyles.map((style) => (
              <div key={style} className="flex items-center space-x-2">
                <Checkbox
                  id={style}
                  checked={data.communicationStyle === style}
                  onCheckedChange={(checked) => 
                    checked && updateData({ communicationStyle: style })
                  }
                />
                <Label htmlFor={style} className="text-sm">
                  {style}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex space-x-4 pt-4">
        <Button variant="outline" onClick={onPrev} className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={onNext} className="flex-1">
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function InterestsStep({ data, updateData, onNext, onPrev }: {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const interestOptions = [
    "Technology", "Sports", "Cooking", "Travel", "Music", "Movies",
    "Reading", "Gaming", "Fitness", "Art", "Photography", "Gardening",
    "Fashion", "Finance", "Health", "Science", "Politics", "History"
  ];

  const toggleInterest = (interest: string) => {
    const current = data.interests || [];
    const updated = current.includes(interest)
      ? current.filter(item => item !== interest)
      : [...current, interest];
    updateData({ interests: updated });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Interests & Hobbies
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          What topics interest you most?
        </p>
      </div>

      <div>
        <Label>Select your interests (choose as many as you like)</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {interestOptions.map((interest) => (
            <div key={interest} className="flex items-center space-x-2">
              <Checkbox
                id={interest}
                checked={data.interests?.includes(interest) || false}
                onCheckedChange={() => toggleInterest(interest)}
              />
              <Label htmlFor={interest} className="text-sm">
                {interest}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex space-x-4 pt-4">
        <Button variant="outline" onClick={onPrev} className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={onNext} className="flex-1">
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function FinalStep({ data, updateData, onNext, onPrev }: {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Almost done!
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Any additional details about your family or personal life?
        </p>
      </div>

      <div>
        <Label htmlFor="family">Family & Personal Details (optional)</Label>
        <Textarea
          id="family"
          value={data.familyDetails}
          onChange={(e) => updateData({ familyDetails: e.target.value })}
          placeholder="e.g., Married with 2 kids, living with parents, pet owner, etc."
          className="mt-1 min-h-[100px]"
        />
      </div>

      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Your Profile Summary
          </h3>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p><strong>Name:</strong> {data.name}</p>
            {data.age && <p><strong>Age:</strong> {data.age}</p>}
            {data.location && <p><strong>Location:</strong> {data.location}</p>}
            {data.profession && <p><strong>Profession:</strong> {data.profession}</p>}
            {data.religious && <p><strong>Religious:</strong> {data.religious}</p>}
            {data.dietary && data.dietary.length > 0 && (
              <p><strong>Dietary:</strong> {data.dietary.join(", ")}</p>
            )}
            {data.communicationStyle && (
              <p><strong>Communication:</strong> {data.communicationStyle}</p>
            )}
            {data.interests && data.interests.length > 0 && (
              <p><strong>Interests:</strong> {data.interests.join(", ")}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex space-x-4 pt-4">
        <Button variant="outline" onClick={onPrev} className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={onNext} className="flex-1">
          Complete Setup
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
