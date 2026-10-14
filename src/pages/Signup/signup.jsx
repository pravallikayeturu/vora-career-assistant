import { useState } from "react";
import "./signup.css";

const API_BASE_URL = "http://127.0.0.1:8000";

function Signup({ onLogin, onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSignup = async (event) => {
    event.preventDefault();

    setMessage("");

    if (!email || !password) {
      setMessage("Please enter email and password.");
      setMessageType("danger");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/signup/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            password: password,
          }),
        }
      );

      const data = await response.json();

      console.log("Signup response:", data);

      if (!response.ok) {
        setMessage(
          data.detail ||
            data.error ||
            data.email?.[0] ||
            data.password?.[0] ||
            JSON.stringify(data)
        );

        setMessageType("danger");
        return;
      }

      if (data.access && data.refresh) {
        localStorage.setItem(
          "vora_access_token",
          data.access
        );

        localStorage.setItem(
          "vora_refresh_token",
          data.refresh
        );

        onSuccess();
      } else {
        setMessage(
          "Account created, but authentication tokens were not returned."
        );

        setMessageType("warning");
      }
    } catch (error) {
      console.error("Signup error:", error);

      setMessage(
        "Cannot connect to VORA backend. Make sure Django is running."
      );

      setMessageType("danger");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">

      {/* NAVBAR */}

      <nav className="signup-navbar">

        <div className="signup-navbar-content">

          <div className="signup-logo">
            VORA AI
          </div>

          <div className="signup-navbar-text">
            AI Career Assistant
          </div>

        </div>

      </nav>


      {/* MAIN */}

      <main className="signup-main">

        {/* LEFT */}

        <section className="signup-left">

          <div className="signup-left-content">

            <div className="signup-badge">
              AI-POWERED CAREER ASSISTANT
            </div>

            <h1>
              Build Your Career
              <br />
              With{" "}
              <span>VORA AI</span>
            </h1>

            <p>
              Your personalized AI career assistant
              designed to help you understand your resume,
              identify skill gaps, create learning plans,
              and prepare for your dream job.
            </p>

            <div className="signup-features">

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

        </section>


        {/* RIGHT */}

        <section className="signup-right">

          <div className="signup-form-container">

            <div className="signup-form-header">

              <h2>
                Create Your Account
              </h2>

              <p>
                Start your AI-powered career journey
              </p>

            </div>


            {/* MESSAGE */}

            {message && (
              <div className={`signup-message ${messageType}`}>
                {message}
              </div>
            )}


            {/* FORM */}

            <form onSubmit={handleSignup}>

              <div className="form-group">

                <label>
                  Email
                </label>

                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  required
                />

              </div>


              <div className="form-group">

                <label>
                  Password
                </label>

                <input
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  required
                />

              </div>


              <button
                type="submit"
                className="signup-button"
                disabled={loading}
              >
                {loading
                  ? "Creating Account..."
                  : "Create Account"}
              </button>

            </form>


            {/* LOGIN */}

            <div className="login-link">

              <span>
                Already have an account?
              </span>

              <button
                type="button"
                onClick={onLogin}
              >
                Login
              </button>

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}

export default Signup;