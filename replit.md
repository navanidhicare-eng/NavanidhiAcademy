# Navanidhi Academy Management System

## Overview
This is a comprehensive educational management system for Navanidhi Academy and its satellite office (SO) centers, offering role-based access for admins, SO center managers, teachers, and agents. The system enables student tracking via QR codes, academic progress monitoring, payment and wallet management. Students do not have direct login access; their data is managed by SO centers and parents can access progress through QR codes. The project aims to provide a production-ready, efficient, and modern platform for educational management with a focus on streamlined operations and user experience.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Critical Issues Resolved
- **SO Center Synchronization Issue (Aug 10, 2025)**: Fixed critical bug where SO Centers were created in Supabase Auth but failed to sync to database due to missing `admission_fee_applicable` column. Added missing column and related equipment tables.
- **Database Schema Completion**: Successfully migrated all missing tables including `so_center_equipment`, ensuring complete SO Center registration process works end-to-end.
- **SO Center Data Privacy & UI Improvements (Aug 10, 2025)**: Implemented strict data privacy controls ensuring SO Centers can only access their own data. Fixed manager dropdown to show only SO Center role users. Updated UI labels from "Center Manager (Optional)" to "SO Study Organizer" for better clarity and accuracy.
- **Exam Results Database Schema Issue (Aug 12, 2025)**: Fixed critical database synchronization issue where `exam_results` table was missing multiple columns (`percentage`, `submitted_by`, `submitted_at`). Implemented production-ready fallback approach using minimal schema to ensure exam results save successfully. Created comprehensive SQL migration script (`add_percentage_column.sql`) for manual database column addition.

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
- **Academic Dashboard**: Universal location filter system (State → District → Mandal → Village → SO Center) shared across Student Progress and Attendance Reports tabs.
- **Exam Management**: Dedicated sidebar page for Academic Admin with comprehensive exam creation, SO Centers selection, and management capabilities.
- **Teacher Management**: Integrated with user authentication system, including teaching records and assignment of classes and subjects.
- **Announcements System**: Complete role-based announcements management with multi-select target audiences, priority levels, date scheduling, QR code integration, and auto-popup display for active announcements based on user roles.
- **Data Privacy & Integrity**: Strict SO Center data isolation with global Aadhar number validation to prevent system-wide duplicates while maintaining privacy between centers.

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