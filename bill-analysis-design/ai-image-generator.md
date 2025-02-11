# AI Image Generator

## Overview
The AI Image Generator is a tool that uses AI to generate images based on text input.

## Components

### URL Input Field
- Text input field that displays the selected image URL
- Preview button/thumbnail to view the current image (respects configured aspect ratio)
- Generate button that opens the image generation dialog (disabled during generation)
- Clear button to remove the current image URL
- Copy URL button
- Loading indicator during image generation

### Image Generation Dialog
- Form with the following elements:
  - Text area for image prompt (required, with min/max length limits)
  - Size selector dropdown with pre-configured options
  - Generate button to start image generation
  - Close button to dismiss dialog
  - Error states shown only in dialog
  - Loading states during generation

#### Image Selection View
- Grid display of 4 generated images
- Click to select functionality
- Selected image indicator
- Regenerate button for new variations
- Confirm selection button that:
  - Closes the dialog
  - Updates the URL input field
  - Shows preview thumbnail
  - The prompt is also returned with the selected image
- Alt text generation for accessibility (stored in metadata)

## Supported Image Sizes
| Image Type      | Dimensions        | Aspect Ratio | code |
|----------------|------------------|--------------|------|
| Hero image     | 1280 x 720 pixels| 16:9         |landscape_16_9
| Blog image     | 1200 x 800 pixels| 3:2          | landscape_3_2  
| Thumbnail image| 300 x 300 pixels | 1:1          | square

## Implementation Details
- Image generation using fal.ai/models/fal-ai/flux/dev/api#files-data-uri
- JavaScript client integration: https://docs.fal.ai/clients/javascript
- Server-side proxy implementation: https://docs.fal.ai/model-endpoints/server-side/#ready-to-use-proxy-implementations
- Initial image storage using Fal.ai (Cloudflare integration planned for future)

## User Flow
1. User clicks generate button on URL input field
2. Image generation dialog opens
3. User enters prompt (pre-filled if previous prompt exists) and selects size
4. System generates 4 image variations
5. User selects desired image
6. Dialog closes and URL field updates with selected image
7. Preview thumbnail shows selected image

## Dialog Behavior
- Closing dialog without selection: Prompts for confirmation and keeps existing URL
- Error handling: Shows errors only within dialog
- Loading states: Visible in both dialog and URL input field
- Prompt validation: Enforces minimum/maximum length requirements

## Accessibility Features
- Alt text generation for selected images
- Alt text stored in blog post metadata
- Keyboard navigation support
- ARIA labels for all interactive elements
- Loading state announcements

## Designation
- The component will be added to the blog post for the three image fields
    - Hero image
    - Blog image
    - Thumbnail image
- Prompts and alt text will be stored in the blog_posts metadata field:
    "metadata": {
        "hero_image_prompt": "Hero Image Prompt",
        "hero_image_alt": "Generated alt text for hero image",
        "main_image_prompt": "Main Image Prompt",
        "main_image_alt": "Generated alt text for main image",
        "thumbnail_image_prompt": "Thumbnail Image Prompt",
        "thumbnail_image_alt": "Generated alt text for thumbnail image",
        "keywords": ["Keyword1", "Keyword2", "Keyword3"]
    }

## Mockups
[To be added]


