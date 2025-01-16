# Legislative Equity Monitor

A web application for monitoring and analyzing the racial equity impact of legislative bills. This system processes bill data to identify potential impacts on different racial and ethnic communities, providing transparency and insight into legislative effects.

## Features

- Real-time bill tracking and analysis
- Racial equity impact assessment
- Interactive dashboard with filtering capabilities
- Detailed bill analysis with sponsor information and voting records
- Impact severity indicators for different demographic groups

## Technology Stack

- Next.js 14
- TypeScript
- PostgreSQL
- OpenAI API for analysis
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
- `OPENAI_API_KEY`: OpenAI API key for analysis

## Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run analyze`: Run bill analysis script

## License

Copyright © 2024 Blue Net Reflections LLC. All rights reserved.
