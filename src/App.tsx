import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Landing from "@/pages/Landing";
import Creators from "@/pages/Creators";
import CreatorDetail from "@/pages/CreatorDetail";
import OrderNew from "@/pages/OrderNew";
import Dashboard from "@/pages/Dashboard";
import OrderDetail from "@/pages/OrderDetail";
import Screenads from "@/pages/Screenads";
import Contracts from "@/pages/Contracts";
import ContractAnalytics from "@/pages/ContractAnalytics";
import Activate from "@/pages/auth/Activate";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="flex min-h-full flex-col bg-background">
          <Navbar />
          <main className="flex-1">
            <p className="border-b border-border bg-muted px-4 py-2 text-center text-xs text-muted-foreground">Démonstration : stars, commandes, messages et revenus sont fictifs. Les comptes utilisent le backend configuré.</p>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/creators" element={<Creators />} />
              <Route path="/creators/:id" element={<CreatorDetail />} />
              <Route
                path="/creators/:id/order"
                element={
                  <ProtectedRoute>
                    <OrderNew />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders/:id"
                element={
                  <ProtectedRoute>
                    <OrderDetail />
                  </ProtectedRoute>
                }
              />
              <Route path="/screenads" element={<ProtectedRoute roles={["admin", "collaborator"]}><Screenads /></ProtectedRoute>} />
              <Route path="/contracts" element={<ProtectedRoute><Contracts /></ProtectedRoute>} />
              <Route path="/contracts/analytics" element={<ProtectedRoute roles={["admin", "collaborator"]}><ContractAnalytics /></ProtectedRoute>} />
              <Route path="/auth/activate" element={<Activate />} />
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/register" element={<Register />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
          <Toaster richColors position="top-right" />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
