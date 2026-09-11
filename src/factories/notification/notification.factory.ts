import { Notification } from "#interfaces/notification.interface";

import { NotificationChannel } from "#types/notification.type";

/**
 * Registration contract for a notification channel.
 *
 * @export
 * @interface NotificationChannelRegistration
 */
export interface NotificationChannelRegistration<TRecipientSource> {
    /**
     * Creates an instance of a `Notification` for the channel.
     *
     * @memberof NotificationChannelRegistration
     */
    CreateNotification: () => Notification;

    /**
     * Resolves the correct recipient value for the channel from a source object.
     *
     * @memberof NotificationChannelRegistration
     */
    ResolveRecipient: (source: TRecipientSource) => string;
}

/**
 * Notification dispatch payload that includes both the service and the resolved recipient.
 *
 * @export
 * @interface NotificationDispatch
 */
export interface NotificationDispatch {
    /**
     * The notification service instance for the channel.
     *
     * @type {Notification}
     * @memberof NotificationDispatch
     */
    notificationService: Notification;

    /**
     * The resolved recipient for the notification channel.
     *
     * @type {string}
     * @memberof NotificationDispatch
     */
    recipient: string;
}

/**
 * This factory class is a pluggable registry for notification channels.
 *
 * @export
 * @class NotificationFactory
 */
export class NotificationFactory<TRecipientSource> {
    /**
     * A registry mapping notification channels to their respective channel registrations.
     *
     * @private
     * @type {Map<
     *         NotificationChannel,
     *         NotificationChannelRegistration<TRecipientSource>
     *     >}
     * @memberof NotificationFactory
     */
    private readonly registry: Map<
        NotificationChannel,
        NotificationChannelRegistration<TRecipientSource>
    > = new Map();

    /**
     * Registers a notification channel at runtime.
     *
     * @param {NotificationChannel} channel - The notification channel key.
     * @param {NotificationChannelRegistration<TRecipientSource>} registration - The channel registration payload.
     * @memberof NotificationFactory
     */
    public RegisterChannel(
        channel: NotificationChannel,
        registration: NotificationChannelRegistration<TRecipientSource>,
    ): void {
        this.registry.set(channel, registration);
    }

    /**
     * Creates an instance of a `Notification` based on the provided channel.
     *
     * @param {NotificationChannel} channel - The channel of the `Notification` to create.
     * @returns {Notification} The created `Notification` instance.
     * @memberof NotificationFactory
     */
    public CreateNotification(channel: NotificationChannel): Notification {
        const registration = this.GetChannelRegistration(channel);
        return registration.CreateNotification();
    }

    /**
     * Resolves the correct recipient value for a channel from a source object.
     *
     * @param {NotificationChannel} channel - The notification channel key.
     * @param {TRecipientSource} source - Source object containing recipient fields.
     * @returns {string} The resolved recipient.
     * @memberof NotificationFactory
     */
    public ResolveRecipient(
        channel: NotificationChannel,
        source: TRecipientSource,
    ): string {
        const registration = this.GetChannelRegistration(channel);
        return registration.ResolveRecipient(source);
    }

    /**
     * Creates both the notification service and the resolved recipient for dispatch.
     *
     * @param {NotificationChannel} channel - The notification channel key.
     * @param {TRecipientSource} source - Source object containing recipient fields.
     * @returns {NotificationDispatch} The dispatch payload.
     * @memberof NotificationFactory
     */
    public CreateNotificationDispatch(
        channel: NotificationChannel,
        source: TRecipientSource,
    ): NotificationDispatch {
        const registration = this.GetChannelRegistration(channel);

        return {
            notificationService: registration.CreateNotification(),
            recipient: registration.ResolveRecipient(source),
        };
    }

    /**
     * Retrieves the channel registration for a given notification channel from the registry.
     *
     * @private
     * @param {NotificationChannel} channel - The notification channel key.
     * @returns {NotificationChannelRegistration<TRecipientSource>} The channel registration for the given notification type.
     * @memberof NotificationFactory
     */
    private GetChannelRegistration(
        channel: NotificationChannel,
    ): NotificationChannelRegistration<TRecipientSource> {
        const registration = this.registry.get(channel);

        if (!registration) {
            throw new Error(`Unsupported notification type: ${channel}`);
        }

        return registration;
    }
}
