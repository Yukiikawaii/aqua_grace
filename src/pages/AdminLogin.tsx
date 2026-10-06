
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { loginAdmin, ApiError } from "../lib/api";
import PasswordInput from "../components/PasswordInput";
import aquaGraceLogo from "../assets/images/aqua-grace-logo.jpg";
import "./AdminLogin.css";

function AdminLogin() {
  const navigate = useNavigate();

  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminBusy, setAdminBusy] = useState(false);

  const handleAdminLogin = async (e: FormEvent) => {
    e.preventDefault();
    setAdminError(null);

    if (!adminEmail.trim() || !adminPassword) {
      setAdminError("Enter your email and password.");
      return;
    }

    setAdminBusy(true);

    try {
      await loginAdmin({
        email: adminEmail.trim(),
        password: adminPassword,
      });

      navigate("/admin/dashboard");
    } catch (err) {
      setAdminError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setAdminBusy(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login__card">
        <div className="admin-login__logo">
          <img src={aquaGraceLogo} alt="Aqua Grace" />
        </div>

        <p className="admin-login__eyebrow">Administrator</p>

        <h1 className="admin-login__title">
          Admin Sign In
        </h1>

        <p className="admin-login__description">
          Sign in to access the Aqua Grace administration dashboard.
        </p>

        <form
          onSubmit={handleAdminLogin}
          noValidate
          className="admin-login__form"
        >
          <div className="admin-login__field">
            <label htmlFor="admin-email">Email</label>

            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </div>

          <PasswordInput
            id="admin-password"
            label="Password"
            value={adminPassword}
            onChange={setAdminPassword}
            autoComplete="current-password"
            required
          />

          {adminError && (
            <p className="admin-login__error" role="alert">
              {adminError}
            </p>
          )}

          <button
            type="submit"
            className="admin-login__submit"
            disabled={adminBusy}
          >
            {adminBusy ? "Signing In…" : "Sign In"}
          </button>
        </form>

        <button
          type="button"
          className="admin-login__back"
          onClick={() => navigate("/")}
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}

export default AdminLogin;

