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
import Reporting from "./pages/Reporting";
import Attestations from "./pages/Attestations";
import Settings from "./pages/Settings";
import UsersManagement from "./pages/UsersManagement";
import FormBuilder from "./pages/FormBuilder";
import FormFieldsEditor from "./pages/FormFieldsEditor";
import FormSubmissions from "./pages/FormSubmissions";
import FormPublicView from "./pages/FormPublicView";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
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
            <Route path="/" element={<SessionsPublic />} />
            <Route path="/formations" element={<SessionsPublic />} />
            <Route path="/sessions/:id" element={<SessionDetail />} />
            <Route path="/inscription/:sessionId" element={<InscriptionForm />} />
            <Route path="/formulaire/:slug" element={<FormPublicView />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected admin routes */}
            <Route path="/admin" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/admin/sessions" element={<ProtectedRoute><Sessions /></ProtectedRoute>} />
            <Route path="/admin/sessions/:id" element={<ProtectedRoute><SessionDetail /></ProtectedRoute>} />
            <Route path="/admin/participants" element={<ProtectedRoute><Participants /></ProtectedRoute>} />
            <Route path="/admin/emargement" element={<ProtectedRoute><Emargement /></ProtectedRoute>} />
            <Route path="/admin/reporting" element={<ProtectedRoute><Reporting /></ProtectedRoute>} />
            <Route path="/admin/attestations" element={<ProtectedRoute><Attestations /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/admin/utilisateurs" element={<ProtectedRoute><UsersManagement /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
