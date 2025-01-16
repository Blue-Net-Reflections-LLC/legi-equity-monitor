import { AuroraBackground } from "@/app/components/ui/aurora-background";
import StateTiles from "@/app/components/StateTiles";
import AnimatedContent from "./components/AnimatedContent";

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 pt-8">
      {/* Hero Section with Aurora */}
      <section className="h-[70vh]">
        <AuroraBackground>
          <AnimatedContent>
            <h1 className="text-4xl md:text-8xl font-bold text-zinc-900 dark:text-white text-center mb-4">
              LegiEquity
            </h1>
            <p className="font-light text-xl md:text-3xl text-zinc-700 dark:text-neutral-200 text-center max-w-3xl mx-auto">
              Illuminating legislative impact through AI-powered racial equity analysis
            </p>
            <p className="text-base md:text-xl text-zinc-600 dark:text-neutral-300 text-center max-w-2xl mx-auto mt-4">
              Explore how state legislation affects different communities across the United States
            </p>
          </AnimatedContent>
        </AuroraBackground>
      </section>

      {/* States Grid Section */}
      <section className="py-16 px-4 bg-gradient-to-b from-white/50 to-white dark:from-zinc-900/50 dark:to-zinc-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-semibold text-zinc-900 dark:text-white text-center mb-12">
            Select a State to Begin
          </h2>
          <StateTiles />
        </div>
      </section>
    </div>
  );
}

