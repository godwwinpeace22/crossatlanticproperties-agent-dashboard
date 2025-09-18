"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";

import { Button } from "@/components/ui/button";
import Lightbox from "@/components/lightbox";

interface PropertyGalleryProps {
  images: string[];
}

export default function PropertyGallery({ images }: PropertyGalleryProps) {
  const [currentImage, setCurrentImage] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  const openLightbox = () => {
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  const handleLightboxImageChange = (index: number) => {
    setCurrentImage(index);
  };

  return (
    <>
      <div className="space-y-2">
        <div className="relative overflow-hidden rounded-lg">
          <Button
            variant="outline"
            size="icon"
            className="absolute right-2 top-2 z-10 bg-background/80 backdrop-blur-sm hover:bg-background"
            onClick={openLightbox}
          >
            <Expand className="h-4 w-4" />
            <span className="sr-only">View full size</span>
          </Button>
          <div className="relative aspect-video">
            <Image
              src={images[currentImage] || "/placeholder.svg"}
              alt={`Property image ${currentImage + 1}`}
              fill
              className="object-cover"
            />
            {images.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-2 top-1/2 z-10 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Previous image</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-2 top-1/2 z-10 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Next image</span>
                </Button>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-2 overflow-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md transition-all ${
                index === currentImage
                  ? "ring-2 ring-primary"
                  : "opacity-70 hover:opacity-100"
              }`}
              onClick={() => setCurrentImage(index)}
            >
              <Image
                src={image || "/placeholder.svg"}
                alt={`Property thumbnail ${index + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox Component */}
      <Lightbox
        images={images}
        isOpen={isLightboxOpen}
        currentIndex={currentImage}
        onClose={closeLightbox}
        onImageChange={handleLightboxImageChange}
      />
    </>
  );
}
