import { Mail, Newspaper, ArrowUpRight } from 'lucide-react'
import { AuroraBackground } from "@/app/components/ui/aurora-background"
import { Footer } from "@/app/components/layout/Footer"

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
          <div className="prose dark:prose-invert max-w-none">
            {/* Email Section */}
            <section className="mb-16">
              <div className="flex items-center space-x-2 mb-6">
                <Mail className="w-6 h-6" />
                <h2 className="text-2xl font-bold m-0">Get in Touch</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">VoterAI</h3>
                  <a 
                    href="mailto:info@voterai.chat"
                    className="inline-flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <span>info@voterai.chat</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </a>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Bluenetreflection</h3>
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
                <Newspaper className="w-6 h-6" />
                <h2 className="text-2xl font-bold m-0">Coming Soon: Impact Blog</h2>
              </div>
              <p className="text-lg leading-relaxed mb-6">
                We&apos;re evolving our platform to include in-depth analysis of bills that have severe impacts across the nation. 
                Our upcoming blog will feature:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>Detailed analysis of high-impact legislation</li>
                <li>Expert insights on legislative trends</li>
                <li>Community perspectives and discussions</li>
                <li>Regular updates on critical bills</li>
              </ul>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Stay tuned for our first publications. Follow us on social media for updates.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
} 