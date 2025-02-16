import { Mail, Newspaper, ArrowUpRight } from 'lucide-react'
import { AuroraBackground } from "@/app/components/ui/aurora-background"
import { Footer } from "@/app/components/layout/Footer"
import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Contact Us | LegiEquity',
  description: 'Get in touch with the LegiEquity team',
  openGraph: {
    title: 'Contact Us | LegiEquity',
    description: 'Get in touch with the LegiEquity team',
    images: [{
      url: '/api/og/static?page=contact',
      width: 1200,
      height: 630,
      alt: 'Contact LegiEquity'
    }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact Us | LegiEquity',
    description: 'Get in touch with the LegiEquity team',
    images: ['/api/og/static?page=contact'],
  }
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 pt-8">
      {/* Hero Section */}
      <section className="h-[30vh] relative">
        <AuroraBackground>
          <div className="absolute inset-0 flex items-center justify-center">
            <h1 className="text-4xl md:text-6xl font-bold text-zinc-900 dark:text-white text-center">
              Contact Us
            </h1>
          </div>
        </AuroraBackground>
      </section>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="w-full lg:w-3/4 mx-auto">
          <div className="space-y-12">
            {/* Email Section */}
            <section className="mb-16">
              <div className="flex items-center space-x-2 mb-6">
                <Mail className="w-6 h-6 text-zinc-900 dark:text-white" />
                <h2 className="text-2xl font-bold m-0 text-zinc-900 dark:text-white">Get in Touch</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-white">VoterAI</h3>
                  <a 
                    href="mailto:info@voterai.chat"
                    className="inline-flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <span>info@voterai.chat</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </a>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-white">Blue Net Reflections, LLC</h3>
                  <a 
                    href="mailto:info@blunetreflections.com"
                    className="inline-flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <span>info@blunetreflections.com</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </section>

            {/* Blog Announcement Section */}
            <section className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-8 rounded-lg">
              <div className="flex items-center space-x-2 mb-6">
                <Newspaper className="w-6 h-6 text-zinc-900 dark:text-white" />
                <h2 className="text-2xl font-bold m-0 text-zinc-900 dark:text-white">Impact Blog Now Available</h2>
              </div>
              <p className="text-lg leading-relaxed mb-6 text-zinc-700 dark:text-zinc-300">
                Explore our in-depth analysis of bills that have significant impacts across the nation. 
                Our blog features:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-6 text-zinc-700 dark:text-zinc-300">
                <li>Detailed analysis of high-impact legislation</li>
                <li>Expert insights on legislative trends</li>
                <li>Community perspectives and discussions</li>
                <li>Regular updates on critical bills</li>
              </ul>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Visit our <Link href="/blog" className="text-orange-500 hover:text-orange-600 transition-colors">Impact Blog</Link> to stay informed about legislative developments.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
} 