import { describe, expect, it, vi } from "vitest";

import { PushNotification } from "#products/notification/push.notification";

describe("PushNotification", () => {
    it("sends a push notification and resolves true", async () => {
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {
            return;
        });

        try {
            const notification = new PushNotification();

            await expect(
                notification.Send("device-xyz", "Hello via push"),
            ).resolves.toBe(true);
            expect(logSpy).toHaveBeenCalledWith(
                "Sending Push Notification to device [device-xyz]: Hello via push",
            );
        } finally {
            logSpy.mockRestore();
        }
    });
});
