# VoterAI - Legislative Impact Analysis

VoterAI provides comprehensive analysis of legislative bills across all 50 states, DC, and the US Congress, focusing on their impact on various demographic groups and categories.

## Coverage

- All 50 US States
- District of Columbia
- US Congress
- State-level analysis (Coming Soon)

## Features

### Bill Analysis
- Detailed analysis of bills' impact on different demographic groups
- Category-based classification and scoring
- Positive impact and bias assessment
- Evidence-based scoring with source citations

### Demographic Impact Scoring
Our analysis system evaluates bills across two main dimensions:

1. **Category Level Analysis**
   - Bills are analyzed within broad categories (e.g., Race, Religion, Gender, Age, Disability, Veterans)
   - Each category receives an overall impact score based on aggregated subgroup analysis
   - Scores indicate whether the bill has a positive impact or potential bias

2. **Demographic Subgroup Analysis**
   - Detailed analysis of impact on specific subgroups within each category
   - Each subgroup receives individual scores for:
     - Positive Impact (0-100%): Measures beneficial effects
     - Bias Score (0-100%): Identifies potential negative impacts
   - Neutral scoring when impact is minimal or balanced

### Sponsor Analysis
- Comprehensive voting history analysis
- Demographic impact breakdown of sponsored bills
- Category-wise analysis of legislative focus
- Overall positive impact and bias assessment

## Coming Soon

- Enhanced Search and Filtering
- State-level Analytics Dashboard
- Impact Blog
- API Access

## About

VoterAI is a collaboration between VoterAI and Bluenetreflection, focused on bringing transparency and insight to legislative analysis through advanced AI technology.

For more information, contact us at info@voterai.chat

## Development Setup

### Technology Stack
- Next.js 14
- TypeScript
- PostgreSQL
- Tailwind CSS

### Getting Started

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

### Environment Variables
Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string

### Scripts
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server

## License

Copyright © 2024 Blue Net Reflections LLC. All rights reserved.
