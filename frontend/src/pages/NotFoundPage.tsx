import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="notfound">
      <h1>404</h1>
      <p>This listing doesn't exist. Let's get you back to the estimator.</p>
      <Link to="/" className="link-button primary">
        Back to home
      </Link>
    </div>
  );
}
