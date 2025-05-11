
import { useNavigate } from "react-router-dom";

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col items-center justify-between bg-tactical-darkgray px-6 py-12">
      {/* Logo and Branding */}
      <div className="flex flex-col items-center mb-4">
        <div className="w-24 h-24 bg-tactical-blue rounded-full flex items-center justify-center mb-4">
          <span className="text-white text-3xl font-bold">PF</span>
        </div>
        <h1 className="text-3xl font-bold mb-2">PF Tactical</h1>
        <p className="text-muted-foreground text-center">
          Performance-focused training for tactical athletes
        </p>
      </div>
      
      {/* Hero image */}
      <div className="w-full max-w-xs mx-auto my-8 rounded-xl overflow-hidden">
        <div className="aspect-[3/4] bg-tactical-blue/20 rounded-xl flex items-center justify-center">
          {/* Placeholder for hero image */}
          <div className="text-4xl font-bold text-tactical-blue/60">
            <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m18 4 3 3-3 3"></path>
              <path d="m18 20 3-3-3-3"></path>
              <path d="M3 7h3a5 5 0 0 1 5 5 5 5 0 0 0 5 5h5"></path>
              <path d="M3 17h3a5 5 0 0 0 5-5 5 5 0 0 1 5-5h5"></path>
            </svg>
          </div>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="w-full space-y-4">
        <button className="btn-primary" onClick={() => navigate("/login")}>
          Login
        </button>
        <button className="btn-outline" onClick={() => navigate("/register")}>
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
