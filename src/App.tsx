
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";

// Pages
import Welcome from "./pages/Welcome";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Workout from "./pages/Workout";
import Calendar from "./pages/Calendar";
import Progress from "./pages/Progress";
import Library from "./pages/Library";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  // Check if user has authenticated and completed onboarding
  useEffect(() => {
    // For the mockup, we'll just use localStorage
    const authStatus = localStorage.getItem("isAuthenticated") === "true";
    const onboardingStatus = localStorage.getItem("hasCompletedOnboarding") === "true";
    
    setIsAuthenticated(authStatus);
    setHasCompletedOnboarding(onboardingStatus);
  }, []);

  // Mock authentication functions
  const handleLogin = () => {
    localStorage.setItem("isAuthenticated", "true");
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.setItem("isAuthenticated", "false");
    localStorage.setItem("hasCompletedOnboarding", "false");
    setIsAuthenticated(false);
    setHasCompletedOnboarding(false);
  };

  const completeOnboarding = () => {
    localStorage.setItem("hasCompletedOnboarding", "true");
    setHasCompletedOnboarding(true);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Welcome />} />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/register" element={<Register onRegister={handleLogin} />} />
            
            {/* Authentication check for onboarding */}
            <Route 
              path="/onboarding" 
              element={
                isAuthenticated ? 
                  (hasCompletedOnboarding ? <Navigate to="/dashboard" /> : <Onboarding onComplete={completeOnboarding} />) : 
                  <Navigate to="/login" />
              } 
            />
            
            {/* Protected routes - require authentication and completed onboarding */}
            <Route 
              path="/dashboard" 
              element={
                isAuthenticated ? 
                  (hasCompletedOnboarding ? <Dashboard /> : <Navigate to="/onboarding" />) : 
                  <Navigate to="/login" />
              } 
            />
            <Route 
              path="/workout/:id" 
              element={
                isAuthenticated ? 
                  (hasCompletedOnboarding ? <Workout /> : <Navigate to="/onboarding" />) : 
                  <Navigate to="/login" />
              } 
            />
            <Route 
              path="/calendar" 
              element={
                isAuthenticated ? 
                  (hasCompletedOnboarding ? <Calendar /> : <Navigate to="/onboarding" />) : 
                  <Navigate to="/login" />
              } 
            />
            <Route 
              path="/progress" 
              element={
                isAuthenticated ? 
                  (hasCompletedOnboarding ? <Progress /> : <Navigate to="/onboarding" />) : 
                  <Navigate to="/login" />
              } 
            />
            <Route 
              path="/library" 
              element={
                isAuthenticated ? 
                  (hasCompletedOnboarding ? <Library /> : <Navigate to="/onboarding" />) : 
                  <Navigate to="/login" />
              } 
            />
            <Route 
              path="/profile" 
              element={
                isAuthenticated ? 
                  (hasCompletedOnboarding ? <Profile onLogout={handleLogout} /> : <Navigate to="/onboarding" />) : 
                  <Navigate to="/login" />
              } 
            />
            
            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
