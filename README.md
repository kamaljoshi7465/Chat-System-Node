# Chat Backend

## Overview
This repository implements a simple chat backend API using **Node.js**, **Express**, **TypeScript**, and **Prisma**. It provides endpoints for:
- User registration and retrieval of a user's chats
- Creating or retrieving a chat between two users
- Sending messages, fetching messages, marking messages as read, and updating a user's last‑seen timestamp

The codebase now uses a shared **type definitions** file (`src/types/common.ts`) to keep request payloads consistent across controllers.

## Project Structure
```
chat-backend/
├─ src/
│  ├─ app.ts                 # Express app configuration
│  ├─ server.ts              # Starts the HTTP server
│  ├─ config/                # Database and Firebase config
│  ├─ controllers/           # Route handlers (user, chat, message)
│  ├─ services/              # Business logic interacting with Prisma
│  ├─ routes/                # Express routers exposing the API
│  └─ types/                 # Shared TypeScript types
├─ prisma/                   # Prisma schema & migrations
├─ postman_collection.json   # Postman collection for API testing
├─ package.json
└─ README.md               
```

## Prerequisites
- **Node.js** (v20+ recommended)
- **npm** or **yarn**
- **Docker** (optional, for running a local PostgreSQL instance)
- **Firebase service account** JSON placed in `credentials/firebase-service-account.json`

## Setup
1. **Install dependencies**
   ```bash
   cd /home/dell/Desktop/chat-backend
   npm install
   ```
2. **Configure the database**
   - Update `src/config/database.ts` with your PostgreSQL connection string.
   - Run Prisma migrations:
     ```bash
     npx prisma migrate dev --name init
     ```
3. **Configure Firebase**
   - Place your Firebase service‑account JSON at `credentials/firebase-service-account.json`.
   - Ensure `src/config/firebase.ts` points to that file.
4. **Build & run**
   ```bash
   npm run dev   # starts the server on http://localhost:5000
   ```

## Shared Types (`src/types/common.ts`)
```ts
export type UUID = string;

export interface CreateUserPayload {
  name: string;
  email: string;
}

export interface CreateChatPayload {
  userId: UUID;            // initiator
  title?: string;
}

export interface SendMessagePayload {
  chatId: UUID;
  senderId: UUID;
  content: string;         // <-- uses "content" instead of "text"
}

export interface MarkReadPayload {
  userId: UUID;
  messageId: string;       // Firestore doc ID (arbitrary string)
}

export interface UpdateLastSeenPayload {
  userId: UUID;
  messageId: string;
}
```
All controllers import these definitions, ensuring type safety and a single source of truth.

## API Endpoints
| Method | Path | Description | Body (JSON) |
|--------|------|-------------|------------|
| **POST** | `/user/create` | Create a new user | `CreateUserPayload` |
| **GET** | `/user/:userId/chats` | List all chats for a user | – |
| **POST** | `/chat/create` | Create or retrieve a chat between two users | `{ "userAId": "<uuid>", "userBId": "<uuid>" }` |
| **POST** | `/chat/:chatId/message/send` | Send a message in a chat | `SendMessagePayload` (uses `content`) |
| **GET** | `/chat/:chatId/messages` | Retrieve messages (optional `limit` query) | – |
| **POST** | `/chat/:chatId/message/:messageId/read` | Mark a message as read | `MarkReadPayload` |
| **POST** | `/chat/:chatId/lastseen` | Update the last‑seen timestamp for a user | `UpdateLastSeenPayload` |

### Example cURL (Send Message)
```bash
curl -X POST http://localhost:5000/chat/12345/message/send \
  -H "Content-Type: application/json" \
  -d '{"chatId":"12345","senderId":"user-abc","content":"Hello world!"}'
```

## Postman Collection
- The file `postman_collection.json` is included and automatically reflects the updated payloads (e.g., `content` instead of `text`).

## Scripts
| Script | Purpose |
|--------|---------|
| `npm run dev` | Start the server with `ts-node-dev` (watch mode) |
| `npm run build` | Compile TypeScript to JavaScript (`dist/`) |
| `npm start` | Run the compiled code (`node dist/server.js`) |

## Development Tips
- **Hot reload**: `npm run dev` watches for changes.
- **Database reset**: `npx prisma migrate reset` will drop and re‑apply all migrations.
- **Adding new endpoints**: create a new controller, add a route in `src/routes/`, and update the Postman collection.


## Environment Variables (.env)
Create a `.env` file in the project root with the following keys (adjust values as needed):
```
# Server
PORT=5000

# Database (PostgreSQL) – Prisma reads this variable
DATABASE_URL=postgresql://<USER>:<PASSWORD>@localhost:5432/<DB_NAME>?schema=public

# Firebase
FIREBASE_SERVICE_ACCOUNT_PATH="./credentials/firebase-service-account.json"
```
The project uses `dotenv` (imported in `src/app.ts`) to load these variables at runtime.

## Database Setup

### Local Installation
If you have PostgreSQL installed locally, create a database and user:

```sql
CREATE DATABASE chatdb;
CREATE USER chat_user WITH ENCRYPTED PASSWORD 'securepassword';
GRANT ALL PRIVILEGES ON DATABASE chatdb TO chat_user;
```

Then set `DATABASE_URL` in your `.env`:

```
DATABASE_URL=postgresql://chat_user:securepassword@localhost:5432/chatdb?schema=public
```
If you have PostgreSQL installed locally, create a database and user:
```sql
CREATE DATABASE chatdb;
CREATE USER chat_user WITH ENCRYPTED PASSWORD 'securepassword';
GRANT ALL PRIVILEGES ON DATABASE chatdb TO chat_user;
```
Then set `DATABASE_URL` accordingly, e.g.:
```
DATABASE_URL=postgresql://chat_user:securepassword@localhost:5432/chatdb?schema=public
```
### Prisma Migration
With the `DATABASE_URL` configured, run:
```bash
npx prisma migrate dev --name init   # creates tables and a migration file
npx prisma generate                # generates the Prisma client
```
To reset the database during development:
```bash
npx prisma migrate reset
```

Now the backend is ready to connect to the database and you can start the server as described in the **Setup** section.
