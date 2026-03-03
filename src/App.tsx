import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Sessions from "./pages/Sessions";
import SessionsPublic from "./pages/SessionsPublic";
import SessionDetail from "./pages/SessionDetail";
import InscriptionForm from "./pages/InscriptionForm";
import Participants from "./pages/Participants";
import Emargement from "./pages/Emargement";
import Notifications from "./pages/Notifications";
import Reporting from "./pages/Reporting";
import Attestations from "./pages/Attestations";
import Hybride from "./pages/Hybride";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/formations" element={<SessionsPublic />} />
            <Route path="/inscription/:sessionId" element={<InscriptionForm />} />

            {/* Protected admin routes */}
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/sessions" element={<ProtectedRoute><Sessions /></ProtectedRoute>} />
            <Route path="/sessions/:id" element={<ProtectedRoute><SessionDetail /></ProtectedRoute>} />
            <Route path="/participants" element={<ProtectedRoute><Participants /></ProtectedRoute>} />
            <Route path="/emargement" element={<ProtectedRoute><Emargement /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/reporting" element={<ProtectedRoute><Reporting /></ProtectedRoute>} />
            <Route path="/attestations" element={<ProtectedRoute><Attestations /></ProtectedRoute>} />
            <Route path="/hybride" element={<ProtectedRoute><Hybride /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
