import type {
  LocationsResponse,
  PredictionRequest,
  PredictionResponse,
} from "../types/prediction";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

class ApiRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (Array.isArray(body?.detail)) {
      // FastAPI/pydantic 422 validation errors
      return body.detail
        .map((e: { loc: string[]; msg: string }) => `${e.loc.at(-1)}: ${e.msg}`)
        .join(", ");
    }
    if (typeof body?.detail === "string") {
      return body.detail;
    }
  } catch {
    // fall through to generic message
  }
  return `Request failed with status ${response.status}`;
}

export async function fetchLocations(): Promise<string[]> {
  const response = await fetch(`${BASE_URL}/locations`);
  if (!response.ok) {
    throw new ApiRequestError(await parseErrorMessage(response), response.status);
  }
  const data: LocationsResponse = await response.json();
  return data.locations;
}

export async function predictPrice(
  payload: PredictionRequest
): Promise<PredictionResponse> {
  const response = await fetch(`${BASE_URL}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new ApiRequestError(await parseErrorMessage(response), response.status);
  }
  return response.json();
}

export { ApiRequestError };
