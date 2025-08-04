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
- **Voice Interaction**: Speech-to-text transcription via OpenAI Whisper API
- **AI Conversations**: GPT-4o for personalized responses based on user context
- **Text-to-Speech**: ElevenLabs API with fallback to OpenAI TTS for natural voice synthesis
- **User Personalization**: Comprehensive preference system storing interests, dietary restrictions, sleep schedules, and communication styles
- **Smart Lists**: Flexible collaborative lists that adapt to any use case (shopping, contractor punch lists, waiting lists, to-do lists)
- **Real-time Collaboration**: Live sharing with unique share codes for multi-user workflows
- **Intelligent Categorization**: Auto-sorting by categories (produce/dairy for shopping, plumber/painter for contractors)
- **Voice-First Item Management**: Voice input with auto-category detection
- **Reminders**: Scheduled notifications with recurring options
- **Onboarding Flow**: Multi-step user setup to establish personalization

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