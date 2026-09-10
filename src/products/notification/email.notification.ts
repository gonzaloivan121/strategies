import { Notification } from "#interfaces/notification.interface";

/**
 * This class implements the `Notification` interface to provide email notification functionality.
 *
 * @export
 * @class EmailNotification
 * @implements {Notification}
 */
export class EmailNotification implements Notification {
    /**
     * Sends an email notification to the specified recipient with the given message.
     *
     * @param {string} recipient - The email address of the recipient.
     * @param {string} message - The content of the email message to be sent.
     * @returns {Promise<boolean>} A promise that resolves to `true` if the email was sent successfully, otherwise `false`.
     * @memberof EmailNotification
     */
    async Send(recipient: string, message: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            console.log(`Sending Email to [${recipient}]: ${message}`);

            // Here you would implement the actual email sending logic, e.g., using an SMTP library or an email service API.

            // Simulate an asynchronous operation, such as sending a message via the Email API.
            setTimeout(() => {
                // For the sake of this example, we'll assume the email was sent successfully.
                resolve(true);
            }, 1000);
        });
    };
}