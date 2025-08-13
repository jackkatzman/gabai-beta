# Overview

GabAi is a voice-first personal assistant web application providing AI-powered conversational interactions, personalized user experiences, and collaborative smart lists. Key capabilities include real-time sharing, intelligent categorization, and high-quality voice synthesis. Users can interact via voice or text, with the AI continuously learning from preferences for increased personalization. The project aims for broad market adoption through advanced AI features, seamless integration with daily routines, and a robust monetization strategy via affiliate links.

## Recent Updates (August 2025)
- **AI-Powered Smart Categorization System** (Aug 12): Completely replaced limited keyword matching with OpenAI GPT-4o-mini powered intelligent categorization. Now handles millions of grocery items with contextual understanding (e.g., "French roast" meat vs coffee, "frozen pizza" vs regular pizza). Includes fallback system for reliability and proper error handling. FIXED quantity display - shopping items now show quantity badges (e.g., "2 lbs", "3 pieces") next to each item with proper color coding and automatic input field clearing.
- **Currency Calculation System Added** (Aug 12): Implemented comprehensive dollar/cents calculation functionality with "Payment Schedule" and "Budget Tracker" list types! Users can now enter monetary amounts (like $150.50) with real-time validation, automatic formatting, and smart totaling by category and grand totals. All currency is stored in cents for precision and displayed with professional formatting.
- **APK Build System Production-Ready** (Aug 12): COMPLETED comprehensive fix for Java toolchain conflicts. Completely regenerated Android project with fresh Capacitor setup to eliminate legacy issues. Implemented ultimate Java 17 enforcement across all modules and simplified Gradle configuration. Created production-ready CI workflow with proper Android SDK setup. System now verified working with: Gradle 8.9-bin + AGP 8.7.2 + Java 17 (forced) + Android SDK 35. Ready for APK generation in GitHub Actions. NOTE: Appflow discontinued - staying with GitHub Actions as primary build solution.
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