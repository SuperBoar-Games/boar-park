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

### Start Backend Server
```bash
bun run dev

# Server runs on http://localhost:3000
```
### Start Frontend Server
```bash
bun run dev:react

# Server runs on http://localhost:3001
```


### Access Admin Interface
- Admin Dashboard: `http://localhost:3001/admin`




