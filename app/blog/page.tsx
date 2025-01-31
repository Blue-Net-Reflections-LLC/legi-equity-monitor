import { Newspaper, Sparkles, Scale, Users, Brain, ArrowRight } from 'lucide-react'
import { AuroraBackground } from "@/app/components/ui/aurora-background"
import { Footer } from "@/app/components/layout/Footer"
import { Metadata } from 'next'

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
    <div className="min-h-screen bg-white dark:bg-zinc-900 pt-8">
      {/* Hero Section */}
      <section className="h-[40vh] relative">
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

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="w-full lg:w-3/4 mx-auto">
          {/* Coming Soon Banner */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 p-8 rounded-2xl mb-16 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <Sparkles className="w-6 h-6 text-blue-500 animate-pulse" />
            </div>
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 inline-block text-transparent bg-clip-text">
              Coming Soon
            </h2>
            <p className="text-lg text-zinc-700 dark:text-zinc-300 mb-4">
              We&apos;re crafting a space where data meets storytelling, where complex legislation transforms into clear insights.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-8 rounded-xl">
              <Scale className="w-8 h-8 mb-4 text-purple-500" />
              <h3 className="text-xl font-semibold mb-3 text-zinc-900 dark:text-white">Impact Analysis</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Deep dives into legislation that significantly affects communities across the nation, 
                backed by data-driven insights and expert analysis.
              </p>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-8 rounded-xl">
              <Users className="w-8 h-8 mb-4 text-blue-500" />
              <h3 className="text-xl font-semibold mb-3 text-zinc-900 dark:text-white">Community Voices</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Real stories from communities impacted by legislation, bringing human perspective 
                to policy discussions and fostering meaningful dialogue.
              </p>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-8 rounded-xl">
              <Brain className="w-8 h-8 mb-4 text-indigo-500" />
              <h3 className="text-xl font-semibold mb-3 text-zinc-900 dark:text-white">AI-Powered Insights</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Leveraging advanced AI to uncover hidden patterns and potential implications 
                in legislative text, making complex bills more accessible.
              </p>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-8 rounded-xl">
              <Newspaper className="w-8 h-8 mb-4 text-violet-500" />
              <h3 className="text-xl font-semibold mb-3 text-zinc-900 dark:text-white">Legislative Trends</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                Tracking and analyzing emerging patterns in legislation across states, 
                providing early insights into potential nationwide impacts.
              </p>
            </div>
          </div>

          {/* Newsletter Section */}
          <section className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-8 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2 text-zinc-900 dark:text-white">Stay Updated</h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Be the first to know when we launch and receive our latest insights.
                </p>
              </div>
              <ArrowRight className="w-6 h-6 text-blue-500" />
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
} 