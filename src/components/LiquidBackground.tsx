export function LiquidBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div
        className="liquid-blob w-96 h-96 bg-primary/30 top-20 left-10"
        style={{ animationDelay: "0s" }}
      />
      <div
        className="liquid-blob w-80 h-80 bg-secondary/30 bottom-20 right-20 animate-float-slow"
        style={{ animationDelay: "5s" }}
      />
      <div
        className="liquid-blob w-64 h-64 bg-accent/30 top-1/2 left-1/2 animate-float-slower"
        style={{ animationDelay: "10s" }}
      />
    </div>
  );
}
