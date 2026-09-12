import { CustomerAccount } from "#interfaces/customer-account.interface";

import { EmailNotification } from "#products/notification/email.notification";
import { SMSNotification } from "#products/notification/sms.notification";
import { PushNotification } from "#products/notification/push.notification";
import { MockPaymentGateway } from "#products/payment/mock.payment-gateway";

import { UtilityBillingWorkflowConfiguration } from "#workflows/billing/utility-billing.workflow";

export const defaultUtilityBillingWorkflowConfiguration: UtilityBillingWorkflowConfiguration =
    {
        notificationChannels: [
            [
                "Email",
                {
                    CreateNotification: () => new EmailNotification(),
                    ResolveRecipient: (customer: CustomerAccount) => customer.email,
                },
            ],
            [
                "SMS",
                {
                    CreateNotification: () => new SMSNotification(),
                    ResolveRecipient: (customer: CustomerAccount) => customer.phone,
                },
            ],
            [
                "Push",
                {
                    CreateNotification: () => new PushNotification(),
                    ResolveRecipient: (customer: CustomerAccount) => customer.deviceId,
                },
            ],
        ],
        paymentGateway: new MockPaymentGateway(),
    };
