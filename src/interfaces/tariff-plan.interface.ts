import { UUID } from "#types/uuid.type";

export interface PeakWindowDefinition {
    startHour: number;
    endHour: number;
    multiplier: number;
    daysOfWeek?: readonly number[];
}

export interface TariffPlan {
    id: UUID;
    name: string;
    currency: string;
    baseRatePerKwh: number;
    fixedCharge: number;
    weekendDiscountRate: number;
    regulatoryChargePerKwh: number;
    taxRate: number;
    peakWindows: readonly PeakWindowDefinition[];
}
