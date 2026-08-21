import { useEffect, useState, type FormEvent } from "react";

import { fetchLocations, predictPrice, ApiRequestError } from "../api/predictionClient";
import type { Furnishing, PredictionRequest, Transaction } from "../types/prediction";

const FURNISHING_OPTIONS: Furnishing[] = ["Unfurnished", "Semi-Furnished", "Furnished"];
const TRANSACTION_OPTIONS: Transaction[] = ["Resale", "New Property"];
const OWNERSHIP_OPTIONS = [
  "Freehold",
  "Leasehold",
  "Co-operative Society",
  "Power Of Attorney",
  "Unknown",
];
const FACING_OPTIONS = [
  "East",
  "West",
  "North",
  "South",
  "North - East",
  "North - West",
  "South - East",
  "South -West",
  "Unknown",
];

export interface FormState {
  location: string;
  carpet_area_sqft: string;
  floor_num: string;
  bathroom: string;
  balcony: string;
  furnishing: Furnishing;
  transaction: Transaction;
  ownership: string;
  facing: string;
}

const INITIAL_STATE: FormState = {
  location: "",
  carpet_area_sqft: "",
  floor_num: "",
  bathroom: "2",
  balcony: "1",
  furnishing: "Semi-Furnished",
  transaction: "Resale",
  ownership: "Freehold",
  facing: "East",
};

interface PredictionFormProps {
  onResult: (price: number, input: FormState) => void;
}

function Field(props: { label: string; htmlFor: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="field-row">
      <label htmlFor={props.htmlFor} className="field-label">
        {props.label}
      </label>
      <div className="field-leader" aria-hidden="true" />
      <div className="field-control">
        {props.children}
        {props.error && <span className="field-error">{props.error}</span>}
      </div>
    </div>
  );
}

export default function PredictionForm({ onResult }: PredictionFormProps) {
  const [locations, setLocations] = useState<string[]>([]);
  const [locationsError, setLocationsError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchLocations()
      .then((locs) => {
        setLocations(locs.filter((l) => l !== "other"));
      })
      .catch(() => {
        setLocationsError(
          "Couldn't load the list of locations from the server. You can still type one in manually below."
        );
      });
  }, []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};

    if (!form.location.trim()) {
      next.location = "Enter or choose a location.";
    }
    const area = Number(form.carpet_area_sqft);
    if (!form.carpet_area_sqft || Number.isNaN(area) || area <= 0) {
      next.carpet_area_sqft = "Area must be a number greater than 0.";
    }
    if (form.floor_num === "" || Number.isNaN(Number(form.floor_num))) {
      next.floor_num = "Enter a floor number (0 for ground, -1 for basement).";
    }
    if (!form.bathroom || Number(form.bathroom) < 0) {
      next.bathroom = "Enter the number of bathrooms.";
    }
    if (!form.balcony || Number(form.balcony) < 0) {
      next.balcony = "Enter the number of balconies.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitError(null);

    if (!validate()) {
      return;
    }

    const payload: PredictionRequest = {
      location: form.location.trim().toLowerCase(),
      carpet_area_sqft: Number(form.carpet_area_sqft),
      floor_num: Number(form.floor_num),
      bathroom: Number(form.bathroom),
      balcony: Number(form.balcony),
      furnishing: form.furnishing,
      transaction: form.transaction,
      ownership: form.ownership,
      facing: form.facing,
    };

    setIsSubmitting(true);
    try {
      const result = await predictPrice(payload);
      onResult(result.predicted_price, form);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Couldn't reach the prediction server. Is the backend running?");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="spec-sheet" onSubmit={handleSubmit} noValidate>
      <div className="spec-sheet-header">
        <span className="spec-sheet-eyebrow">Property Details</span>
        <h2>Fill in the listing</h2>
      </div>

      <Field label="Location" htmlFor="location" error={errors.location}>
        <input
          id="location"
          list="location-options"
          value={form.location}
          onChange={(e) => update("location", e.target.value)}
          placeholder="e.g. Mumbai"
          autoComplete="off"
        />
        <datalist id="location-options">
          {locations.map((loc) => (
            <option key={loc} value={loc} />
          ))}
        </datalist>
        {locationsError && <span className="field-hint">{locationsError}</span>}
      </Field>

      <Field label="Carpet area (sqft)" htmlFor="carpet_area_sqft" error={errors.carpet_area_sqft}>
        <input
          id="carpet_area_sqft"
          type="number"
          min={1}
          value={form.carpet_area_sqft}
          onChange={(e) => update("carpet_area_sqft", e.target.value)}
          placeholder="e.g. 950"
        />
      </Field>

      <Field label="Floor" htmlFor="floor_num" error={errors.floor_num}>
        <input
          id="floor_num"
          type="number"
          value={form.floor_num}
          onChange={(e) => update("floor_num", e.target.value)}
          placeholder="e.g. 5 (0 = ground, -1 = basement)"
        />
      </Field>

      <Field label="Bathrooms" htmlFor="bathroom" error={errors.bathroom}>
        <input
          id="bathroom"
          type="number"
          min={0}
          value={form.bathroom}
          onChange={(e) => update("bathroom", e.target.value)}
        />
      </Field>

      <Field label="Balconies" htmlFor="balcony" error={errors.balcony}>
        <input
          id="balcony"
          type="number"
          min={0}
          value={form.balcony}
          onChange={(e) => update("balcony", e.target.value)}
        />
      </Field>

      <Field label="Furnishing" htmlFor="furnishing">
        <select
          id="furnishing"
          value={form.furnishing}
          onChange={(e) => update("furnishing", e.target.value as Furnishing)}
        >
          {FURNISHING_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Transaction" htmlFor="transaction">
        <select
          id="transaction"
          value={form.transaction}
          onChange={(e) => update("transaction", e.target.value as Transaction)}
        >
          {TRANSACTION_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Ownership" htmlFor="ownership">
        <select
          id="ownership"
          value={form.ownership}
          onChange={(e) => update("ownership", e.target.value)}
        >
          {OWNERSHIP_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Facing" htmlFor="facing">
        <select
          id="facing"
          value={form.facing}
          onChange={(e) => update("facing", e.target.value)}
        >
          {FACING_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </Field>

      {submitError && (
        <div className="submit-error" role="alert">
          {submitError}
        </div>
      )}

      <button type="submit" className="cta-button" disabled={isSubmitting}>
        {isSubmitting ? "Estimating…" : "Estimate price"}
      </button>
    </form>
  );
}
