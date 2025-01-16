# Legislative Equity Monitor

A web application that leverages Large Language Models (LLMs) to analyze the racial equity impact of legislative bills. The system uses AI to process bill text and identify potential impacts on different racial and ethnic communities, providing data-driven insights into legislative effects.

## Features

- AI-powered bill analysis using OpenAI's GPT models
- Automated racial equity impact assessment
- Impact severity classification (mild to urgent)
- Sentiment analysis (positive/negative impacts)
- Interactive dashboard with filtering capabilities
- Detailed bill analysis with sponsor information and voting records
- Impact severity indicators for different demographic groups

## Analysis Approach

The system employs Large Language Models to:
1. Process and understand legislative bill text
2. Analyze potential impacts on different racial and ethnic communities
3. Classify the severity and type of impact for each demographic group
4. Generate detailed explanations of identified impacts
5. Provide evidence-based reasoning for impact assessments

## Technology Stack

- Next.js 14
- TypeScript
- PostgreSQL
- OpenAI GPT API for AI analysis
- Tailwind CSS for styling

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and configure your environment variables:
   ```bash
   cp .env.example .env
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: OpenAI API key for LLM analysis

## Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run analyze`: Run AI-powered bill analysis script

## License

Copyright © 2024 Blue Net Reflections LLC. All rights reserved.
