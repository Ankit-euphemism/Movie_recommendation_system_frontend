# Movie Recommendation System

A full-stack movie recommendation app that combines content-based filtering, collaborative filtering, and user profile tracking to suggest movies based on a user's likes and viewing behavior.

## Overview

This project contains:

- A FastAPI backend for authentication, recommendation logic, and movie streaming metadata
- A React + Vite frontend for browsing movies and viewing recommendations
- A PostgreSQL/Supabase data layer for user accounts and liked movies
- A hybrid recommendation engine using:
  - content similarity based on movie metadata
  - collaborative filtering with SVD
  - user watch percentage signals to update taste profiles

## Tech Stack

### Backend
- Python
- FastAPI
- SQLAlchemy
- PostgreSQL / Supabase
- JWT authentication
- scikit-learn
- pandas / NumPy
- bcrypt

### Frontend
- React
- Vite
- Tailwind CSS
- Axios
- HLS.js for streaming playback

## Project Structure

```text
Movie Recommendation System/
├── Backend/
│   ├── database.py
│   ├── main.py
│   ├── requirements.txt
│   ├── .env
│   └── recommendation/
│       └── virtual environment files
├── Frontend/
│   └── movie-recommendation/
│       ├── src/
│       ├── public/
│       ├── package.json
│       ├── vite.config.js
│       └── README.md
└── README.md (this project documentation)
```

## Prerequisites

- Python 3.11+
- Node.js 18+
- npm
- A PostgreSQL database connection string for Supabase or another compatible service

## Backend Setup

1. Open a terminal in the Backend folder.
2. Create and activate a virtual environment if needed.
3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Create a `.env` file inside the Backend folder with:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<database>
SUPER_SECRET_KEY=your-secure-secret-key
```

5. Start the API server:

```bash
python -m uvicorn main:app --reload --port 8000
```

The API will run at:

```text
http://localhost:8000
```

## Frontend Setup

1. Open a terminal in the Frontend/movie-recommendation directory.
2. Install dependencies:

```bash
npm install
```

3. Run the app:

```bash
npm run dev
```

The frontend will usually run at:

```text
http://localhost:5173
```

## Key API Features

### Authentication
- `POST /api/signup`
- `POST /api/login`

### User likes
- `POST /api/like`

### Recommendations
- `GET /api/hybrid-recommendations?email=<email>&top_n=6&weight_a=0.5`

### Movie streaming
- `GET /api/stream/{movie_id}`

### Watch tracking
- `POST /api/watch-event`

## Recommendation Flow

1. User signs up or logs in.
2. Likes are stored in the database and synced to an in-memory profile cache.
3. The app computes:
   - content-based similarity using TF-IDF metadata
   - collaborative scores using SVD prediction
4. These scores are normalized and combined into a hybrid recommendation result.
5. If a user watches more than 50% of a movie, it is added to their taste profile automatically.

## Notes

- The backend uses CORS so the frontend can call API routes during local development.
- Sample movie stream URLs are configured in the backend for demo functionality.
- In production, replace the demo stream URLs with secure cloud-hosted media endpoints.

## Useful Commands

Backend:
```bash
cd Backend
python -m uvicorn main:app --reload --port 8000
```

Frontend:
```bash
cd Frontend/movie-recommendation
npm install
npm run dev
```

## License

This project is for educational/demo use unless otherwise specified by the repository owner.
