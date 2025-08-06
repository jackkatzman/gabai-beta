# Overview

GabAi is a voice-first personal assistant web application built with React and Express. The application provides AI-powered conversational interactions, personalized user experiences, and collaborative smart lists that adapt to any use case. The system features real-time sharing capabilities, intelligent categorization, and high-quality voice synthesis. Users can interact through both voice input and text, with the AI learning from user preferences to provide increasingly personalized responses.

## Recent Progress (August 2025)
- ✅ Fixed AI list categorization system with proper type matching
- ✅ Implemented automatic UI cache invalidation for real-time updates
- ✅ Resolved time parsing issues - "1:40" now correctly interpreted as 1:40 PM EST
- ✅ Fixed date handling to use current date (2025-08-04) instead of outdated examples
- ✅ Implemented proper Eastern Time (EST/EDT) timezone support
- ✅ Food items (chocolate, Twizzlers) now correctly categorized to shopping lists
- ✅ Appointments properly created in calendar with correct dates and times
- ✅ **Multilingual support confirmed** - AI understands Hebrew voice commands, responds in Hebrew, and adds Hebrew items to lists
- ✅ **Google OAuth Authentication implemented** - Replaced localStorage UUID system with proper Google OAuth
- ✅ **App store ready authentication** - Users can sign in with Google accounts for cross-device sync
- ✅ **Login/logout flow** - Complete authentication system with login page and logout functionality
- ✅ **Session persistence fixed** - Google OAuth sessions now properly maintained across requests
- ✅ **Production-ready authentication** - Memory store with proper trust proxy configuration for Replit environment
- ✅ **Frontend integration completed** - UserProvider wrapper added to support existing components
- ✅ **Native Calendar Sync Implemented** - Complete ICS export system for device calendar integration
- ✅ **Full calendar export** - Download all appointments as ICS file for import into any calendar app
- ✅ **Individual event export** - Export single appointments with download buttons on each event
- ✅ **Calendar subscription URLs** - Live calendar feeds that update automatically
- ✅ **Cross-platform support** - Setup instructions for iPhone, Android, Google Calendar, Outlook
- ✅ **Calendar sync UI** - Professional interface with badges, instructions, and copy functionality
- ✅ **OCR Text Extraction** - AI-powered image text extraction using OpenAI vision API for digitizing handwritten lists, invitations, receipts, and documents
- ✅ **Notification Preferences System** - Complete user control over reminder notifications with browser, in-app, calendar-only, or disabled options
- ✅ **Timezone-Accurate Calendar Export** - Fixed ICS export to properly handle Eastern Time for accurate device calendar imports
- ✅ **Google OAuth Domain Fix** - Updated callback URL to use gabai.ai directly to prevent domain switching during authentication
- ✅ **Authentication Bypass Removed** - Removed temporary authentication bypass, now using proper Google OAuth flow
- ✅ **Login Page Active** - Users see proper Google OAuth login page when not authenticated
- ✅ **Mobile App Store Preparation** - Complete dual deployment strategy implemented
- ✅ **PWA Implementation** - Progressive Web App with offline support, installable from browser
- ✅ **Capacitor Integration** - Native mobile app framework ready for iOS/Android app stores
- ✅ **Enhanced UI Components** - Larger send button, improved voice input with toast notifications
- ✅ **Settings Page Authentication** - Fixed settings page with proper auth checks and loading states
- ✅ **OCR Scrolling Fixed** - OCR page now has proper vertical scrolling for long content
- ✅ **Settings Routing Fixed** - Settings page now loads correctly from bottom navigation
- ✅ **Mobile Layout Improvements** - Both OCR and Settings pages properly fit within app layout
- ✅ **PWA Install Prompt Added** - Landing page now shows install button when PWA is available
- ✅ **Camera OCR Support** - OCR page now includes camera capture option alongside file upload
- ✅ **Autoscale Deployment Fixes Applied** - Removed reusePort for better Autoscale compatibility, added health check endpoint, fixed React hooks import
- ✅ **Health Check Endpoint** - Added `/health` endpoint for Autoscale deployment monitoring
- ✅ **Server Binding Updated** - Changed from reusePort to standard listen call for Autoscale compatibility
- ✅ **React Hooks Fixed** - Resolved invalid hook call errors by properly importing React in ThemeProvider
- ✅ **Deployment Configuration Fixed** - Applied all suggested deployment fixes:
  - Dynamic OAuth callback URL detection using REPLIT_DOMAINS environment variable
  - Health check timeout handling with 5-second timeout protection
  - Readiness check endpoint at `/ready` for deployment monitoring
  - Enhanced error handling and server initialization logging
  - Proper domain configuration for Replit deployment environment
