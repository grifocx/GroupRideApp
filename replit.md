# GroupRideApp

## Overview

GroupRideApp is a comprehensive cycling social platform built for connecting cyclists in Washington DC through advanced ride management and community engagement tools. The application uses a modern full-stack architecture with React frontend, Express backend, and PostgreSQL database.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state, local React state for UI
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Build Tool**: Vite for fast development and optimized builds
- **Maps**: Leaflet for interactive mapping with marker clustering
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with local and Google OAuth strategies
- **Session Management**: Express-session with memory store
- **File Uploads**: Multer with Sharp for image processing
- **Email**: Nodemailer for email verification
- **WebSocket**: Built-in for real-time features

### Database Design
- **ORM**: Drizzle with type-safe queries
- **Schema**: Comprehensive user, rides, and preferences tables
- **Security**: Row Level Security (RLS) policies
- **Validation**: Zod schemas for runtime type checking
- **Migrations**: Drizzle Kit for schema management

## Key Components

### Authentication System
- Local username/password authentication
- Google OAuth integration
- Email verification system
- Two-factor authentication support
- Session-based authentication with secure cookies

### Ride Management
- CRUD operations for bicycle rides
- Advanced filtering and search capabilities
- Recurring ride support (weekly/monthly)
- Geolocation integration for ride locations
- Difficulty levels (E, D, C, B, A, AA)
- Multiple ride types (MTB, Road, Gravel)

### User System
- Comprehensive user profiles
- Avatar upload and management
- Profile completion tracking
- Admin role management
- User preferences for ride matching

### Map Integration
- Interactive Leaflet maps
- Marker clustering for performance
- Mobile-optimized touch controls
- Fullscreen map capabilities
- Real-time ride location display

### Mobile Optimization
- Mobile-first responsive design
- Touch-friendly UI elements
- Optimized breakpoints (SM: 640px, MD: 768px, LG: 1024px)
- Progressive Web App features
- Adaptive layouts for different screen sizes

## Data Flow

### Authentication Flow
1. User submits credentials → Server validates → Session created
2. Google OAuth → Redirect to Google → Callback with user data → Session created
3. Session validation on protected routes

### Ride Management Flow
1. User creates ride → Geocoding service resolves address → Database storage
2. Ride queries → Database → Filtering/sorting → Client display
3. Ride participation → User join/leave → Database update → Real-time notifications

### Real-time Updates
1. User actions → Server events → WebSocket broadcast → Client updates
2. Cache invalidation through React Query
3. Optimistic updates for better UX

## External Dependencies

### Third-party Services
- **Google OAuth**: User authentication
- **OpenStreetMap**: Geocoding service (no API key required)
- **Leaflet**: Interactive maps
- **Sharp**: Image processing
- **Nodemailer**: Email services

### UI Libraries
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Icon library
- **Framer Motion**: Animations and transitions

### Development Tools
- **TypeScript**: Type safety
- **ESBuild**: Production bundling
- **Vite**: Development server
- **Drizzle Kit**: Database migrations

## Deployment Strategy

### Build Process
1. Frontend build: Vite bundles React app to `dist/public`
2. Backend build: ESBuild bundles Express server to `dist/index.js`
3. Database: Drizzle migrations applied via `db:push`

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required)
- **GOOGLE_CLIENT_ID**: Google OAuth client ID
- **GOOGLE_CLIENT_SECRET**: Google OAuth client secret
- **SESSION_SECRET**: Express session secret
- **SMTP_***: Email service configuration

### Production Considerations
- Database provisioning required before deployment
- Environment variables must be configured
- File upload directory (`uploads/`) needs write permissions
- Session store should be upgraded from memory to persistent storage for production scaling

### Performance Optimizations
- React Query caching for reduced API calls
- Image optimization with Sharp
- Lazy loading for map components
- Efficient database queries with proper indexing
- Mobile-optimized assets and layouts

The application follows modern web development best practices with a focus on type safety, responsive design, and user experience optimization.