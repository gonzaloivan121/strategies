import { describe, expect, it, vi } from "vitest";

import { SlackNotification } from "#products/notification/slack.notification";

describe("SlackNotification", () => {
    it("sends a slack notification and resolves true", async () => {
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {
            return;
        });

        try {
            const notification = new SlackNotification();

            await expect(
                notification.Send("john_doe", "Hello via Slack"),
            ).resolves.toBe(true);
            expect(logSpy).toHaveBeenCalledWith(
                "Sending Slack message to [john_doe]: Hello via Slack",
            );
        } finally {
            logSpy.mockRestore();
        }
    });
});
