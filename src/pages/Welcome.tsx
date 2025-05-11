
import { useNavigate } from "react-router-dom";

const Welcome = () => {
  const navigate = useNavigate();

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
        <h1 className="text-3xl font-bold mb-2">PF Tactical</h1>
        <p className="text-muted-foreground text-center">
          Performance-focused training for tactical athletes
        </p>
      </div>
      
      {/* Hero image */}
      <div className="w-full max-w-xs mx-auto my-8 rounded-xl overflow-hidden">
        <div className="aspect-[3/4] bg-gradient-to-b from-tactical-blue/20 to-tactical-darkgray rounded-xl flex items-center justify-center shadow-inner">
          {/* Hero image depicting tactical training */}
          <div className="flex flex-col items-center justify-center">
            <div className="text-tactical-blue/60 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16.2 3.8a2.7 2.7 0 0 0-3.81 0l-.4.38-.4-.4a2.7 2.7 0 0 0-3.82 0C6.73 4.85 6.67 6.64 8 8l4 4 4-4c1.33-1.36 1.27-3.15.2-4.2z"></path>
                <path d="M8 8c-1.36 1.37-2 3.88-2 6.67 0 4.97 1.33 7.33 6 7.33s6-2.36 6-7.33c0-2.79-.64-5.3-2-6.67"></path>
                <path d="M12 19v-3"></path>
                <path d="M10 13V9"></path>
                <path d="M14 13V9"></path>
              </svg>
            </div>
            <p className="text-sm text-tactical-blue/80 font-medium">TACTICAL EXCELLENCE</p>
          </div>
        </div>
      </div>
      
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
