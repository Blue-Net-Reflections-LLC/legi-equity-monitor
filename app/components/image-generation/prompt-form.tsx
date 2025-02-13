'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { IMAGE_MODELS, IMAGE_SIZES, type PromptFormProps, type ImageGenerationFormData } from './types';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  prompt: z.string()
    .min(10, 'Prompt must be at least 10 characters')
    .max(500, 'Prompt must be less than 500 characters'),
  size: z.enum(['landscape_16_9', 'landscape_3_2', 'square']),
  model: z.enum(Object.keys(IMAGE_MODELS) as [string, ...string[]])
});

export function PromptForm({
  defaultPrompt,
  imageType,
  onSubmit,
  loading
}: PromptFormProps) {
  const form = useForm<ImageGenerationFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: defaultPrompt || '',
      size: IMAGE_SIZES[imageType].code,
      model: 'flux-pro/v1.1'
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

        <FormField
          control={form.control}
          name="model"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Model</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={loading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(IMAGE_MODELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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