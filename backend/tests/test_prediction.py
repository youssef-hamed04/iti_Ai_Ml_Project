from fastapi.testclient import TestClient

from app.main import app

VALID_PAYLOAD = {
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


def test_health() -> None:
    with TestClient(app) as client:
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}


def test_locations() -> None:
    with TestClient(app) as client:
        response = client.get("/locations")
        assert response.status_code == 200
        body = response.json()
        assert "locations" in body
        assert isinstance(body["locations"], list)
        assert len(body["locations"]) > 0


def test_predict_happy_path() -> None:
    with TestClient(app) as client:
        response = client.post("/predict", json=VALID_PAYLOAD)
        assert response.status_code == 200
        body = response.json()
        assert "predicted_price" in body
        assert body["predicted_price"] > 0


def test_predict_unknown_location_falls_back_to_other() -> None:
    with TestClient(app) as client:
        payload = {**VALID_PAYLOAD, "location": "some-town-not-in-training-data"}
        response = client.post("/predict", json=payload)
        assert response.status_code == 200
        assert response.json()["predicted_price"] > 0


def test_predict_invalid_input_returns_422() -> None:
    with TestClient(app) as client:
        payload = {**VALID_PAYLOAD, "carpet_area_sqft": -100}
        response = client.post("/predict", json=payload)
        assert response.status_code == 422


def test_predict_missing_field_returns_422() -> None:
    with TestClient(app) as client:
        payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "location"}
        response = client.post("/predict", json=payload)
        assert response.status_code == 422
