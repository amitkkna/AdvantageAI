'use client';

import { useState } from 'react';
import { Camera, ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AssetPhoto {
  id: string;
  url: string;
  caption?: string | null;
  isPrimary: boolean;
}

interface AssetPhotoGalleryProps {
  photos: AssetPhoto[];
  assetName: string;
}

export function AssetPhotoGallery({ photos, assetName }: AssetPhotoGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (photos.length === 0) {
    return (
      <div className="w-full h-64 bg-muted flex flex-col items-center justify-center rounded-lg">
        <ImageOff className="h-12 w-12 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No photos available</p>
      </div>
    );
  }

  const openLightbox = (index: number) => setLightboxIndex(index);

  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (lightboxIndex === null) return;
    if (direction === 'prev') {
      setLightboxIndex(lightboxIndex > 0 ? lightboxIndex - 1 : photos.length - 1);
    } else {
      setLightboxIndex(lightboxIndex < photos.length - 1 ? lightboxIndex + 1 : 0);
    }
  };

  return (
    <>
      {/* Primary photo */}
      <div className="relative cursor-pointer group" onClick={() => openLightbox(0)}>
        <img
          src={photos[0].url}
          alt={photos[0].caption || assetName}
          className="w-full h-64 object-cover rounded-lg group-hover:opacity-90 transition-opacity"
        />
        {photos[0].isPrimary && (
          <Badge className="absolute top-2 left-2" variant="secondary">
            <Camera className="h-3 w-3 mr-1" /> Primary
          </Badge>
        )}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="bg-black/60 text-white text-xs px-3 py-1 rounded-full">Click to enlarge</span>
        </div>
      </div>

      {/* Thumbnail grid */}
      {photos.length > 1 && (
        <div className="grid grid-cols-4 gap-2 mt-2">
          {photos.slice(1).map((photo, idx) => (
            <div
              key={photo.id}
              className="relative cursor-pointer group"
              onClick={() => openLightbox(idx + 1)}
            >
              <img
                src={photo.url}
                alt={photo.caption || `${assetName} view ${idx + 2}`}
                className="w-full h-20 object-cover rounded-md group-hover:opacity-80 transition-opacity"
              />
              {photo.caption && (
                <span className="absolute bottom-0 left-0 right-0 text-[9px] bg-black/50 text-white px-1 py-0.5 rounded-b-md truncate">
                  {photo.caption}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox dialog */}
      <Dialog open={lightboxIndex !== null} onOpenChange={() => setLightboxIndex(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">{assetName} - Photo {(lightboxIndex ?? 0) + 1}</DialogTitle>
          {lightboxIndex !== null && (
            <div className="relative">
              <img
                src={photos[lightboxIndex].url}
                alt={photos[lightboxIndex].caption || assetName}
                className="w-full max-h-[80vh] object-contain bg-black"
              />
              {photos.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                    onClick={(e) => { e.stopPropagation(); navigateLightbox('prev'); }}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                    onClick={(e) => { e.stopPropagation(); navigateLightbox('next'); }}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <p className="text-white text-sm">{photos[lightboxIndex].caption}</p>
                <p className="text-white/70 text-xs">{lightboxIndex + 1} of {photos.length}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
