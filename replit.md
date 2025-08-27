# Overview

GabAi is a voice-first AI personal assistant application designed for mobile platforms. The app provides conversational AI capabilities, smart list management, calendar integration, contact management with OCR scanning, and intelligent alarm systems. The project follows a full-stack architecture with a React frontend, Node.js/Express backend, and PostgreSQL database, with specialized mobile app deployment capabilities through Capacitor and VoltBuilder.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client application is built with React and TypeScript, utilizing modern UI libraries including Radix UI components and Tailwind CSS for styling. The frontend follows a component-based architecture with React hooks for state management and React Query for server state synchronization. The app is optimized for mobile-first experiences with responsive design patterns and PWA capabilities.

## Backend Architecture
The server is implemented using Node.js with Express framework, providing RESTful API endpoints and WebSocket connections for real-time features. The architecture employs a modular approach with separate route handlers for different features (authentication, lists, messages, etc.). Authentication is handled through Passport.js with Google OAuth2 strategy, supporting both web and mobile authentication flows.

## Data Storage
The application uses PostgreSQL as the primary database with Drizzle ORM for type-safe database operations. The database schema includes tables for users, conversations, messages, smart lists, reminders, contacts, and user patterns. The system supports user preferences, onboarding states, and activity logging for personalization features.

## Mobile Architecture
The app supports multiple deployment strategies:
- **Capacitor Integration**: Native mobile app capabilities using Capacitor plugins for camera access, notifications, device features, and native UI components
- **VoltBuilder Support**: Specialized build configuration for VoltBuilder APK generation with redirect-based architecture for simplified deployment
- **PWA Capabilities**: Progressive Web App features with service worker support and offline functionality

## Authentication System
Implements dual authentication strategies:
- **Web Authentication**: Full OAuth2 flow with Google authentication, session management using express-session with memory store
- **Mobile Authentication**: Simplified authentication flow for VoltBuilder/Capacitor apps with demo user creation and token-based verification

## AI Integration
OpenAI GPT integration powers the conversational AI features, with specialized prompts for different use cases including item categorization, personalized responses, and proactive suggestions. The system includes speech-to-text capabilities and text-to-speech generation for voice-first interactions.

# External Dependencies

## Core Services
- **Neon Database**: PostgreSQL hosting with serverless architecture
- **OpenAI API**: GPT-4 for conversational AI and text processing
- **Google OAuth2**: User authentication and profile management

## Development and Build Tools
- **Vite**: Frontend build system and development server
- **Capacitor**: Cross-platform mobile app development framework
- **VoltBuilder**: APK build service for mobile app deployment
- **Drizzle Kit**: Database migration and schema management

## UI and Styling Libraries
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn/UI**: Pre-built component system

## Mobile and Device APIs
- **Capacitor Plugins**: Camera, notifications, status bar, splash screen, keyboard, haptics, and device information
- **WebSocket (ws)**: Real-time communication for chat features

## Authentication and Security
- **Passport.js**: Authentication middleware
- **Express Session**: Session management
- **Connect-pg-simple**: PostgreSQL session store (configured but using memory store)

## Utility Libraries
- **Zod**: Schema validation and type safety
- **Nanoid**: Unique ID generation
- **React Query**: Server state management and caching