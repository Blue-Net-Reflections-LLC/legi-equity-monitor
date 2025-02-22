import { Metadata } from 'next'
import SecondHomepage from './home/second-hp'

export const metadata: Metadata = {
  title: 'LegiEquity - AI-Powered Legislative Impact Analysis',
  description: 'Understand how bills and laws affect communities across age, disability, gender, race, and religion through AI-powered analysis.',
  openGraph: {
    title: 'LegiEquity - AI-Powered Legislative Impact Analysis',
    description: 'Understand how bills and laws affect communities across age, disability, gender, race, and religion through AI-powered analysis.',
    url: 'https://legiequity.us',
    siteName: 'LegiEquity',
    images: [
      {
        url: 'https://legiequity.us/images/og-home.png',
        width: 1200,
        height: 630,
        alt: 'LegiEquity - Legislative Impact Analysis',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LegiEquity - AI-Powered Legislative Impact Analysis',
    description: 'Understand how bills and laws affect communities across age, disability, gender, race, and religion through AI-powered analysis.',
    images: ['https://legiequity.us/images/og-home.png'],
  },
}

export default function Home() {
  return <SecondHomepage />
}

