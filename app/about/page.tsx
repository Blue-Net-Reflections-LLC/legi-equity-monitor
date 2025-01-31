import { Footer } from "@/app/components/layout/Footer";
import { AuroraBackground } from "@/app/components/ui/aurora-background";
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About LegiEquity',
  description: 'Learn about our mission to analyze legislative impact on demographic equity using AI',
  openGraph: {
    title: 'About LegiEquity',
    description: 'Learn about our mission to analyze legislative impact on demographic equity using AI',
    images: [{
      url: '/api/og/static?page=about',
      width: 1200,
      height: 630,
      alt: 'About LegiEquity'
    }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About LegiEquity',
    description: 'Learn about our mission to analyze legislative impact on demographic equity using AI',
    images: ['/api/og/static?page=about'],
  }
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 pt-8">
      {/* Hero Section */}
      <section className="h-[30vh] relative">
        <AuroraBackground>
          <div className="absolute inset-0 flex items-center justify-center">
            <h1 className="text-4xl md:text-6xl font-bold text-zinc-900 dark:text-white text-center">
              About Us
            </h1>
          </div>
        </AuroraBackground>
      </section>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="w-full lg:w-3/4 mx-auto">
          <div className="space-y-12">
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-6 text-zinc-900 dark:text-white">Our Vision</h2>
              <p className="text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
                VoterAI represents a groundbreaking collaboration between VoterAI and Bluenetreflection, 
                dedicated to revolutionizing how we understand and interact with legislative processes. 
                Through advanced AI analysis, we&apos;re making complex legislative information accessible and 
                meaningful to everyone.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-white">Our Mission</h3>
                <p className="text-zinc-700 dark:text-zinc-300">
                  We strive to democratize legislative analysis by providing clear, unbiased insights 
                  into how bills impact different communities. Our platform empowers citizens, 
                  legislators, and advocacy groups with data-driven understanding of legislative effects.
                </p>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-white">Technology</h3>
                <p className="text-zinc-700 dark:text-zinc-300">
                  Using state-of-the-art AI and machine learning, we analyze legislative text to identify 
                  potential impacts across various demographic groups. Our technology provides unprecedented 
                  insight into the real-world effects of legislation.
                </p>
              </div>
            </div>

            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-6 text-zinc-900 dark:text-white">Our Commitment</h2>
              <div className="space-y-4">
                <p className="text-lg text-zinc-700 dark:text-zinc-300">
                  We are committed to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-zinc-700 dark:text-zinc-300">
                  <li>Providing unbiased, data-driven analysis of legislation</li>
                  <li>Making legislative information accessible to all</li>
                  <li>Promoting transparency in the legislative process</li>
                  <li>Supporting informed decision-making in democracy</li>
                  <li>Protecting privacy and maintaining ethical standards</li>
                </ul>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-8 rounded-lg">
              <h2 className="text-3xl font-bold mb-6 text-zinc-900 dark:text-white">Looking Forward</h2>
              <p className="text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
                As we continue to evolve, our goal remains constant: to create a more transparent, 
                accessible, and equitable legislative process. We invite you to join us in this 
                mission to strengthen democratic participation through technology and insight.
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-8 rounded-lg">
              <h2 className="text-3xl font-bold mb-6 text-zinc-900 dark:text-white">Upcoming Blog</h2>
              <p className="text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
                We&apos;re evolving our platform to include in-depth analysis of bills that have severe impacts across the nation. 
                Our upcoming blog will feature:
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 