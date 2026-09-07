import { describe, expect, it, vi } from "vitest";

import { NotificationFactory } from "#factories/notification/notification.factory";
import type { Notification } from "#interfaces/notification.interface";

interface RecipientSource {
    email: string;
    phone: string;
    deviceId: string;
}

describe("NotificationFactory", () => {
    const source: RecipientSource = {
        email: "jane@example.com",
        phone: "+1 (555) 222-1234",
        deviceId: "device-123",
    };

    it("creates notifications and recipients from registered channels", () => {
        const factory = new NotificationFactory<RecipientSource>();

        const notificationStub: Notification = {
            Send: vi.fn(async () => true),
        };

        const createNotification = vi.fn(() => notificationStub);
        const resolveRecipient = vi.fn((value: RecipientSource) => value.email);

        factory.RegisterChannel("Email", {
            CreateNotification: createNotification,
            ResolveRecipient: resolveRecipient,
        });

        const notification = factory.CreateNotification("Email");
        const recipient = factory.ResolveRecipient("Email", source);
        const dispatch = factory.CreateNotificationDispatch("Email", source);

        expect(notification).toBe(notificationStub);
        expect(recipient).toBe(source.email);
        expect(dispatch.notificationService).toBe(notificationStub);
        expect(dispatch.recipient).toBe(source.email);
        expect(createNotification).toHaveBeenCalledTimes(2);
        expect(resolveRecipient).toHaveBeenCalledTimes(2);
        expect(resolveRecipient).toHaveBeenCalledWith(source);
    });

    it("throws a clear error when a channel is not registered", () => {
        const factory = new NotificationFactory<RecipientSource>();

        expect(() => factory.CreateNotification("Push")).toThrow(
            "Unsupported notification type: Push",
        );
        expect(() => factory.ResolveRecipient("Push", source)).toThrow(
            "Unsupported notification type: Push",
        );
        expect(() =>
            factory.CreateNotificationDispatch("Push", source),
        ).toThrow("Unsupported notification type: Push");
    });
});
