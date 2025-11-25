# Overview

GabAi is a voice-first AI personal assistant application for mobile platforms, offering conversational AI, smart list management, calendar and contact integration with OCR, and intelligent alarm systems. It targets users, particularly those with ADHD, by providing a simple, clean UI and aims for viral growth through its premium group reminder features. The project uses a full-stack architecture including React, Node.js/Express, PostgreSQL, and mobile deployment via Capacitor and VoltBuilder.

# User Preferences

Preferred communication style: Simple, everyday language.
Target audience: ADHD users requiring simple, clean UI.
Monetization: Premium group reminder features at $9.99/month.
Growth strategy: Viral growth through friend-to-friend reminders.

# System Architecture

## Frontend Architecture
The client is a React and TypeScript application, using Radix UI components and Tailwind CSS for styling. It features a component-based architecture with React hooks for state management and React Query for server state synchronization, optimized for mobile-first, responsive design, and PWA capabilities.

## Backend Architecture
The backend is a Node.js Express application providing RESTful APIs and WebSockets for real-time features. It follows a modular design with separate handlers for features like authentication and list management. Authentication is handled via Passport.js with Google OAuth2.

## Data Storage
PostgreSQL serves as the primary database, managed with Drizzle ORM for type-safe operations. The schema supports users, conversations, messages, smart lists, reminders, contacts, user patterns, preferences, onboarding states, activity logging for personalization, and daily usage limits for rate limiting.

## Rate Limiting System
The backend implements atomic daily rate limiting for free users to ensure fair usage and system stability:
- **Architecture**: Atomic SQL upserts with UNIQUE constraints on (user_id, date) prevent race conditions under concurrent load.
- **Limits**: Configurable via environment variables (FREE_CHAT_PER_DAY=50, FREE_LIST_ITEMS_PER_DAY=100, FREE_REMINDERS_PER_DAY=20).
- **Enforcement**: Middleware checks limits, handlers create resources and atomically increment counters, compensating deletes roll back on quota overflow.
- **Premium Bypass**: Users with isPremium=true skip all rate limit checks.
- **Panic Mode**: DISABLE_CHAT_TEMPORARILY env var returns 503 for chat endpoints when enabled.
- **Error Handling**: Failed compensating deletes return 500 with critical error logging to maintain quota/resource consistency.

## Mobile Architecture
GabAi supports multiple deployment strategies:
- **Capacitor Integration**: For native mobile app functionalities like camera access and notifications.
- **VoltBuilder Support**: For specialized APK generation with a redirect-based architecture.
- **PWA Capabilities**: Progressive Web App features including service workers for offline functionality.

## Authentication System
The system implements multiple authentication strategies:
- **Web Authentication**: Full OAuth2 flow with Google authentication and session management.
- **Mobile Authentication**: Simplified token-based authentication for VoltBuilder/Capacitor apps, including demo user creation.
- **Email/Password Authentication**: Secure registration and login with bcrypt password hashing (10 salt rounds).
- **Password Reset**: Email-based password recovery via Postmark (15-minute token expiry, single-use tokens) for Google Play compliance.

## AI Integration
OpenAI GPT powers the conversational AI, utilizing specialized prompts for item categorization, personalized responses, and proactive suggestions. It integrates speech-to-text and text-to-speech for voice-first interactions.

# External Dependencies

## Core Services
- **Neon Database**: PostgreSQL hosting.
- **OpenAI API**: GPT-4 for conversational AI.
- **Google OAuth2**: User authentication.
- **Postmark**: Transactional email service for password reset and notifications.

## Development and Build Tools
- **Vite**: Frontend build tool.
- **Capacitor**: Cross-platform mobile development framework.
- **VoltBuilder**: APK build service.
- **Drizzle Kit**: Database migration and schema management.

## UI and Styling Libraries
- **Radix UI**: Accessible component primitives.
- **Tailwind CSS**: Utility-first CSS framework.
- **Shadcn/UI**: Pre-built component system.

## Mobile and Device APIs
- **Capacitor Plugins**: For camera, notifications, and device features.
- **WebSocket (ws)**: Real-time communication.

## Authentication and Security
- **Passport.js**: Authentication middleware.
- **Express Session**: Session management.
- **bcryptjs**: Password hashing and verification for secure credential storage.

## Utility Libraries
- **Zod**: Schema validation.
- **Nanoid**: Unique ID generation.
- **React Query**: Server state management.