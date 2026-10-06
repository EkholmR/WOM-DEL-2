# Notes API (Part 2)

REST API for collaborative notes. Notes belong to boards, and each board lists which users may access it. Authentication uses JWTs issued by the separate login service (Part 1).

**Stack:** Node.js, Express, PostgreSQL (Neon)

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in the values:
   - `DATABASE_URL`: PostgreSQL connection string (separate database from the login service)
   - `JWT_SECRET`: must be identical to the secret used by the login service
   - `PORT`: optional, defaults to 3000
3. Run `schema.sql` in your database to create the tables and example boards.
4. `npm run dev` (development) or `npm start` (production)

Boards are added manually in the database. Put the user IDs from the login service in `allowed_user_ids`.

## Authentication

Every request to `/boards/...` needs a token from the login service:

```
Authorization: Bearer <token>
```

The token must be signed with HS256, and the user ID is read from the `sub` claim.

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Check server and database |
| GET | `/boards/:boardId/notes` | List notes on a board |
| GET | `/boards/:boardId/notes/:noteId` | Get one note |
| POST | `/boards/:boardId/notes` | Create a note (`title` required, `content` optional) |
| PATCH | `/boards/:boardId/notes/:noteId` | Update `title` and/or `content` (author only) |
| DELETE | `/boards/:boardId/notes/:noteId` | Delete a note (author only) |

All `/boards/...` routes require the user to be listed in the board's `allowed_user_ids`.

## Status codes

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Note created |
| 204 | Note deleted |
| 400 | Invalid input, invalid id, or malformed JSON |
| 401 | Missing, invalid or expired token |
| 403 | No access to the board, or not the author of the note |
| 404 | Board, note or route not found |
| 500 | Server error |

Errors are returned as JSON: `{ "error": "message" }`.