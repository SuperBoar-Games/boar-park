# API Documentation

## Base URL
```
http://localhost:3000/api
```

## Games

### List All Games
```
GET /games
```
**Response:**
```json
[
  { "id": 1, "name": "Blast Alpha", "display_name": "Blast Alpha" }
]
```

### Get Heroes for Game
```
GET /games/:gameId/heroes
```
**Response:**
```json
[
  {
    "id": 1,
    "game_id": 1,
    "name": "Hero Name",
    "industry": "Industry"
  }
]
```

## Heroes

### Get Hero Movies
```
GET /heroes/:heroId/movies
```
**Response:**
```json
[
  {
    "id": 1,
    "hero_id": 1,
    "title": "Movie Title",
    "locked": false,
    "cards_count": 5,
    "review_count": 2
  }
]
```

### Create Hero
```
POST /heroes
Content-Type: application/json

{
  "game_id": 1,
  "name": "Hero Name",
  "industry": "Industry"
}
```

### Update Hero
```
PUT /heroes/:heroId
Content-Type: application/json

{
  "name": "New Name",
  "industry": "New Industry"
}
```

## Movies

### Get Movie Details
```
GET /movies/:movieId
```
**Response:**
```json
{
  "id": 1,
  "hero_id": 1,
  "title": "Movie Title",
  "locked": false,
  "cards": [...],
  "tags": [...]
}
```

### Get Movie Cards
```
GET /movies/:movieId/cards
```
**Response:**
```json
[
  {
    "id": 1,
    "movie_id": 1,
    "type": "Card Type",
    "name": "Card Name",
    "description": "...",
    "need_review": false
  }
]
```

### Create Movie
```
POST /movies
Content-Type: application/json

{
  "hero_id": 1,
  "title": "Movie Title"
}
```

### Update Movie
```
PUT /movies/:movieId
Content-Type: application/json

{
  "title": "New Title"
}
```

### Toggle Movie Lock
```
PATCH /movies/:movieId/locked
Content-Type: application/json

{
  "locked": true
}
```

## Cards

### Get Card Details
```
GET /cards/:cardId
```
**Response:**
```json
{
  "id": 1,
  "movie_id": 1,
  "type": "Card Type",
  "name": "Card Name",
  "description": "...",
  "need_review": false,
  "tags": [...]
}
```

### Create Card
```
POST /cards
Content-Type: application/json

{
  "movie_id": 1,
  "type": "Card Type",
  "name": "Card Name",
  "description": "..."
}
```

### Update Card
```
PUT /cards/:cardId
Content-Type: application/json

{
  "type": "New Type",
  "name": "New Name",
  "description": "..."
}
```

### Toggle Card Review Flag
```
PATCH /cards/:cardId/review
Content-Type: application/json

{
  "need_review": true
}
```

### Delete Card
```
DELETE /cards/:cardId
```

## Tags

### List All Tags
```
GET /tags
```
**Response:**
```json
[
  {
    "id": 1,
    "name": "Tag Name",
    "cards_count": 5
  }
]
```

### Create Tag
```
POST /tags
Content-Type: application/json

{
  "name": "Tag Name"
}
```

### Update Tag
```
PUT /tags/:tagId
Content-Type: application/json

{
  "name": "New Tag Name"
}
```

### Delete Tag
```
DELETE /tags/:tagId
```

### Add Tag to Card
```
POST /cards/:cardId/tags/:tagId
```

### Remove Tag from Card
```
DELETE /cards/:cardId/tags/:tagId
```

## Error Responses

All errors return with appropriate HTTP status codes:

```json
{
  "error": "Error message describing what went wrong"
}
```

**Common Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Server Error
