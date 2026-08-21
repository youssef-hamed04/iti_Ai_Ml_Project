from fastapi import APIRouter

from app.schemas.prediction import (
    HealthResponse,
    LocationsResponse,
    PredictionRequest,
    PredictionResponse,
)
from app.services import inference, preprocessing
from app.utils.logging_config import get_logger

logger = get_logger(__name__)

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok")


@router.get("/locations", response_model=LocationsResponse)
def locations() -> LocationsResponse:
    """Used by the frontend to populate the location dropdown."""
    return LocationsResponse(locations=inference.get_all_locations())


@router.post("/predict", response_model=PredictionResponse)
def predict(payload: PredictionRequest) -> PredictionResponse:
    df = preprocessing.request_to_dataframe(payload)
    price = inference.predict(df)
    logger.info("Prediction: %.0f for location=%s", price, payload.location)
    return PredictionResponse(predicted_price=price)
