import { Button } from "@/components/ui/button";
import { LiquidBackground } from "@/components/LiquidBackground";
import { Home, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative flex items-center justify-center">
      <LiquidBackground />
      
      <div className="glass p-12 rounded-2xl max-w-md text-center space-y-6 animate-fade-in">
        <div className="text-8xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          404
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Page Not Found</h1>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex gap-3 justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="glass hover:glass-dark"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
          <Button
            variant="gradient" // Menggunakan varian gradient
            onClick={() => navigate("/dashboard")}
            className="btn-gradient-effect" // Menerapkan efek gradient
          >
            <Home className="mr-2 h-4 w-4" />
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}