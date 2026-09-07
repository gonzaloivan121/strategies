import { describe, expect, it, vi } from "vitest";

import { EmailNotification } from "#products/notification/email.notification";

describe("EmailNotification", () => {
    it("sends an email notification and resolves true", async () => {
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {
            return;
        });

        try {
            const notification = new EmailNotification();

            await expect(
                notification.Send("alex@example.com", "Hello via email"),
            ).resolves.toBe(true);
            expect(logSpy).toHaveBeenCalledWith(
                "Sending Email to [alex@example.com]: Hello via email",
            );
        } finally {
            logSpy.mockRestore();
        }
    });
});
