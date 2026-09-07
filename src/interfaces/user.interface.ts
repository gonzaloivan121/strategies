import { UUID } from "#types/uuid.type";
import { Email } from "#types/email.type";
import { PhoneNumber } from "#types/phone.type";
import { NotificationType } from "#types/notification.type";

export interface User {
    id: UUID;
    name: string;
    email: Email;
    phone: PhoneNumber;
    deviceId: UUID;
    notificationType: NotificationType;
}