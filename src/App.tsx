import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Pages
import { HomePage } from "./pages/public/HomePage";
import { LoginPage } from "./pages/public/LoginPage";
import { RegisterPage } from "./pages/public/RegisterPage";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminCustomers } from "./pages/admin/AdminCustomers";
import { AdminPlans } from "./pages/admin/AdminPlans";
import { AdminApplications } from "./pages/admin/AdminApplications";
import { CustomerDashboard } from "./pages/customer/CustomerDashboard";
import { ContactUs } from "./pages/public/ContactUs"
import { ApplicationPage } from "./pages/customer/ApplicationPage";

import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app">
          <Navbar />
          <Routes>
            {/* PUBLIC ROUTES */}
            <Route path="/" element={<HomePage />} />
            <Route path="/plans" element={<Navigate to="/" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/contact" element={<ContactUs />} />

            {/* ADMIN PROTECTED ROUTES */}
            <Route
              path="/admin"
              element={<Navigate to="/admin/dashboard" replace />}
            />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/customers"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminCustomers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/plans"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminPlans />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/applications"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminApplications />
                </ProtectedRoute>
              }
            />

            {/* CUSTOMER PROTECTED ROUTES */}
            <Route
              path="/customer"
              element={<Navigate to="/customer/dashboard" replace />}
            />
            <Route
              path="/customer/dashboard"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/apply"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <ApplicationPage />
                </ProtectedRoute>
              }
            />

            {/* FALLBACK */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
