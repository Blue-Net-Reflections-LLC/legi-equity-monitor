import { BlogList } from './components/BlogList';
import { Metadata } from 'next';
import { AuroraBackground } from '../components/ui/aurora-background';
import { Newspaper } from 'lucide-react';

export const metadata: Metadata = {
  title: 'LegiEquity Blog',
  description: 'Insights and updates on legislative analysis and demographic equity',
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

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900">
      {/* Hero Section */}
      <section className="h-[30vh] relative">
        <AuroraBackground>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
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
      <div className="container mx-auto px-4 py-8">
        <BlogList />
      </div>
    </div>
  );
} 