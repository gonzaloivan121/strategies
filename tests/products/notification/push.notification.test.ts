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
                notification.Send(
                    "65156c3b-4e8a-42a7-b077-b8da754ee788",
                    "Hello via push",
                ),
            ).resolves.toBe(true);
            expect(logSpy).toHaveBeenCalledWith(
                "Sending Push Notification to device [65156c3b-4e8a-42a7-b077-b8da754ee788]: Hello via push",
            );
        } finally {
            logSpy.mockRestore();
        }
    });
});
