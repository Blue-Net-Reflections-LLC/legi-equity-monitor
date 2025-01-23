import { config } from 'dotenv';
import { BatchSizeCalculator } from './bill-analysis/batch-calculator';
import { sql } from '@/lib/db';

// Load environment variables
config();

async function main() {
    try {
        const calculator = new BatchSizeCalculator();
        const batchSize = calculator.getQueryLimit();
        
        console.log(`Starting bill analysis with batch size: ${batchSize}`);
        
        // TODO: Implement bill selection and analysis
        
    } catch (error) {
        console.error('Error in bill analysis:', error);
        process.exit(1);
    }
}

main(); 