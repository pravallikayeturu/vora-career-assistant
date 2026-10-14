import { useNavigate } from "react-router-dom";
import "./Welcome.css";

function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="welcome-page">

      {/* Navbar */}
      <nav className="welcome-navbar">

        <div className="vora-logo">
          <div className="logo-box">V</div>
          <span>VORA AI</span>
        </div>

        <div className="nav-actions">

          <button
            className="signin-btn"
            onClick={() => navigate("/login")}
          >
            Sign In
          </button>

          <button
            className="signup-btn"
            onClick={() => navigate("/dashboard")}
          >
            Get Started
          </button>

        </div>

      </nav>

      {/* Main Content */}
      <main className="hero">

        {/* Left floating bubble */}
        <div className="feature-bubble bubble-left-top">
          <span>📄</span>
          <div>
            <strong>Resume Analysis</strong>
            <small>Understand your profile</small>
          </div>
        </div>

        {/* Right floating bubble */}
        <div className="feature-bubble bubble-right-top">
          <span>🎯</span>
          <div>
            <strong>Skill Gap</strong>
            <small>Know what to learn</small>
          </div>
        </div>

        {/* Left bottom bubble */}
        <div className="feature-bubble bubble-left-bottom">
          <span>💼</span>
          <div>
            <strong>Job Matching</strong>
            <small>Find suitable opportunities</small>
          </div>
        </div>

        {/* Right bottom bubble */}
        <div className="feature-bubble bubble-right-bottom">
          <span>🎤</span>
          <div>
            <strong>Interview Prep</strong>
            <small>Practice with AI</small>
          </div>
        </div>

        {/* Center */}
        <section className="hero-content">

          <div className="ai-label">
            <span className="green-dot"></span>
            AI-POWERED CAREER ASSISTANT
          </div>

          <h1>
            Build Your
            <br />
            <span>Career With VORA</span>
          </h1>

          <p>
            Your intelligent career companion for resume analysis,
            skill discovery, personalized learning roadmaps, job
            recommendations, and interview preparation.
          </p>

          <div className="hero-buttons">

            {/* CHATBOT */}
            <button
              className="primary-button"
              onClick={() => navigate("/dashboard")}
            >
              Start Your Journey
              <span>→</span>
            </button>

            {/* LOGIN */}
            <button
              className="secondary-button"
              onClick={() => navigate("/login")}
            >
              Sign In
            </button>

          </div>

          {/* Steps */}
          <div className="steps">

            <div className="step">
              <b>01</b>
              <span>Upload Resume</span>
            </div>

            <div className="line"></div>

            <div className="step">
              <b>02</b>
              <span>Set Your Goal</span>
            </div>

            <div className="line"></div>

            <div className="step">
              <b>03</b>
              <span>Get Your Roadmap</span>
            </div>

          </div>

        </section>

      </main>

      {/* Footer */}
      <footer className="footer">
        <span>© 2026 VORA AI</span>
        <span>Your career journey starts here.</span>
      </footer>

    </div>
  );
}

export default Welcome;