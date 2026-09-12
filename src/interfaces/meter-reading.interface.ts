import { ConsumptionInterval } from "#interfaces/consumption-interval.interface";

import { UUID } from "#types/uuid.type";

export interface MeterReadingBatch {
    meterId: UUID;
    customerId: UUID;
    timezone: string;
    intervals: readonly ConsumptionInterval[];
}
