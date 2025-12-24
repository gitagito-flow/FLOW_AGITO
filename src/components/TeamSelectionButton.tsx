import React from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamSelectionButtonProps {
  teamId: string;
  teamName: string;
  isSelected: boolean;
  onToggle: (teamId: string) => void;
  category: "graphic" | "motion" | "music"; // Untuk menerapkan styling khusus kategori
}

export function TeamSelectionButton({
  teamId,
  teamName,
  isSelected,
  onToggle,
  category,
}: TeamSelectionButtonProps) {
  let activeBgClass = "";
  let activeTextClass = "text-primary-foreground"; // Teks putih untuk latar belakang berwarna (mode terang/gelap)

  if (category === "graphic") {
    activeBgClass = "bg-primary hover:bg-primary/90";
  } else if (category === "motion") {
    activeBgClass = "bg-secondary hover:bg-secondary/90";
  } else if (category === "music") {
    activeBgClass = "bg-accent hover:bg-accent/90";
  }

  return (
    <Button
      type="button"
      onClick={() => onToggle(teamId)}
      className={cn(
        "w-full justify-start transition-all duration-200 relative",
        "pl-3 pr-8", // Tambahkan padding untuk ikon centang
        isSelected ? activeBgClass : "glass hover:glass-dark",
        isSelected ? activeTextClass : "text-foreground" // Teks gelap untuk latar belakang terang (mode terang)
      )}
      variant={isSelected ? "default" : "ghost"}
    >
      {isSelected && (
        <Check className="h-4 w-4 absolute right-3" />
      )}
      {teamName}
    </Button>
  );
}