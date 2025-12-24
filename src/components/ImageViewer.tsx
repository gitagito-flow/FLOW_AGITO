import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { useState } from "react";

interface ImageViewerProps {
  imageUrl: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImageViewer({ imageUrl, open, onOpenChange }: ImageViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  if (!imageUrl) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-0" aria-describedby="image-viewer-description">
        <span id="image-viewer-description" className="sr-only">
          Full screen image viewer with zoom and rotation controls
        </span>
        <div className="relative w-full h-[95vh] flex items-center justify-center">
          <div className="absolute top-4 right-4 z-50 flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleZoomOut}
              className="glass bg-black/50 hover:bg-black/70 border-white/20"
            >
              <ZoomOut className="h-4 w-4 text-white" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleZoomIn}
              className="glass bg-black/50 hover:bg-black/70 border-white/20"
            >
              <ZoomIn className="h-4 w-4 text-white" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRotate}
              className="glass bg-black/50 hover:bg-black/70 border-white/20"
            >
              <RotateCw className="h-4 w-4 text-white" />
            </Button>
            <Button
              variant="outline" // Menggunakan varian outline
              size="icon"
              onClick={handleReset}
              className="glass bg-black/50 hover:bg-black/70 border-white/20" // Tetap menggunakan kelas glass
            >
              Reset
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="glass bg-black/50 hover:bg-black/70 border-white/20"
            >
              <X className="h-4 w-4 text-white" />
            </Button>
          </div>

          <img
            src={imageUrl}
            alt="Full size preview"
            className="max-w-full max-h-full object-contain transition-all duration-300"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}