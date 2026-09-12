# Interview AI Platform

A full-stack AI-powered interview platform built with React, Vite, Express, Supabase, and Google Gemini. Users can register, authenticate, complete interviews, and receive generated interview reports. Administrators can monitor users and platform status.

## Features

- User registration and login
- Protected user and admin routes
- AI-generated interview questions and feedback
- Interview reports and score tracking
- Supabase-backed persistence
- Admin dashboard
- Docker and Vercel deployment configuration

## Tech Stack

- **Frontend:** React, React Router, Vite, Sass
- **Backend:** Node.js, Express
- **Database and authentication support:** Supabase
- **AI:** Google GenAI / Gemini
- **Deployment:** Docker and Vercel

## Project Structure

```text
.
├── api/                    # Vercel serverless entry point
├── controllers/            # Backend request handlers
├── frontend/interview/     # React + Vite frontend
├── middleware/             # Authentication, admin, and file middleware
├── routes/                 # Backend route definitions
├── src/
│   ├── app.js              # Express application
│   ├── config/             # Database configuration
│   ├── models/             # Application models
│   └── services/           # AI and other services
├── supabase/               # Database schema
├── server.js               # Local backend entry point
└── docker-compose.yml      # Docker services
```

## Requirements

- Node.js 18 or newer
- npm
- A Supabase project
- A Google Gemini API key

## Setup

1. Clone the repository:

   ```bash
   git clone <your-repository-url>
   cd gen-ai
   ```

2. Install backend dependencies:

   ```bash
   npm install
   ```

3. Install frontend dependencies:

   ```bash
   cd frontend/interview
   npm install
   cd ../..
   ```

4. Create a `.env` file in the project root:

   ```env
   PORT=3000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   JWT_SECRET=replace-with-a-random-secret-at-least-32-characters-long
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   GOOGLE_GENAI_API_KEY=your-google-genai-api-key
   CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
   VITE_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
   ```

5. Apply the database schema from [`supabase/schema.sql`](supabase/schema.sql) to your Supabase project.

For production SEO, create `frontend/interview/.env.production` locally or configure these variables in your deployment provider:

```env
VITE_SITE_URL=https://your-production-domain.com
VITE_GOOGLE_SITE_VERIFICATION=your-search-console-token
```

`VITE_SITE_URL` generates the canonical URL, Open Graph URL, `robots.txt`, and sitemap. `VITE_GOOGLE_SITE_VERIFICATION` injects the Google Search Console verification tag when provided. Never commit the verification token to this repository. After deployment, submit `https://your-production-domain.com/sitemap.xml` in Google Search Console.
## Running Locally

Start the backend from the project root:

```bash
npm run dev
```

In a second terminal, start the frontend:

```bash
cd frontend/interview
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser. The backend runs at [http://localhost:3000](http://localhost:3000).

## Production Build

Build the frontend from the project root:

```bash
npm run build
```

Start the backend:

```bash
npm start
```

## Docker

Create a root `.env` file with the required values, then run:

```bash
docker compose up --build
```

The frontend is available at `http://localhost:5173` and the backend at `http://localhost:3000`.

## Deployment

The repository includes `vercel.json` for Vercel routing. Configure the required environment variables in the hosting provider before deploying. The frontend build output is generated in `frontend/interview/dist`.

## Security

- Never commit `.env` files, API keys, Supabase service-role keys, or production JWT secrets.
- Use a unique, long random value for `JWT_SECRET` in production.
- Keep `SUPABASE_SERVICE_ROLE_KEY` on the server only.
- Review and replace any development credentials before deploying.

## License

This project is currently private/unlicensed. Add a license before distributing it publicly.
