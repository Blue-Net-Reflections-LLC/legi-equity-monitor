'use client';

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { type ImageGridProps } from './types';
import { Button } from '@/components/ui/button';

export function ImageGrid({
  images,
  selectedIndex,
  onSelect,
  loading
}: ImageGridProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] border rounded-lg bg-muted/50">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">Generating images...</p>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] border rounded-lg bg-muted/50">
        <p className="text-sm text-muted-foreground">
          Enter a prompt and click generate to create images
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {images.map((image, index) => (
          <div
            key={image.url}
            className={cn(
              "relative aspect-square border rounded-lg overflow-hidden cursor-pointer",
              "hover:border-primary transition-colors",
              selectedIndex === index && "ring-2 ring-primary"
            )}
            onClick={() => onSelect(index)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.url}
              alt={image.alt || `Generated image ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {selectedIndex !== undefined && (
        <div className="flex justify-end">
          <Button onClick={() => onSelect(selectedIndex)}>
            Use Selected Image
          </Button>
        </div>
      )}
    </div>
  );
} 