# Overview

GabAi is a voice-first personal assistant web application providing AI-powered conversational interactions, personalized user experiences, and collaborative smart lists. Key capabilities include real-time sharing, intelligent categorization, and high-quality voice synthesis. Users can interact via voice or text, with the AI continuously learning from preferences for increased personalization. The project aims for broad market adoption through advanced AI features, seamless integration with daily routines, and a robust monetization strategy via affiliate links.

## Recent Updates (August 2025)
- **Automatic Smart List Generation** (Aug 12): Added intelligent context-aware list creation! When users mention books, movies, travel, or gifts in conversation, GabAi automatically creates appropriate specialized lists (Reading List, Movie Watchlist, Travel Plans, Gift Ideas) with smart categorization. No more manual list creation - just talk naturally about your interests and lists appear automatically.
- **Task Duplication Prevention** (Aug 12): Fixed the issue where tasks sometimes got duplicated when adding through AI chat. Added comprehensive protection against rapid submissions and race conditions in both smart lists and chat systems with pending state validation.
- **Contact Creation from Chat Fixed** (Aug 12): Completely restored AI's ability to create contacts from simple text like "John Smith 555-123-4567". Enhanced AI system prompts with contact detection patterns and improved error handling for seamless contact creation from conversations.
- **Drag-and-Drop List Reordering Added** (Aug 12): Added full drag-and-drop functionality to smart lists, just like popular task manager apps. Users can now grab the drag handle (grip icon) and reorder items within categories. Changes save automatically to backend with position tracking. Includes touch support for mobile devices.
- **Enhanced Settings Page** (Aug 11): Made settings fully editable with comprehensive personalization fields including profession, interests, dietary restrictions, communication style, and family details. All changes save to backend and help make GabAi responses more personalized and contextually relevant.
- **Profession-Based List Creation** (Aug 12): Added intelligent profession-based automatic list generation during onboarding! When users enter their profession (teacher, contractor, doctor, chef, etc.), GabAi automatically creates relevant starter lists. Teachers get "School Supplies" and "Teaching Tasks", contractors get "Project Punch List" and "Tools & Materials", developers get "Development Tasks" and "Tech Reading", etc. Includes live preview in onboarding showing exactly which lists will be created.

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
- **Smart Lists**: Flexible, collaborative lists (shopping, punch lists, to-do) with real-time sharing, intelligent categorization, drag-and-drop reordering, and AI-suggested names based on user profession.
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