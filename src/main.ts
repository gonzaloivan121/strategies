import { CreateApplication } from "#interfaces/application.interface";

import { BillingApplication } from "#applications/billing.application";
import { appConfig } from "#applications/billing/billing.config";

CreateApplication(BillingApplication, appConfig)
    .catch((error) => console.error(error));