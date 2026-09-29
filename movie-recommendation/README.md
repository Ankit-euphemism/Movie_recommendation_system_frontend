# FlixRecommend

FlixRecommend is a full-stack movie recommendation system. Users sign in with an email address, select movies they like, and receive a personalized feed based on a hybrid content and collaborative filtering model.

## Features

- Email-based profile creation with local session persistence
- First-use onboarding with starter movie selections
- Hybrid recommendations combining TF-IDF content similarity and collaborative filtering
- Separate content, collaborative, and combined match scores
- Like and unlike actions that refresh the recommendation feed
- FastAPI backend with local-development CORS

## Project Structure

```text
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
