// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import CampaignList from "./pages/CampaignList";
import CreateCampaign from "./pages/CreateCampaign";
import CampaignDetail from "./pages/CampaignDetail";
import EmailTracking from "./pages/EmailTracking";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Confirm from "./pages/Confirm";
import ForgotPassword from "./pages/ForgotPassword";
import PrivateRoute from "./components/PrivateRoute";
import Navbar from "./components/Navbar";
import DripCampaignBuilder from "./pages/DripCampaignBuilder";
import DripCampaignsDashboard from "./pages/DripCampaignsDashboard";
import TemplateLibrary from "./templates/TemplateLibrary";
import TemplateEditor from "./templates/TemplateEditor";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/confirm" element={<Confirm />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Root redirect - check if logged in */}
        <Route
          path="/"
          element={
            localStorage.getItem("token") ? (
              <Navigate to="/campaigns" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Protected routes */}
        <Route
          path="/campaigns"
          element={
            <PrivateRoute>
              <CampaignList />
            </PrivateRoute>
          }
        />
        <Route
          path="/create"
          element={
            <PrivateRoute>
              <CreateCampaign />
            </PrivateRoute>
          }
        />
        <Route
          path="/campaign/:id"
          element={
            <PrivateRoute>
              <CampaignDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/tracking/:campaignId"
          element={
            <PrivateRoute>
              <EmailTracking />
            </PrivateRoute>
          }
        />
        <Route
          path="/drip-builder"
          element={
            <PrivateRoute>
              <DripCampaignBuilder />
            </PrivateRoute>
          }
        />
        <Route
          path="/drip-dashboard"
          element={
            <PrivateRoute>
              <DripCampaignsDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/templates"
          element={
            <PrivateRoute>
              <TemplateLibrary />
            </PrivateRoute>
          }
        />
        <Route
          path="/template-editor"
          element={
            <PrivateRoute>
              <TemplateEditor />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;