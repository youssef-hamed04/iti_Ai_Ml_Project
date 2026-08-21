import { useNavigate } from "react-router-dom";

import PredictionForm from "../components/PredictionForm";
import type { FormState } from "../components/PredictionForm";

export default function HomePage() {
  const navigate = useNavigate();

  function handleResult(price: number, input: FormState) {
    navigate("/result", { state: { price, input } });
  }

  return (
    <div className="hero">
      <div className="hero-copy">
        <span className="hero-eyebrow">India · Residential Listings</span>
        <h1>
          What's it <em>actually</em> worth?
        </h1>
        <p>
          Enter a property's area, floor, and a few details, and a model trained on
          real Indian listing data will estimate a fair market price in seconds.
        </p>
        <dl className="hero-stats">
          <div className="hero-stat">
            <dt>Listings trained on</dt>
            <dd>165K+</dd>
          </div>
          <div className="hero-stat">
            <dt>Typical error</dt>
            <dd>~₹32K</dd>
          </div>
          <div className="hero-stat">
            <dt>Cities covered</dt>
            <dd>50+</dd>
          </div>
        </dl>
      </div>

      <PredictionForm onResult={handleResult} />
    </div>
  );
}
