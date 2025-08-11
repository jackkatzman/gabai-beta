# Overview

GabAi is a voice-first personal assistant web application designed to provide AI-powered conversational interactions, personalized user experiences, and collaborative smart lists. It features real-time sharing, intelligent categorization, and high-quality voice synthesis. Users can interact via voice or text, with the AI continually learning from preferences for increasingly personalized responses. The project aims for broad market adoption through advanced AI features, seamless integration with daily routines, and a robust monetization strategy via affiliate links.

## Recent Updates (August 2025)
- **Production Deployment Fix** (Aug 11): RESOLVED! Fixed deployment error by configuring proper production build process. Updated deployment configuration to use `npm run build` and `npm start` instead of development `npm run dev` command. Production build tested successfully with optimized bundles (103.6kb server, compressed frontend assets).
- **APK Distribution System** (Aug 11): COMPLETE SUCCESS! APK build workflow succeeded and automated GitHub release system is now configured. The website's download button directly links to GitHub releases for seamless APK distribution. Users can now click "Download Beta APK" on gabai.ai and immediately get the latest built Android app. Professional native Android app with GabAi branding and automatic redirect to live website is fully operational for mobile users.
- **Complete APK Build Infrastructure** (Aug 8): Full Android APK build system ready for deployment with GitHub Actions automation, professional beta testing program, and comprehensive distribution setup - awaiting desktop upload of workflow file
- **iOS Support Strategy**: Documented complete iOS deployment options including immediate web app access and future native app development path
- **Beta Testing Program**: Enhanced landing page with prominent beta download section, comprehensive testing guide, and multi-channel feedback collection
- **GitHub Actions Workflow**: Created automated APK builds on every commit with release management, artifact distribution, and version tracking - ready for upload
- **Mobile App Configuration**: Optimized Capacitor setup with proper Android permissions, native plugin integration, and production-ready build scripts
- **Multi-Platform Landing Page**: Professional download options for Android APK, iOS web app, and direct web access with $14.95/month subscription model
- **AFFILIATE LINK SYSTEM COMPLETELY FIXED** (Aug 10): Critical monetization pipeline now fully operational - GabAi automatically generates affiliate links with proper URL processing, database persistence, and commission tracking. Users asking for shopping help now get shortened affiliate URLs that earn revenue.
- **ALARM SYSTEM COMPLETELY FIXED** (Aug 8): Critical bug resolved - voice commands now properly create alarms instead of calendar appointments. Added "create_alarm" action type to OpenAI system prompt to distinguish alarms from appointments. Manual "Set Alarm" button now fully responsive with proper loading states.
- **Drill Sergeant Voice Fixed** (Aug 8): Updated to correct voice ID (DGzg6RaUqxGRTHSBjfgF) with enhanced military phrases including "MAGGOT", "RECRUIT", "THE ENEMY DOESN'T SLEEP" for aggressive wake-up calls
- **Amazon Affiliate Code Updated** (Aug 8): Successfully changed from "gabai-20" to user's personal code "floater01b-20" in URL shortening system for proper commission tracking. Added automatic URL processing to AI chat responses - ALL Amazon links now automatically include affiliate code and get shortened to clean gabai.ai/l/xxxxx format
- **Navigation System Fixed** (Aug 8): Resolved critical routing issue preventing Lists and Calendar navigation - restructured App.tsx routes to handle `/lists` and `/calendar` properly
- **React Query Integration**: Fixed query key formatting and URL construction for proper data fetching across all components
- **Authentication Flow**: Stabilized OAuth session management with consistent cookie handling and user state synchronization
- **Smart Lists & Calendar**: Both sections now fully functional with real-time data display (shopping lists, to-do items, calendar reminders)
- **OAuth Domain Issue**: Fixed login redirect pointing to wrong domain - now uses dynamic REPLIT_DOMAINS
- **Google Console Setup**: Development URL must be added to OAuth callback: `https://399006af-98ce-4004-809a-fd955a60de01-00-11d3bac8de4bw.worf.replit.dev/api/auth/google/callback`
- **Calendar Timezone Fix**: Resolved calendar import time shifting issues by implementing floating time events and user timezone preferences
- **Timezone Detection**: Auto-detect user timezone from browser with manual selection during onboarding
- **URL Shortening Service**: Implemented clean "gabai.ai/l/xxxxxxxx" format to replace messy 12-line affiliate URLs
- **Metabase Analytics**: Added plug-and-play business intelligence dashboard with 30-second Docker setup
- **Affiliate Monetization**: Automatic URL shortening with click tracking for Booking.com, Amazon, Kayak, Expedia, Hotels.com
- **Native Notifications**: Replaced web toast notifications with Capacitor native notifications for better mobile UX
- **Native Scheduling**: Added Capacitor alarm system with date/time pickers, recurring alarms, and voice command integration
- **Advanced Alarm Sounds**: Custom ringtones, voice notes, and ElevenLabs AI voices (drill sergeant, sweet grandma, angry mom, etc.)
- **Production Ready**: Complete backend analytics and URL shortening APIs ready for $14.95/month subscription model

