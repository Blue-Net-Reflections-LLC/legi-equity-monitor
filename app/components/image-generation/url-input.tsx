'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageIcon, Copy, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IMAGE_SIZES, type UrlInputProps } from './types';
import { GenerationDialog } from './generation-dialog';
import { FieldValues, Path, PathValue } from 'react-hook-form';

export function UrlInput<T extends FieldValues>({
  name,
  label,
  imageType,
  form,
  promptFieldName,
  altFieldName,
  disabled
}: UrlInputProps<T>) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const imageSize = IMAGE_SIZES[imageType];
  const currentUrl = form.watch(name) as string || '';
  const currentPrompt = form.watch(promptFieldName) as string || '';
  
  // Get the metadata field based on image type
  const metadata = form.watch('metadata' as Path<T>) as unknown as Record<string, unknown>;
  const metadataPrompt = metadata?.[`${imageType}_image_prompt`] as string || '';

  const handleGenerate = () => {
    setDialogOpen(true);
    setLoading(true);
  };

  const handleClear = () => {
    form.setValue(name, '' as PathValue<T, Path<T>>);
    form.setValue(promptFieldName, '' as PathValue<T, Path<T>>);
    form.setValue(altFieldName, '' as PathValue<T, Path<T>>);
    setLoading(false);
  };

  const handleCopy = async () => {
    if (currentUrl) {
      await navigator.clipboard.writeText(currentUrl);
    }
  };

  const handleSelect = (image: { url: string; alt?: string; prompt: string }) => {
    form.setValue(name, image.url as PathValue<T, Path<T>>);
    form.setValue(promptFieldName, image.prompt as PathValue<T, Path<T>>);
    debugger
    if (image.alt) {
      form.setValue(altFieldName, image.alt as PathValue<T, Path<T>>);
    }
    // Update the metadata prompt when a new image is selected
    form.setValue(`metadata.${imageType}_image_prompt` as Path<T>, image.prompt as PathValue<T, Path<T>>);
    setDialogOpen(false);
    setLoading(false);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      <div className="flex gap-2">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Input
              {...form.register(name)}
              disabled={disabled}
              placeholder={`Enter ${imageSize.name.toLowerCase()} URL`}
              className={cn(
                "bg-white dark:bg-zinc-950",
                "text-neutral-950 dark:text-neutral-50",
                "border-input"
              )}
            />
            {loading && (
              <div className="absolute inset-y-0 right-3 flex items-center">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>

          {currentUrl && (
            <Button
              variant="outline"
              size="icon"
              type="button"
              onClick={handleCopy}
              disabled={disabled}
            >
              <Copy className="h-4 w-4" />
            </Button>
          )}

          {currentUrl && (
            <Button
              variant="outline"
              size="icon"
              type="button"
              onClick={handleClear}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          )}

          <Button
            type="button"
            onClick={handleGenerate}
            disabled={disabled}
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Generate
          </Button>
        </div>
      </div>

      {currentUrl && (
        <div 
          className={cn(
            "relative mt-2 border rounded-lg overflow-hidden bg-muted/50",
            "hover:bg-muted transition-colors"
          )}
          style={{ 
            paddingTop: `${(imageSize.height / imageSize.width) * 100}%` 
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentUrl}
            alt={form.watch(altFieldName) || 'Generated image'}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      )}

      <GenerationDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSelect={handleSelect}
        imageType={imageType}
        defaultPrompt={currentPrompt || metadataPrompt}
        existingUrl={currentUrl}
        apiEndpoint="/admin/api/image-generation"
      />
    </div>
  );
} 