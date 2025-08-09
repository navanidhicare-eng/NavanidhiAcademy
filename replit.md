# Navanidhi Academy Management System

## Overview

This is a comprehensive educational management system designed for Navanidhi Academy and its satellite office (SO) centers. The application provides role-based access control for different user types including admins, SO center managers, teachers, and agents. The system focuses on student tracking through QR codes, academic progress monitoring, payment management, and wallet transactions. Students do not have login access - all tracking is managed by SO centers and accessible to parents via QR codes.

## Recent Changes (August 2025)

✓ **Student List Display** - Fixed critical issue where students weren't showing in the SO Center dashboard
✓ **Wallet Balance Updates** - FULLY RESOLVED wallet balance calculations to properly reflect admission fee payments with real-time updates
✓ **PhonePe Audio Integration** - Implemented authentic PhonePe success sound from provided MP3 file with NO interfering sounds
✓ **Payment Processing** - Completely resolved SQL parsing errors preventing admission fee payments from being recorded
✓ **Confetti Celebrations** - Silent multi-burst confetti effects for successful student registrations (visual only)
✓ **Wallet Update Bug Fix** - Fixed "query.getSQL is not a function" error by using proper Drizzle SQL syntax for wallet updates
✓ **Settings Page & Dark Mode** - Created comprehensive Settings page with dark/light theme toggle functionality and ThemeProvider context
✓ **Admin Login Setup** - Created admin user account with email: navanidhi.care@gmail.com and secure password authentication
✓ **ADVANCED FEE MANAGEMENT** - Implemented comprehensive enrollment-based fee calculation system with:
  - Enrollment date tracking with automated fee calculation (1st-10th: full fee, 11th-20th: half fee, 21st+: no first month fee)
  - Previous balance tracking and management for students with outstanding fees
  - Monthly fee scheduling with 12-month advance planning for each student
  - Fee calculation history tracking for complete audit trail
  - Automated monthly fee processing system for production deployment
  - Real-time balance updates and payment status tracking
✓ **RETROACTIVE FEE CALCULATION SYSTEM** - Implemented comprehensive enrollment-based fee calculation:
  - Removed "Expected fee" functionality completely from fee payments page
  - Built FeeCalculationService for accurate retroactive fee calculations based on enrollment date
  - Enhanced logic: 1st-10th enrollment = full month fee, 11th-20th = half month fee, 21st+ = no first month fee
  - Automatic calculation from enrollment month to current month with proper monthly breakdown
  - Real-time fee updates in database with enrollment date-based logic
  - Clean payment progress display showing actual calculated amounts instead of expected fees
  - Production-ready code with comprehensive error handling and logging

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development practices
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: Radix UI primitives with shadcn/ui design system for consistent, accessible components
- **Styling**: Tailwind CSS with CSS variables for theming and responsive design
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js server framework
- **Language**: TypeScript for type safety across the entire stack
- **Database ORM**: Drizzle ORM for type-safe database operations and schema management
- **Authentication**: JWT-based authentication with bcrypt for password hashing
- **API Design**: RESTful API structure with role-based middleware protection

### Database Design
- **Primary Database**: PostgreSQL via Neon serverless platform
- **Schema Management**: Drizzle Kit for migrations and schema evolution
- **Key Entities**:
  - Users with role-based permissions (admin, so_center, teacher, agent, etc.)
  - Students with QR code tracking
  - Academic structure (classes, subjects, chapters, topics)
  - Progress tracking with topic completion status
  - Payment records with multiple payment methods
  - SO centers with wallet management
  - Wallet transactions for financial tracking

### Authentication & Authorization
- **JWT Token System**: Secure token-based authentication with configurable expiration
- **Role-Based Access Control**: Eight distinct user roles with specific permissions
- **Protected Routes**: Frontend route protection based on authentication status
- **Middleware Security**: Server-side authentication middleware for API protection

### Key Features Architecture
- **QR Code System**: Unique QR codes per student for public progress viewing without authentication
- **Wallet Management**: Non-cash wallet system for SO centers with transaction tracking
- **Progress Tracking**: Granular topic-level progress monitoring with completion status
- **Payment Processing**: Multi-method payment recording (cash, online, wallet) with course type support
- **Public Progress Views**: Unauthenticated access to student progress via QR codes

## External Dependencies

### Database & Backend Services
- **Neon Database**: Serverless PostgreSQL hosting for scalable data storage
- **Supabase**: Backup authentication and database services (currently using direct Neon connection)

### Development & Build Tools
- **Vite**: Fast build tool with HMR for development and optimized production builds
- **Replit Integration**: Development environment with cartographer plugin and runtime error handling
- **TypeScript**: Type checking and compilation across frontend and backend

### UI & Design Libraries
- **Radix UI**: Headless component primitives for accessibility and customization
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Lucide React**: Consistent icon system for user interface elements
- **React Hook Form**: Form handling with validation and error management
- **Zod**: Schema validation for form inputs and API data

### State Management & Data Fetching
- **TanStack Query**: Server state management, caching, and synchronization
- **React Router (Wouter)**: Lightweight routing solution for single-page application navigation

### Authentication & Security
- **bcryptjs**: Password hashing for secure user credential storage
- **jsonwebtoken**: JWT token generation and verification for session management
- **Connect PG Simple**: PostgreSQL session store for Express sessions

### Development Quality Tools
- **ESLint & Prettier**: Code formatting and linting for consistent code quality
- **PostCSS**: CSS processing with Tailwind CSS integration
- **React DevTools**: Development debugging and optimization tools