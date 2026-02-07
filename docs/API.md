# API Documentation

## Overview

This document lists all API endpoints available in the Boar Park application, including their HTTP methods, handlers, and access requirements.

## Table of Contents

- [Health Check](#health-check)
- [Authentication Routes](#authentication-routes)
- [Admin Routes](#admin-routes)
  - [User Management](#user-management)
  - [Roles & Games](#roles--games)
- [Games](#games)
- [Talkies Game Routes](#talkies-game-routes)
  - [Heroes](#heroes)
  - [Movies](#movies)
  - [Cards](#cards)
  - [Tags](#tags)

---

## Health Check

### GET /health

**Handler:** Built-in response
**Access:** Public
**Description:** Check if the server is running.

**Response:**
```json
{
  "status": "ok"
}
```

---

## Authentication Routes

### POST /api/auth/signup

**Handler:** `signupHandler`
**Access:** Public
**Description:** Create a new user account (pending admin approval).

**Request Body:**
```json
{
  "username": "string (3-32 chars, alphanumeric + underscore)",
  "email": "string (valid email format)",
  "password": "string (minimum 8 characters)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account created successfully. Please wait for admin approval.",
  "data": {
    "id": number,
    "username": "string",
    "email": "string",
    "status": "pending"
  }
}
```

---

### POST /api/auth/login

**Handler:** `loginHandler`
**Access:** Public
**Description:** Authenticate user and receive access/refresh tokens.

**Request Body:**
```json
{
  "usernameOrEmail": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": number,
      "username": "string",
      "email": "string",
      "status": "active",
      "roles": [
        {
          "gameId": number | null,
          "gameName": "string | null",
          "roleId": number,
          "roleName": "string"
        }
      ]
    },
    "accessToken": "string (JWT)",
    "refreshToken": "string (JWT)"
  }
}
```

---

### POST /api/auth/refresh

**Handler:** `refreshTokenHandler`
**Access:** Public
**Description:** Refresh expired access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "string (JWT)"
  }
}
```

---

### POST /api/auth/logout

**Handler:** `logoutHandler`
**Access:** Authenticated
**Description:** Revoke refresh token and log out user.

**Request Body:**
```json
{
  "refreshToken": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### POST /api/auth/request-reset

**Handler:** `requestPasswordResetHandler`
**Access:** Public
**Description:** Request a password reset link (sends email with reset token).

**Request Body:**
```json
{
  "email": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "If the email exists, a password reset link has been sent"
}
```

---

### POST /api/auth/reset-password

**Handler:** `resetPasswordHandler`
**Access:** Public
**Description:** Reset password using reset token from email.

**Request Body:**
```json
{
  "token": "string",
  "newPassword": "string (minimum 8 characters)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

### POST /api/auth/set-password

**Handler:** `setPasswordHandler`
**Access:** Public
**Description:** Set password for admin-created users on first login.

**Request Body:**
```json
{
  "token": "string",
  "password": "string (minimum 8 characters)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password set successfully. You can now log in."
}
```

---

### GET /api/auth/me

**Handler:** `getCurrentUserHandler`
**Access:** Authenticated (requires valid access token)
**Description:** Get current authenticated user's profile information.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": number,
    "username": "string",
    "email": "string",
    "status": "string",
    "isVerified": boolean,
    "roles": [
      {
        "gameId": number | null,
        "gameName": "string | null",
        "roleId": number,
        "roleName": "string"
      }
    ]
  }
}
```

---

### PUT /api/auth/me

**Handler:** `updateUserProfileHandler`
**Access:** Authenticated
**Description:** Update current user's profile (username, email, password).

**Request Body:**
```json
{
  "username": "string (optional, 3-32 chars)",
  "email": "string (optional, valid email)",
  "currentPassword": "string (required for verification)",
  "newPassword": "string (optional, minimum 8 characters)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": number,
    "username": "string",
    "email": "string",
    "status": "string"
  }
}
```

---

## Admin Routes

### User Management

#### GET /api/admin/users

**Handler:** `getAllUsersHandler`
**Access:** Admin only
**Description:** Get all users with their roles and status.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": number,
      "username": "string",
      "email": "string",
      "status": "string",
      "is_verified": boolean,
      "created_at": "string (ISO timestamp)",
      "roles": [
        {
          "gameId": number | null,
          "gameName": "string | null",
          "roleId": number,
          "roleName": "string"
        }
      ]
    }
  ]
}
```

---

#### GET /api/admin/users/pending

**Handler:** `getPendingUsersHandler`
**Access:** Admin only
**Description:** Get all pending (unapproved) user accounts.

**Response:** Same structure as `GET /api/admin/users`

---

#### POST /api/admin/users

**Handler:** `createUserHandler`
**Access:** Admin only
**Description:** Create a new user account (admin-created, requires password setup).

**Request Body:**
```json
{
  "username": "string (3-32 chars)",
  "email": "string (valid email)",
  "roleId": number,
  "gameId": number | null
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully. Password setup email sent.",
  "data": {
    "id": number,
    "username": "string",
    "email": "string",
    "status": "pending"
  }
}
```

---

#### POST /api/admin/users/{id}/approve

**Handler:** `approveUserHandler`
**Access:** Admin only
**Description:** Approve a pending user account.

**Response:**
```json
{
  "success": true,
  "message": "User approved successfully"
}
```

---

#### POST /api/admin/users/{id}/disable

**Handler:** `disableUserHandler`
**Access:** Admin only
**Description:** Disable an active user account.

**Response:**
```json
{
  "success": true,
  "message": "User disabled successfully"
}
```

---

#### POST /api/admin/users/{id}/send-reset-email

**Handler:** `sendResetEmailHandler`
**Access:** Admin only
**Description:** Send a password reset email to a user.

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

---

#### DELETE /api/admin/users/{id}

**Handler:** `deleteUserHandler`
**Access:** Admin only
**Description:** Permanently delete a user account.

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

#### PUT /api/admin/users/{id}/email

**Handler:** `updateUserEmailHandler`
**Access:** Admin only
**Description:** Update a user's email address.

**Request Body:**
```json
{
  "email": "string (valid email)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email updated successfully"
}
```

---

#### PUT /api/admin/users/{id}/username

**Handler:** `updateUserUsernameHandler`
**Access:** Admin only
**Description:** Update a user's username.

**Request Body:**
```json
{
  "username": "string (3-32 chars)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Username updated successfully"
}
```

---

#### GET /api/admin/users/{id}/roles

**Handler:** `getUserRolesHandler`
**Access:** Admin only
**Description:** Get all roles assigned to a specific user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "gameId": number | null,
      "gameName": "string | null",
      "roleId": number,
      "roleName": "string"
    }
  ]
}
```

---

### Roles & Games

#### GET /api/admin/roles

**Handler:** `getAllRolesHandler`
**Access:** Admin only
**Description:** Get all available roles in the system.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": number,
      "name": "string"
    }
  ]
}
```

---

#### GET /api/admin/games

**Handler:** `getAllGamesHandler` (from admin.handler)
**Access:** Admin only
**Description:** Get all games in the system.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": number,
      "slug": "string",
      "name": "string"
    }
  ]
}
```

---

#### POST /api/admin/assign-role

**Handler:** `assignRoleHandler`
**Access:** Admin only
**Description:** Assign a role to a user for a specific game.

**Request Body:**
```json
{
  "userId": number,
  "roleId": number,
  "gameId": number | null
}
```

**Response:**
```json
{
  "success": true,
  "message": "Role assigned successfully"
}
```

---

#### POST /api/admin/remove-role

**Handler:** `removeRoleHandler`
**Access:** Admin only
**Description:** Remove a role from a user.

**Request Body:**
```json
{
  "userId": number,
  "roleId": number,
  "gameId": number | null
}
```

**Response:**
```json
{
  "success": true,
  "message": "Role removed successfully"
}
```

---

## Games

#### GET /api/games

**Handler:** `getGamesForUser` (custom permission logic)
**Access:** Authenticated
**Description:** Get all games the authenticated user has access to (based on roles).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": number,
      "slug": "string",
      "name": "string"
    }
  ]
}
```

---

#### GET /api/games/{gameSlug}

**Handler:** `getGameHandler`
**Access:** Authenticated (requires viewer+ role for the game)
**Description:** Get details for a specific game.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": number,
    "slug": "string",
    "name": "string"
  }
}
```

---

## Talkies Game Routes

### Heroes

#### GET /api/talkies/heroes

**Handler:** `getHeroesHandler`
**Access:** Public
**Description:** Get all heroes in the Talkies game.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": number,
      "name": "string",
      "industry": "string"
    }
  ]
}
```

---

#### POST /api/talkies/heroes

**Handler:** `createHeroHandler`
**Access:** Public
**Description:** Create a new hero.

**Request Body:**
```json
{
  "name": "string",
  "industry": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Hero created successfully",
  "data": {
    "id": number,
    "name": "string",
    "industry": "string"
  }
}
```

---

#### PUT /api/talkies/heroes/{id}

**Handler:** `updateHeroHandler`
**Access:** Public
**Description:** Update a hero's information.

**Request Body:**
```json
{
  "name": "string",
  "industry": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Hero updated successfully"
}
```

---

#### DELETE /api/talkies/heroes/{id}

**Handler:** `deleteHeroHandler`
**Access:** Public
**Description:** Delete a hero.

**Response:**
```json
{
  "success": true,
  "message": "Hero deleted successfully"
}
```

---

### Movies

#### GET /api/talkies/movies

**Handler:** `getMoviesByHeroIdHandler`
**Access:** Public
**Query Parameters:**
- `heroId` (required): The ID of the hero

**Description:** Get all movies for a specific hero.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": number,
      "hero_id": number,
      "hero_name": "string",
      "title": "string",
      "done": boolean,
      "locked": boolean,
      "need_review": boolean,
      "total_cards": number,
      "review_cards": number
    }
  ]
}
```

