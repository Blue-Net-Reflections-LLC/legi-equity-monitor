import { Metadata } from 'next';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Blog | Bills Impact',
  description: 'Explore our latest articles and insights about bills and their impact.',
};

interface BlogLayoutProps {
  children: React.ReactNode;
}

export default function BlogLayout({ children }: BlogLayoutProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
          {/* Main Content */}
      <main className=''>
        {children}
      </main>

      <Footer />
    </div>
  );
} 