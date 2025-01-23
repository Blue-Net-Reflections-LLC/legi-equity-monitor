import { BillTokenEstimate } from './types';

export class BatchSizeCalculator {
    private readonly TOKENS_PER_SPONSOR = 12;
    private readonly TOKENS_PER_SUBJECT = 8;
    private readonly TOKENS_PER_AMENDMENT = 125;
    private readonly JSON_OVERHEAD = 6;
    private readonly SAFETY_MARGIN = 0.8;

    constructor(
        private readonly contextWindowTokens: number = 128000,
        private readonly promptOverheadTokens: number = 1000
    ) {}

    calculateBillTokens(bill: BillTokenEstimate): number {
        return (
            3 + // bill_id
            5 + // status
            bill.descriptionTokens +
            (this.TOKENS_PER_SPONSOR * bill.sponsorsCount) +
            (this.TOKENS_PER_SUBJECT * bill.subjectsCount) +
            (this.TOKENS_PER_AMENDMENT * bill.amendmentsCount) +
            this.JSON_OVERHEAD
        );
    }

    getQueryLimit(): number {
        const averageBill: BillTokenEstimate = {
            descriptionTokens: 500,
            sponsorsCount: 2,
            subjectsCount: 3,
            amendmentsCount: 1
        };

        const tokensPerBill = this.calculateBillTokens(averageBill);
        const availableTokens = (this.contextWindowTokens - this.promptOverheadTokens) * this.SAFETY_MARGIN;
        
        return Math.floor(availableTokens / tokensPerBill);
    }
} 