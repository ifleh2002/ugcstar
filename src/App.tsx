import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Landing from "@/pages/Landing";
import Creators from "@/pages/Stars";
import CreatorDetail from "@/pages/CreatorDetail";
import OrderNew from "@/pages/OrderNew";
import Dashboard from "@/pages/Dashboard";
import OrderDetail from "@/pages/ProjectDetail";
import Auth from "@/pages/Auth";
import Admin from "@/pages/Admin";
import StarProfile from "@/pages/StarProfile";
import {AuthProvider,useAuth} from "@/lib/api";
import type {ReactNode} from "react";
function Protected({children,admin=false}:{children:ReactNode;admin?:boolean}) {const {user,loading,error}=useAuth(); const location=useLocation();if(loading)return <p className="container py-12">Chargement…</p>;if(error)return <p role="alert" className="container py-12">{error}</p>;if(!user)return <Navigate to={"/connexion?next="+encodeURIComponent(location.pathname)} replace/>;if(admin&&user.role!=="admin")return <p role="alert" className="container py-12">Cet espace est réservé à l’administration.</p>;return <>{children}</>;}
import Screenads from "@/pages/Screenads";
import Contracts from "@/pages/Contracts";
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <BrowserRouter><AuthProvider>
      <div className="flex min-h-full flex-col bg-background">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/stars" element={<Creators />} />
            <Route path="/stars/:id" element={<CreatorDetail />} />
            <Route path="/stars/:id/order" element={<OrderNew />} />
            <Route path="/connexion" element={<Auth />} />
            <Route path="/inscription" element={<Auth register />} />
            <Route path="/mon-profil" element={<Protected><StarProfile /></Protected>} />
            <Route path="/admin" element={<Protected admin><Admin /></Protected>} />
            <Route path="/" element={<Landing />} />
            <Route path="/creators" element={<Creators />} />
            <Route path="/creators/:id" element={<CreatorDetail />} />
            <Route path="/creators/:id/order" element={<OrderNew />} />
            <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
            <Route path="/orders/:id" element={<Protected><OrderDetail /></Protected>} />
            <Route path="/screenads" element={<Protected admin><Screenads /></Protected>} />
            <Route path="/contracts" element={<Protected admin><Contracts /></Protected>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider></BrowserRouter>
  );
}
