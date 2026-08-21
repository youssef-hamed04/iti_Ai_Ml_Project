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


def get_known_locations() -> set[str]:
    return _known_locations


def get_all_locations() -> list[str]:
    return _all_locations


def predict(df: pd.DataFrame) -> float:
    """Run the pipeline and invert the log1p transform used during training."""
    if _model is None:
        raise RuntimeError("Model is not loaded. Call load_model() at startup.")

    log_pred = _model.predict(df)
    price = float(np.expm1(log_pred)[0])
    return price
