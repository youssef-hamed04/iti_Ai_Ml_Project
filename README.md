# 🏠 Ghar Sheet — House Price Prediction (End-to-End ML Web App)

Predicts the market price of a residential property in India from its location, area, floor,
and a handful of listing details. Built as a complete ML product: a Jupyter notebook that cleans
a messy real-world dataset and trains a model, a FastAPI backend that serves it, and a React
frontend where a user fills in a property "spec sheet" and gets an instant price estimate.

## Overview

| Layer | What it does |
|---|---|
| **Notebook** | Cleans 187K messy Kaggle listings → trains & compares 2 regression models → exports a scikit-learn `Pipeline` as `house_price.pkl` |
| **Backend** | FastAPI service that loads the pipeline once at startup and exposes `/predict`, `/locations`, `/health` |
| **Frontend** | React + TypeScript + Vite form that posts to the backend and shows the estimate |

## Architecture

```
┌─────────────────┐        POST /predict         ┌──────────────────────┐        joblib.load        ┌────────────────────┐
│  React Frontend  │ ────────────────────────────▶│   FastAPI Backend    │ ─────────────────────────▶│  house_price.pkl    │
│  (Vite, :5173)   │◀──────────────────────────── │      (:8000)         │                            │  (sklearn Pipeline) │
└─────────────────┘   { predicted_price: ... }    └──────────────────────┘                            └────────────────────┘
                                                              ▲
                                                              │ trained & exported by
                                                              │
                                                   ┌──────────────────────┐        pd.read_csv        ┌────────────────────┐
                                                   │  Jupyter Notebook    │◀───────────────────────── │  house_prices.csv   │
                                                   │  (cleaning + models) │                            │  (Kaggle dataset)   │
                                                   └──────────────────────┘                            └────────────────────┘
```

## Tech stack

- **Data / ML:** pandas, scikit-learn (`ColumnTransformer` + `Pipeline`), matplotlib, seaborn, joblib
- **Backend:** FastAPI, Pydantic v2 / pydantic-settings, uvicorn, pytest + httpx
- **Frontend:** React 18, TypeScript, Vite, React Router

## Project structure

```
house-price-project/
├── notebooks/
│   ├── house_price_model.ipynb   # cleaning, EDA, training, evaluation, export
│   └── data/                      # house_prices.csv goes here (gitignored)
├── backend/
│   ├── app/
│   │   ├── main.py                       # FastAPI app, CORS, model loaded at startup (lifespan)
│   │   ├── api/routes/prediction.py      # GET /health, GET /locations, POST /predict
│   │   ├── core/config.py                # Settings from .env (pydantic-settings)
│   │   ├── schemas/prediction.py         # PredictionRequest / PredictionResponse
│   │   ├── services/
│   │   │   ├── preprocessing.py          # Turn a request into a one-row DataFrame
│   │   │   └── inference.py              # Load .pkl, run predict
│   │   └── utils/logging_config.py
│   ├── models/
│   │   ├── house_price.pkl        # ← exported from the notebook
│   │   └── locations.json         # ← exported from the notebook
│   ├── tests/test_prediction.py
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
├── frontend/
│   └── src/
│       ├── api/predictionClient.ts       # fetch wrapper, base URL from VITE_API_BASE_URL
│       ├── components/PredictionForm.tsx
│       ├── pages/HomePage.tsx | ResultPage.tsx | NotFoundPage.tsx
│       ├── types/prediction.ts           # TS types mirroring the backend schema
│       └── App.tsx                       # routes: / , /result , * (404)
├── .gitignore
└── README.md
```

## Dataset

