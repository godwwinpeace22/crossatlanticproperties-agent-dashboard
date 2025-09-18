"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LightboxProps {
  images: string[];
  isOpen: boolean;
  currentIndex: number;
  onClose: () => void;
  onImageChange: (index: number) => void;
}

export default function Lightbox({
  images,
  isOpen,
  currentIndex,
  onClose,
  onImageChange,
}: LightboxProps) {
  const [isZoomed, setIsZoomed] = useState(false);

  const nextImage = () => {
    const newIndex = (currentIndex + 1) % images.length;
    onImageChange(newIndex);
    setIsZoomed(false);
  };

  const prevImage = () => {
    const newIndex = (currentIndex - 1 + images.length) % images.length;
    onImageChange(newIndex);
    setIsZoomed(false);
  };

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  const handleClose = () => {
    setIsZoomed(false);
    onClose();
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "Escape":
          handleClose();
          break;
        case "ArrowLeft":
          prevImage();
          break;
        case "ArrowRight":
          nextImage();
          break;
        case " ":
          e.preventDefault();
          toggleZoom();
          break;
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyPress);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, currentIndex, isZoomed]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
      onClick={handleClose}
    >
      {/* Close button */}
      <Button
        variant="outline"
        size="icon"
        className="absolute top-4 right-4 z-20 bg-white/10 border-white/20 text-white hover:bg-white/20"
        onClick={handleClose}
      >
        <X className="h-5 w-5" />
        <span className="sr-only">Close lightbox</span>
      </Button>

      {/* Zoom toggle */}
      <Button
        variant="outline"
        size="icon"
        className="absolute top-4 right-16 z-20 bg-white/10 border-white/20 text-white hover:bg-white/20"
        onClick={toggleZoom}
      >
        {isZoomed ? (
          <ZoomOut className="h-5 w-5" />
        ) : (
          <ZoomIn className="h-5 w-5" />
        )}
        <span className="sr-only">{isZoomed ? "Zoom out" : "Zoom in"}</span>
      </Button>

      {/* Main image container */}
      <div
        className={`relative w-full h-full flex items-center justify-center transition-transform duration-300 ${
          isZoomed ? "scale-150 cursor-move" : "scale-100"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative max-w-[90vw] max-h-[90vh] w-full h-full">
          <Image
            src={images[currentIndex] || "/placeholder.svg"}
            alt={`Property image ${currentIndex + 1}`}
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Navigation buttons */}
      {images.length > 1 && (
        <>
          <Button
            variant="outline"
            size="icon"
            className="absolute left-4 top-1/2 z-20 -translate-y-1/2 bg-white/10 border-white/20 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              prevImage();
            }}
          >
            <ChevronLeft className="h-6 w-6" />
            <span className="sr-only">Previous image</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-4 top-1/2 z-20 -translate-y-1/2 bg-white/10 border-white/20 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              nextImage();
            }}
          >
            <ChevronRight className="h-6 w-6" />
            <span className="sr-only">Next image</span>
          </Button>
        </>
      )}

      {/* Image counter and info */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4">
        <div className="bg-black/60 text-white px-4 py-2 rounded-full text-sm">
          {currentIndex + 1} / {images.length}
        </div>
        <div className="text-white/70 text-xs">
          Press ESC to close • Arrow keys to navigate • Space to zoom
        </div>
      </div>

      {/* Thumbnail strip */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90vw] overflow-x-auto px-4 py-2 bg-black/40 rounded-lg">
        {images.map((image, index) => (
          <button
            key={index}
            className={`relative h-12 w-12 flex-shrink-0 overflow-hidden rounded transition-all ${
              index === currentIndex
                ? "ring-2 ring-white"
                : "opacity-50 hover:opacity-80"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onImageChange(index);
              setIsZoomed(false);
            }}
          >
            <Image
              src={image || "/placeholder.svg"}
              alt={`Thumbnail ${index + 1}`}
              fill
              className="object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
