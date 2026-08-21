import { Link, useLocation, useNavigate } from "react-router-dom";

interface ResultState {
  price: number;
  input: {
    location: string;
    carpet_area_sqft: string;
    floor_num: string;
    bathroom: string;
    balcony: string;
    furnishing: string;
    transaction: string;
  };
}

function formatInr(value: number): string {
  if (value >= 1e7) {
    return `₹${(value / 1e7).toFixed(2)} Cr`;
  }
  if (value >= 1e5) {
    return `₹${(value / 1e5).toFixed(2)} Lac`;
  }
  return `₹${value.toLocaleString("en-IN")}`;
}

export default function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ResultState | null;

  if (!state) {
    // Someone navigated to /result directly without submitting the form.
    navigate("/", { replace: true });
    return null;
  }

  const { price, input } = state;

  return (
    <div className="result-card">
      <span className="result-stamp">Estimate ready</span>
      <div className="result-figure">{formatInr(price)}</div>
      <p className="result-sub">Estimated market price for this property</p>

      <dl className="result-specs">
        <div>
          <dt>Location</dt>
          <dd style={{ textTransform: "capitalize" }}>{input.location}</dd>
        </div>
        <div>
          <dt>Carpet area</dt>
          <dd>{input.carpet_area_sqft} sqft</dd>
        </div>
        <div>
          <dt>Floor</dt>
          <dd>{input.floor_num}</dd>
        </div>
        <div>
          <dt>Bath / Balcony</dt>
          <dd>
            {input.bathroom} / {input.balcony}
          </dd>
        </div>
        <div>
          <dt>Furnishing</dt>
          <dd>{input.furnishing}</dd>
        </div>
        <div>
          <dt>Transaction</dt>
          <dd>{input.transaction}</dd>
        </div>
      </dl>

      <div className="result-actions">
        <Link to="/" className="link-button primary">
          Estimate another
        </Link>
      </div>

      <p className="result-disclaimer">
        This is a statistical estimate from a machine-learning model trained on historical
        listings — not a valuation or an offer.
      </p>
    </div>
  );
}
