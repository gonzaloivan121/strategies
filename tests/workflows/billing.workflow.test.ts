import { describe, expect, it, vi } from "vitest";

import type { Notification } from "#interfaces/notification.interface";
import type { NotificationChannel } from "#types/notification.type";
import type { UsageData } from "#interfaces/usage-data.interface";
import {
    BillingWorkflow,
    type BillingWorkflowConfiguration,
} from "#workflows/billing/billing.workflow";

interface RecipientSource {
    email: string;
    phone: string;
    notificationChannels: NotificationChannel[];
}

const usageData: UsageData = {
    timestamp: new Date(2024, 0, 2, 12, 0, 0),
    consumption: 75,
};

describe("BillingWorkflow", () => {
    it("dispatches notifications across all user channels", async () => {
        const emailSend = vi.fn(async () => true);
        const smsSend = vi.fn(async () => true);

        const emailNotification: Notification = { Send: emailSend };
        const smsNotification: Notification = { Send: smsSend };

        const configuration: BillingWorkflowConfiguration<RecipientSource> = {
            pricingStrategies: [],
            notificationChannels: [
                [
                    "Email",
                    {
                        CreateNotification: () => emailNotification,
                        ResolveRecipient: (recipientSource: RecipientSource) =>
                            recipientSource.email,
                    },
                ],
                [
                    "SMS",
                    {
                        CreateNotification: () => smsNotification,
                        ResolveRecipient: (recipientSource: RecipientSource) =>
                            recipientSource.phone,
                    },
                ],
            ],
            BuildMessage: (finalPrice: number) => `Final price: ${finalPrice}`,
        };

        const workflow = new BillingWorkflow(configuration);

        const recipientSource: RecipientSource = {
            email: "jane@example.com",
            phone: "+1 (555) 010-1234",
            notificationChannels: ["Email", "SMS"],
        };

        const result = await workflow.Execute({
            basePrice: 100,
            usageData,
            recipientSource,
        });

        expect(result.finalPrice).toBe(100);
        expect(result.message).toBe("Final price: 100");
        expect(result.notificationSent).toBe(true);
        expect(result.notifications).toEqual([
            {
                channel: "Email",
                recipient: recipientSource.email,
                notificationSent: true,
            },
            {
                channel: "SMS",
                recipient: recipientSource.phone,
                notificationSent: true,
            },
        ]);

        expect(emailSend).toHaveBeenCalledOnce();
        expect(emailSend).toHaveBeenCalledWith(
            recipientSource.email,
            result.message,
        );

        expect(smsSend).toHaveBeenCalledOnce();
        expect(smsSend).toHaveBeenCalledWith(
            recipientSource.phone,
            result.message,
        );
    });

    it("marks aggregate notification status as false when one channel fails", async () => {
        const emailSend = vi.fn(async () => true);
        const smsSend = vi.fn(async () => false);

        const emailNotification: Notification = { Send: emailSend };
        const smsNotification: Notification = { Send: smsSend };

        const configuration: BillingWorkflowConfiguration<RecipientSource> = {
            pricingStrategies: [],
            notificationChannels: [
                [
                    "Email",
                    {
                        CreateNotification: () => emailNotification,
                        ResolveRecipient: (recipientSource: RecipientSource) =>
                            recipientSource.email,
                    },
                ],
                [
                    "SMS",
                    {
                        CreateNotification: () => smsNotification,
                        ResolveRecipient: (recipientSource: RecipientSource) =>
                            recipientSource.phone,
                    },
                ],
            ],
            BuildMessage: (finalPrice: number) => `Final price: ${finalPrice}`,
        };

        const workflow = new BillingWorkflow(configuration);

        const recipientSource: RecipientSource = {
            email: "jane@example.com",
            phone: "+1 (555) 010-1234",
            notificationChannels: ["Email", "SMS"],
        };

        const result = await workflow.Execute({
            basePrice: 100,
            usageData,
            recipientSource,
        });

        expect(result.notificationSent).toBe(false);
        expect(result.notifications).toEqual([
            {
                channel: "Email",
                recipient: recipientSource.email,
                notificationSent: true,
            },
            {
                channel: "SMS",
                recipient: recipientSource.phone,
                notificationSent: false,
            },
        ]);

        expect(emailSend).toHaveBeenCalledOnce();
        expect(smsSend).toHaveBeenCalledOnce();
    });
});
