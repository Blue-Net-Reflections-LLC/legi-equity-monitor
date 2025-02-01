import { Metadata } from 'next'
import { BillList } from '@/app/components/bills/BillList'
import { StateHero } from '@/app/components/states/StateHero'

interface StatePageProps {
  params: {
    stateCode: string
  }
}

export async function generateMetadata({ params }: StatePageProps): Promise<Metadata> {
  const stateCode = params.stateCode.toUpperCase()
  
  return {
    title: `${stateCode} Legislature Bills - LegiEquity Monitor`,
    description: `Track and analyze ${stateCode} state legislature bills for demographic equity impact.`,
  }
}

export default function StatePage({ params }: StatePageProps) {
  const stateCode = params.stateCode.toUpperCase()

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900">
      {/* Hero Section - Server Side */}
      <StateHero stateCode={stateCode} />

      {/* Bill List - Client Side */}
      <BillList 
        stateCode={stateCode}
      />
    </div>
  )
} 