- ✅ **React Hooks Error Fixed** - Resolved invalid hook call errors preventing login page display
- ✅ **Login Page Working** - Clean login interface with OAuth callback configured for existing gabai.ai setup
- ✅ **Server Port Conflicts Resolved** - Fixed EADDRINUSE errors and server startup issues
- ✅ **OAuth Configuration Fixed** - Created fresh Google Cloud project "GabAi" with properly configured redirect URIs
- ✅ **Google Console Aligned** - Redirect URIs now match server configuration exactly with /api/auth/google/callback paths
- ✅ **OAuth Route Registration Fixed** - Moved OAuth routes before all middleware to prevent Vite interception
- ✅ **Development Environment Limitation** - OAuth routes intercepted by Vite middleware in development, works in production
- ✅ **Production Deployment Complete** - OAuth authentication routes accessible in production environment
- ✅ **OAuth Logging Enhanced** - Comprehensive logging added to track authentication flow and debug session issues
- ✅ **OAuth Route Conflicts Resolved** - Removed duplicate OAuth handlers, now using only Passport.js implementation
- ✅ **Passport.js Integration Complete** - Auth endpoints now use proper Passport.js session handling
- ✅ **Session Persistence Fixed** - Improved session configuration with forced save and longer cookie duration
- ✅ **Login Button Fixed** - Updated OAuth redirect path from /auth/google to /api/auth/google
- → **Production Authentication Complete** - Full OAuth implementation with login page functionality

# User Preferences

Preferred communication style: Simple, everyday language.
Timezone: Eastern Time (EST/EDT) - All appointments and reminders should use EST.
Date format: Current date (August 4, 2025) should be used for new appointments unless specified otherwise.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **State Management**: TanStack Query for server state, React Context for user state
- **Routing**: Wouter for client-side routing
- **Voice Features**: Web APIs for speech recognition and audio playback

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Database Provider**: Neon serverless PostgreSQL
- **API Design**: RESTful endpoints with structured error handling
- **File Upload**: Multer for handling audio file uploads

## Core Features
- **Voice Interaction**: Speech-to-text transcription via OpenAI Whisper API with multilingual support (Hebrew, English, etc.)
- **AI Conversations**: GPT-4o for personalized responses based on user context with automatic language detection
- **Text-to-Speech**: ElevenLabs API with fallback to OpenAI TTS for natural voice synthesis
- **User Personalization**: Comprehensive preference system storing interests, dietary restrictions, sleep schedules, and communication styles
- **Smart Lists**: Flexible collaborative lists that adapt to any use case (shopping, contractor punch lists, waiting lists, to-do lists)
- **Real-time Collaboration**: Live sharing with unique share codes for multi-user workflows
- **Intelligent Categorization**: Auto-sorting by categories (produce/dairy for shopping, plumber/painter for contractors)
- **Voice-First Item Management**: Voice input with auto-category detection
- **Calendar & Reminders**: Scheduled notifications with recurring options and full native calendar sync
- **Native Calendar Integration**: ICS export for seamless sync with device calendars (iPhone, Android, web)
- **Calendar Subscription**: Live calendar feeds with automatic updates across all devices
- **OCR Text Extraction**: AI-powered image text extraction for digitizing handwritten lists, wedding invitations, receipts, business cards, and any text-based documents
- **Onboarding Flow**: Multi-step user setup to establish personalization
- **Progressive Web App**: Installable PWA with offline support and push notifications
- **Mobile App Ready**: Capacitor integration for native iOS and Android app store distribution

## Data Models
- **Users**: Profile information, preferences, and onboarding status
- **Conversations**: Chat sessions with title and metadata
- **Messages**: Individual chat messages with role (user/assistant) and optional audio
- **Smart Lists**: Flexible lists with type (shopping/punch_list/waiting_list/todo), sharing capabilities, and custom categories
- **List Items**: Items with priority levels, assignments, categories, and completion status
- **Reminders**: Scheduled tasks with categories and recurrence patterns

## Authentication & Security
- **User Management**: UUID-based user identification stored in localStorage
- **Session Handling**: Client-side user state management
- **Input Validation**: Zod schemas for type-safe data validation

# External Dependencies

## AI & Voice Services
- **OpenAI**: GPT-4o for conversational AI and Whisper for speech transcription
- **ElevenLabs**: Primary text-to-speech service with natural voice synthesis

## Database & Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting
- **Drizzle ORM**: Type-safe database queries and migrations

## Development & Deployment
- **Replit**: Development environment with integrated deployment
- **Vite**: Fast build tool with hot module replacement
- **ESBuild**: Production bundling for server code

## UI & Styling
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **React Hook Form**: Form validation and management

## Additional Services
- **TanStack Query**: Server state management and caching
- **date-fns**: Date manipulation and formatting
- **Wouter**: Lightweight client-side routing