import { BillingProcessor } from "#processors/billing/billing.processor";

import { PeakHoursTariff } from "#strategies/pricing/peak-hours-tariff.pricing-strategy";
import { RegulatoryComplianceSurcharge } from "#strategies/pricing/regulatory-compliance-surcharge.pricing-strategy";
import { WeekendDiscount } from "#strategies/pricing/weekend-discount.pricing-strategy";

import { User } from "#interfaces/user.interface";

import { NotificationFactory } from "#factories/notification/notification.factory";
import { EmailNotification } from "#products/notification/email.notification";
import { PushNotification } from "#products/notification/push.notification";
import { SMSNotification } from "#products/notification/sms.notification";
import { DiscordNotification } from "#products/notification/discord.notification";

const billingProcessor: BillingProcessor = new BillingProcessor();
billingProcessor.AddStrategy(new PeakHoursTariff());
billingProcessor.AddStrategy(new WeekendDiscount());
billingProcessor.AddStrategy(new RegulatoryComplianceSurcharge());

const finalPrice = billingProcessor.CalculateTotal(100, {
    timestamp: new Date(),
    consumption: 100,
});

const user: User = {
    id: crypto.randomUUID(),
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+1 (123) 456-7890",
    deviceId: crypto.randomUUID(),
    discordUsername: "john_doe#1234",
    notificationType: "Discord",
};

const notificationFactory: NotificationFactory<User> =
    new NotificationFactory<User>();

notificationFactory.RegisterChannel("Email", {
    CreateNotification: () => new EmailNotification(),
    ResolveRecipient: (user: User) => user.email,
});

notificationFactory.RegisterChannel("SMS", {
    CreateNotification: () => new SMSNotification(),
    ResolveRecipient: (user: User) => user.phone,
});

notificationFactory.RegisterChannel("Push", {
    CreateNotification: () => new PushNotification(),
    ResolveRecipient: (user: User) => user.deviceId,
});

notificationFactory.RegisterChannel("Discord", {
    CreateNotification: () => new DiscordNotification(),
    ResolveRecipient: (user: User) => user.discordUsername,
});

const { notificationService, recipient } =
    notificationFactory.CreateNotificationDispatch(user.notificationType, user);

await notificationService.Send(recipient, `The final price is: ${finalPrice}`);
