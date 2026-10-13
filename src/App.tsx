import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
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
import ForgotPassword from "@/pages/auth/ForgotPassword";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import { useEffect } from "react";
import Profile from "@/pages/Profile";
import Marketing from "@/pages/Marketing";
import CookiePreferences from "@/components/features/CookiePreferences";
import NotFound from "@/pages/NotFound";

function ScrollToPage() {
 const { pathname, hash } = useLocation();
 useEffect(() => { if(hash) { requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView()); } else window.scrollTo(0,0); }, [pathname, hash]);
 return null;
}
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="flex min-h-full flex-col bg-background">
          <ScrollToPage />
          <Navbar />
          <main className="flex-1">

            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/mon-profil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/marques" element={<Marketing page="marques"/>} />
              <Route path="/devenir-createur" element={<Marketing page="createurs"/>} />
              <Route path="/tarifs" element={<Marketing page="tarifs"/>} />
              <Route path="/demo" element={<Marketing page="demo"/>} />
              <Route path="/blog" element={<Marketing page="blog"/>} />
              <Route path="/blog/:slug" element={<Marketing page="article"/>} />
              <Route path="/informations/:section" element={<Marketing page="infos"/>} />
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
              <Route path="/auth/forgot-password" element={<ForgotPassword />} />
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
          <CookiePreferences />
          <Toaster richColors position="top-right" />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
