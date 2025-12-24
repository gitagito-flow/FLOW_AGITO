import { LiquidBackground } from "./LiquidBackground";

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <LiquidBackground />
      <div className="glass p-8 rounded-2xl flex flex-col items-center space-y-4 animate-fade-in">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-secondary border-b-transparent rounded-full animate-spin animation-delay-150" />
        </div>
        <p className="text-lg font-medium bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Loading...
        </p>
      </div>
    </div>
  );
}
