import { Footer } from "@/app/components/layout/Footer";
import { AuroraBackground } from "@/app/components/ui/aurora-background";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 pt-8">
      {/* Hero Section */}
      <section className="h-[30vh] relative">
        <AuroraBackground>
          <div className="absolute inset-0 flex items-center justify-center">
            <h1 className="text-4xl md:text-6xl font-bold text-zinc-900 dark:text-white text-center">
              Terms & Conditions
            </h1>
          </div>
        </AuroraBackground>
      </section>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="w-full lg:w-3/4 mx-auto">
          <div className="prose dark:prose-invert max-w-none">
            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-lg mb-8">
              <p className="text-lg leading-relaxed">
                Welcome to VoterAI. By accessing our website, you agree to these terms and conditions.
                Please read them carefully before using our services.
              </p>
            </div>

            <div className="space-y-12">
              <section>
                <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-700">
                  <p>
                    By accessing and using VoterAI, you accept and agree to be bound by these terms and 
                    conditions. If you do not agree to all the terms and conditions, you must not use our services.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">2. Use License</h2>
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-700">
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Permission is granted to temporarily access our materials for personal, non-commercial use only.</li>
                    <li>This license does not include permission to modify, distribute, or use the materials for any commercial purpose.</li>
                    <li>All content remains the property of VoterAI and our partners.</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">3. Disclaimer</h2>
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-700">
                  <p className="mb-4">
                    The materials on VoterAI&apos;s website are provided on an &apos;as is&apos; basis. VoterAI makes no 
                    warranties, expressed or implied, and hereby disclaims and negates all other warranties including:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Implied warranties of merchantability</li>
                    <li>Fitness for a particular purpose</li>
                    <li>Non-infringement of intellectual property</li>
                    <li>Accuracy of the materials</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">4. Limitations</h2>
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-700">
                  <p>
                    VoterAI and its suppliers will not be held accountable for any damages that result from the use 
                    of, or inability to use, the materials on our website, even if VoterAI or an authorized 
                    representative has been notified orally or in writing of the possibility of such damage.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">5. Privacy & Data Protection</h2>
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-700">
                  <p className="mb-4">
                    We are committed to protecting your privacy and handling your data with transparency and care:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>We collect only necessary information to provide our services</li>
                    <li>Your data is protected using industry-standard security measures</li>
                    <li>We do not sell or share your personal information with third parties</li>
                    <li>You have the right to access and control your data</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">6. Modifications</h2>
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-6 rounded-lg">
                  <p>
                    VoterAI may revise these terms of service at any time without notice. By using this website, 
                    you are agreeing to be bound by the current version of these terms of service. We recommend 
                    checking this page periodically for any changes.
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 