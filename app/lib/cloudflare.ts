import { BlogPost } from './validations/blog';

const cloudflareAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const cloudflareApiToken = process.env.CLOUDFLARE_IMAGES_API_TOKEN;

type BlogPostWithStringDates = Omit<BlogPost, 'published_at' | 'created_at'> & {
  published_at?: string | Date | null;
  created_at?: string | Date;
};

export async function uploadToCloudflare(imageUrl: string, metadata: Record<string, unknown>) {
  if (!cloudflareAccountId || !cloudflareApiToken) {
    throw new Error('Cloudflare configuration missing');
  }

  const formData = new FormData();
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  formData.append('file', blob);
  formData.append('metadata', JSON.stringify(metadata));

  const uploadResponse = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/images/v1`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cloudflareApiToken}`,
      },
      body: formData,
    }
  );

  if (!uploadResponse.ok) {
    throw new Error('Failed to upload image to Cloudflare');
  }

  const result = await uploadResponse.json();
  return result.result.variants[0];
}

export async function uploadBlogImages<T extends Partial<BlogPostWithStringDates>>(post: T): Promise<T> {
  const uploads: Record<string, Promise<string>> = {};
  
  if (post.hero_image?.includes('fal.media')) {
    uploads.hero_image = uploadToCloudflare(post.hero_image, { 
      type: 'hero',
      title: post.title
    });
  }
  
  if (post.main_image?.includes('fal.media')) {
    uploads.main_image = uploadToCloudflare(post.main_image, {
      type: 'main',
      title: post.title
    });
  }
  
  if (post.thumb?.includes('fal.media')) {
    uploads.thumb = uploadToCloudflare(post.thumb, {
      type: 'thumbnail',
      title: post.title
    });
  }

  if (Object.keys(uploads).length === 0) {
    return post;
  }

  const results = await Promise.all(Object.values(uploads));
  const updatedUrls = Object.fromEntries(
    Object.keys(uploads).map((key, index) => [key, results[index]])
  );

  return {
    ...post,
    ...updatedUrls
  };
} 