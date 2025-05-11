
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-tactical-darkgray p-6">
      <div className="w-16 h-16 bg-tactical-blue/10 rounded-full flex items-center justify-center mb-6">
        <AlertTriangle className="text-tactical-blue h-8 w-8" />
      </div>
      
      <h1 className="text-3xl font-bold mb-2 text-center">Page Not Found</h1>
      <p className="text-muted-foreground text-center mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      
      <button 
        onClick={() => navigate("/dashboard")}
        className="btn-primary bg-gradient-to-r from-tactical-blue to-tactical-blue/80 hover:from-tactical-blue/90 hover:to-tactical-blue/70 max-w-xs w-full shadow-md"
      >
        Return to Dashboard
      </button>
    </div>
  );
};

export default NotFound;
