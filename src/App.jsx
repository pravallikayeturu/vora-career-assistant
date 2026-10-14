import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

import Signup from "./pages/Signup/signup";
import Login from "./pages/Login/login";
import Welcome from "./pages/Welcome/Welcome";
import Chatbot from "./pages/Chatbot/Chatbot";

function AppContent() {
  const navigate = useNavigate();

  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("vora_access_token")
  );

  // Signup completed
  const handleSignupSuccess = () => {
    setIsAuthenticated(true);

    // IMPORTANT:
    // Signup → Welcome
    navigate("/welcome");
  };

  // Login completed
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);

    // Login → Chatbot
    navigate("/dashboard");
  };

  // Welcome → Chatbot
  const handleGoToChatbot = () => {
    navigate("/dashboard");
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("vora_access_token");
    localStorage.removeItem("vora_refresh_token");

    setIsAuthenticated(false);

    // Logout → Signup
    navigate("/signup");
  };

  return (
    <Routes>

      {/* FIRST PAGE */}
      <Route
        path="/"
        element={
          <Navigate to="/signup" replace />
        }
      />

      {/* SIGNUP */}
      <Route
        path="/signup"
        element={
          isAuthenticated ? (
            <Navigate to="/welcome" replace />
          ) : (
            <Signup
              onLogin={() => navigate("/login")}
              onSuccess={handleSignupSuccess}
            />
          )
        }
      />

      {/* WELCOME */}
      <Route
        path="/welcome"
        element={
          isAuthenticated ? (
            <Welcome onContinue={handleGoToChatbot} />
          ) : (
            <Navigate to="/signup" replace />
          )
        }
      />

      {/* LOGIN */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/welcome" replace />
          ) : (
            <Login
              onSignup={() => navigate("/signup")}
              onSuccess={handleLoginSuccess}
            />
          )
        }
      />

      {/* CHATBOT */}
      <Route
        path="/dashboard"
        element={
          isAuthenticated ? (
            <Chatbot onLogout={handleLogout} />
          ) : (
            <Navigate to="/signup" replace />
          )
        }
      />

      {/* ANY WRONG URL */}
      <Route
        path="*"
        element={<Navigate to="/signup" replace />}
      />

    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;