import { Email } from "#types/email.type";
import { PhoneNumber } from "#types/phone.type";
import { NotificationChannel } from "#types/notification.type";
import { UUID } from "#types/uuid.type";

import { ServiceAddress } from "#interfaces/service-address.interface";

export type CustomerAccountStatus =
    | "Active"
    | "Inactive"
    | "Suspended"
    | "Disconnected";

export interface CustomerAccount {
    id: UUID;
    accountNumber: string;
    externalId: string;
    fullName: string;
    email: Email;
    phone: PhoneNumber;
    deviceId: UUID;
    notificationChannels: NotificationChannel[];
    status: CustomerAccountStatus;
    serviceAddress: ServiceAddress;
    billingAddress: ServiceAddress;
}
