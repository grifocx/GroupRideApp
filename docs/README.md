# GroupRideApp 🚲

GroupRideApp is a comprehensive cycling social platform connecting cyclists in Washington DC through advanced ride management and community engagement tools. The application provides an intuitive, mobile-first experience with enhanced data security, robust access controls, and intelligent ride matchmaking.

## Features ✨

### Current Features
- **User Management**
  - Secure authentication with local and Google OAuth
  - Customizable user profiles with avatars
  - Profile completion tracking
  - Role-based access control

- **Ride Management**
  - Create and join group rides
  - Advanced ride filtering and search
  - Interactive map view with ride locations
  - Calendar integration for ride scheduling
  - Real-time ride status updates
  - Archive system for past rides

- **Ride Buddy AI Matchmaking**
  - Smart rider preference management
  - Compatibility scoring system
  - Geographic matching within specified radius
  - Customizable matching criteria:
    - Ride types (MTB, Road, Gravel)
    - Terrain preferences
    - Difficulty levels
    - Pace ranges
    - Available days

- **Community Features**
  - Comments system for rides
  - Real-time notifications
  - User activity tracking
  - Club affiliations

### Technical Features
- Mobile-first responsive design
- Advanced data security with Row Level Security (RLS)
- Real-time WebSocket communication
- Geospatial integration with Leaflet
- Modern React frontend with Tailwind CSS
- PostgreSQL database with Drizzle ORM
- Comprehensive API documentation

## Setup 🛠️

### Prerequisites
- Node.js 20.x or higher
- PostgreSQL 16.x
- npm or yarn

### Environment Variables
```env
DATABASE_URL=postgresql://...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up the database: `npm run db:push`
4. Start the development server: `npm run dev`

## Development Status 📊

Current Version: 1.0.4 (March 25, 2025)

### Recent Updates
- Centralized all documentation in a dedicated `/docs` directory
- Created detailed development roadmap with priorities and timelines
- Added version display in application footer
- Implemented Ride Buddy AI matchmaking system
- Enhanced UI with improved animations and transitions
- Optimized component performance

### Known Issues
- None reported

## Future Roadmap 🗺️

For detailed information on our development plans, priorities, and timelines, please refer to our comprehensive [ROADMAP.md](ROADMAP.md) document.

### Short-term (Q1 2025)
- [ ] User activity dashboard with cycling insights
- [ ] Integration with Cursor AI for code generation
- [ ] New "About Us" page
- [ ] Enhanced mobile responsiveness
- [ ] Improved accessibility features

### Mid-term (Q2-Q3 2025)
- [ ] Integration with popular cycling apps (Strava, Garmin)
- [ ] Advanced route planning features
- [ ] Weather integration for ride planning
- [ ] Ride statistics and analytics
- [ ] Social features enhancement

### Long-term (Q4 2025+)
- [ ] Mobile app development
- [ ] Advanced AI-powered route recommendations
- [ ] Virtual ride planning and simulation
- [ ] International expansion support
- [ ] Club management features

## Contributing 🤝

We welcome contributions! Please see our [contributing guidelines](CONTRIBUTING.md) for more information.

### Development Guidelines
- Follow our established coding standards
- Write tests for new features
- Update documentation as needed
- Use feature branches and pull requests

## License 📄

Copyright © 2025 GroupRideApp. All rights reserved.