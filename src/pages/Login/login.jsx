import { useState } from "react";
import "./login.css";

const API_BASE_URL = "http://127.0.0.1:8000";

function Login({ onSignup, onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [loading, setLoading] = useState(false);

  // ==========================================
  // LOGIN
  // ==========================================

  const handleLogin = async (event) => {
    event.preventDefault();

    setMessage("");

    if (!email.trim() || !password) {
      setMessage("Please enter email and password.");
      setMessageType("danger");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/login/`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: email.trim(),
            password: password,
          }),
        }
      );

      const data = await response.json();

      console.log("Login response:", data);

      if (!response.ok) {
        setMessage(
          data.detail ||
            data.error ||
            JSON.stringify(data)
        );

        setMessageType("danger");
        return;
      }

      // ==========================================
      // CHECK JWT TOKENS
      // ==========================================

      if (!data.access) {
        console.error("Access token missing:", data);

        setMessage(
          "Login successful, but access token was not received."
        );

        setMessageType("danger");
        return;
      }

      // ==========================================
      // CLEAR OLD TOKENS
      // ==========================================

      localStorage.removeItem("vora_access_token");
      localStorage.removeItem("vora_refresh_token");

      // ==========================================
      // SAVE NEW JWT TOKENS
      // ==========================================

      localStorage.setItem(
        "vora_access_token",
        data.access
      );

      if (data.refresh) {
        localStorage.setItem(
          "vora_refresh_token",
          data.refresh
        );
      }

      console.log(
        "Access token saved:",
        localStorage.getItem("vora_access_token")
      );

      // ==========================================
      // OPEN DASHBOARD
      // ==========================================

      onSuccess();

    } catch (error) {
      console.error("Login error:", error);

      setMessage(
        "Cannot connect to VORA backend. Make sure Django is running."
      );

      setMessageType("danger");

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* NAVBAR */}

      <nav className="navbar navbar-dark login-navbar">

        <div className="container">

          <span className="navbar-brand fw-bold">
            VORA AI
          </span>

          <span className="text-light small">
            AI Career Assistant
          </span>

        </div>

      </nav>


      {/* MAIN */}

      <div className="container-fluid">

        <div className="row min-vh-100">

          {/* LEFT SIDE */}

          <div className="col-lg-6 login-left">

            <div className="login-left-content">

              <span className="badge bg-info text-dark mb-4">
                AI-POWERED CAREER ASSISTANT
              </span>

              <h1 className="display-4 fw-bold text-white">

                Welcome Back to

                <br />

                <span className="vora-highlight">
                  VORA AI
                </span>

              </h1>

              <p className="mt-4">
                Continue your personalized AI-powered
                career journey with VORA AI.
              </p>

              <div className="login-features mt-5">

                <div className="feature-item">
                  <span>✓</span>
                  AI Resume Analysis
                </div>

                <div className="feature-item">
                  <span>✓</span>
                  Skill Gap Identification
                </div>

                <div className="feature-item">
                  <span>✓</span>
                  Personalized Learning Roadmap
                </div>

                <div className="feature-item">
                  <span>✓</span>
                  Job Recommendations
                </div>

                <div className="feature-item">
                  <span>✓</span>
                  Interview Preparation
                </div>

              </div>

            </div>

          </div>


          {/* RIGHT SIDE */}

          <div className="col-lg-6 login-right">

            <div className="login-form-container">

              <div className="text-center mb-4">

                <h2 className="fw-bold">
                  Login to VORA AI
                </h2>

                <p className="text-muted">
                  Continue your career journey
                </p>

              </div>


              {/* MESSAGE */}

              {message && (
                <div
                  className={`alert alert-${messageType}`}
                  role="alert"
                >
                  {message}
                </div>
              )}


              {/* FORM */}

              <form onSubmit={handleLogin}>

                <div className="mb-3">

                  <label className="form-label fw-semibold">
                    Email
                  </label>

                  <input
                    type="email"
                    className="form-control form-control-lg"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    required
                  />

                </div>


                <div className="mb-4">

                  <label className="form-label fw-semibold">
                    Password
                  </label>

                  <input
                    type="password"
                    className="form-control form-control-lg"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    required
                  />

                </div>


                <button
                  type="submit"
                  className="btn btn-vora btn-lg w-100"
                  disabled={loading}
                >

                  {loading
                    ? "Logging in..."
                    : "Login"}

                </button>

              </form>


              {/* SIGNUP */}

              <div className="text-center mt-4">

                <span className="text-muted">
                  Don't have an account?
                </span>

                <button
                  type="button"
                  className="btn btn-link text-decoration-none"
                  onClick={onSignup}
                >
                  Create Account
                </button>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Login;