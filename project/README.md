# Smart Notes and Task Manager

This project provides a Node.js + Express backend with MongoDB for managing users, notes, and tasks.

## Project Structure

```
project/
|-- client/
|   |-- index.html
|   |-- dashboard.html
|   |-- style.css
|   `-- script.js
|-- server/
|   |-- config/
|   |   `-- db.js
|   |-- controllers/
|   |   |-- authController.js
|   |   |-- noteController.js
|   |   `-- taskController.js
|   |-- middleware/
|   |   |-- authMiddleware.js
|   |   `-- errorMiddleware.js
|   |-- models/
|   |   |-- Note.js
|   |   |-- Task.js
|   |   `-- User.js
|   |-- routes/
|   |   |-- authRoutes.js
|   |   |-- noteRoutes.js
|   |   `-- taskRoutes.js
|   `-- server.js
|-- .env
|-- package.json
`-- README.md
```

## Setup

1. Install dependencies:
   npm install

2. Update `.env` values for your MongoDB and JWT secret.

3. Set frontend API URL in `client/config.js`:
   - Local: `http://localhost:5000/api`
   - Production example: `https://your-backend-domain.com/api`

4. Start the server:
   npm run dev

## Production URI Configuration

### Backend (.env)
- `MONGO_URI`: use your MongoDB Atlas connection URI.
- `JWT_SECRET`: set a long random secret string.
- `CLIENT_ORIGIN`: optional comma-separated frontend URLs for CORS, example:
  `CLIENT_ORIGIN=https://your-frontend.netlify.app,https://your-frontend.vercel.app`

### Frontend (client/config.js)
- Set `API_BASE_URL` to your deployed backend API URL ending with `/api`.
- Example: `https://smart-notes-api.onrender.com/api`

## Deploy (Single Service on Render)

This project is configured so Express serves both API and frontend from one service.

### URLs after deploy
- UI: `/`
- API status: `/api`
- API health: `/health`

### Steps
1. Push repository to GitHub.
2. In Render, create a new Blueprint and select this repository.
3. Render will detect `render.yaml` at repo root.
4. Set secret env vars in Render:
    - `MONGO_URI`
    - `JWT_SECRET`
5. Deploy.

### Notes
- `rootDir` is already configured as `project` in `render.yaml`.
- Frontend API URL auto-resolves:
   - Local file testing: `http://localhost:5000/api`
   - Deployed app: `<your-render-domain>/api`

## API Endpoints

### Auth
- POST /api/auth/signup
- POST /api/auth/login

### Notes (Protected)
- POST /api/notes
- GET /api/notes
- PUT /api/notes/:id
- DELETE /api/notes/:id

### Tasks (Protected)
- POST /api/tasks
- GET /api/tasks
- PUT /api/tasks/:id
- DELETE /api/tasks/:id

## Authentication

Use the JWT from signup/login in the request header:

Authorization: Bearer <token>
