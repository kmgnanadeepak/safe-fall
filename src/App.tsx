import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import EmergencyContacts from "./pages/EmergencyContacts";
import HealthProfile from "./pages/HealthProfile";
import FallHistory from "./pages/FallHistory";
import LiveMap from "./pages/LiveMap";
import HospitalDashboard from "./pages/HospitalDashboard";
import AnalysisChat from "./pages/AnalysisChat";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import PrivacySecurity from "./pages/PrivacySecurity";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['patient']}><Dashboard /></ProtectedRoute>} />
              <Route path="/emergency-contacts" element={<ProtectedRoute allowedRoles={['patient']}><EmergencyContacts /></ProtectedRoute>} />
              <Route path="/health-profile" element={<ProtectedRoute><HealthProfile /></ProtectedRoute>} />
              <Route path="/fall-history" element={<ProtectedRoute><FallHistory /></ProtectedRoute>} />
              <Route path="/live-map" element={<ProtectedRoute><LiveMap /></ProtectedRoute>} />
              <Route path="/hospital-dashboard" element={<ProtectedRoute allowedRoles={['hospital']}><HospitalDashboard /></ProtectedRoute>} />
              <Route path="/hospital-map" element={<ProtectedRoute allowedRoles={['hospital']}><LiveMap /></ProtectedRoute>} />
              <Route path="/analysis-chat" element={<ProtectedRoute><AnalysisChat /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/privacy-security" element={<ProtectedRoute><PrivacySecurity /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
