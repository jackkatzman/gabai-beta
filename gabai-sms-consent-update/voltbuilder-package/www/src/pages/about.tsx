import React from 'react';
import { Building2, Users, Smartphone, Brain, Calendar, MessageCircle, Shield, Phone } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <Brain className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            About GabAi
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Your intelligent personal assistant for modern productivity
          </p>
        </div>

        {/* Company Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center mb-6">
            <Building2 className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Company Information</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Owner & Operator</h3>
              <p className="text-gray-600 dark:text-gray-300">Booah LLC (EIN: 33-4873384)</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Product</h3>
              <p className="text-gray-600 dark:text-gray-300">GabAi - AI Personal Assistant</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Industry</h3>
              <p className="text-gray-600 dark:text-gray-300">Artificial Intelligence & Productivity Software</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Platform</h3>
              <p className="text-gray-600 dark:text-gray-300">Web & Mobile Application</p>
            </div>
          </div>
        </div>

        {/* About GabAi */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center mb-6">
            <Brain className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">About GabAi</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
            GabAi is an innovative voice-first artificial intelligence personal assistant developed by Booah LLC. 
            Designed for mobile platforms, GabAi provides users with conversational AI capabilities, intelligent 
            task management, and seamless integration with daily productivity tools.
          </p>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            Our platform leverages cutting-edge technologies including OpenAI's GPT models for natural language 
            processing, secure user authentication systems, and cloud-based data synchronization. GabAi maintains 
            enterprise-grade security standards while providing an intuitive user experience.
          </p>
        </div>

        {/* Key Features */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center mb-6">
            <Smartphone className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Key Features</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start">
              <MessageCircle className="w-5 h-5 text-blue-600 mr-3 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Voice-First Interaction</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Natural conversation with AI using advanced speech-to-text and text-to-speech technology</p>
              </div>
            </div>
            <div className="flex items-start">
              <Users className="w-5 h-5 text-blue-600 mr-3 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Smart List Management</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Intelligent organization and categorization of tasks, shopping lists, and reminders</p>
              </div>
            </div>
            <div className="flex items-start">
              <Calendar className="w-5 h-5 text-blue-600 mr-3 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Calendar Integration</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Seamless scheduling and appointment management with native calendar sync</p>
              </div>
            </div>
            <div className="flex items-start">
              <Phone className="w-5 h-5 text-blue-600 mr-3 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Contact Management</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">OCR scanning capabilities for business cards and contact information</p>
              </div>
            </div>
          </div>
        </div>

        {/* Target Market */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center mb-6">
            <Users className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Target Market</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            GabAi serves professionals, busy individuals, and anyone seeking to enhance their productivity through 
            AI-powered personal assistance. Our users value efficient task management, voice-controlled interactions, 
            and intelligent automation of daily routines. The platform is designed for users who need reliable 
            scheduling, task organization, and seamless communication across multiple devices.
          </p>
        </div>

        {/* SMS Service Use Cases */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center mb-6">
            <Shield className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">SMS Service Integration</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
            GabAi requires SMS messaging services to provide essential user notifications and verification features:
          </p>
          <ul className="space-y-2 text-gray-600 dark:text-gray-300">
            <li className="flex items-center">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
              <span>Appointment and calendar event reminders</span>
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
              <span>Task and shopping list notifications</span>
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
              <span>User account verification and two-factor authentication</span>
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
              <span>Shared list collaboration alerts</span>
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
              <span>Time-sensitive AI assistant notifications</span>
            </li>
          </ul>
        </div>

        {/* Technology Stack */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center mb-6">
            <Brain className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Technology Stack</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Frontend</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">React, TypeScript, Tailwind CSS, Progressive Web App</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Backend</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Node.js, Express, PostgreSQL, RESTful APIs</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">AI Integration</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">OpenAI GPT-4, Speech-to-Text, Text-to-Speech</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Mobile</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Capacitor, Native iOS/Android, Cross-platform</p>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="flex items-center mb-6">
            <Phone className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Contact Information</h2>
          </div>
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              For business inquiries or partnership opportunities:
            </p>
            <p className="text-blue-600 font-semibold">
              Booah LLC
            </p>
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-2">
              📧 Contact: <a href="mailto:info@gabaiapp.com" className="text-blue-600 hover:text-blue-700">info@gabaiapp.com</a>
            </p>
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
              Professional AI Solutions & Software Development
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400">
            © 2025 GabAi — Owned and operated by Booah LLC
          </p>
        </div>
      </div>
    </div>
  );
}