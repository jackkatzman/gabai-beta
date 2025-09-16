import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Check, X, Shield, FileText, Users, MessageSquare } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

export function SMSCompliancePage() {
  const [phoneNumber, setPhoneNumber] = useState("+17326101200");
  const [consent, setConsent] = useState(false);
  const [showError, setShowError] = useState(false);

  const handleSubmit = () => {
    if (!consent) {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">SMS Compliance Documentation</h1>
            <p className="text-gray-600">GabAI Personal Assistant - Toll-Free SMS Verification</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        
        {/* Application Overview */}
        <Card className="p-6 bg-white">
          <div className="flex items-start gap-3 mb-4">
            <Shield className="h-6 w-6 text-blue-600 mt-1" />
            <div>
              <h2 className="text-xl font-semibold mb-2">Application Details</h2>
              <div className="space-y-2 text-gray-700">
                <p><strong>Service:</strong> GabAI - Voice-First Personal Assistant</p>
                <p><strong>Website:</strong> https://gabai.ai</p>
                <p><strong>Purpose:</strong> Personal reminder service for medications, appointments, and daily tasks</p>
                <p><strong>Owner:</strong> Booah LLC</p>
                <p><strong>Phone Number:</strong> +18888800291 (Toll-Free)</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Live Consent Demo */}
        <Card className="p-6 bg-white">
          <div className="flex items-start gap-3 mb-4">
            <MessageSquare className="h-6 w-6 text-green-600 mt-1" />
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-4">Live Opt-In Demonstration</h2>
              
              {/* Demo Form */}
              <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="font-medium mb-3">New SMS Reminder</h3>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="reminder">What to remember?</Label>
                    <Input 
                      id="reminder"
                      value="Take medication" 
                      readOnly
                      className="bg-white"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="bg-white"
                    />
                  </div>
                  
                  <div className="border-2 border-blue-500 rounded-lg p-3 bg-blue-50">
                    <div className="flex items-start space-x-2">
                      <Checkbox 
                        id="sms-consent"
                        checked={consent}
                        onCheckedChange={(checked) => setConsent(checked as boolean)}
                        className="mt-0.5"
                      />
                      <Label 
                        htmlFor="sms-consent" 
                        className="text-sm font-normal cursor-pointer leading-relaxed"
                      >
                        <strong>I consent to receive automated SMS text message reminders at this number from GabAI.</strong> Message frequency varies based on reminders I create. Message & data rates may apply. Reply STOP to unsubscribe at any time. View our privacy policy at gabai.ai/privacy.
                      </Label>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleSubmit}
                    className="w-full"
                    variant={consent ? "default" : "outline"}
                  >
                    Set SMS Reminder
                  </Button>
                  
                  {showError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                      <div className="flex items-center gap-2">
                        <X className="h-4 w-4" />
                        <span className="font-medium">Consent Required</span>
                      </div>
                      <p className="text-sm mt-1">You must agree to receive SMS messages before setting a reminder.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Opt-In Process */}
        <Card className="p-6 bg-white">
          <div className="flex items-start gap-3 mb-4">
            <FileText className="h-6 w-6 text-purple-600 mt-1" />
            <div>
              <h2 className="text-xl font-semibold mb-4">User Consent Process</h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-green-100 rounded-full p-1">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">1. Explicit Opt-In Required</h3>
                    <p className="text-gray-600 text-sm">Users must actively check the consent checkbox. It is never pre-checked or assumed.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-green-100 rounded-full p-1">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">2. Clear Disclosure</h3>
                    <p className="text-gray-600 text-sm">Consent text clearly states: automated messages, message frequency, data rates may apply, and STOP to unsubscribe.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-green-100 rounded-full p-1">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">3. Error Prevention</h3>
                    <p className="text-gray-600 text-sm">System prevents reminder creation without consent. Error message clearly explains the requirement.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-green-100 rounded-full p-1">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">4. User Control</h3>
                    <p className="text-gray-600 text-sm">Users can delete reminders anytime from the app. Every SMS includes "Reply STOP to unsubscribe".</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Message Examples */}
        <Card className="p-6 bg-white">
          <div className="flex items-start gap-3 mb-4">
            <Users className="h-6 w-6 text-orange-600 mt-1" />
            <div>
              <h2 className="text-xl font-semibold mb-4">Sample Messages</h2>
              
              <div className="space-y-3">
                <div className="bg-gray-100 rounded-lg p-3">
                  <p className="text-sm font-mono">
                    <strong>SMS Example:</strong><br/>
                    "GabAI Reminder: Take medication. Reply STOP to unsubscribe from reminders."
                  </p>
                </div>
                
                <div className="bg-gray-100 rounded-lg p-3">
                  <p className="text-sm font-mono">
                    <strong>Voice Call Example:</strong><br/>
                    "This is GabAI with your reminder: Take medication. Press 1 to stop future reminders."
                  </p>
                </div>
                
                <div className="bg-gray-100 rounded-lg p-3">
                  <p className="text-sm font-mono">
                    <strong>Confirmation SMS:</strong><br/>
                    "GabAI: Your reminder has been scheduled. Reply STOP to cancel all reminders. Msg & data rates may apply."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Compliance Statement */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            TCPA Compliance Statement
          </h2>
          <div className="space-y-2 text-gray-700">
            <p>
              GabAI by Booah LLC ensures all SMS messaging complies with applicable regulations including TCPA 
              (Telephone Consumer Protection Act) and CTIA guidelines.
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Users must explicitly opt-in to receive SMS notifications</li>
              <li>Consent is obtained before any messages are sent</li>
              <li>Users can opt-out at any time by replying STOP</li>
              <li>Message frequency varies based on user-created reminders</li>
              <li>Standard message and data rates may apply</li>
              <li>User phone numbers are never shared or sold</li>
              <li>All data is encrypted and stored securely</li>
            </ul>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center text-gray-600 text-sm pb-8">
          <p>This page serves as documentation of our compliant opt-in process for SMS service providers.</p>
          <p className="mt-2">
            For questions about SMS compliance, contact: compliance@gabai.ai
          </p>
          <p className="mt-4 font-medium">
            Verification Request SID: HH3bac6dd29c7b3117252059388027f136<br/>
            Toll-Free Number: +18888800291
          </p>
        </div>
      </div>
    </div>
  );
}