# GroupRideApp API Documentation

This document describes the API endpoints available in the GroupRideApp.

## Authentication Endpoints

### Register User
- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Description**: Registers a new user
- **Request Body**:
  ```json
  {
    "username": "string",
    "password": "string",
    "email": "string"
  }
  ```
- **Response**: User object

### Login
- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Description**: Authenticates a user and creates a session
- **Request Body**:
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **Response**: User object

### Logout
- **URL**: `/api/auth/logout`
- **Method**: `POST`
- **Description**: Logs out the current user and destroys the session
- **Response**: Success message

### Get Current User
- **URL**: `/api/auth/session`
- **Method**: `GET`
- **Description**: Returns the currently authenticated user
- **Response**: User object or null if not authenticated

### Change Password
- **URL**: `/api/auth/change-password`
- **Method**: `POST`
- **Description**: Changes the password for the authenticated user
- **Request Body**:
  ```json
  {
    "currentPassword": "string",
    "newPassword": "string"
  }
  ```
- **Response**: Success message

## User Endpoints

### Update User Profile
- **URL**: `/api/users/:id`
- **Method**: `PUT`
- **Description**: Updates the user's profile information
- **Request Body**: User profile fields to update
- **Response**: Updated user object

### Upload Avatar
- **URL**: `/api/users/:id/avatar`
- **Method**: `POST`
- **Description**: Uploads a user avatar image
- **Request Body**: Form data with image file
- **Response**: Avatar URL

## Ride Endpoints

### Get All Rides
- **URL**: `/api/rides`
- **Method**: `GET`
- **Description**: Returns all active rides
- **Query Parameters**:
  - `status`: Filter by ride status (active/archived)
- **Response**: Array of ride objects with owner and participant information

### Get User Rides
- **URL**: `/api/users/rides`
- **Method**: `GET`
- **Description**: Returns rides created by or participated in by the current user
- **Response**: Object with `owned` and `participating` arrays of ride objects

### Create Ride
- **URL**: `/api/rides`
- **Method**: `POST`
- **Description**: Creates a new ride
- **Request Body**: Ride information including title, date, location, etc.
- **Response**: Created ride object

### Get Ride by ID
- **URL**: `/api/rides/:id`
- **Method**: `GET`
- **Description**: Returns a specific ride by ID
- **Response**: Ride object with owner and participant information

### Update Ride
- **URL**: `/api/rides/:id`
- **Method**: `PUT`
- **Description**: Updates a ride
- **Request Body**: Ride fields to update
- **Response**: Updated ride object

### Delete Ride
- **URL**: `/api/rides/:id`
- **Method**: `DELETE`
- **Description**: Deletes a ride
- **Response**: Success message

### Join Ride
- **URL**: `/api/rides/:id/join`
- **Method**: `POST`
- **Description**: Adds the current user as a participant to a ride
- **Response**: Updated ride object

### Leave Ride
- **URL**: `/api/rides/:id/leave`
- **Method**: `POST`
- **Description**: Removes the current user from a ride's participants
- **Response**: Updated ride object

## Comment Endpoints

### Add Comment
- **URL**: `/api/rides/:id/comments`
- **Method**: `POST`
- **Description**: Adds a comment to a ride
- **Request Body**:
  ```json
  {
    "content": "string"
  }
  ```
- **Response**: Created comment object

### Pin Comment
- **URL**: `/api/rides/:rideId/comments/:commentId/pin`
- **Method**: `POST`
- **Description**: Pins a comment to a ride (ride owner only)
- **Response**: Updated comment object

### Edit Comment
- **URL**: `/api/rides/:rideId/comments/:commentId`
- **Method**: `PUT`
- **Description**: Edits a comment (comment owner only)
- **Request Body**:
  ```json
  {
    "content": "string"
  }
  ```
- **Response**: Updated comment object

### Delete Comment
- **URL**: `/api/rides/:rideId/comments/:commentId`
- **Method**: `DELETE`
- **Description**: Deletes a comment (comment owner or ride owner only)
- **Response**: Success message

## Rider Preferences Endpoints

### Get Rider Preferences
- **URL**: `/api/rider-preferences`
- **Method**: `GET`
- **Description**: Gets the rider preferences for the current user
- **Response**: Rider preferences object

### Update Rider Preferences
- **URL**: `/api/rider-preferences`
- **Method**: `POST`
- **Description**: Creates or updates rider preferences for the current user
- **Request Body**: Rider preferences data
- **Response**: Updated rider preferences object

### Get Rider Matches
- **URL**: `/api/rider-matches`
- **Method**: `GET`
- **Description**: Gets potential rider matches based on preferences
- **Response**: Array of matched users with compatibility scores

## Admin Endpoints

### Get All Users (Admin Only)
- **URL**: `/api/admin/users`
- **Method**: `GET`
- **Description**: Returns all users (admin access required)
- **Response**: Array of user objects

### Update User (Admin Only)
- **URL**: `/api/admin/users/:id`
- **Method**: `PUT`
- **Description**: Updates a user (admin access required)
- **Request Body**: User fields to update
- **Response**: Updated user object

### Get All Rides (Admin Only)
- **URL**: `/api/admin/rides`
- **Method**: `GET`
- **Description**: Returns all rides (admin access required)
- **Response**: Array of ride objects

### Update Ride (Admin Only)
- **URL**: `/api/admin/rides/:id`
- **Method**: `PUT`
- **Description**: Updates any ride (admin access required)
- **Request Body**: Ride fields to update
- **Response**: Updated ride object

## Activity Stats Endpoints

### Get User Activity Stats
- **URL**: `/api/stats/activity`
- **Method**: `GET`
- **Description**: Gets activity statistics for the current user
- **Response**: User activity stats object

### Get User Monthly Stats
- **URL**: `/api/stats/monthly`
- **Method**: `GET`
- **Description**: Gets monthly statistics for the current user
- **Response**: Array of monthly stats objects

## Error Responses

All API endpoints return appropriate HTTP status codes:

- `200 OK`: Request succeeded
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

Error responses include a JSON object with details:

```json
{
  "error": "Error message",
  "details": "Additional error details (if available)"
}
```