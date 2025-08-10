# Navanidhi Academy Management System

## Overview
This is a comprehensive educational management system for Navanidhi Academy and its satellite office (SO) centers, offering role-based access for admins, SO center managers, teachers, and agents. The system enables student tracking via QR codes, academic progress monitoring, payment and wallet management. Students do not have direct login access; their data is managed by SO centers and parents can access progress through QR codes. The project aims to provide a production-ready, efficient, and modern platform for educational management with a focus on streamlined operations and user experience.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack Query
- **UI Components**: Radix UI primitives with shadcn/ui
- **Styling**: Tailwind CSS with CSS variables
- **Build Tool**: Vite
- **UI/UX Decisions**: Modern UI with gradient backgrounds, hover effects, professional typography, responsive design, and confetti celebrations for successful student registrations. Settings page includes dark/light theme toggle.

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database ORM**: Drizzle ORM
- **Authentication**: JWT-based authentication with bcrypt for password hashing, primarily managed by Supabase Auth.
- **API Design**: RESTful API structure with role-based middleware protection.

### Database Design
- **Primary Database**: PostgreSQL via Supabase. All database operations are exclusively routed through Supabase PostgreSQL.
- **Schema Management**: Drizzle Kit for migrations.
- **Key Entities**: Users (with role-based permissions), Students (with QR code tracking), Academic structure (classes, subjects, chapters, topics), Progress tracking, Payment records, SO centers (with wallet management), Wallet transactions.

### Authentication & Authorization
- **Authentication System**: Exclusively Supabase Authentication for all user types (Admin, SO Center, Teacher, etc.). This includes user creation, login, and token management.
- **JWT Token System**: Secure token-based authentication.
- **Role-Based Access Control**: Eight distinct user roles with specific permissions, synchronized between Supabase Auth and PostgreSQL.
- **Protected Routes**: Frontend and server-side API protection using authentication middleware.
- **SO Center Authentication**: Standardized SO Center login system with ID-to-email conversion (e.g., `NNASOC00001` converts to `nnasoc00001@navanidhi.org`).

### Key Features Architecture
- **QR Code System**: Unique QR codes per student for public, unauthenticated progress viewing.
- **Wallet Management**: Non-cash wallet system for SO centers with transaction tracking.
- **Progress Tracking**: Granular topic-level progress monitoring.
- **Payment Processing**: Comprehensive enrollment-based fee calculation, including enrollment date logic, previous balance tracking, monthly fee scheduling, and auto-update system. Supports multi-method payment recording (cash, online, wallet).
- **Academic Dashboard**: Universal location filter system (State → District → Mandal → Village → SO Center) shared across Student Progress, Exam Management, and Attendance Reports tabs.
- **Teacher Management**: Integrated with user authentication system, including teaching records and assignment of classes and subjects.

## External Dependencies

### Database & Backend Services
- **Supabase**: Primary database (PostgreSQL) and authentication services.

### Development & Build Tools
- **Vite**: Fast build tool.
- **TypeScript**: Type checking and compilation.

### UI & Design Libraries
- **Radix UI**: Headless component primitives.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide React**: Icon system.
- **React Hook Form**: Form handling.
- **Zod**: Schema validation.

### State Management & Data Fetching
- **TanStack Query**: Server state management.
- **Wouter**: Routing solution.

### Authentication & Security
- **bcryptjs**: Password hashing.
- **jsonwebtoken**: JWT token generation and verification.
- **Connect PG Simple**: PostgreSQL session store for Express sessions.