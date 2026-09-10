import { Notification } from "#interfaces/notification.interface";

/**
 * This class implements the `Notification` interface to provide SMS notification functionality.
 *
 * @export
 * @class SMSNotification
 * @implements {Notification}
 */
export class SMSNotification implements Notification {
    /**
     * Sends an SMS notification to the specified recipient with the given message.
     *
     * @param {string} recipient - The phone number of the recipient.
     * @param {string} message - The content of the SMS message to be sent.
     * @returns {Promise<boolean>} A promise that resolves to `true` if the SMS was sent successfully, otherwise `false`.
     * @memberof SMSNotification
     */
    async Send(recipient: string, message: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            console.log(`Sending SMS to [${recipient}]: ${message}`);

            // Here you would implement the actual SMS sending logic, e.g., using an SMS gateway API.

            // Simulate an asynchronous operation, such as sending a message via the SMS API.
            setTimeout(() => {
                // For the sake of this example, we'll assume the SMS was sent successfully.
                resolve(true);
            }, 1000);
        }
    )};
}