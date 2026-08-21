from pydantic import BaseModel, Field, field_validator


class PredictionRequest(BaseModel):
    location: str = Field(..., description="City/area, e.g. 'mumbai'. Unknown values map to 'other'.")
    carpet_area_sqft: float = Field(..., gt=0, description="Carpet area in square feet.")
    floor_num: int = Field(..., ge=-2, le=200, description="Floor number (0 = ground, -1 = basement).")
    bathroom: int = Field(..., ge=0, le=20, description="Number of bathrooms.")
    balcony: int = Field(..., ge=0, le=20, description="Number of balconies.")
    furnishing: str = Field(..., description='"Furnished" | "Semi-Furnished" | "Unfurnished"')
    transaction: str = Field(..., description='"New Property" | "Resale"')
    ownership: str = Field(..., description='e.g. "Freehold", "Leasehold", "Co-operative Society"')
    facing: str = Field(..., description='e.g. "East", "North - East", "Unknown"')

    @field_validator("location", "furnishing", "transaction", "ownership", "facing")
    @classmethod
    def strip_and_require_nonempty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("must not be empty")
        return v

    model_config = {
        "json_schema_extra": {
            "example": {
                "location": "mumbai",
                "carpet_area_sqft": 950,
                "floor_num": 5,
                "bathroom": 2,
                "balcony": 1,
                "furnishing": "Semi-Furnished",
                "transaction": "Resale",
                "ownership": "Freehold",
                "facing": "East",
            }
        }
    }


class PredictionResponse(BaseModel):
    predicted_price: float = Field(..., description="Predicted price in INR.")


class LocationsResponse(BaseModel):
    locations: list[str]


class HealthResponse(BaseModel):
    status: str
