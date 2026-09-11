import { User } from "#interfaces/user.interface";

import { NotificationChannel } from "#types/notification.type";

/**
 * Creates a demo user with the specified notification channels.
 *
 * @export
 * @param {NotificationChannel[]} notificationChannels - The notification channels for the demo user.
 * @returns {User} The created demo user.
 */
export function CreateDemoUser(notificationChannels: NotificationChannel[]): User {
    return {
        id: crypto.randomUUID(),
        name: "John Doe",
        email: "john.doe@example.com",
        phone: "+1 (123) 456-7890",
        deviceId: crypto.randomUUID(),
        discordUsername: "john_doe#1234",
        slackUsername: "john_doe",
        notificationChannels,
    };
}
