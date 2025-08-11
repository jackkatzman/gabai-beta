# Overview

GabAi is a voice-first personal assistant web application providing AI-powered conversational interactions, personalized user experiences, and collaborative smart lists. Key capabilities include real-time sharing, intelligent categorization, and high-quality voice synthesis. Users can interact via voice or text, with the AI continuously learning from preferences for increased personalization. The project aims for broad market adoption through advanced AI features, seamless integration with daily routines, and a robust monetization strategy via affiliate links.

## Recent Updates (August 2025)
- **Alarm System FULLY OPERATIONAL** (Aug 11): COMPLETELY FIXED! Resolved stuck "Scheduling..." button issue and enabled proper alarm creation. Fixed TypeScript errors in scheduling components, improved error handling with user feedback, and ensured alarms can be successfully set with both native and web fallback systems.
- **ElevenLabs Voice System Fixed** (Aug 11): COMPLETELY FIXED! All alarm voices now use pure ElevenLabs voice IDs without artificial manipulation. Drill sergeant voice (DGzg6RaUqxGRTHSBjfgF) uses natural voice characteristics as selected from ElevenLabs library. Removed forced masculinity/femininity settings - voices sound authentic and distinct as intended by ElevenLabs voice design.

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
- **Mobile-First Approach**: Optimized for hands-free voice interactions, native notifications, and Capacitor alarms.

## Backend Architecture
- **Runtime**: Node.js with Express.js.
- **Database**: PostgreSQL with Drizzle ORM, hosted on Neon serverless PostgreSQL.
- **API Design**: RESTful endpoints with structured error handling.
- **File Upload**: Multer for handling audio file uploads.
- **Authentication**: Google OAuth for secure user authentication and session management.

## Core Features
- **Voice Interaction**: Speech-to-text via OpenAI Whisper API with multilingual support; text-to-speech via ElevenLabs API. Includes hold-to-talk functionality.
- **AI Conversations**: GPT-4o for personalized responses and automatic language detection.
- **User Personalization**: Comprehensive preference system for interests, dietary needs, and communication styles.
- **Smart Lists**: Flexible, collaborative lists (shopping, punch lists, to-do) with real-time sharing, intelligent categorization, and AI-suggested names based on user profession.
- **Calendar & Reminders**: Scheduled notifications with recurring options, native calendar sync, and timezone accuracy. Supports custom alarm sounds and ElevenLabs AI voices.
- **OCR Text Extraction**: AI-powered image text extraction using OpenAI Vision API for digitizing documents like handwritten lists, receipts, and business cards.
- **Contact Management**: Creation of contacts from business card OCR with smart detection and vCard export.
- **Monetization**: Automatic conversion of URLs to clickable affiliate links (e.g., Booking.com, Amazon) using a custom URL shortening service with analytics.
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
- **OpenAI**: GPT-4o (conversational AI, vision API), Whisper (speech transcription).
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