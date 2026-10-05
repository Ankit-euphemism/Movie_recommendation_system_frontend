<<<<<<< HEAD
# FlixRecommend

FlixRecommend is a full-stack movie recommendation system. Users sign in with an email address, select movies they like, and receive a personalized feed based on a hybrid content and collaborative filtering model.

## Features

- Email-based profile creation with local session persistence
- First-use onboarding with starter movie selections
- Hybrid recommendations combining TF-IDF content similarity and collaborative filtering
- Separate content, collaborative, and combined match scores
- Like and unlike actions that refresh the recommendation feed
- FastAPI backend with local-development CORS
=======
# FlixRecommend Frontend

The React frontend for a movie discovery app. Users can create an account, choose starter movies to establish their taste profile, browse personalized recommendations, like or unlike movies, and watch available streams in an HLS-capable video player.

## Features

- Email and password sign-up and login
- First-time onboarding with starter movie selections
- Hybrid recommendations loaded from the FastAPI backend
- Like and unlike actions that refresh the recommendation feed
- HLS, MP4, and WebM playback with play, pause, seek, mute, and fullscreen controls
- Watch-progress tracking: viewing at least 50% of a movie sends implicit feedback to the backend
- JWT and profile data persisted in browser `localStorage`

## Tech Stack

- React 19
- Vite 8
- Tailwind CSS 3
- Axios for API requests
- Hls.js for browser HLS playback
- lucide-react for icons

## Requirements

- Node.js 18 or newer
- npm
- A running instance of the companion FastAPI backend at `http://localhost:8000`

## Getting Started

From this directory:

```bash
npm install
npm run dev
```

Open the URL printed by Vite, usually `http://localhost:5173`.

The API base URL is currently defined in `src/App.jsx` and `src/components/VideoPlayerModal.jsx` as:

```text
http://localhost:8000/api
```

Start the backend separately before signing in. The frontend does not include the backend, database, recommendation model, or movie data in this repository.

## Available Scripts

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start the Vite development server    |
| `npm run build`   | Create a production build in `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint`    | Run ESLint                           |

## Backend API Contract

The frontend expects the backend to expose these routes under `/api`:

| Method | Route                     | Purpose                                                     |
| ------ | ------------------------- | ----------------------------------------------------------- |
| `POST` | `/signup`                 | Create an account and return a JWT, email, and liked movies |
| `POST` | `/login`                  | Authenticate and return a JWT, email, and liked movies      |
| `POST` | `/like`                   | Add or remove a movie from the user’s liked movies          |
| `GET`  | `/hybrid-recommendations` | Return personalized recommendations for an email            |
| `GET`  | `/stream/{movie_id}`      | Return a playable `video_url`                               |
| `POST` | `/watch-event`            | Record watch progress and return updated likes              |

Authenticated requests send the stored JWT as a bearer token. Recommendation requests include `email` and `top_n=6`; like and watch requests include the user email and movie details in the JSON body.
>>>>>>> 61cc50444b4d9fcff0f823dd61ef65c912d24e6e

## Project Structure

```text
<<<<<<< HEAD
.
|-- Backend/
|   |-- main.py
|   |-- database.py
|   |-- requirements.txt
|   |-- movies_data.pkl
|   |-- similarity_matrix.pkl
|   `-- svd_collaborative_model.pkl
`-- Frontend/movie-recommendation/
	|-- src/App.jsx
	|-- src/components/OnboardingModal.jsx
	`-- package.json
```

The model files in `Backend/` are required when the API starts. They are loaded relative to `main.py`.

## Requirements

- Python 3.13 or a compatible Python version supported by the backend dependencies
- Node.js and npm
- The serialized model files listed above

## Run Locally

Open two terminals from the repository root.

### Start the backend

```powershell
cd Backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

The API is available at `http://localhost:8000`, with interactive documentation at `http://localhost:8000/docs`.

### Start the frontend

```powershell
cd Frontend\movie-recommendation
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

The frontend uses `http://localhost:8000/api` as a fixed API base URL. Start the backend on port `8000` unless you update `API_BASE_URL` in `src/App.jsx`.

## API Endpoints

- `POST /api/login` creates or loads a profile by email.
- `POST /api/like` toggles a movie in the user's liked list.
- `GET /api/hybrid-recommendations` returns personalized recommendations.

Example request:

```text
GET /api/hybrid-recommendations?email=name@example.com&top_n=6&weight_a=0.5
```

`weight_a` controls the content-similarity weight. The collaborative-filtering weight is `1 - weight_a`.

## Frontend Scripts

Run these commands from `Frontend/movie-recommendation`:

```bash
npm run dev      # Start the Vite development server
npm run build    # Create a production build
npm run preview  # Preview the production build
npm run lint     # Run ESLint
```

## Notes

- User likes are stored in memory by the backend and reset whenever the API process restarts.
- The frontend stores only the current email in browser `localStorage`.
- The backend's permissive CORS policy is intended for local development and should be restricted before production deployment.
=======
movie-recommendation/
├── public/                        # Static assets
├── src/
│   ├── components/
│   │   ├── OnboardingModal.jsx    # Starter movie taste setup
│   │   └── VideoPlayerModal.jsx   # HLS and HTML5 video player
│   ├── App.jsx                    # Auth, feed, likes, and stream orchestration
│   ├── index.css                  # Global styles and Tailwind layers
│   └── main.jsx                   # React entry point
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.js
```

## Local Storage

After authentication, the app stores these values in the browser:

- `accessToken`: JWT used for authenticated API requests
- `userEmail`: current signed-in user
- `likedMovies`: cached liked movie list used during initialization

Use the in-app logout action to clear this data. During development, clear the site’s local storage if testing a fresh onboarding flow.

## Troubleshooting

- **Requests fail or recommendations stay empty:** verify that the backend is running on port `8000` and that its CORS configuration allows the Vite origin.
- **Video does not play:** verify that `/api/stream/{movie_id}` returns a reachable `video_url`; HLS URLs should end in `.m3u8`.
- **Changes are not visible after editing:** restart Vite or run `npm run build` to check the production bundle.

## License

This project is intended for educational and demonstration use unless otherwise specified by the repository owner.
>>>>>>> 61cc50444b4d9fcff0f823dd61ef65c912d24e6e
