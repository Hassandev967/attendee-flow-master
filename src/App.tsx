import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/formations" element={<SessionsPublic />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/sessions/:id" element={<SessionDetail />} />
          <Route path="/inscription/:sessionId" element={<InscriptionForm />} />
          <Route path="/participants" element={<Participants />} />
          <Route path="/emargement" element={<Emargement />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/reporting" element={<Reporting />} />
          <Route path="/attestations" element={<Attestations />} />
          <Route path="/hybride" element={<Hybride />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
