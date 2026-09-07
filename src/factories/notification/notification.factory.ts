import { Notification } from "#interfaces/notification.interface";

import { NotificationType } from "#types/notification.type";

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
     * A registry mapping notification types to their respective channel registrations.
     *
     * @private
     * @type {Map<
     *         NotificationType,
     *         NotificationChannelRegistration<TRecipientSource>
     *     >}
     * @memberof NotificationFactory
     */
    private readonly registry: Map<
        NotificationType,
        NotificationChannelRegistration<TRecipientSource>
    > = new Map();

    /**
     * Registers a notification channel at runtime.
     *
     * @param {NotificationType} type - The notification type key.
     * @param {NotificationChannelRegistration<TRecipientSource>} registration - The channel registration payload.
     * @memberof NotificationFactory
     */
    public RegisterChannel(
        type: NotificationType,
        registration: NotificationChannelRegistration<TRecipientSource>,
    ): void {
        this.registry.set(type, registration);
    }

    /**
     * Creates an instance of a `Notification` based on the provided type.
     *
     * @param {NotificationType} type - The type of `Notification` to create.
     * @returns {Notification} The created `Notification` instance.
     * @memberof NotificationFactory
     */
    public CreateNotification(type: NotificationType): Notification {
        const channel = this.GetChannel(type);
        return channel.CreateNotification();
    }

    /**
     * Resolves the correct recipient value for a channel from a source object.
     *
     * @param {NotificationType} type - The notification type key.
     * @param {TRecipientSource} source - Source object containing recipient fields.
     * @returns {string} The resolved recipient.
     * @memberof NotificationFactory
     */
    public ResolveRecipient(
        type: NotificationType,
        source: TRecipientSource,
    ): string {
        const channel = this.GetChannel(type);
        return channel.ResolveRecipient(source);
    }

    /**
     * Creates both the notification service and the resolved recipient for dispatch.
     *
     * @param {NotificationType} type - The notification type key.
     * @param {TRecipientSource} source - Source object containing recipient fields.
     * @returns {NotificationDispatch} The dispatch payload.
     * @memberof NotificationFactory
     */
    public CreateNotificationDispatch(
        type: NotificationType,
        source: TRecipientSource,
    ): NotificationDispatch {
        const channel = this.GetChannel(type);

        return {
            notificationService: channel.CreateNotification(),
            recipient: channel.ResolveRecipient(source),
        };
    }

    /**
     * Retrieves the channel registration for a given notification type from the registry.
     *
     * @private
     * @param {NotificationType} type - The notification type key.
     * @returns {NotificationChannelRegistration<TRecipientSource>} The channel registration for the given notification type.
     * @memberof NotificationFactory
     */
    private GetChannel(
        type: NotificationType,
    ): NotificationChannelRegistration<TRecipientSource> {
        const channel = this.registry.get(type);

        if (!channel) {
            throw new Error(`Unsupported notification type: ${type}`);
        }

        return channel;
    }
}
