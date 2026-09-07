/**
 * This interface defines the structure for a notification system that can send messages to recipients.
 *
 * @export
 * @interface Notification
 */
export interface Notification {
    /**
     * Sends a notification message to a specified recipient.
     *
     * @param {string} recipient - The recipient of the notification message.
     * @param {string} message - The content of the notification message to be sent.
     * @returns {Promise<boolean>} A promise that resolves to `true` if the notification was sent successfully, otherwise `false`.
     * @memberof Notification
     */
    Send(recipient: string, message: string): Promise<boolean>;
}