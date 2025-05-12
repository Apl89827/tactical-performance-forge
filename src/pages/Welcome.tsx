
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

const Welcome = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard');
      } else {
        setLoading(false);
      }
    };
    
    checkSession();
  }, [navigate]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-tactical-darkgray">
        <div className="animate-spin h-8 w-8 border-4 border-tactical-blue border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-between bg-tactical-darkgray px-6 py-12">
      {/* Logo and Branding */}
      <div className="flex flex-col items-center mb-4">
        <div className="w-32 h-32 flex items-center justify-center mb-4">
          <img 
            src="/lovable-uploads/cb57105b-33dc-4813-9b66-ba828e6b1d42.png" 
            alt="Performance First Logo" 
            className="w-full h-auto"
          />
        </div>
        <h1 className="text-3xl font-bold mb-2">Performance First Operator</h1>
        <p className="text-muted-foreground text-center">
          Performance-focused training for tactical athletes
        </p>
      </div>
      
      {/* Empty space where the hero image was */}
      <div className="flex-1"></div>
      
      {/* Action buttons */}
      <div className="w-full space-y-4">
        <button 
          className="btn-primary bg-gradient-to-r from-tactical-blue to-tactical-blue/80 hover:from-tactical-blue/90 hover:to-tactical-blue/70 shadow-md"
          onClick={() => navigate("/login")}
        >
          Login
        </button>
        <button 
          className="btn-outline border-tactical-blue/30 text-tactical-blue hover:bg-tactical-blue/10" 
          onClick={() => navigate("/register")}
        >
          Create Account
        </button>
        
        <p className="text-center text-sm text-muted-foreground mt-8">
          Performance First US | Tactical Training
        </p>
      </div>
    </div>
  );
};

export default Welcome;
