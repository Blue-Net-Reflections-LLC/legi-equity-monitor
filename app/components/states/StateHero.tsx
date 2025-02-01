import { AuroraBackground } from "@/app/components/ui/aurora-background"
import { STATE_NAMES } from '@/app/constants/states'

interface StateHeroProps {
  stateCode: string
}

export function StateHero({ stateCode }: StateHeroProps) {
  const stateName = STATE_NAMES[stateCode] || stateCode

  return (
    <section className="h-[12.5vh] min-h-[75px] mb-8">
      <AuroraBackground>
        <h1 className="text-2xl md:text-4xl font-bold text-zinc-900 dark:text-white text-center">
          {stateName} Bills
        </h1>
        <p className="text-sm md:text-base text-zinc-700 dark:text-zinc-300 text-center mt-2">
          Analyzing legislative impact on demographic equity
        </p>
      </AuroraBackground>
    </section>
  )
} 