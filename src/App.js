import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
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
const ProtectedRoute = ({ isAuthenticated, isLoadingAuth, children }) => {
  if (isLoadingAuth) {
    return <div>Loading authentication...</div>;
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUid, setAdminUid] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); // <-- Moved here

  useEffect(() => {
    const storedAuth = localStorage.getItem("isAuthenticated");
    const storedUid = localStorage.getItem("adminUid");

    if (storedAuth === "true" && storedUid) {
      setIsAuthenticated(true);
      setAdminUid(storedUid);
    }

    setIsLoadingAuth(false);
  }, []);

  const handleLoginSuccess = (uid) => {
    setIsAuthenticated(true);
    setAdminUid(uid);
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("adminUid", uid);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAdminUid(null);
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("adminUid");
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route
            path="/login"
            element={<LoginPage onLoginSuccess={handleLoginSuccess} />}
          />

          <Route
            path="/"
            element={
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                isLoadingAuth={isLoadingAuth}
              >
                <LandingPage adminUid={adminUid} onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/add-pets"
            element={
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                isLoadingAuth={isLoadingAuth}
              >
                <AddPets adminUid={adminUid} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manage-pets"
            element={
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                isLoadingAuth={isLoadingAuth}
              >
                <ManagePets adminUid={adminUid} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/feedback"
            element={
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                isLoadingAuth={isLoadingAuth}
              >
                <Feedback adminUid={adminUid} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/pet-reports"
            element={
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                isLoadingAuth={isLoadingAuth}
              >
                <ManagePetReports adminUid={adminUid} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/incident/:id"
            element={
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                isLoadingAuth={isLoadingAuth}
              >
                <IncidentDetails adminUid={adminUid} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/requests"
            element={
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                isLoadingAuth={isLoadingAuth}
              >
                <ManageRequests adminUid={adminUid} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/users"
            element={
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                isLoadingAuth={isLoadingAuth}
              >
                <ManageUsers adminUid={adminUid} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/messages"
            element={
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                isLoadingAuth={isLoadingAuth}
              >
                <ManageMessages adminUid={adminUid} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedRoute
                isAuthenticated={isAuthenticated}
                isLoadingAuth={isLoadingAuth}
              >
                <Reports adminUid={adminUid} />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