---

#### POST /api/talkies/movies

**Handler:** `createMovieHandler`
**Access:** Public
**Description:** Create a new movie for a hero.

**Request Body:**
```json
{
  "title": "string",
  "heroId": number
}
```

**Response:**
```json
{
  "success": true,
  "message": "Movie created successfully",
  "data": {
    "id": number,
    "hero_id": number,
    "title": "string",
    "done": boolean,
    "locked": boolean,
    "need_review": boolean
  }
}
```

---

#### PUT /api/talkies/movies/{id}

**Handler:** `updateMovieTitleHandler`
**Access:** Public
**Description:** Update a movie's title.

**Request Body:**
```json
{
  "title": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Movie updated successfully"
}
```

---

#### PATCH /api/talkies/movies/{id}/review

**Handler:** `updateMovieReviewHandler`
**Access:** Public
**Description:** Toggle movie review flag.

**Request Body:**
```json
{
  "need_review": boolean
}
```

**Response:**
```json
{
  "success": true,
  "message": "Movie review status updated"
}
```

---

#### PATCH /api/talkies/movies/{id}/locked

**Handler:** `updateMovieLockedHandler`
**Access:** Public
**Description:** Toggle movie locked status.

**Request Body:**
```json
{
  "locked": boolean
}
```

**Response:**
```json
{
  "success": true,
  "message": "Movie locked status updated"
}
```

