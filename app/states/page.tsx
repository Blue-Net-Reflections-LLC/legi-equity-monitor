import dynamic from "next/dynamic";
import StateTiles from "@/app/components/StateTiles";

// Dynamically import the InteractiveMap component with no SSR
const InteractiveMap = dynamic(() => import("../components/InteractiveMap"), {
  ssr: false,
});

export const metadata = {
  title: 'US States - LegiEquity',
  description: 'Explore legislative impact analysis across different US states.',
}

export default function StatesPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 py-16">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl md:text-5xl font-bold text-zinc-900 dark:text-white text-center mb-8">
          US States
        </h1>
        
        {/* Interactive Map Section (Desktop Only) */}
        <section className="hidden md:block mb-16">
          <div className="h-[600px]">
            <InteractiveMap />
          </div>
        </section>

        {/* States Grid Section (Mobile Only) */}
        <section className="md:hidden">
          <StateTiles />
        </section>
      </div>
    </div>
  );
} 