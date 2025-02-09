'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { IMAGE_SIZES, type GenerationDialogProps, type ImageGenerationFormData } from './types';
import { PromptForm } from './prompt-form';
import { ImageGrid } from './image-grid';
import { cn } from '@/lib/utils';

export function GenerationDialog({
  open,
  onClose,
  onSelect,
  imageType,
  defaultPrompt,
  existingUrl
}: GenerationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [images, setImages] = useState<Array<{ url: string; alt?: string }>>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>();

  const handleSubmit = async (data: ImageGenerationFormData) => {
    try {
      setLoading(true);
      setError(undefined);
      setImages([]);
      setSelectedIndex(undefined);

      const response = await fetch('/api/image-generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate images');
      }

      const result = await response.json();
      setImages(result.images);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate images');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = () => {
    if (selectedIndex !== undefined && images[selectedIndex]) {
      const selected = images[selectedIndex];
      onSelect({
        url: selected.url,
        alt: selected.alt,
        prompt: defaultPrompt || ''
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={cn(
        "max-w-3xl",
        "bg-white dark:bg-zinc-950",
        "text-neutral-950 dark:text-neutral-50",
        "border-border"
      )}>
        <DialogHeader>
          <DialogTitle>
            {existingUrl ? 'Regenerate' : 'Generate'} {IMAGE_SIZES[imageType].name}
          </DialogTitle>
          <DialogDescription>
            Enter a prompt to generate images. Select the best one to use.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <PromptForm
            defaultPrompt={defaultPrompt}
            imageType={imageType}
            onSubmit={handleSubmit}
            loading={loading}
          />

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <ImageGrid
            images={images}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
            loading={loading}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
} 