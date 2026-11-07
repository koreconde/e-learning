import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import AdminAuth from "./pages/AdminAuth.tsx";
import AdminLeads from "./pages/AdminLeads.tsx";
import AdminCampaigns from "./pages/AdminCampaigns.tsx";
import { CookieBanner } from "./components/CookieBanner";
import { AdminErrorBoundary } from "./components/AdminErrorBoundary";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route
            path="/li"
            element={
              <Navigate
                to="/?utm_source=linkedin&utm_medium=organic&utm_campaign=post_organico"
                replace
              />
            }
          />
          <Route
            path="/linkedin"
            element={
              <Navigate
                to="/?utm_source=linkedin&utm_medium=organic&utm_campaign=post_organico"
                replace
              />
            }
          />
          <Route path="/admin/auth" element={<AdminAuth />} />
          <Route
            path="/admin"
            element={
              <AdminErrorBoundary>
                <AdminLeads />
              </AdminErrorBoundary>
            }
          />
          <Route
            path="/admin/campaigns"
            element={
              <AdminErrorBoundary>
                <AdminCampaigns />
              </AdminErrorBoundary>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <CookieBanner />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
