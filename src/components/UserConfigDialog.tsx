import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "lucide-react";
import { getCurrentUserName, setCurrentUserName } from "@/lib/storage";
import { toast } from "sonner";

interface UserConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNameSet: (name: string) => void;
}

export function UserConfigDialog({ open, onOpenChange, onNameSet }: UserConfigDialogProps) {
  const [name, setName] = useState("");

  useEffect(() => {
    const storedName = getCurrentUserName();
    if (storedName) {
      setName(storedName);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      toast.error("Please enter a valid name.");
      return;
    }

    setCurrentUserName(trimmedName);
    onNameSet(trimmedName);
    onOpenChange(false);
    toast.success(`Welcome, ${trimmedName}!`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Set Your Name
          </DialogTitle>
          <DialogDescription>
            This name will be used for time tracking and comments across all projects.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userName">Your Name</Label>
            <Input
              id="userName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="glass"
              placeholder="e.g., John Doe"
              required
            />
          </div>
          <Button type="submit" variant="gradient" className="btn-gradient-effect"> {/* Menggunakan varian gradient */}
            Save Name
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}