import * as z from 'zod'

// Metadata schema for blog posts
const blogMetadataSchema = z.object({
  hero_image_prompt: z.string().nullable().optional(),
  hero_image_alt: z.string().nullable().optional(),
  main_image_prompt: z.string().nullable().optional(),
  main_image_alt: z.string().nullable().optional(),
  thumbnail_image_prompt: z.string().nullable().optional(),
  thumbnail_image_alt: z.string().nullable().optional(),
  keywords: z.array(z.string()).optional()
}).nullable().optional()

// Base schema for blog post fields
export const blogPostSchema = z.object({
  post_id: z.string().uuid().optional(),
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
  
  created_at: z.date()
    .optional(),
  
  author: z.string()
    .min(1, 'Author is required')
    .max(100, 'Author name must be less than 100 characters'),
  
  is_curated: z.boolean()
    .default(false),
  
  hero_image: z.string().url('Hero image must be a valid URL').nullable().optional(),
  
  main_image: z.string().url('Main image must be a valid URL').nullable().optional(),
  
  thumb: z.string().url('Thumbnail must be a valid URL').nullable().optional(),

  cluster_id: z.string().uuid().optional(),
  
  metadata: blogMetadataSchema
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
export const updateBlogPostSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  slug: z.string().min(1, 'Slug is required'),
  status: z.enum(['draft', 'review', 'published', 'archived']),
  author: z.string().min(1, 'Author is required'),
  hero_image: z.string().nullable(),
  main_image: z.string().nullable(),
  thumb: z.string().nullable(),
  cluster_id: z.string().uuid().optional(),
  published_at: z.union([z.date(), z.string().datetime(), z.null()]),
  metadata: blogMetadataSchema
})

// Schema for batch updating blog posts
export const batchUpdateBlogPostSchema = z.object({
  ids: z.array(z.number(), {
    required_error: 'Post IDs are required',
    invalid_type_error: 'Invalid post IDs'
  }).min(1, 'At least one post ID is required'),
  
  data: z.object({
    status: z.enum(['draft', 'review', 'published', 'archived']).optional(),
    is_curated: z.boolean().optional(),
    metadata: blogMetadataSchema
  }, {
    required_error: 'Update data is required'
  }).refine(data => 
    Object.keys(data).length > 0, 
    'At least one field must be provided for update'
  )
})

// Schema for partial blog post updates
export const partialUpdateBlogPostSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  content: z.string().min(1, 'Content is required').optional(),
  slug: z.string().min(1, 'Slug is required').optional(),
  status: z.enum(['draft', 'review', 'published', 'archived']).optional(),
  author: z.string().min(1, 'Author is required').optional(),
  hero_image: z.string().nullable().optional(),
  main_image: z.string().nullable().optional(),
  thumb: z.string().nullable().optional(),
  published_at: z.union([z.date(), z.string().datetime(), z.null()]),
  metadata: blogMetadataSchema
}).refine(data => Object.keys(data).length > 0, 'At least one field must be provided for update')

// Types derived from schemas
export type BlogPost = z.infer<typeof blogPostSchema>
export type CreateBlogPost = z.infer<typeof createBlogPostSchema>
export type UpdateBlogPost = z.infer<typeof updateBlogPostSchema>
export type BatchUpdateBlogPost = z.infer<typeof batchUpdateBlogPostSchema>
export type BlogMetadata = z.infer<typeof blogMetadataSchema> 