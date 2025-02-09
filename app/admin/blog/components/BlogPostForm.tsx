'use client';

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
import { blogPostSchema, type BlogPost } from '@/app/lib/validations/blog';
import { UrlInput } from '@/components/image-generation';

interface BlogPostFormProps {
  initialData?: Partial<BlogPost>;
  isSubmitting?: boolean;
  onSubmit: (data: BlogPost) => Promise<void>;
}

function FormFieldWithError({ label, error, required }: { 
  label: string; 
  error?: boolean; 
  required?: boolean;
}) {
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

export function BlogPostForm({ initialData, isSubmitting = false, onSubmit }: BlogPostFormProps) {
  const form = useForm<BlogPost>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      title: '',
      slug: '',
      content: '',
      status: 'draft',
      author: '',
      is_curated: false,
      hero_image: '',
      hero_image_prompt: '',
      hero_image_alt: '',
      main_image: '',
      main_image_prompt: '',
      main_image_alt: '',
      thumb: '',
      thumb_prompt: '',
      thumb_alt: '',
      ...initialData
    }
  });

  const submitForm = async (status: 'published' | 'draft') => {
    const values = form.getValues();
    values.status = status;
    await onSubmit(values);
  };

  const isEditing = !!initialData?.post_id;

  return (
    <div className="h-[calc(100vh-4rem)] text-neutral-950 dark:text-neutral-50">
      <Form {...form}>
        <form>
          <div className="grid grid-cols-[minmax(0,1fr),400px] gap-6">
            {/* Main Content */}
            <div className="flex flex-col h-full max-w-4xl mx-auto">
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
                          "bg-white dark:bg-zinc-950",
                          "text-neutral-950 dark:text-neutral-50",
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
                            "bg-white dark:bg-zinc-950",
                            "text-neutral-950 dark:text-neutral-50",
                            form.formState.errors.slug && "border-destructive"
                          )}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                            className={cn(
                              "bg-white dark:bg-zinc-950",
                              "text-neutral-950 dark:text-neutral-50"
                            )}
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
                              "bg-white dark:bg-zinc-950",
                              "text-neutral-950 dark:text-neutral-50",
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
                      type="button"
                      onClick={() => submitForm('published')}
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting 
                        ? (isEditing ? 'Updating...' : 'Publishing...') 
                        : (isEditing ? 'Update & Publish' : 'Publish')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => submitForm('draft')}
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting 
                        ? 'Saving...' 
                        : (isEditing ? 'Save as Draft' : 'Save Draft')}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Images Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Images</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <UrlInput
                    name="hero_image"
                    label="Hero Image"
                    imageType="hero"
                    form={form}
                    promptFieldName="hero_image_prompt"
                    altFieldName="hero_image_alt"
                    disabled={isSubmitting}
                  />

                  <UrlInput
                    name="main_image"
                    label="Main Image"
                    imageType="main"
                    form={form}
                    promptFieldName="main_image_prompt"
                    altFieldName="main_image_alt"
                    disabled={isSubmitting}
                  />

                  <UrlInput
                    name="thumb"
                    label="Thumbnail"
                    imageType="thumbnail"
                    form={form}
                    promptFieldName="thumb_prompt"
                    altFieldName="thumb_alt"
                    disabled={isSubmitting}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
} 