---

#### DELETE /api/talkies/movies/{id}

**Handler:** `deleteMovieHandler`
**Access:** Public
**Description:** Delete a movie.

**Response:**
```json
{
  "success": true,
  "message": "Movie deleted successfully"
}
```

---

### Cards

#### GET /api/talkies/cards

**Handler:** `getCardsByHeroAndMovieHandler` or `getAllCardsByHeroHandler`
**Access:** Public
**Query Parameters:**
- `heroId` (required): The ID of the hero
- `movieId` (optional): The ID of the movie. If not provided, returns all cards for the hero.

**Description:** Get cards for a hero (optionally filtered by movie).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": number,
      "hero_id": number,
      "movie_id": number,
      "movie_title": "string",
      "name": "string",
      "type": "string",
      "call_sign": "string",
      "ability_text": "string",
      "ability_text2": "string",
      "need_review": boolean,
      "movie_locked": boolean
    }
  ]
}
```

---

#### POST /api/talkies/cards

**Handler:** `createCardHandler`
**Access:** Public
**Description:** Create a new card.

**Request Body:**
```json
{
  "hero_id": number,
  "movie_id": number,
  "name": "string",
  "type": "string",
  "call_sign": "string",
  "ability1": "string",
  "ability2": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Card created successfully",
  "data": {
    "id": number,
    "hero_id": number,
    "movie_id": number,
    "name": "string",
    "type": "string",
    "call_sign": "string"
  }
}
```

---

#### PUT /api/talkies/cards/{id}

**Handler:** `updateCardHandler`
**Access:** Public
**Description:** Update a card's information.

**Request Body:**
```json
{
  "name": "string",
  "type": "string",
  "call_sign": "string",
  "ability1": "string",
  "ability2": "string",
  "need_review": boolean
}
```

**Response:**
```json
{
  "success": true,
  "message": "Card updated successfully"
}
```

---

#### DELETE /api/talkies/cards/{id}

**Handler:** `deleteCardHandler`
**Access:** Public
**Description:** Delete a card.

**Response:**
```json
{
  "success": true,
  "message": "Card deleted successfully"
}
```

---

### Tags

#### GET /api/talkies/tags

**Handler:** `getTagCountsByHeroHandler` or `getTagsHandler`
**Access:** Public
**Query Parameters:**
- `heroId` (optional): The ID of the hero. If provided, returns tag counts for that hero.

**Description:** Get all tags (optionally with counts for a specific hero).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": number,
      "name": "string",
      "count": number (if heroId provided)
    }
  ]
}
```

---

#### POST /api/talkies/tags

**Handler:** `createTagHandler`
**Access:** Public
**Description:** Create a new tag.

**Request Body:**
```json
{
  "name": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tag created successfully",
  "data": {
    "id": number,
    "name": "string"
  }
}
```

---

#### PUT /api/talkies/tags/{id}

**Handler:** `updateTagHandler`
**Access:** Public
**Description:** Update a tag's name.

**Request Body:**
```json
{
  "name": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tag updated successfully"
}
```

---

#### DELETE /api/talkies/tags/{id}

**Handler:** `deleteTagHandler`
**Access:** Public
**Description:** Delete a tag.

**Response:**
```json
{
  "success": true,
  "message": "Tag deleted successfully"
}
```

---

## Authentication

Most endpoints require a bearer token in the `Authorization` header:

```
Authorization: Bearer {accessToken}
```

### Token Types

- **Access Token**: Short-lived (2 hours), used for API requests
- **Refresh Token**: Long-lived (30 days), used to obtain new access tokens

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Error description"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Admin access required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Server error description"
}
```
