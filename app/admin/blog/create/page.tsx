'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, AlertCircle } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Editor } from '@/components/editor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createBlogPostSchema, type CreateBlogPost } from '@/app/lib/validations/blog';
import { toast } from 'sonner';

function FormFieldWithError({ label, error, required }: { label: string; error?: boolean; required?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn(
        error && "text-destructive",
        "flex items-center gap-1"
      )}>
        {label}
        {required && (
          <span className="text-destructive text-sm">*</span>
        )}
      </span>
      {error && (
        <AlertCircle className="h-4 w-4 text-destructive" />
      )}
    </div>
  );
}

export default function CreateBlogPost() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateBlogPost>({
    resolver: zodResolver(createBlogPostSchema),
    defaultValues: {
      status: 'draft',
      is_curated: false,
      content: '',
    },
  });

  async function onSubmit(data: CreateBlogPost) {
    setIsSubmitting(true);
    try {
      const response = await fetch('/admin/api/blog/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle validation errors
        if (response.status === 400 && result.errors) {
          // Set form errors
          Object.entries(result.errors).forEach(([key, value]) => {
            form.setError(key as keyof CreateBlogPost, {
              message: Array.isArray(value) ? value[0] : value as string,
            });
          });
          toast.error('Please fix the form errors');
          return;
        }
        throw new Error(result.message || 'Failed to create blog post');
      }

      if (data.status === 'published') {
        // For published posts, redirect to the blog listing page
        toast.success('Blog post published successfully');
        router.push('/admin/blog');
      } else {
        // For drafts, show success message and let user continue editing
        toast.success('Draft saved successfully');
        // Update form with returned data to ensure we have the correct ID/timestamps
        form.reset(result.post);
      }
    } catch (error) {
      console.error('Error creating blog post:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create blog post');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="h-[calc(100vh-4rem)]">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-[1fr,300px] gap-6">
            {/* Main Content */}
            <div className="flex flex-col h-full">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <FormFieldWithError 
                        label="Title"
                        error={!!form.formState.errors.title}
                        required={true}
                      />
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter post title" 
                        className={cn(
                          "text-2xl h-auto py-3 px-4 border focus-visible:ring-0",
                          form.formState.errors.title && "border-destructive"
                        )}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex-1 min-h-0 mt-6">
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem className="h-full">
                      <FormLabel>
                        <FormFieldWithError 
                          label="Content"
                          error={!!form.formState.errors.content}
                          required={true}
                        />
                      </FormLabel>
                      <FormControl>
                        <div className={cn(
                          "h-full",
                          form.formState.errors.content && "border-destructive"
                        )}>
                          <Editor 
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="border-t mt-0">
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem className="py-4">
                      <FormLabel>
                        <FormFieldWithError 
                          label="Slug"
                          error={!!form.formState.errors.slug}
                          required={true}
                        />
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="enter-post-slug" 
                          className={cn(
                            form.formState.errors.slug && "border-destructive"
                          )}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4 py-4">
                  <FormField
                    control={form.control}
                    name="hero_image"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hero Image URL</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://..." 
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="main_image"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Main Image URL</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://..." 
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="thumb"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Thumbnail URL</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://..." 
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Publish</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge variant="outline" className="capitalize">
                      {form.watch('status')}
                    </Badge>
                  </div>

                  <FormField
                    control={form.control}
                    name="published_at"
                    render={({ field: { value, onChange, ...field } }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Publish Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" className="h-auto p-0">
                                <CalendarIcon className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                              <Calendar
                                selected={value as Date}
                                onSelect={onChange}
                                initialFocus

                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <FormControl>
                          <Input 
                            value={value ? format(value as Date, 'PPP') : 'Immediately'} 
                            readOnly
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="author"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <FormFieldWithError 
                            label="Author"
                            error={!!form.formState.errors.author}
                            required={true}
                          />
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter author name" 
                            className={cn(
                              form.formState.errors.author && "border-destructive"
                            )}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex flex-col gap-2 pt-4">
                    <Button
                      type="submit"
                      onClick={() => form.setValue('status', 'published')}
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Publishing...' : 'Publish'}
                    </Button>
                    <Button
                      type="submit"
                      variant="outline"
                      onClick={() => form.setValue('status', 'draft')}
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Saving...' : 'Save Draft'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
} 