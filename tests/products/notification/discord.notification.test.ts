import { describe, expect, it, vi } from "vitest";

import { DiscordNotification } from "#products/notification/discord.notification";

describe("DiscordNotification", () => {
    it("sends a discord notification and resolves true", async () => {
        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {
            return;
        });

        try {
            const notification = new DiscordNotification();

            await expect(
                notification.Send("john_doe", "Hello via Discord"),
            ).resolves.toBe(true);
            expect(logSpy).toHaveBeenCalledWith(
                "Sending Discord message to [john_doe]: Hello via Discord",
            );
        } finally {
            logSpy.mockRestore();
        }
    });
});
