import { describe, expect, it, vi } from "vitest";

import { SMSNotification } from "#products/notification/sms.notification";

describe("SMSNotification", () => {
    it("sends an sms notification and resolves true", async () => {
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {
            return;
        });

        try {
            const notification = new SMSNotification();

            await expect(
                notification.Send("+1 (555) 333-0909", "Hello via sms"),
            ).resolves.toBe(true);
            expect(logSpy).toHaveBeenCalledWith(
                "Sending SMS to [+1 (555) 333-0909]: Hello via sms",
            );
        } finally {
            logSpy.mockRestore();
        }
    });
});
