import {
    Application,
    ApplicationConfiguration,
} from "#interfaces/application.interface";

import { User } from "#interfaces/user.interface";

import { BillingWorkflow } from "#workflows/billing/billing.workflow";
import { CreateDemoUser } from "#workflows/billing/create-demo-user";
import { defaultBillingWorkflowConfiguration } from "#workflows/billing/default-billing.workflow-configuration";

export class BillingApplication implements Application {
    private billingWorkflow: BillingWorkflow<User>;
    private readonly config: ApplicationConfiguration;

    constructor(config: ApplicationConfiguration) {
        this.config = config;

        this.billingWorkflow = new BillingWorkflow(
            defaultBillingWorkflowConfiguration,
        );
    }

    async Start(): Promise<void> {
        const workflowResult = await this.billingWorkflow.Execute({
            basePrice: 100,
            usageData: {
                timestamp: new Date(),
                consumption: 100,
            },
            recipientSource: CreateDemoUser("Slack"),
        });

        if (workflowResult.notificationSent) {
            console.log(`Notification sent to [${workflowResult.recipient}]`);
        }
    }

    async Update(): Promise<void> {
        // Implementation for updating the BillingApplication
    }

    async Stop(): Promise<void> {
        // Implementation for stopping the BillingApplication
    }
}