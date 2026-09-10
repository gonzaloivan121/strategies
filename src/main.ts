import { BillingWorkflow } from "#workflows/billing/billing.workflow";
import { CreateDemoUser } from "#workflows/billing/create-demo-user";
import { defaultBillingWorkflowConfiguration } from "#workflows/billing/default-billing.workflow-configuration";

const billingWorkflow = new BillingWorkflow(defaultBillingWorkflowConfiguration);

const workflowResult = await billingWorkflow.Execute({
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
