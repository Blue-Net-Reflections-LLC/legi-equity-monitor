import { auth } from '@/app/(auth)/auth';
import { ADMIN_ROLES } from '@/app/constants/user-roles';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { fal } from "@fal-ai/client";

// Initialize fal client
fal.config({
  credentials: process.env.BLOGGING_IMAGES_GENERATION_API_KEY
});

// Validate request body
const requestSchema = z.object({
  prompt: z.string()
    .min(10, 'Prompt must be at least 10 characters')
    .max(500, 'Prompt must be less than 500 characters'),
  size: z.enum(['landscape_16_9', 'landscape_3_2', 'square'])
});

// Map size codes to dimensions
const DIMENSIONS = {
  landscape_16_9: { width: 1280, height: 720 },
  landscape_3_2: { width: 1200, height: 800 },
  square: { width: 300, height: 300 }
} as const;

// Number of images to generate per request
const IMAGES_PER_REQUEST = 2;

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    // Check authentication
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Check admin role
    if (!session.user?.role || !ADMIN_ROLES.includes(session.user.role)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Check if Fal.ai configuration is available
    if (!process.env.BLOGGING_IMAGES_GENERATION_API_KEY) {
      return new NextResponse('Image generation not configured', { status: 500 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = requestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { errors: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { prompt, size } = validationResult.data;
    const dimensions = DIMENSIONS[size];

    // Generate images using fal client with flux/dev model
    const { data } = await fal.subscribe('fal-ai/flux/dev', {
      input: {
        prompt,
        image_size: {
          width: dimensions.width,
          height: dimensions.height
        },
        num_images: IMAGES_PER_REQUEST,
        num_inference_steps: 28, // Default value from API docs
        guidance_scale: 3.5,     // Default value from API docs
        enable_safety_checker: true,
        sync_mode: false // Use async mode for better performance
      },
      pollInterval: 1000, // Poll every second
      logs: true, // Enable logs for debugging
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          // Log progress for debugging
          console.log(update.logs.map(log => log.message));
        }
      }
    });

    // Transform response to our format
    const images = data.images.map((image) => ({
      url: image.url,
      alt: `AI generated image for: ${prompt.slice(0, 100)}...`,
      width: image.width ?? dimensions.width,
      height: image.height ?? dimensions.height
    }));

    return NextResponse.json({ 
      images,
      seed: data.seed, // Include seed for reproducibility
      prompt: data.prompt // Include final prompt used
    });
  } catch (error) {
    console.error('Image generation error:', error);
    return new NextResponse(
      error instanceof Error ? error.message : 'Failed to generate images',
      { status: 500 }
    );
  }
} 