**[House Price](https://www.kaggle.com/datasets/juhibhojani/house-price)** by Juhi Bhojani —
~187,000 real property listings from India. It's messy on purpose: price and area are free text
(`"42 Lac"`, `"1200 sqft"`), floor is `"3 out of 10"`, and several categorical columns have
hundreds of distinct values. See section 2.3 of the notebook for exactly how each problem is
handled.

**Download it yourself** (not committed to this repo — see `.gitignore`):

```bash
pip install kaggle
# Get your API token: Kaggle → Settings → API → "Create New Token"
# Place kaggle.json in C:\Users\<you>\.kaggle\ (Windows) or ~/.kaggle/ (macOS/Linux)
kaggle datasets download -d juhibhojani/house-price -p notebooks/data --unzip
```

Or download manually from the link above and place `house_prices.csv` in `notebooks/data/`.

## Setup

### Prerequisites

| Tool | Minimum version |
|---|---|
| Python | 3.11+ |
| Node.js + npm | 18+ |
| Git | any recent |

### 1. Notebook

```bash
python -m venv .venv
source .venv/bin/activate   # .venv\Scripts\activate on Windows
pip install jupyter pandas numpy scikit-learn matplotlib seaborn joblib

# put house_prices.csv in notebooks/data/ (see Dataset section above), then:
jupyter notebook notebooks/house_price_model.ipynb
# Run all cells. This regenerates house_price.pkl and locations.json inside notebooks/.
# Copy both into backend/models/ (already done in this repo).
```

### 2. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env   # adjust CORS_ORIGINS_RAW if needed

uvicorn app.main:app --reload
# → http://localhost:8000/docs (Swagger UI — try /predict from there)
```

Run the tests:

```bash
pytest
```

### 3. Frontend

```bash
cd frontend
npm install

cp .env.example .env   # VITE_API_BASE_URL=http://localhost:8000

npm run dev
# → http://localhost:5173
```

With the backend running on `:8000` and the frontend dev server on `:5173`, open the frontend,
fill in the form, and submit to see a real prediction.

## Environment variables

**`backend/.env`**

| Variable | Default | Description |
|---|---|---|
| `CORS_ORIGINS_RAW` | `http://localhost:5173` | Comma-separated list of allowed frontend origins |
| `MODEL_PATH` | `backend/models/house_price.pkl` | Path to the exported pipeline |
| `LOCATIONS_PATH` | `backend/models/locations.json` | Path to the exported locations list |

**`frontend/.env`**

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000` | Base URL of the FastAPI backend |

## API reference

### `GET /health`

```bash
curl http://localhost:8000/health
# {"status": "ok"}
```

### `GET /locations`

Returns the list of locations the model was trained on (used to populate the frontend dropdown).

```bash
curl http://localhost:8000/locations
# {"locations": ["agra", "ahmedabad", ..., "other"]}
```

### `POST /predict`

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "location": "mumbai",
    "carpet_area_sqft": 950,
    "floor_num": 5,
    "bathroom": 2,
    "balcony": 1,
    "furnishing": "Semi-Furnished",
    "transaction": "Resale",
    "ownership": "Freehold",
    "facing": "East"
  }'
# {"predicted_price": 37192569.04}
```

An unrecognized `location` is automatically mapped to `"other"` rather than rejected. Invalid
input (e.g. `carpet_area_sqft <= 0`) returns `422 Unprocessable Entity` with details on which
field failed.

## Model metrics

Two models were trained on `log1p(price)` and compared on a held-out 20% test set
(see notebook section 2.5 for the full discussion):

| Model | MAE (₹) | RMSE (₹) | MedAE (₹) | R² |
|---|---|---|---|---|
| LinearRegression | 6,866,220 | 342,813,991 | 1,841,536 | -684.21 |
| **RandomForestRegressor** | **1,102,613** | **4,324,154** | **32,380** | **0.89** |

**RandomForestRegressor** was chosen and exported. It wins on every metric — most tellingly,
**MedAE of ₹32K** means a *typical* prediction is off by less than a rounding error on a
multi-lakh property. The linear baseline's negative R² comes from a small number of genuine
luxury listings it extrapolates wildly on (see the notebook for the full explanation) — a real
limitation of linear models on this kind of skewed, high-cardinality data, not a bug.

## Screenshots

*Run the app locally (`npm run dev` + `uvicorn app.main:app --reload`) and add screenshots of the
home page and result page here before submitting — none are checked into this template.*

## Notes on scope / known limitations

- The model uses 4 numeric + 5 categorical features (see notebook section 2.4). Columns like
  `Society`, `Car Parking`, and `overlooking` were dropped rather than engineered further, in the
  interest of keeping the pipeline simple and robust for a student project — a natural next step
  would be adding them back with proper handling of their missingness.
- `location` matching is case-insensitive exact-match against the training set's top-50 cities;
  anything else (including typos) falls back to `"other"`.
