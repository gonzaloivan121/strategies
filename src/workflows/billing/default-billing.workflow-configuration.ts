import { User } from "#interfaces/user.interface";

import { EmailNotification } from "#products/notification/email.notification";
import { SMSNotification } from "#products/notification/sms.notification";
import { PushNotification } from "#products/notification/push.notification";

import { PeakHoursTariff } from "#strategies/pricing/peak-hours-tariff.pricing-strategy";
import { RegulatoryComplianceSurcharge } from "#strategies/pricing/regulatory-compliance-surcharge.pricing-strategy";
import { WeekendDiscount } from "#strategies/pricing/weekend-discount.pricing-strategy";

import { BillingWorkflowConfiguration } from "#workflows/billing/billing.workflow";

/**
 * The default billing workflow configuration for the system.
 * 
 * This configuration includes the default pricing strategies and notification channels used in the billing workflow.
 * 
 * @type {BillingWorkflowConfiguration<User>}
 */
export const defaultBillingWorkflowConfiguration: BillingWorkflowConfiguration<User> = {
    pricingStrategies: [
        new PeakHoursTariff(),
        new WeekendDiscount(),
        new RegulatoryComplianceSurcharge(),
    ],
    notificationChannels: [
        [
            "Email",
            {
                CreateNotification: () => new EmailNotification(),
                ResolveRecipient: (user: User) => user.email,
            },
        ],
        [
            "SMS",
            {
                CreateNotification: () => new SMSNotification(),
                ResolveRecipient: (user: User) => user.phone,
            },
        ],
        [
            "Push",
            {
                CreateNotification: () => new PushNotification(),
                ResolveRecipient: (user: User) => user.deviceId,
            },
        ],
    ],
    BuildMessage: (finalPrice: number) => `The final price is: ${finalPrice}`,
};