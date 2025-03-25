# Database Schema Documentation

This document describes the database schema used in GroupRideApp.

## Overview

GroupRideApp uses PostgreSQL with Drizzle ORM. The schema includes robust type validation with Zod and implements Row Level Security (RLS) for data protection.

## Tables

### Users

The `users` table stores user account information and profile details.

| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| username | text | Unique username |
| password | text | Hashed password (for local authentication) |
| email | text | User's email address |
| googleId | text | Google OAuth ID (for Google authentication) |
| avatarUrl | text | URL to user's avatar image |
| isAdmin | boolean | Administrator flag |
| emailVerified | boolean | Email verification status |
| display_name | text | User's display name |
| zip_code | text | User's zip code |
| club | text | Cycling club affiliation |
| home_bike_shop | text | Preferred bike shop |
| gender | text | User's gender |
| birthdate | date | User's birthdate |
| created_at | timestamp | Account creation timestamp |
| updated_at | timestamp | Last update timestamp |

### Rides

The `rides` table stores information about cycling rides.

| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| title | text | Ride title |
| description | text | Detailed ride description |
| dateTime | timestamp | Ride date and time |
| distance | numeric | Ride distance in miles |
| address | text | Meeting location address |
| lat | text | Latitude of meeting location |
| lon | text | Longitude of meeting location |
| maxRiders | integer | Maximum number of participants |
| difficulty | text | Ride difficulty level |
| pace | numeric | Average ride pace (mph) |
| rideType | text | Type of ride (Road, MTB, Gravel, etc.) |
| terrain | text | Type of terrain |
| status | text | Ride status (active, archived) |
| ownerId | integer | Reference to ride creator (user.id) |
| created_at | timestamp | Ride creation timestamp |
| updated_at | timestamp | Last update timestamp |
| route_url | text | URL to route map |
| is_recurring | boolean | Whether ride is recurring |
| recurring_type | text | Recurrence pattern (weekly, monthly) |
| recurring_end_date | timestamp | End date for recurring ride series |

### Ride Participants

The `ride_participants` table tracks which users are participating in which rides.

| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| rideId | integer | Reference to ride.id |
| userId | integer | Reference to user.id |
| created_at | timestamp | Participation registration timestamp |

### Ride Comments

The `ride_comments` table stores comments made on rides.

| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| rideId | integer | Reference to ride.id |
| userId | integer | Reference to user.id (comment author) |
| content | text | Comment content |
| isPinned | boolean | Whether comment is pinned |
| created_at | timestamp | Comment creation timestamp |
| updated_at | timestamp | Last update timestamp |

### Rider Preferences

The `rider_preferences` table stores user preferences for ride matching.

| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| userId | integer | Reference to user.id |
| preferred_ride_types | text[] | Array of ride types (Road, MTB, etc.) |
| min_distance | numeric | Minimum preferred ride distance |
| max_distance | numeric | Maximum preferred ride distance |
| min_pace | numeric | Minimum preferred ride pace |
| max_pace | numeric | Maximum preferred ride pace |
| preferred_terrain | text[] | Array of terrain preferences |
| preferred_difficulty | text[] | Array of difficulty preferences |
| available_days | text[] | Array of available days |
| zip_code | text | Preferred ride location zip code |
| matching_radius | integer | Distance willing to travel for rides (miles) |
| updated_at | timestamp | Last update timestamp |

### Rider Matches

The `rider_matches` table stores compatibility scores between users.

| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| user_id_1 | integer | Reference to first user.id |
| user_id_2 | integer | Reference to second user.id |
| compatibility_score | numeric | Match compatibility percentage |
| created_at | timestamp | Match calculation timestamp |
| updated_at | timestamp | Last update timestamp |

### User Activity Stats

The `user_activity_stats` table tracks user activity statistics.

| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| userId | integer | Reference to user.id |
| total_rides | integer | Total rides participated in |
| total_distance | numeric | Total distance ridden |
| total_created_rides | integer | Total rides created |
| last_ride_date | timestamp | Date of last ride |
| updated_at | timestamp | Last update timestamp |

### User Monthly Stats

The `user_monthly_stats` table tracks monthly activity statistics.

| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| userId | integer | Reference to user.id |
| year_month | text | Year and month (format: YYYY-MM) |
| rides_count | integer | Rides in that month |
| distance | numeric | Distance in that month |
| created_rides | integer | Rides created in that month |
| updated_at | timestamp | Last update timestamp |

## Relationships

The schema includes the following relationships:

- A user can own multiple rides (one-to-many)
- A user can participate in multiple rides (many-to-many through ride_participants)
- A ride has one owner (many-to-one with users)
- A ride can have multiple participants (many-to-many through ride_participants)
- A ride can have multiple comments (one-to-many with ride_comments)
- A user can have one set of riding preferences (one-to-one)
- A user can have multiple rider matches (many-to-many through rider_matches)
- A user has one activity stats record (one-to-one)
- A user can have multiple monthly stats records (one-to-many)

## Enumerations

The schema defines the following enumerations for data consistency:

### RideStatus
- `active`: Currently active ride
- `archived`: Past or cancelled ride

### DifficultyLevel
- `easy`: Beginner-friendly rides
- `moderate`: Intermediate difficulty
- `challenging`: Advanced rides
- `difficult`: Expert-level rides

### RideType
- `road`: Road biking
- `mountain`: Mountain biking
- `gravel`: Gravel riding
- `casual`: Casual/recreational rides
- `training`: Training-focused rides
- `bikepacking`: Multi-day bikepacking routes

### TerrainType
- `flat`: Flat terrain
- `rolling`: Rolling hills
- `hilly`: Significant hills
- `mountainous`: Mountain terrain
- `mixed`: Mixed terrain types

### RecurringType
- `weekly`: Repeats weekly
- `biweekly`: Repeats every two weeks
- `monthly`: Repeats monthly

## Row Level Security (RLS)

The database implements Row Level Security policies to ensure that:

- Users can only see and modify their own profile data
- Ride owners can edit their own rides
- Any user can view active rides
- Only ride participants can view ride details and comments
- Only admins can access administrative functions and data
- User activity data is only visible to the user and admins