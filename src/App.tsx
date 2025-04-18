
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Book from "./pages/Book";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Navigation from "@/components/Navigation";
import RoleConfig from "@/pages/RoleConfig";
import MasterData from "./pages/MasterData";
import ManageTests from "./pages/ManageTests";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Router>
        <AuthProvider>
          <Navigation />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/book" element={
              <ProtectedRoute>
                <Book />
              </ProtectedRoute>
            } />
            <Route path="/manage-tests" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageTests />
              </ProtectedRoute>
            } />
            <Route path="/role-config" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <RoleConfig />
              </ProtectedRoute>
            } />
            <Route path="/master-data" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <MasterData />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </Router>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
