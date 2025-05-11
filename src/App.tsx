
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Book from "./pages/Book";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Navigation from "@/components/Navigation";
import RoleConfig from "@/pages/RoleConfig";
import MasterData from "./pages/MasterData";
import ManageTests from "./pages/ManageTests";
import Notifications from "./pages/Notifications";

const queryClient = new QueryClient();

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Router>
        <Navigation />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/book" element={<Book />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/manage-tests" element={<ManageTests />} />
          <Route path="/role-config" element={<RoleConfig />} />
          <Route path="/master-data" element={<MasterData />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
