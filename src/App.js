import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./LoginPage";
import LandingPage from "./LandingPage";
import AddPets from "./components/AddPets";
import ManagePets from "./components/ManagePets";
import Reports from "./components/Reports";
import Feedback from "./components/Feedback";
import ManagePetReports from "./components/ManagePetReports";
import ManageRequests from "./components/ManageRequests";
import ManageUsers from "./components/ManageUsers";
import ManageMessages from "./components/Messages";
import IncidentDetails from "./components/IncidentDetails";

// Wrapper component to enforce authentication
const ProtectedRoute = ({ isAuthenticated, children }) => {
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUid, setAdminUid] = useState(null);

  // Load authentication state on app start
  useEffect(() => {
    const storedAuth = localStorage.getItem("isAuthenticated");
    const storedUid = localStorage.getItem("adminUid");

    if (storedAuth === "true" && storedUid) {
      setIsAuthenticated(true);
      setAdminUid(storedUid);
      console.log("Admin UID loaded from localStorage:", storedUid);
    } else {
      console.warn("Admin UID not found in localStorage.");
    }
  }, []);

  // Login handler
  const handleLoginSuccess = (uid) => {
    console.log("Admin logged in with UID:", uid);
    setIsAuthenticated(true);
    setAdminUid(uid);

    // Persist login state in localStorage
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("adminUid", uid);
  };

  // Logout handler
  const handleLogout = () => {
    setIsAuthenticated(false);
    setAdminUid(null);

    // Clear localStorage
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("adminUid");
    console.log("Admin logged out.");
  };

  if (adminUid === null && isAuthenticated) {
    // Render a fallback in case `adminUid` is temporarily unavailable
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Route: Login */}
          <Route
            path="/login"
            element={<LoginPage onLoginSuccess={handleLoginSuccess} />}
          />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <LandingPage adminUid={adminUid} onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/add-pets"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <AddPets adminUid={adminUid} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manage-pets"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <ManagePets adminUid={adminUid} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/feedback"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <Feedback adminUid={adminUid} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/pet-reports"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <ManagePetReports adminUid={adminUid} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/incident/:id"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <IncidentDetails adminUid={adminUid} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/requests"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <ManageRequests adminUid={adminUid} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/users"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <ManageUsers adminUid={adminUid} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/messages"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <ManageMessages adminUid={adminUid} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <Reports adminUid={adminUid} />
              </ProtectedRoute>
            }
          />

          {/* Default route: Redirect to login */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
