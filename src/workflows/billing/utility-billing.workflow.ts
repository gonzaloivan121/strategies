import {
    NotificationChannelRegistration,
    NotificationFactory,
} from "#factories/notification/notification.factory";

import { CustomerAccount } from "#interfaces/customer-account.interface";
import { IntervalBillingInput } from "#interfaces/interval-billing.interface";
import { Invoice } from "#interfaces/invoice.interface";
import {
    InvoicePaymentRequest,
    PaymentRecord,
} from "#interfaces/payment.interface";
import { PaymentGateway } from "#interfaces/payment-gateway.interface";

import { IntervalBillingProcessor } from "#processors/billing/interval-billing.processor";
import {
    PaymentProcessingResult,
    PaymentProcessor,
} from "#processors/billing/payment.processor";

import { NotificationChannel } from "#types/notification.type";

export type UtilityNotificationChannelDefinition = readonly [
    NotificationChannel,
    NotificationChannelRegistration<CustomerAccount>,
];

export interface UtilityBillingWorkflowConfiguration {
    notificationChannels: readonly UtilityNotificationChannelDefinition[];
    paymentGateway: PaymentGateway;
    BuildInvoiceMessage?: (invoice: Invoice) => string;
    BuildPaymentMessage?: (
        invoice: Invoice,
        payment: PaymentRecord,
    ) => string;
}

export interface UtilityBillingWorkflowNotificationResult {
    channel: NotificationChannel;
    recipient: string;
    notificationSent: boolean;
    error?: string;
}

export interface UtilityBillingRunResult {
    invoice: Invoice;
    message: string;
    notifications: UtilityBillingWorkflowNotificationResult[];
    notificationSent: boolean;
}

export interface UtilityBillingPaymentInput {
    invoice: Invoice;
    customer: CustomerAccount;
    paymentRequest: InvoicePaymentRequest;
}

export interface UtilityBillingPaymentResult {
    invoice: Invoice;
    payment: PaymentRecord;
    message: string;
    notifications: UtilityBillingWorkflowNotificationResult[];
    notificationSent: boolean;
}

function CreateNotificationFactory(
    notificationChannels: readonly UtilityNotificationChannelDefinition[],
): NotificationFactory<CustomerAccount> {
    const notificationFactory = new NotificationFactory<CustomerAccount>();

    for (const [notificationType, registration] of notificationChannels) {
        notificationFactory.RegisterChannel(notificationType, registration);
    }

    return notificationFactory;
}

export class UtilityBillingWorkflow {
    private readonly intervalBillingProcessor = new IntervalBillingProcessor();
    private readonly paymentProcessor: PaymentProcessor;
    private readonly notificationFactory: NotificationFactory<CustomerAccount>;

    constructor(
        private readonly configuration: UtilityBillingWorkflowConfiguration,
    ) {
        this.paymentProcessor = new PaymentProcessor(configuration.paymentGateway);
        this.notificationFactory = CreateNotificationFactory(
            configuration.notificationChannels,
        );
    }

    public async RunBilling(
        input: IntervalBillingInput,
    ): Promise<UtilityBillingRunResult> {
        const invoice = this.intervalBillingProcessor.GenerateInvoice(input);
        const message = this.configuration.BuildInvoiceMessage
            ? this.configuration.BuildInvoiceMessage(invoice)
            : this.BuildDefaultInvoiceMessage(invoice);

        const notifications = await this.DispatchNotifications(
            input.customer,
            message,
        );

        return {
            invoice,
            message,
            notifications,
            notificationSent:
                notifications.length > 0 &&
                notifications.every((notification) => notification.notificationSent),
        };
    }

    public async ApplyPayment(
        input: UtilityBillingPaymentInput,
    ): Promise<UtilityBillingPaymentResult> {
        const paymentResult: PaymentProcessingResult =
            await this.paymentProcessor.Process({
                invoice: input.invoice,
                customer: input.customer,
                paymentRequest: input.paymentRequest,
            });

        const message = this.configuration.BuildPaymentMessage
            ? this.configuration.BuildPaymentMessage(
                  paymentResult.invoice,
                  paymentResult.payment,
              )
            : this.BuildDefaultPaymentMessage(
                  paymentResult.invoice,
                  paymentResult.payment,
              );

        const notifications = await this.DispatchNotifications(
            input.customer,
            message,
        );

        return {
            invoice: paymentResult.invoice,
            payment: paymentResult.payment,
            message,
            notifications,
            notificationSent:
                notifications.length > 0 &&
                notifications.every((notification) => notification.notificationSent),
        };
    }

    private async DispatchNotifications(
        customer: CustomerAccount,
        message: string,
    ): Promise<UtilityBillingWorkflowNotificationResult[]> {
        return Promise.all(
            customer.notificationChannels.map(async (notificationChannel) => {
                let recipient = "";

                try {
                    const dispatch = this.notificationFactory.CreateNotificationDispatch(
                        notificationChannel,
                        customer,
                    );

                    recipient = dispatch.recipient;

                    const notificationSent = await dispatch.notificationService.Send(
                        recipient,
                        message,
                    );

                    return {
                        channel: notificationChannel,
                        recipient,
                        notificationSent,
                    };
                } catch (error) {
                    return {
                        channel: notificationChannel,
                        recipient,
                        notificationSent: false,
                        error:
                            error instanceof Error
                                ? error.message
                                : "Unknown notification error.",
                    };
                }
            }),
        );
    }

    private BuildDefaultInvoiceMessage(invoice: Invoice): string {
        return [
            `Invoice ${invoice.invoiceNumber} was generated.`,
            `Total due: ${invoice.currency} ${invoice.totals.totalAmount.toFixed(2)}.`,
            `Due date: ${invoice.dueAt.toISOString().slice(0, 10)}.`,
        ].join(" ");
    }

    private BuildDefaultPaymentMessage(
        invoice: Invoice,
        payment: PaymentRecord,
    ): string {
        if (payment.status === "Captured") {
            return [
                `Payment received for invoice ${invoice.invoiceNumber}.`,
                `Amount: ${invoice.currency} ${payment.amount.toFixed(2)}.`,
                `Remaining balance: ${invoice.currency} ${invoice.balanceDue.toFixed(2)}.`,
            ].join(" ");
        }

        return [
            `Payment failed for invoice ${invoice.invoiceNumber}.`,
            payment.reason ?? "The gateway returned a failure status.",
        ].join(" ");
    }
}
