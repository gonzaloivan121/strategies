import { randomUUID } from "node:crypto";

import { CustomerAccount } from "#interfaces/customer-account.interface";

import { NotificationChannel } from "#types/notification.type";

export function CreateDemoCustomerAccount(
    notificationChannels: NotificationChannel[],
): CustomerAccount {
    return {
        id: randomUUID(),
        accountNumber: "ACC-0001",
        externalId: "cust-demo-0001",
        fullName: "John Doe",
        email: "john.doe@example.com",
        phone: "+01234567890",
        deviceId: randomUUID(),
        notificationChannels,
        status: "Active",
        serviceAddress: {
            line1: "123 Main St",
            city: "New York",
            region: "NY",
            postalCode: "10001",
            country: "US",
        },
        billingAddress: {
            line1: "123 Main St",
            city: "New York",
            region: "NY",
            postalCode: "10001",
            country: "US",
        },
    };
}
