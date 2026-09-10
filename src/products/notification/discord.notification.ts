import { Notification } from "#interfaces/notification.interface";

/**
 * This class implements the `Notification` interface to provide discord notification functionality.
 *
 * @export
 * @class DiscordNotification
 * @implements {Notification}
 */
export class DiscordNotification implements Notification {
    /**
     * Sends a discord notification to the specified recipient with the given message.
     *
     * @param {string} recipient - The discord ID of the recipient.
     * @param {string} message - The content of the discord message to be sent.
     * @returns {Promise<boolean>} A promise that resolves to `true` if the discord message was sent successfully, otherwise `false`.
     * @memberof DiscordNotification
     */
    async Send(recipient: string, message: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            console.log(`Sending Discord message to [${recipient}]: ${message}`);

            // Here you would implement the actual discord message sending logic, e.g., using a Discord API library.

            // Simulate an asynchronous operation, such as sending a message via the Discord API.
            setTimeout(() => {
                // For the sake of this example, we'll assume the discord message was sent successfully.
                resolve(true);
            }, 1000);
        }
    )};
}