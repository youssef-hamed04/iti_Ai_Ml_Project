import pandas as pd

from app.schemas.prediction import PredictionRequest
from app.services import inference

# Must exactly match the column names used when training the pipeline
# (see notebooks/house_price_model.ipynb, section 2.4).
NUMERIC_FEATURES = ["carpet_area_sqft", "floor_num", "bathroom", "balcony"]
CATEGORICAL_FEATURES = ["location_grouped", "Furnishing", "Transaction", "Ownership", "facing"]


def request_to_dataframe(payload: PredictionRequest) -> pd.DataFrame:
    """Turn a validated request into the one-row DataFrame the trained pipeline expects."""
    location = payload.location.strip().lower()
    known_locations = inference.get_known_locations()
    location_grouped = location if location in known_locations else "other"

    row = {
        "carpet_area_sqft": payload.carpet_area_sqft,
        "floor_num": payload.floor_num,
        "bathroom": payload.bathroom,
        "balcony": payload.balcony,
        "location_grouped": location_grouped,
        "Furnishing": payload.furnishing,
        "Transaction": payload.transaction,
        "Ownership": payload.ownership,
        "facing": payload.facing,
    }

    return pd.DataFrame([row], columns=NUMERIC_FEATURES + CATEGORICAL_FEATURES)
