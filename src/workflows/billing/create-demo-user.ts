import { User } from "#interfaces/user.interface";

import { NotificationType } from "#types/notification.type";

/**
 * Creates a demo user with the specified notification type.
 *
 * @export
 * @param {NotificationType} notificationType - The notification type for the demo user.
 * @returns {User} The created demo user.
 */
export function CreateDemoUser(notificationType: NotificationType): User {
    return {
        id: crypto.randomUUID(),
        name: "John Doe",
        email: "john.doe@example.com",
        phone: "+1 (123) 456-7890",
        deviceId: crypto.randomUUID(),
        discordUsername: "john_doe#1234",
        slackUsername: "john_doe",
        notificationType,
    };
}
