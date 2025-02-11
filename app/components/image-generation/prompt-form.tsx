'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { IMAGE_SIZES, type PromptFormProps, type ImageGenerationFormData } from './types';
import { Loader2 } from 'lucide-react';

const promptSchema = z.object({
  prompt: z.string()
    .min(10, 'Prompt must be at least 10 characters')
    .max(500, 'Prompt must be less than 500 characters'),
  size: z.enum(['landscape_16_9', 'landscape_3_2', 'square'])
});

export function PromptForm({
  defaultPrompt,
  imageType,
  onSubmit,
  loading
}: PromptFormProps) {
  const form = useForm<ImageGenerationFormData>({
    resolver: zodResolver(promptSchema),
    defaultValues: {
      prompt: defaultPrompt || '',
      size: IMAGE_SIZES[imageType].code
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="prompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image Generation Prompt</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter a detailed description of the image you want to generate..."
                  className="h-20 resize-none"
                  disabled={loading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate Images
          </Button>
        </div>
      </form>
    </Form>
  );
} 