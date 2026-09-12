export interface LateFeePolicy {
    graceDays: number;
    dailyRate: number;
    fixedFee: number;
    maximumFee?: number;
}
