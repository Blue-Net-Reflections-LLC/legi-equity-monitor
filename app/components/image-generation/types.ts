import { FieldValues, UseFormReturn, Path } from 'react-hook-form';

export const IMAGE_MODELS = {
  'flux/dev': 'Flux Dev',
  'flux-pro/v1.1': 'Flux Pro v1.1',
  'recraft-v3': 'Recraft v3',
  'ideogram/v2': 'Ideogram v2',
  'flux-pro/v1.1-ultra': 'Flux Pro Ultra',
  'imagen3': 'Imagen 3'
} as const;

export type ImageModel = keyof typeof IMAGE_MODELS;

export type ImageSize = {
  code: 'landscape_16_9' | 'landscape_3_2' | 'square';
  name: string;
  width: number;
  height: number;
  aspectRatio: string;
};

export const IMAGE_SIZES: Record<string, ImageSize> = {
  hero: {
    code: 'landscape_16_9',
    name: 'Hero Image',
    width: 1280,
    height: 720,
    aspectRatio: '16:9'
  },
  main: {
    code: 'landscape_3_2',
    name: 'Blog Image',
    width: 1200,
    height: 800,
    aspectRatio: '3:2'
  },
  thumbnail: {
    code: 'square',
    name: 'Thumbnail',
    width: 300,
    height: 300,
    aspectRatio: '1:1'
  }
} as const;

export type ImageType = keyof typeof IMAGE_SIZES;

export interface GeneratedImage {
  url: string;
  alt?: string;
  prompt: string;
}

export interface ImageGenerationFormData {
  prompt: string;
  size: ImageSize['code'];
  model: ImageModel;
  count: number;
}

export interface ImageGenerationResponse {
  images: Array<{
    url: string;
    alt?: string;
  }>;
  error?: string;
}

export interface ImageFormFields {
  url: string;
  prompt: string;
  alt: string;
}

export interface UrlInputProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  imageType: ImageType;
  form: UseFormReturn<T>;
  promptFieldName: Path<T>;
  altFieldName: Path<T>;
  disabled?: boolean;
}

export interface GenerationDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (image: GeneratedImage) => void;
  imageType: ImageType;
  defaultPrompt?: string;
  existingUrl?: string;
  apiEndpoint: string;
}

export interface ImageGridProps {
  images: Array<{
    url: string;
    alt?: string;
  }>;
  selectedIndex?: number;
  onSelect: (index: number) => void;
  onConfirm: () => void;
  loading?: boolean;
}

export interface PromptFormProps {
  defaultPrompt?: string;
  imageType: ImageType;
  onSubmit: (data: ImageGenerationFormData) => void;
  loading?: boolean;
} 