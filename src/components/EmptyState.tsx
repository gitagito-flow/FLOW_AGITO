import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="glass p-12 rounded-2xl max-w-md animate-fade-in">
        <div className="mb-6 flex justify-center">
          <div className="glass p-6 rounded-full">
            <Icon className="h-12 w-12 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <p className="text-muted-foreground mb-6">{description}</p>
        {actionLabel && onAction && (
          <Button 
            variant="gradient" // Menggunakan varian gradient
            onClick={onAction}
            className="btn-gradient-effect" // Menerapkan efek gradient
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}