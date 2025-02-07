'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  status: z.enum(['draft', 'review', 'published', 'archived']),
  content: z.string().min(1, 'Content is required'),
  publishedAt: z.date().optional(),
  author: z.string().min(1, 'Author is required'),
  isCurated: z.boolean().default(false),
  heroImage: z.string().url().optional().nullable(),
  mainImage: z.string().url().optional().nullable(),
  thumb: z.string().url().optional().nullable(),
});

type FormData = z.infer<typeof formSchema>;

export default function CreateBlogPost() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: 'draft',
      isCurated: false,
      content: '',
    },
  });

  async function onSubmit(data: FormData) {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/blog/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create blog post');
      }

      const result = await response.json();
      router.push(`/admin/blog/${result.post.slug}`);
    } catch (error) {
      console.error('Error creating blog post:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="h-[calc(100vh-4rem)]">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="h-full">
          <div className="grid grid-cols-[1fr,300px] gap-6 h-full">
            {/* Main Content */}
            <div className="flex flex-col h-full">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input 
                        placeholder="Enter post title" 
                        className="text-2xl h-auto py-3 px-4 border-0 focus-visible:ring-0 rounded-none border-b"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex-1 min-h-0">
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem className="h-full">
                      <FormControl>
                        <div className="h-full">
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

              <div className="border-t">
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem className="py-4">
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input placeholder="enter-post-slug" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4 py-4">
                  <FormField
                    control={form.control}
                    name="heroImage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hero Image URL</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://..." 
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mainImage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Main Image URL</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://..." 
                            {...field}
                            value={field.value || ''}
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
                            value={field.value || ''}
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
                    name="publishedAt"
                    render={({ field }) => (
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
                                mode="single"
                                selected={field.value || undefined}
                                onSelect={(date: Date | undefined) => field.onChange(date || null)}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <FormControl>
                          <Input 
                            value={field.value ? format(field.value, 'PPP') : 'Immediately'} 
                            readOnly
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
                        <FormLabel>Author</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter author name" {...field} />
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
                    >
                      Publish
                    </Button>
                    <Button
                      type="submit"
                      variant="outline"
                      onClick={() => form.setValue('status', 'draft')}
                      className="w-full"
                    >
                      Save Draft
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