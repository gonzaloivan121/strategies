/**
 * Represents the possible statuses of a `BillingCycle`.
 */
export type BillingCycleStatus =
    | "Open"
    | "Closed"
    | "Issued"
    | "PartiallyPaid"
    | "Paid"
    | "Overdue";