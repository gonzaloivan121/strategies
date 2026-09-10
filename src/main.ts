import { CreateApplication } from "#interfaces/application.interface";

import { BillingApplication } from "#applications/billing/billing.application";
import { billingAppConfig } from "#applications/billing/billing.config";

CreateApplication(BillingApplication, billingAppConfig)
    .catch((error) => console.error(error));