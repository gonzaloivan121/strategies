import { UUID } from "#types/uuid.type";
import { Email } from "#types/email.type";
import { PhoneNumber } from "#types/phone.type";
import { NotificationChannel } from "#types/notification.type";

/**
 * Represents a user in the system.
 *
 * @export
 * @interface User
 */
export interface User {
    /**
     * The unique identifier of the `User`.
     *
     * @type {UUID}
     * @memberof User
     */
    id: UUID;

    /**
     * The name of the `User`.
     *
     * @type {string}
     * @memberof User
     */
    name: string;
    
    /**
     * The email address of the `User`.
     *
     * @type {Email}
     * @memberof User
     */
    email: Email;

    /**
     * The phone number of the `User`.
     *
     * @type {PhoneNumber}
     * @memberof User
     */
    phone: PhoneNumber;

    /**
     * The device identifier of the `User`.
     *
     * @type {UUID}
     * @memberof User
     */
    deviceId: UUID;

    /**
     * The Discord username of the `User`.
     *
     * @type {string}
     * @memberof User
     */
    discordUsername: string;

    /**
     * The Slack username of the `User`.
     *
     * @type {string}
     * @memberof User
     */
    slackUsername: string;

    /**
     * The notification channels of the `User`.
     *
     * @type {NotificationChannel[]}
     * @memberof User
     */
    notificationChannels: NotificationChannel[];
}