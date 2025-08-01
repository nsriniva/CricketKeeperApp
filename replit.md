# CricketPro - Cricket Statistics Application

## Overview

CricketPro is a comprehensive cricket statistics management application built as a Progressive Web App (PWA) with a full-stack architecture. The application provides functionality for managing cricket teams, players, matches, and live scoring with offline capabilities and a mobile-first design approach.

## Recent Changes

### August 1, 2025
- **COMPLETED**: Added "Team Batting First" field to Create Match functionality
  - Added batting first selection to both Team Management and Match Tracker create match dialogs
  - Updated form schemas to require batting first selection with proper validation
  - Updated mutations to store batting and bowling team information in match data
  - Field dynamically shows selected team names for easy selection

- **COMPLETED**: Successfully implemented automatic data import prioritizing local storage over defaults
  - ✅ Auto-import system uses correct localStorage key ("cricket_app_backup") matching Settings import
  - ✅ System detects local storage data and automatically imports it on app startup
  - ✅ Added proper React Query cache invalidation to ensure UI updates after import
  - ✅ Removed default teams - app starts empty if no local storage data exists
  - ✅ Data format conversion between export format and auto-import format
  - ✅ Enhanced debugging and error handling for the import process
  - ✅ User's custom teams and players now load automatically on app startup

- **COMPLETED**: Fixed all Create Match functionality issues across the application
  - Root cause: Schema validation mismatch between form fields (team1Id/team2Id) and backend schema (team1Name/team2Name required)
  - Solution: Created custom form schema matching form fields, with proper data transformation in mutation
  - Status: Create Match dialogs now work correctly in both Team Management and Match Tracker components
  - Implementation: Both pages use identical working form pattern with proper validation and error handling
  - Testing: Successfully verified functionality in both locations

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Framework**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack React Query for server state management
- **Routing**: Single-page application with tab-based navigation
- **PWA Features**: Service worker for offline functionality, web app manifest for mobile installation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API architecture
- **Storage**: In-memory storage with interface for future database integration
- **Middleware**: Express middleware for logging, JSON parsing, and error handling

### Mobile-First Design
- **Target Platform**: iOS-optimized design with safe area handling
- **Navigation**: Bottom tab navigation with cricket-themed icons
- **Responsive Design**: Mobile-first approach with touch-friendly interactions
- **Performance**: Optimized for mobile networks with caching strategies

## Key Components

### Data Models
- **Teams**: Management of cricket teams with statistics (wins, losses, matches)
- **Players**: Individual player statistics including batting and bowling records
- **Matches**: Match management with support for T20, ODI, and Test formats
- **Live Scoring**: Real-time match scoring capabilities

### Frontend Pages
- **Dashboard**: Overview of recent matches and quick statistics
- **Live Scoring**: Real-time match scoring interface
- **Player Stats**: Comprehensive player statistics and filtering
- **Match History**: Historical match data with format filtering
- **Team Management**: Team and player CRUD operations

### API Endpoints
- `/api/teams` - Team management (GET, POST, PATCH, DELETE)
- `/api/players` - Player management (GET, POST, PATCH, DELETE)
- `/api/matches` - Match management (GET, POST, PATCH, DELETE)

### UI Components
- **shadcn/ui**: Complete UI component library with Radix UI primitives
- **Custom Components**: Cricket-themed navigation and specialized forms
- **Responsive Design**: Mobile-optimized layouts with touch interactions

## Data Flow

### Client-Server Communication
1. **Query Layer**: TanStack React Query manages API calls with caching
2. **API Layer**: RESTful endpoints with Express.js routing
3. **Storage Layer**: In-memory storage with interface abstraction
4. **Validation**: Zod schemas for data validation on both client and server

### State Management
1. **Server State**: Managed by React Query with automatic caching
2. **Local State**: React hooks for component-level state
3. **Persistent State**: Local storage for user preferences and offline data
4. **Form State**: React Hook Form with Zod validation

### Offline Functionality
1. **Service Worker**: Caches static assets and API responses
2. **Local Storage**: Stores critical data for offline access
3. **Background Sync**: Syncs data when connection is restored
4. **Cache Strategy**: Network-first with fallback to cache

## External Dependencies

### Frontend Dependencies
- **React Ecosystem**: React 18, React DOM, React Hook Form
- **UI Libraries**: Radix UI components, Tailwind CSS, shadcn/ui
- **Data Management**: TanStack React Query, Zod validation
- **Icons**: Lucide React icons
- **PWA**: Service worker and manifest configuration

### Backend Dependencies
- **Core**: Express.js, TypeScript, Node.js
- **Database**: Drizzle ORM with PostgreSQL dialect (configured but using in-memory storage)
- **Validation**: Zod schemas shared between client and server
- **Development**: tsx for TypeScript execution, esbuild for production builds

### Development Tools
- **Build Tools**: Vite, esbuild, TypeScript compiler
- **Code Quality**: ESLint configuration through Vite
- **Development**: Hot module replacement, runtime error overlay
- **Deployment**: Production build optimization

## Deployment Strategy

### Development Environment
- **Development Server**: Vite dev server with Express.js backend
- **Hot Reloading**: Full-stack hot reloading with Vite middleware
- **Error Handling**: Runtime error overlay for development debugging
- **Logging**: Request/response logging for API endpoints

### Production Build
- **Frontend**: Vite production build with optimizations
- **Backend**: esbuild bundle for Node.js deployment
- **Static Assets**: Optimized and compressed static files
- **Environment**: NODE_ENV-based configuration

### Database Configuration
- **ORM**: Drizzle configured for PostgreSQL
- **Migrations**: Database migration support with drizzle-kit
- **Connection**: Environment-based database URL configuration
- **Current State**: Using in-memory storage, ready for PostgreSQL integration

### PWA Deployment
- **Service Worker**: Caching strategies for offline functionality
- **Manifest**: Web app manifest for mobile installation
- **Icons**: Optimized icons for various device sizes
- **Offline Support**: Background sync and cache management

The application is architected to be easily extensible, with clear separation of concerns and ready for production deployment with minimal configuration changes.