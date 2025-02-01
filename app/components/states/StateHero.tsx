import { AuroraBackground } from "@/app/components/ui/aurora-background"
import { STATE_NAMES } from '@/app/constants/states'

interface StateHeroProps {
  stateCode: string
}

export function StateHero({ stateCode }: StateHeroProps) {
  const stateName = STATE_NAMES[stateCode] || stateCode

  return (
    <section className="h-[10vh] min-h-[80px]">
      <AuroraBackground>
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 text-center">
          {stateName} Bills
        </h1>
        <p className="text-sm md:text-base text-zinc-700 text-center mt-1">
          Analyzing legislative impact on demographic equity
        </p>
      </AuroraBackground>
    </section>
  )
} 