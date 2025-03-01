import { BlogLayout } from './components/BlogList';
import { Metadata } from 'next';
import { AuroraBackground } from '../components/ui/aurora-background';
import { Newspaper } from 'lucide-react';
import { generateMetadata as generatePageMetadata } from '@/app/utils/metadata-utils';

export const metadata: Metadata = generatePageMetadata(
  'LegiEquity Blog',
  'Insights and updates on legislative analysis and demographic equity',
  '/blog',
  {
    openGraph: {
      title: 'LegiEquity Blog',
      description: 'Insights and updates on legislative analysis and demographic equity',
      images: [{
        url: '/api/og/static?page=blog',
        width: 1200,
        height: 630,
        alt: 'LegiEquity Blog'
      }]
    },
    twitter: {
      card: 'summary_large_image',
      title: 'LegiEquity Blog',
      description: 'Insights and updates on legislative analysis and demographic equity',
      images: ['/api/og/static?page=blog'],
    }
  }
);

// The fetchPosts function can be reused in the page component
async function fetchPosts(page: number = 1) {
  const postsPerPage = page === 1 ? 21 : 20;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://legiequity.us';
  
  try {
    const response = await fetch(`${baseUrl}/api/blog/posts?page=${page}&limit=${postsPerPage}`, { 
      next: { 
        // Revalidate every hour
        revalidate: 3600,
        // Mark page as cacheable
        tags: ['blog-posts'],
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch posts');
    }
    
    const data = await response.json();
    return {
      posts: data.data || [],
      totalPosts: data.total || 0
    };
  } catch (error) {
    console.error('Error fetching posts:', error);
    return {
      posts: [],
      totalPosts: 0
    };
  }
}

// Generate static params for paginated blog routes
export async function generateStaticParams() {
  try {
    // Fetch the total number of posts to calculate total pages
    const { totalPosts } = await fetchPosts(1);
    
    // Calculate total pages - first page has 21 posts, others have 20
    const totalPages = Math.ceil((totalPosts - 1) / 20);
    
    // Generate params for each page
    const pageParams = [];
    
    // Add first page
    pageParams.push({ searchParams: { page: '1' } });
    
    // Add remaining pages
    for (let i = 2; i <= totalPages && i <= 10; i++) {
      pageParams.push({ 
        searchParams: { page: i.toString() } 
      });
    }
    
    return pageParams;
  } catch (error) {
    console.error('Error generating static params for blog pages:', error);
    return [{ searchParams: { page: '1' } }];
  }
}

// The main page component
export default async function BlogPage({ 
  searchParams 
}: { 
  searchParams: { page?: string } 
}) {
  // Parse the page from the request
  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  
  // Fetch posts on the server
  const { posts, totalPosts } = await fetchPosts(page);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900">
      {/* Hero Section */}
      <section className="h-[30vh] relative">
        <AuroraBackground>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-900 dark:text-white">
            <div className="flex items-center space-x-3 mb-4">
              <Newspaper className="w-8 h-8" />
              <h1 className="text-4xl md:text-6xl font-bold text-zinc-900 dark:text-white text-center">
                Impact Blog
              </h1>
            </div>
            <p className="text-lg md:text-xl text-zinc-700 dark:text-zinc-300 max-w-2xl text-center px-4">
              Illuminating the profound effects of legislation on our society
            </p>
          </div>
        </AuroraBackground>
      </section>

      {/* Blog List */}
      <div className="px-6 py-8">
        <BlogLayout 
          posts={posts} 
          totalPosts={totalPosts} 
          currentPage={page} 
        />
      </div>
    </div>
  );
} 