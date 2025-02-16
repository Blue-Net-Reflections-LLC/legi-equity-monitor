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
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { blogPostSchema, type BlogPost } from '@/app/lib/validations/blog';
import { UrlInput } from '@/components/image-generation';
import { toast, Toaster } from 'sonner';
import { Tabs, TabsList, TabsContent, TabsTrigger } from '@/components/ui/tabs';
import { FilterTag } from '@/components/filters/FilterTag';
import { useState } from 'react';

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
      main_image: '',
      thumb: '',
      metadata: {
        hero_image_prompt: '',
        hero_image_alt: '',
        main_image_prompt: '',
        main_image_alt: '',
        thumbnail_image_prompt: '',
        thumbnail_image_alt: '',
        keywords: []
      },
      ...initialData
    }
  });

  const [newKeyword, setNewKeyword] = useState('');
  const keywords = form.watch('metadata.keywords') || [];

  const handleAddKeyword = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newKeyword.trim()) {
      e.preventDefault();
      const trimmedKeyword = newKeyword.trim();
      if (!keywords.includes(trimmedKeyword)) {
        form.setValue('metadata.keywords', [...keywords, trimmedKeyword]);
        setNewKeyword('');
      }
    }
  };

  const handleRemoveKeyword = (keywordToRemove: string) => {
    form.setValue(
      'metadata.keywords',
      keywords.filter(k => k !== keywordToRemove)
    );
  };

  const submitForm = async (status: 'published' | 'draft') => {
    try {
      const values = form.getValues();
      values.status = status;
      
      // Convert the date to ISO string for API
      const formData = {
        ...values,
        published_at: values.published_at ? new Date(values.published_at).toISOString() : null
      };
      
      await onSubmit(formData as BlogPost);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save blog post");
    }
  };

  const isEditing = !!initialData?.post_id;

  const handlePreview = () => {
    const formData = form.getValues();
    const previewData = {
      ...formData,
      slug: formData.slug || (formData.title ? formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : 'untitled'),
      status: 'draft',
      content: formData.content ? String(formData.content).trim() : '',
      published_at: formData.published_at ? new Date(formData.published_at).toISOString() : null
    };
    
    // Store preview data in localStorage
    localStorage.setItem('blog-preview', JSON.stringify(previewData));
    
    // Open preview in new window
    const previewWindow = window.open(`/blog/${previewData.slug}/preview`, '_blank');
    if (!previewWindow) {
      toast.error('Please allow popups for preview functionality');
      return;
    }
  };

  return (
    <div className="text-neutral-950 dark:text-neutral-50">
      <Toaster position="top-center" richColors />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-[minmax(0,1fr),400px] gap-6">
            {/* Main Content */}
            <div className="flex flex-col max-w-4xl mx-auto">
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

              <div className="min-h-0 mt-6">
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem className="">
                      <FormLabel>
                        <div className="flex items-center justify-between">
                          <FormFieldWithError 
                            label="Content"
                            error={!!form.formState.errors.content}
                            required={true}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handlePreview}
                            disabled={isSubmitting}
                            className="bg-blue-600 hover:bg-blue-700 text-white border-0"
                          >
                            Preview
                          </Button>
                        </div>
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

              {/* Keywords Field */}
              <FormField
                control={form.control}
                name="metadata.keywords"
                render={() => (
                  <FormItem className="py-4">
                    <FormLabel>Keywords</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        <Input
                          placeholder="Type a keyword and press Enter"
                          value={newKeyword}
                          onChange={(e) => setNewKeyword(e.target.value)}
                          onKeyDown={handleAddKeyword}
                          className={cn(
                            "bg-white dark:bg-zinc-950",
                            "text-neutral-950 dark:text-neutral-50"
                          )}
                        />
                        <div className="flex flex-wrap gap-2">
                          {keywords.map((keyword) => (
                            <FilterTag
                              key={keyword}
                              label={keyword}
                              onRemove={() => handleRemoveKeyword(keyword)}
                            />
                          ))}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                {/* <CardHeader>
                  <CardTitle>Publish</CardTitle>
                </CardHeader> */}
                <CardContent className="space-y-4 pt-6">
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

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      onClick={() => submitForm('draft')}
                      variant="outline"
                      className="flex-1"
                      disabled={isSubmitting}
                    >
                      {isSubmitting 
                        ? 'Saving...' 
                        : (isEditing ? 'Save as Draft' : 'Save Draft')}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => submitForm('published')}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                      disabled={isSubmitting}
                    >
                      {isSubmitting 
                        ? (isEditing ? 'Updating...' : 'Publishing...') 
                        : (isEditing ? 'Update & Publish' : 'Publish')}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Images Section */}
              <Card>
                {/* <CardHeader>
                  <CardTitle>Images</CardTitle>
                </CardHeader> */}
                <CardContent className="pt-6">
                  <Tabs defaultValue="main">
                    <TabsList className="grid w-full grid-cols-3 bg-muted/20 dark:bg-muted/5 p-1 rounded-lg">
                      <TabsTrigger 
                        value="main" 
                        className="rounded-md data-[state=active]:bg-background dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm"
                      >
                        Main
                      </TabsTrigger>
                      <TabsTrigger 
                        value="hero"
                        className="rounded-md data-[state=active]:bg-background dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm"
                      >
                        Hero
                      </TabsTrigger>
                      <TabsTrigger 
                        value="thumb"
                        className="rounded-md data-[state=active]:bg-background dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm"
                      >
                        Thumbnail
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="main" className="mt-4">
                      <UrlInput
                        name="main_image"
                        label="Main Image"
                        imageType="main"
                        form={form}
                        promptFieldName="metadata.main_image_prompt"
                        altFieldName="metadata.main_image_alt"
                        disabled={isSubmitting}
                      />
                    </TabsContent>
                    <TabsContent value="hero" className="mt-4">
                      <UrlInput
                        name="hero_image"
                        label="Hero Image"
                        imageType="hero"
                        form={form}
                        promptFieldName="metadata.hero_image_prompt"
                        altFieldName="metadata.hero_image_alt"
                        disabled={isSubmitting}
                      />
                    </TabsContent>
                    <TabsContent value="thumb" className="mt-4">
                      <UrlInput
                        name="thumb"
                        label="Thumbnail"
                        imageType="thumbnail"
                        form={form}
                        promptFieldName="metadata.thumbnail_image_prompt"
                        altFieldName="metadata.thumbnail_image_alt"
                        disabled={isSubmitting}
                      />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
} 