## Mobile-First Approach
- **Capacitor Integration**: Native iOS/Android app deployment capabilities
- **Voice-First Design**: Optimized for hands-free voice interactions
- **Native Notifications**: Platform-specific notification system for better user engagement
- **Native Scheduling**: Capacitor alarms with recurring options, voice commands, and quick timer presets
- **Advanced Alarm Sounds**: Custom ringtones, voice notes, and ElevenLabs AI drill sergeant wake-up calls
- **Progressive Web App**: Offline capabilities and app-like experience

# User Preferences

Preferred communication style: Simple, everyday language.
Timezone: Eastern Time (EST/EDT) - All appointments and reminders should use EST.
Date format: Current date (August 4, 2025) should be used for new appointments unless specified otherwise.
Amazon affiliate code: floater01b-20 (configured in the URL shortening monetization system).
VRBO affiliate link: https://www.dpbolvw.net/click-101504231-10697641 (configured for vacation rental recommendations).

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite.
- **UI Library**: Radix UI components with shadcn/ui styling.
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode).
- **State Management**: TanStack Query for server state, React Context for user state.
- **Routing**: Wouter for client-side routing.
- **Voice Features**: Web APIs for speech recognition and audio playback.
- **Deployment**: Progressive Web App (PWA) with offline support and Capacitor integration for native iOS/Android app store distribution.

## Backend Architecture
- **Runtime**: Node.js with Express.js.
- **Database**: PostgreSQL with Drizzle ORM, hosted on Neon serverless PostgreSQL.
- **API Design**: RESTful endpoints with structured error handling.
- **File Upload**: Multer for handling audio file uploads.
- **Authentication**: Google OAuth for secure user authentication and session management.

## Core Features
- **Voice Interaction**: Speech-to-text via OpenAI Whisper API with multilingual support.
- **AI Conversations**: GPT-4o for personalized responses and automatic language detection.
- **Text-to-Speech**: ElevenLabs API with OpenAI TTS fallback for natural voice synthesis.
- **User Personalization**: Comprehensive preference system for user interests, dietary needs, and communication styles.
- **Smart Lists**: Flexible, collaborative lists (shopping, punch lists, to-do) with real-time sharing and intelligent categorization. AI recognizes user profession for specialized list generation.
- **Calendar & Reminders**: Scheduled notifications with recurring options, full native calendar sync (ICS export, live subscriptions), and timezone accuracy.
- **OCR Text Extraction**: AI-powered image text extraction using OpenAI vision API for digitizing various documents (handwritten lists, receipts, business cards).
- **Contact Management**: Creation of contacts from business card OCR with smart detection of contact information and vCard export.
- **Monetization**: Automatic conversion of URLs to clickable affiliate links (e.g., Booking.com, Amazon) when users request purchasing help, supported by a custom URL shortening service with analytics.
- **Onboarding Flow**: Multi-step user setup for personalization.

## Data Models
- **Users**: Profiles, preferences, onboarding status.
- **Conversations**: Chat sessions metadata.
- **Messages**: Individual chat messages with role and optional audio.
- **Smart Lists**: Flexible lists with type, sharing, and custom categories.
- **List Items**: Items with priority, assignments, categories, completion status.
- **Reminders**: Scheduled tasks with categories and recurrence.

## Authentication & Security
- **User Management**: Google OAuth for identification and cross-device sync.
- **Session Handling**: Passport.js for session persistence.
- **Input Validation**: Zod schemas for type-safe data validation.

# External Dependencies

## AI & Voice Services
- **OpenAI**: GPT-4o (conversational AI, vision API) and Whisper (speech transcription).
- **ElevenLabs**: Text-to-speech synthesis.

## Database & Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting.
- **Drizzle ORM**: Type-safe database operations.

## Development & Deployment
- **Replit**: Development and integrated deployment environment.
- **Vite**: Fast build tool.
- **ESBuild**: Production bundling.

## UI & Styling
- **Radix UI**: Accessible component library.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide React**: Icon library.
- **React Hook Form**: Form validation.

## Additional Services
- **TanStack Query**: Server state management.
- **date-fns**: Date manipulation.
- **Wouter**: Client-side routing.
- **Passport.js**: Authentication middleware.