import { BillingProcessor } from "#processors/billing/billing.processor";

import { PeakHoursTariff } from "#strategies/pricing/peak-hours-tariff.pricing-strategy";
import { RegulatoryComplianceSurcharge } from "#strategies/pricing/regulatory-compliance-surcharge.pricing-strategy";

const processor: BillingProcessor = new BillingProcessor();
processor.AddStrategy(new PeakHoursTariff());
processor.AddStrategy(new RegulatoryComplianceSurcharge());

const finalPrice = processor.CalculateTotal(100, {
    timestamp: new Date("2024-06-01T18:00:00Z"),
});
console.log(`Final Price: ${finalPrice}`);
