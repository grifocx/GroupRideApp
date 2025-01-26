# Changelog

All notable changes to this project that affect deployments will be documented in this file.

## [Unreleased]
### Upcoming
- User activity dashboard with cycling insights

## [1.0.1] - 2025-01-26
### Added
- Password confirmation in change password dialog
- Improved dialog behavior with auto-close after successful password change
- App state refresh after password update

### Fixed
- Implemented proper password change functionality with crypto utilities
- Fixed dialog state management in profile page

## [1.0.0] - 2024
### Added
- Initial release with core ride sharing functionality
- User authentication system with Google OAuth and local auth
- Ride management system with CRUD operations
- Map integration with location services
- Calendar view for ride scheduling
- Admin dashboard for ride management
- Profile system with customizable avatars
- Real-time ride status updates
- Comments system for rides

### Database Changes
- Added user management with admin capabilities
- Implemented ride series and recurring rides functionality
- Added geocoding support for ride locations
- Enhanced user profiles with additional fields
- Added commenting system for rides

### Infrastructure
- Set up PostgreSQL database with Drizzle ORM
- Configured email notification system
- Implemented geocoding service integration
- Set up authentication middleware
- Configured deployment for autoscaling

### Security
- Secure session management
- Protected API endpoints with authentication
- Environment variable management for sensitive data

## Migration History
1. Initial schema setup with ride difficulty management
2. Enhanced user profiles with avatar and email support
3. Added route URL and description capabilities
4. Implemented recurring rides functionality
5. Added ride series management
6. Implemented user ride tracking
7. Added commenting system

For detailed technical changes, refer to the migrations folder.