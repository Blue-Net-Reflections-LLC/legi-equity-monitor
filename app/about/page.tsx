import { AuroraBackground } from "@/app/components/ui/aurora-background";
import AnimatedContent from "@/app/components/AnimatedContent";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 pt-8">
      <section className="h-[50vh]">
        <AuroraBackground>
          <AnimatedContent>
            <h1 className="text-4xl md:text-6xl font-bold text-zinc-900 dark:text-white text-center">
              About LegiEquity
            </h1>
            <p className="text-xl text-zinc-700 dark:text-neutral-200 text-center mt-4 max-w-3xl mx-auto">
              Empowering transparency in legislative impact analysis
            </p>
          </AnimatedContent>
        </AuroraBackground>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto prose dark:prose-invert">
          <h2>Our Mission</h2>
          <p>
            LegiEquity is dedicated to making legislative impact analysis accessible and transparent. 
            We use AI-powered analysis to understand how bills affect different racial communities, 
            helping citizens and lawmakers make informed decisions.
          </p>

          <h2>How It Works</h2>
          <p>
            Our platform analyzes bills using advanced natural language processing to identify potential 
            impacts on different racial communities. Each analysis considers direct and indirect effects, 
            providing a comprehensive view of legislative impact.
          </p>

          <h2>Current Coverage</h2>
          <p>
            We currently analyze bills from Georgia, with plans to expand to other states. Our goal is 
            to provide nationwide coverage while maintaining the highest standards of accuracy and insight.
          </p>
        </div>
      </section>
    </div>
  );
} 