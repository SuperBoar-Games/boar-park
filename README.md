# Boar Park Admin

A modern admin interface for managing games, heroes, movies, cards, and tags.

## Setup & Local Development

### Prerequisites
- Node.js/Bun installed
- PostgreSQL running
- Environment variables configured

### Installation
```bash
# Clone repository
git clone <repo-url>
cd boar-park

# Install dependencies
bun install
```

### Environment Setup
Create `.env` file in root:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/boar_park
PORT=3000
```

### Start Development Server
```bash
# Start Bun dev server
bun run dev

# Server runs on http://localhost:3000
```

### Access Admin Interface
- Admin Dashboard: `http://localhost:3000/admin`
- Talkies Management: `http://localhost:3000/admin/games/talkies`

## Project Structure
```
/frontend/admin           # Admin UI
  /games/talkies         # Talkies game management
  header.css             # Shared header/theme styles
  style.css              # Admin page styles

/functions/api           # API endpoints
/db                      # Database schema & migrations
```

## Documentation
- [API Documentation](./docs/API.md) - REST endpoints and request/response formats
- [Database Documentation](./docs/DATABASE.md) - Schema, tables, and materialized views

