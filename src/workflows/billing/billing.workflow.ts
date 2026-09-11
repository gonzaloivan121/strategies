import {
    NotificationChannelRegistration,
    NotificationFactory,
} from "#factories/notification/notification.factory";

import { PricingStrategy } from "#interfaces/pricing-strategy.interface";
import { UsageData } from "#interfaces/usage-data.interface";

import { BillingProcessor } from "#processors/billing/billing.processor";

import { NotificationChannel } from "#types/notification.type";

/**
 * Represents a source that can receive notifications.
 * 
 * @export
 * @interface NotifiableRecipientSource
 */
export interface NotifiableRecipientSource {
    /**
     * The notification channels that the recipient source can receive.
     *
     * @type {NotificationChannel[]}
     * @memberof NotifiableRecipientSource
     */
    notificationChannels: readonly NotificationChannel[];
}

/**
 * Represents a definition of a notification channel for a specific recipient source.
 */
export type NotificationChannelDefinition<TRecipientSource> = readonly [
    NotificationChannel,
    NotificationChannelRegistration<TRecipientSource>,
];

/**
 * Represents the input required to execute the billing workflow.
 *
 * @export
 * @interface BillingWorkflowInput
 * @template TRecipientSource - The type of the recipient source that can receive notifications.
 */
export interface BillingWorkflowInput<
    TRecipientSource extends NotifiableRecipientSource,
> {
    /**
     * The base price for the billing calculation.
     *
     * @type {number}
     * @memberof BillingWorkflowInput
     */
    basePrice: number;

    /**
     * The usage data for the billing calculation.
     *
     * @type {UsageData}
     * @memberof BillingWorkflowInput
     */
    usageData: UsageData;

    /**
     * The recipient source that can receive notifications.
     *
     * @type {TRecipientSource}
     * @memberof BillingWorkflowInput
     */
    recipientSource: TRecipientSource;
}

/**
 * Represents the configuration required to set up the billing workflow.
 *
 * @export
 * @interface BillingWorkflowConfiguration
 * @template TRecipientSource - The type of the recipient source that can receive notifications.
 */
export interface BillingWorkflowConfiguration<
    TRecipientSource extends NotifiableRecipientSource,
> {
    /**
     * The pricing strategies to be used in the billing workflow.
     *
     * @readonly
     * @type {PricingStrategy[]}
     * @memberof BillingWorkflowConfiguration
     */
    pricingStrategies: readonly PricingStrategy[];

    /**
     * The notification channels to be used in the billing workflow.
     *
     * @readonly
     * @type {NotificationChannelDefinition<TRecipientSource>[]}
     * @memberof BillingWorkflowConfiguration
     */
    notificationChannels: readonly NotificationChannelDefinition<TRecipientSource>[];

    /**
     * Builds the message to be sent to the recipient based on the final price and input data.
     *
     * @param {number} finalPrice - The final calculated price for the billing.
     * @param {BillingWorkflowInput<TRecipientSource>} input - The input data for the billing workflow.
     * @returns {string} The message to be sent to the recipient.
     */
    BuildMessage: (
        finalPrice: number,
        input: BillingWorkflowInput<TRecipientSource>,
    ) => string;
}

/**
 * Represents a single notification dispatch result for the billing workflow.
 *
 * @export
 * @interface BillingWorkflowNotificationResult
 */
export interface BillingWorkflowNotificationResult {
    /**
     * The notification channel used for this dispatch.
     *
     * @type {NotificationChannel}
     * @memberof BillingWorkflowNotificationResult
     */
    channel: NotificationChannel;

    /**
     * The resolved recipient who received the notification.
     *
     * @type {string}
     * @memberof BillingWorkflowNotificationResult
     */
    recipient: string;

    /**
     * Indicates whether this channel notification was successfully sent.
     *
     * @type {boolean}
     * @memberof BillingWorkflowNotificationResult
     */
    notificationSent: boolean;
}

/**
 * Represents the result of executing the billing workflow.
 *
 * @export
 * @interface BillingWorkflowResult
 */
export interface BillingWorkflowResult {
    /**
     * The final calculated price for the billing.
     *
     * @type {number}
     * @memberof BillingWorkflowResult
     */
    finalPrice: number;
    
    /**
     * The message that was sent to the recipient.
     *
     * @type {string}
     * @memberof BillingWorkflowResult
     */
    message: string;

