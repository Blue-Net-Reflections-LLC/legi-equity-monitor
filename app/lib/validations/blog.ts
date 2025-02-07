import * as z from 'zod'

// Base schema for blog post fields
export const blogPostSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(255, 'Title must be less than 255 characters'),
  
  slug: z.string()
    .min(1, 'Slug is required')
    .max(255, 'Slug must be less than 255 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be URL-friendly (lowercase letters, numbers, and hyphens)'),
  
  content: z.string()
    .min(1, 'Content is required'),
  
  status: z.enum(['draft', 'review', 'published', 'archived'], {
    required_error: 'Status is required',
    invalid_type_error: 'Invalid status'
  }),
  
  published_at: z.date()
    .nullable()
    .optional(),
  
  author: z.string()
    .min(1, 'Author is required')
    .max(100, 'Author name must be less than 100 characters'),
  
  is_curated: z.boolean()
    .default(false),
  
  hero_image: z.string()
    .url('Hero image must be a valid URL')
    .nullable()
    .optional(),
  
  main_image: z.string()
    .url('Main image must be a valid URL')
    .nullable()
    .optional(),
  
  thumb: z.string()
    .url('Thumbnail must be a valid URL')
    .nullable()
    .optional()
})

// Schema for creating a new blog post
export const createBlogPostSchema = blogPostSchema.omit({
  published_at: true
}).extend({
  published_at: z.union([
    z.string().datetime({ message: 'Invalid date format' }),
    z.date(),
    z.null()
  ]).optional()
})

// Schema for updating a blog post
export const updateBlogPostSchema = blogPostSchema.partial().extend({
  published_at: z.union([
    z.string().datetime({ message: 'Invalid date format' }),
    z.date(),
    z.null()
  ]).optional()
})

// Schema for batch updating blog posts
export const batchUpdateBlogPostSchema = z.object({
  ids: z.array(z.number(), {
    required_error: 'Post IDs are required',
    invalid_type_error: 'Invalid post IDs'
  }).min(1, 'At least one post ID is required'),
  
  data: z.object({
    status: z.enum(['draft', 'review', 'published', 'archived']).optional(),
    is_curated: z.boolean().optional()
  }, {
    required_error: 'Update data is required'
  }).refine(data => 
    Object.keys(data).length > 0, 
    'At least one field must be provided for update'
  )
})

// Types derived from schemas
export type BlogPost = z.infer<typeof blogPostSchema>
export type CreateBlogPost = z.infer<typeof createBlogPostSchema>
export type UpdateBlogPost = z.infer<typeof updateBlogPostSchema>
export type BatchUpdateBlogPost = z.infer<typeof batchUpdateBlogPostSchema> 