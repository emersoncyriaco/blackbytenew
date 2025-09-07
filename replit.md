# Overview

This is a BlackByte forum application built with modern web technologies. The application provides a community platform where users can create and participate in discussions across different forum categories. It features user authentication through Replit's OIDC system, role-based access control (member, VIP, moderator, admin), and a comprehensive content management system with support for posts, replies, and file attachments.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client-side is built using React 18 with TypeScript, utilizing Vite as the build tool and development server. The UI is constructed with shadcn/ui components built on top of Radix UI primitives, providing a consistent design system. TailwindCSS handles styling with a dark theme configuration optimized for the forum aesthetic. The application uses Wouter for lightweight client-side routing and TanStack Query for server state management and caching.

## Backend Architecture
The server follows a RESTful API architecture built with Express.js and TypeScript. The application uses a modular structure separating concerns into distinct layers: route handlers, storage abstraction, and database access. Session management is handled through express-session with PostgreSQL storage. File uploads are managed using Multer middleware with image validation and size limits.

## Database Design
The application uses PostgreSQL as the primary database with Drizzle ORM for type-safe database operations. The schema includes core entities: users (with role-based permissions), forums (categorized discussion areas), posts (main content), replies (threaded responses), attachments (file uploads), and sessions (authentication state). The database is configured for Neon serverless PostgreSQL deployment.

## Authentication & Authorization
Authentication is implemented using Replit's OpenID Connect (OIDC) provider with Passport.js strategy. The system supports four user roles: member (default), VIP (premium features), moderator (content management), and admin (full system access). Session persistence is handled through PostgreSQL-backed session storage with configurable TTL.

## Content Management
The forum supports rich text content creation with a custom markdown-style editor. File attachments are supported with image validation and secure file serving. Posts and replies support hierarchical threading for organized discussions. View counting and forum statistics are tracked for engagement metrics.

## External Dependencies

- **Replit Authentication**: OIDC provider for user authentication and session management
- **Neon Database**: Serverless PostgreSQL hosting for data persistence
- **Radix UI**: Headless UI component primitives for accessible interface components
- **TailwindCSS**: Utility-first CSS framework for responsive design
- **Font Awesome**: Icon library for UI elements and visual indicators
- **Google Fonts**: Custom typography including DM Sans, Fira Code, and Geist Mono