    /**
     * The per-channel notification dispatch results.
     *
     * @type {BillingWorkflowNotificationResult[]}
     * @memberof BillingWorkflowResult
     */
    notifications: BillingWorkflowNotificationResult[];

    /**
     * Indicates whether all configured notifications were successfully sent.
     *
     * @type {boolean}
     * @memberof BillingWorkflowResult
     */
    notificationSent: boolean;
}

/**
 * Creates a billing processor with the specified pricing strategies.
 *
 * @param {PricingStrategy[]} pricingStrategies - The pricing strategies to be used in the billing processor.
 * @returns {BillingProcessor} The created billing processor instance.
 */
function CreateBillingProcessor(
    pricingStrategies: readonly PricingStrategy[],
): BillingProcessor {
    const billingProcessor: BillingProcessor = new BillingProcessor();

    for (const strategy of pricingStrategies) {
        billingProcessor.AddStrategy(strategy);
    }

    return billingProcessor;
}

/**
 * Creates a notification factory with the specified notification channels.
 *
 * @template TRecipientSource - The type of the recipient source for the notification channels.
 * @param {NotificationChannelDefinition<TRecipientSource>[]} notificationChannels - The notification channels to be used in the notification factory.
 * @returns {NotificationFactory<TRecipientSource>} The created notification factory instance.
 */
function CreateNotificationFactory<TRecipientSource>(
    notificationChannels: readonly NotificationChannelDefinition<TRecipientSource>[],
): NotificationFactory<TRecipientSource> {
    const notificationFactory = new NotificationFactory<TRecipientSource>();

    for (const [notificationType, registration] of notificationChannels) {
        notificationFactory.RegisterChannel(notificationType, registration);
    }

    return notificationFactory;
}

/**
 * Represents the billing workflow that handles the calculation of the final price and the dispatch of notifications.
 *
 * @export
 * @class BillingWorkflow
 * @template TRecipientSource - The type of the recipient source for the billing workflow.
 */
export class BillingWorkflow<TRecipientSource extends NotifiableRecipientSource> {
    /**
     * The billing processor responsible for calculating the final price.
     *
     * @private
     * @type {BillingProcessor}
     * @memberof BillingWorkflow
     */
    private readonly billingProcessor: BillingProcessor;

    /**
     * The notification factory responsible for creating notification dispatchers.
     *
     * @private
     * @type {NotificationFactory<TRecipientSource>}
     * @memberof BillingWorkflow
     */
    private readonly notificationFactory: NotificationFactory<TRecipientSource>;

    /**
     * Initializes a new instance of the `BillingWorkflow` class with the specified configuration.
     *
     * @param {BillingWorkflowConfiguration<TRecipientSource>} configuration - The configuration object for the billing workflow.
     * @memberof BillingWorkflow
     */
    constructor(
        private readonly configuration: BillingWorkflowConfiguration<TRecipientSource>,
    ) {
        this.billingProcessor = CreateBillingProcessor(
            configuration.pricingStrategies,
        );

        this.notificationFactory = CreateNotificationFactory(
            configuration.notificationChannels,
        );
    }

    /**
     * Executes the billing workflow by calculating the final price and dispatching notifications.
     *
     * @param {BillingWorkflowInput<TRecipientSource>} input - The input data for the billing workflow.
     * @returns {Promise<BillingWorkflowResult>} A promise that resolves to the result of the billing workflow.
     * @memberof BillingWorkflow
     */
    public async Execute(
        input: BillingWorkflowInput<TRecipientSource>,
    ): Promise<BillingWorkflowResult> {
        const finalPrice = this.billingProcessor.CalculateTotal(
            input.basePrice,
            input.usageData,
        );

        const message = this.configuration.BuildMessage(finalPrice, input);

        const notifications: BillingWorkflowNotificationResult[] =
            await Promise.all(
                input.recipientSource.notificationChannels.map(
                    async (notificationChannel) => {
                        const { notificationService, recipient } =
                            this.notificationFactory.CreateNotificationDispatch(
                                notificationChannel,
                                input.recipientSource,
                            );

                        const notificationSent = await notificationService.Send(
                            recipient,
                            message,
                        );

                        return {
                            channel: notificationChannel,
                            recipient,
                            notificationSent,
                        };
                    },
                ),
            );

        return {
            finalPrice,
            message,
            notifications,
            notificationSent:
                notifications.length > 0 &&
                notifications.every(
                    (notification) => notification.notificationSent,
                ),
        };
    }
}