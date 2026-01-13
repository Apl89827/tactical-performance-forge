
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect, createContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

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
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Install from "./pages/Install";

// Components
import OfflineIndicator from "./components/pwa/OfflineIndicator";

// Create auth context
export const AuthContext = createContext<{
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
}>({
  session: null,
  user: null,
  isAdmin: false,
});

// Create a new QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check authentication and admin status
  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Using setTimeout to prevent auth deadlocks
          setTimeout(() => {
            checkAdminStatus(session.user.id);
            checkOnboardingStatus();
          }, 0);
        } else {
          setIsAdmin(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        checkAdminStatus(session.user.id);
        checkOnboardingStatus();
      }
      
      setIsInitialized(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('role', 'admin');
        
      if (error) throw error;
      
      setIsAdmin(data && data.length > 0);
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
    }
  };
  
  const checkOnboardingStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setHasCompletedOnboarding(false);
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      setHasCompletedOnboarding(!!data?.has_completed_onboarding);
    } catch (err) {
      console.warn('Failed to check onboarding status:', err);
      setHasCompletedOnboarding(false);
    }
  };

  const completeOnboarding = () => {
    setHasCompletedOnboarding(true);
  };
  
  // Show loading state until we've checked auth status
  if (!isInitialized) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-tactical-darkgray">
        <div className="animate-spin h-8 w-8 border-4 border-tactical-blue border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={{ session, user, isAdmin }}>
        <TooltipProvider>
          <OfflineIndicator />
          <Toaster />
          <Sonner position="top-center" closeButton={true} />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={session ? <Navigate to="/dashboard" /> : <Welcome />} />
              <Route path="/install" element={<Install />} />
              <Route path="/login" element={session ? <Navigate to="/dashboard" /> : <Login />} />
              <Route path="/register" element={session ? <Navigate to="/dashboard" /> : <Register />} />
              <Route path="/forgot-password" element={session ? <Navigate to="/dashboard" /> : <ForgotPassword />} />
              {/* Reset page should be accessible regardless to handle recovery session */}
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* Authentication check for onboarding */}
              <Route 
                path="/onboarding" 
                element={
                  session ? 
                    (hasCompletedOnboarding ? <Navigate to="/dashboard" /> : <Onboarding onComplete={completeOnboarding} />) : 
                    <Navigate to="/login" />
                } 
              />
              
              {/* Protected routes - require authentication and completed onboarding */}
              <Route 
                path="/dashboard" 
                element={
                  session ? 
                    (hasCompletedOnboarding ? <Dashboard /> : <Navigate to="/onboarding" />) : 
                    <Navigate to="/login" />
                } 
              />
              <Route 
                path="/workout/:id" 
                element={
                  session ? 
                    (hasCompletedOnboarding ? <Workout /> : <Navigate to="/onboarding" />) : 
                    <Navigate to="/login" />
                } 
              />
              <Route 
                path="/calendar" 
                element={
                  session ? 
                    (hasCompletedOnboarding ? <Calendar /> : <Navigate to="/onboarding" />) : 
                    <Navigate to="/login" />
                } 
              />
              <Route 
                path="/progress" 
                element={
                  session ? 
                    (hasCompletedOnboarding ? <Progress /> : <Navigate to="/onboarding" />) : 
                    <Navigate to="/login" />
                } 
              />
              <Route 
                path="/library" 
                element={
                  session ? 
                    (hasCompletedOnboarding ? <Library /> : <Navigate to="/onboarding" />) : 
                    <Navigate to="/login" />
                } 
              />
              <Route path="/profile" element={session ? <Profile /> : <Navigate to="/login" />} />
              
              {/* Admin routes */}
              <Route 
                path="/admin" 
                element={
                  session && isAdmin ? <Admin /> : <Navigate to="/dashboard" />
                }
              />
              
              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
};

export default App;
