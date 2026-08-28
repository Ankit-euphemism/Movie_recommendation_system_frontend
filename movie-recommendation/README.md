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

## Project Structure

```text
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
