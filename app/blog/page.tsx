import { Metadata } from 'next'
import { BlogList } from './components/BlogList'

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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Blog</h1>
      <BlogList />
    </div>
  )
} 