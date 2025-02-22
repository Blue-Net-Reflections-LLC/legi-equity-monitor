import { AuroraBackground } from "@/app/components/ui/aurora-background";
import AnimatedContent from "../components/AnimatedContent";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Footer } from "@/app/components/layout/Footer";

// Dynamically import the InteractiveMap component with no SSR
const InteractiveMap = dynamic(() => import("../components/InteractiveMap"), {
  ssr: false,
});

export default function SecondHomepage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900">
      {/* Hero Section with Split Layout */}
      <section className="min-h-[calc(75vh-4rem)]">
        <AuroraBackground>
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="grid md:grid-cols-2 gap-8 items-center min-h-[calc(75vh-8rem)]">
              {/* Left Column - Text Content */}
              <AnimatedContent>
                <div className="relative z-10 flex items-center h-full">
                  {/* Glow Effect */}
                  <div className="absolute -inset-px transition duration-500"></div>
                  
                  <div className="relative z-20">
                    <div className="space-y-6">
                      <p className="text-2xl md:text-4xl text-zinc-700 dark:text-neutral-200 font-semibold">
                        AI-powered analysis of legislation&apos;s impact on demographic equity
                      </p>
                      <p className="text-lg text-zinc-600 dark:text-neutral-300">
                        Understand how bills and laws affect communities across age, disability, gender, race, and religion
                      </p>
                      {/* Mobile CTA */}
                      <div className="md:hidden">
                        <Link 
                          href="/states"
                          className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg 
                                   shadow-lg hover:shadow-xl transition-all duration-200 
                                   text-xl font-semibold"
                        >
                          Select Your State
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </AnimatedContent>

              {/* Right Column - Interactive Map (Desktop Only) */}
              <div className="hidden md:flex items-center justify-center">
                <div className="relative w-full h-full flex items-center">
                  <InteractiveMap />
                </div>
              </div>
            </div>
          </div>
        </AuroraBackground>
      </section>
      <section>
        Content will go here.
      </section>
      <Footer />
    </div>
  );
} 