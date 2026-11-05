import json

import joblib
import numpy as np
import pandas as pd

_model = None
_known_locations: set[str] = set()
_all_locations: list[str] = []


def load_model(model_path: str, locations_path: str) -> None:
    """Load the trained pipeline and the list of known locations. Call once at startup."""
    global _model, _known_locations, _all_locations

    _model = joblib.load(model_path)

    with open(locations_path) as f:
        _all_locations = json.load(f)
    _known_locations = {loc.lower() for loc in _all_locations if loc != "other"}


def ensure_loaded() -> None:
    """Load on first use if the startup hook never ran (serverless hosts may skip it)."""
    if _model is None:
        from app.core.config import settings

        load_model(settings.MODEL_PATH, settings.LOCATIONS_PATH)


def get_known_locations() -> set[str]:
    ensure_loaded()
    return _known_locations


def get_all_locations() -> list[str]:
    ensure_loaded()
    return _all_locations


def predict(df: pd.DataFrame) -> float:
    """Run the pipeline and invert the log1p transform used during training."""
    ensure_loaded()

    log_pred = _model.predict(df)
    price = float(np.expm1(log_pred)[0])
    return price
