import { randomUUID } from "node:crypto";

import express, { Express, Request, Response } from "express";

import {
    NotFoundError,
    UtilityAPIError,
    ValidationError,
} from "#errors/utility-api.error";
import { BuildUtilityOpenApiSpecification } from "#applications/utility/utility-openapi.spec";
import { BillingCycle } from "#interfaces/billing-cycle.interface";
import { CustomerAccount, CustomerAccountStatus } from "#interfaces/customer-account.interface";
import { LateFeePolicy } from "#interfaces/late-fee-policy.interface";
import { MeterReadingBatch } from "#interfaces/meter-reading.interface";
import { PaymentMethod } from "#interfaces/payment.interface";
import { ServiceAddress } from "#interfaces/service-address.interface";
import { TariffPlan } from "#interfaces/tariff-plan.interface";

import { UUID } from "#types/uuid.type";
import { NotificationChannel } from "#types/notification.type";

import {
    AssessOverdueInvoiceCommand,
    ApplyPaymentCommand,
    GenerateInvoiceCommand,
    UtilityBillingService,
} from "#services/utility-billing.service";
import { BillingCycleStatus } from "#types/billing-cycle-status.type";

export interface UtilityRestServerOptions {
    service: UtilityBillingService;
}

type AsyncRouteHandler = (
    request: Request,
    response: Response,
) => Promise<void>;

const CUSTOMER_STATUS_VALUES: readonly CustomerAccountStatus[] = [
    "Active",
    "Inactive",
    "Suspended",
    "Disconnected",
];

const BILLING_CYCLE_STATUS_VALUES: readonly BillingCycleStatus[] = [
    "Open",
    "Closed",
    "Issued",
    "PartiallyPaid",
    "Paid",
    "Overdue",
];

const PAYMENT_METHOD_VALUES: readonly PaymentMethod[] = [
    "Card",
    "BankTransfer",
    "Cash",
    "Wallet",
];

const NOTIFICATION_CHANNEL_VALUES: readonly NotificationChannel[] = [
    "Email",
    "SMS",
    "Push",
];

function HandleErrors(handler: AsyncRouteHandler): AsyncRouteHandler {
    return async (request: Request, response: Response): Promise<void> => {
        try {
            await handler(request, response);
        } catch (error) {
            const requestId =
                typeof response.locals["requestId"] === "string"
                    ? response.locals["requestId"]
                    : "unknown";

            if (error instanceof UtilityAPIError) {
                response.status(error.statusCode).json({
                    code: error.code,
                    error: error.message,
                    requestId,
                });
                return;
            }

            if (error instanceof Error) {
                response.status(400).json({
                    code: "bad_request",
                    error: error.message,
                    requestId,
                });
                return;
            }

            response.status(500).json({
                code: "internal_error",
                error: "Unexpected server error.",
                requestId,
            });
        }
    };
}

function ResolveRequestId(request: Request): string {
    const incomingRequestId = request.header("x-request-id");

    if (incomingRequestId && incomingRequestId.trim().length > 0) {
        return incomingRequestId.trim();
    }

    return randomUUID();
}

function IsRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function EnsureRecord(value: unknown, context: string): Record<string, unknown> {
    if (!IsRecord(value)) {
        throw new Error(`${context} must be an object.`);
    }

    return value;
}

function RequireString(payload: Record<string, unknown>, key: string): string {
    const value = payload[key];
    if (typeof value !== "string" || value.trim().length === 0) {
        throw new Error(`Field '${key}' must be a non-empty string.`);
    }

    return value;
}

function RequireNumber(payload: Record<string, unknown>, key: string): number {
    const value = payload[key];
    if (typeof value !== "number" || Number.isNaN(value)) {
        throw new Error(`Field '${key}' must be a number.`);
    }

    return value;
}

function OptionalString(payload: Record<string, unknown>, key: string): string | undefined {
    const value = payload[key];
    if (value === undefined) {
        return undefined;
    }

    if (typeof value !== "string") {
        throw new Error(`Field '${key}' must be a string.`);
    }

    return value;
}

function ParseDate(value: unknown, key: string): Date {
    if (typeof value !== "string" && !(value instanceof Date)) {
        throw new Error(`Field '${key}' must be an ISO datetime string.`);
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
        throw new Error(`Field '${key}' is not a valid datetime.`);
    }

    return parsedDate;
}

function ParseAddress(value: unknown, key: string): ServiceAddress {
    const payload = EnsureRecord(value, key);

    return {
        line1: RequireString(payload, "line1"),
        line2: OptionalString(payload, "line2"),
        city: RequireString(payload, "city"),
        region: RequireString(payload, "region"),
        postalCode: RequireString(payload, "postalCode"),
        country: RequireString(payload, "country"),
    };
}

function ParseNotificationChannels(value: unknown): NotificationChannel[] {
    if (value === undefined) {
        return ["Email"];
    }

    if (!Array.isArray(value)) {
        throw new Error("Field 'notificationChannels' must be an array.");
    }

    const channels = value.map((channel) => {
        if (typeof channel !== "string") {
            throw new Error("Notification channels must be strings.");
        }

        if (!NOTIFICATION_CHANNEL_VALUES.includes(channel as NotificationChannel)) {
            throw new Error(`Unsupported notification channel: ${channel}`);
        }

        return channel as NotificationChannel;
    });

    if (channels.length === 0) {
        throw new Error("At least one notification channel is required.");
    }

    return channels;
}

function ParseCustomerStatus(value: unknown): CustomerAccountStatus {
    if (value === undefined) {
        return "Active";
    }

    if (
        typeof value !== "string" ||
        !CUSTOMER_STATUS_VALUES.includes(value as CustomerAccountStatus)
    ) {
        throw new Error("Field 'status' contains an unsupported customer status.");
    }

    return value as CustomerAccountStatus;
}

function ParseBillingCycleStatus(value: unknown): BillingCycleStatus {
    if (value === undefined) {
        return "Open";
    }

    if (
        typeof value !== "string" ||
        !BILLING_CYCLE_STATUS_VALUES.includes(value as BillingCycleStatus)
    ) {
        throw new Error(
            "Field 'status' contains an unsupported billing cycle status.",
        );
    }

    return value as BillingCycleStatus;
}

function ParsePaymentMethod(value: unknown): PaymentMethod {
    if (typeof value !== "string" || !PAYMENT_METHOD_VALUES.includes(value as PaymentMethod)) {
        throw new Error("Field 'method' contains an unsupported payment method.");
    }

    return value as PaymentMethod;
}

function QueryValue(value: unknown, key: string): string {
    if (typeof value === "string" && value.length > 0) {
        return value;
    }

    throw new Error(`Query parameter '${key}' is required.`);
}

function ReadIdempotencyKey(request: Request): string | undefined {
    const headerValue =
        request.header("idempotency-key") ??
        request.header("x-idempotency-key");

    if (headerValue === undefined) {
        return undefined;
    }

    const normalized = headerValue.trim();
    if (normalized.length === 0) {
        throw new ValidationError("Idempotency-Key header cannot be empty.");
    }

    return normalized;
}

function ParseCustomerAccountPayload(payload: unknown): CustomerAccount {
    const value = EnsureRecord(payload, "customerAccount");

    const id = OptionalString(value, "id") ?? randomUUID();

    const serviceAddress = ParseAddress(value["serviceAddress"], "serviceAddress");
    const billingAddress = value["billingAddress"]
        ? ParseAddress(value["billingAddress"], "billingAddress")
        : serviceAddress;

    return {
        id: id as UUID,
        accountNumber: RequireString(value, "accountNumber"),
        externalId: RequireString(value, "externalId"),
        fullName: RequireString(value, "fullName"),
        email: RequireString(value, "email") as CustomerAccount["email"],
        phone: RequireString(value, "phone") as CustomerAccount["phone"],
        deviceId: (OptionalString(value, "deviceId") ?? randomUUID()) as UUID,
        notificationChannels: ParseNotificationChannels(value["notificationChannels"]),
        status: ParseCustomerStatus(value["status"]),
        serviceAddress,
        billingAddress,
    };
}

function ParseTariffPlanPayload(payload: unknown): TariffPlan {
    const value = EnsureRecord(payload, "tariffPlan");

    const peakWindowsValue = value["peakWindows"];
    if (!Array.isArray(peakWindowsValue) || peakWindowsValue.length === 0) {
        throw new Error("Field 'peakWindows' must be a non-empty array.");
    }

    return {
        id: RequireString(value, "id") as UUID,
        name: RequireString(value, "name"),
        currency: RequireString(value, "currency"),
        baseRatePerKwh: RequireNumber(value, "baseRatePerKwh"),
        fixedCharge: RequireNumber(value, "fixedCharge"),
        weekendDiscountRate: RequireNumber(value, "weekendDiscountRate"),
        regulatoryChargePerKwh: RequireNumber(value, "regulatoryChargePerKwh"),
        taxRate: RequireNumber(value, "taxRate"),
        peakWindows: peakWindowsValue.map((window, index) => {
            const windowValue = EnsureRecord(window, `peakWindows[${index}]`);
            return {
                startHour: RequireNumber(windowValue, "startHour"),
                endHour: RequireNumber(windowValue, "endHour"),
                multiplier: RequireNumber(windowValue, "multiplier"),
                daysOfWeek: Array.isArray(windowValue["daysOfWeek"])
                    ? windowValue["daysOfWeek"].map((day) => {
                          if (typeof day !== "number") {
                              throw new Error(
                                  "peakWindows daysOfWeek values must be numbers.",
                              );
                          }

                          return day;
                      })
                    : undefined,
            };
        }),
    };
}

function ParseBillingCyclePayload(payload: unknown): BillingCycle {
    const value = EnsureRecord(payload, "billingCycle");

    return {
        id: (OptionalString(value, "id") ?? randomUUID()) as UUID,
        customerId: RequireString(value, "customerId") as UUID,
        startsAt: ParseDate(value["startsAt"], "startsAt"),
        endsAt: ParseDate(value["endsAt"], "endsAt"),
        dueAt: ParseDate(value["dueAt"], "dueAt"),
        status: ParseBillingCycleStatus(value["status"]),
    };
}

function ParseMeterReadingsPayload(payload: unknown): MeterReadingBatch {
    const value = EnsureRecord(payload, "meterReadings");

    const intervalsValue = value["intervals"];
    if (!Array.isArray(intervalsValue) || intervalsValue.length === 0) {
        throw new Error("Field 'intervals' must be a non-empty array.");
    }

    return {
        meterId: RequireString(value, "meterId") as UUID,
        customerId: RequireString(value, "customerId") as UUID,
        timezone: RequireString(value, "timezone"),
        intervals: intervalsValue.map((interval, index) => {
            const intervalValue = EnsureRecord(interval, `intervals[${index}]`);
            return {
                startedAt: ParseDate(intervalValue["startedAt"], "startedAt"),
                endedAt: ParseDate(intervalValue["endedAt"], "endedAt"),
                consumedKwh: RequireNumber(intervalValue, "consumedKwh"),
            };
        }),
    };
}

function ParseGenerateInvoicePayload(payload: unknown): GenerateInvoiceCommand {
    const value = EnsureRecord(payload, "billingRun");

    return {
        customerId: RequireString(value, "customerId") as UUID,
        billingCycleId: RequireString(value, "billingCycleId") as UUID,
        tariffPlanId: RequireString(value, "tariffPlanId") as UUID,
        meterId: RequireString(value, "meterId") as UUID,
        invoiceNumber: OptionalString(value, "invoiceNumber"),
        issuedAt: value["issuedAt"] ? ParseDate(value["issuedAt"], "issuedAt") : undefined,
        idempotencyKey: OptionalString(value, "idempotencyKey"),
    };
}

function ParseApplyPaymentPayload(payload: unknown): ApplyPaymentCommand {
    const value = EnsureRecord(payload, "payment");

    return {
        invoiceId: RequireString(value, "invoiceId") as UUID,
        amount: RequireNumber(value, "amount"),
        method: ParsePaymentMethod(value["method"]),
        reference: OptionalString(value, "reference"),
        idempotencyKey: OptionalString(value, "idempotencyKey"),
    };
}

function ParseLateFeePolicy(payload: unknown): LateFeePolicy {
    const value = EnsureRecord(payload, "lateFeePolicy");

    const maximumFeeValue = value["maximumFee"];

    return {
        graceDays: RequireNumber(value, "graceDays"),
        dailyRate: RequireNumber(value, "dailyRate"),
        fixedFee: RequireNumber(value, "fixedFee"),
        maximumFee:
            maximumFeeValue === undefined
                ? undefined
                : RequireNumber(value, "maximumFee"),
    };
}

function ParseAssessOverduePayload(
    payload: unknown,
    invoiceId: UUID,
): AssessOverdueInvoiceCommand {
    const value = EnsureRecord(payload, "overdueAssessment");

    const policyPayload = IsRecord(value["policy"]) ? value["policy"] : value;

    return {
        invoiceId,
        policy: ParseLateFeePolicy(policyPayload),
        asOf: value["asOf"] ? ParseDate(value["asOf"], "asOf") : undefined,
    };
}

export function CreateUtilityRestServer(options: UtilityRestServerOptions): Express {
    const app = express();

    app.use((request, response, next) => {
        const requestId = ResolveRequestId(request);
        response.locals["requestId"] = requestId;
        response.setHeader("x-request-id", requestId);
        next();
    });

    app.use(express.json());

    app.get("/openapi.json", (request, response) => {
        const hostHeader = request.header("host") ?? "127.0.0.1:3010";
        const [host, portText] = hostHeader.split(":");
        const parsedPort = Number(portText ?? "80");
        const safePort = Number.isFinite(parsedPort) ? parsedPort : 80;

        const specification = BuildUtilityOpenApiSpecification({
            host,
            port: safePort,
        });

        response.status(200).json(specification);
    });

    app.get("/health", (_request, response) => {
        response.status(200).json({ status: "ok" });
    });

    app.post(
        "/customers",
        HandleErrors(async (request, response) => {
            const customer = ParseCustomerAccountPayload(request.body);
            await options.service.RegisterCustomerAccount(customer);
            response.status(201).json(customer);
        }),
    );

    app.get(
        "/customers",
        HandleErrors(async (_request, response) => {
            const customers = await options.service.ListCustomerAccounts();
            response.status(200).json(customers);
        }),
    );

    app.get(
        "/customers/:customerId",
        HandleErrors(async (request, response) => {
            const customer = await options.service.GetCustomerAccountById(
                request.params["customerId"] as UUID,
            );

            if (!customer) {
                throw new NotFoundError("Customer not found.");
            }

            response.status(200).json(customer);
        }),
    );

    app.post(
        "/tariff-plans",
        HandleErrors(async (request, response) => {
            const tariffPlan = ParseTariffPlanPayload(request.body);
            await options.service.RegisterTariffPlan(tariffPlan);
            response.status(201).json(tariffPlan);
        }),
    );

    app.get(
        "/tariff-plans",
        HandleErrors(async (_request, response) => {
            const tariffPlans = await options.service.ListTariffPlans();
            response.status(200).json(tariffPlans);
        }),
    );

    app.post(
        "/billing-cycles",
        HandleErrors(async (request, response) => {
            const billingCycle = ParseBillingCyclePayload(request.body);
            await options.service.RegisterBillingCycle(billingCycle);
            response.status(201).json(billingCycle);
        }),
    );

    app.get(
        "/billing-cycles",
        HandleErrors(async (request, response) => {
            const customerId = QueryValue(request.query["customerId"], "customerId") as UUID;
            const billingCycles =
                await options.service.ListBillingCyclesByCustomer(customerId);
            response.status(200).json(billingCycles);
        }),
    );

    app.post(
        "/meter-readings",
        HandleErrors(async (request, response) => {
            const meterReadings = ParseMeterReadingsPayload(request.body);
            await options.service.RecordMeterReadings(meterReadings);
            response.status(201).json({
                customerId: meterReadings.customerId,
                meterId: meterReadings.meterId,
                intervalsStored: meterReadings.intervals.length,
            });
        }),
    );

    app.post(
        "/billing-runs",
        HandleErrors(async (request, response) => {
            const command = ParseGenerateInvoicePayload(request.body);
            command.idempotencyKey =
                command.idempotencyKey ?? ReadIdempotencyKey(request);

            const result = await options.service.GenerateInvoice(command);

            if (command.idempotencyKey) {
                response.setHeader("idempotency-key", command.idempotencyKey);
            }

            response.status(201).json(result);
        }),
    );

    app.get(
        "/invoices/:invoiceId",
        HandleErrors(async (request, response) => {
            const invoice = await options.service.GetInvoiceById(
                request.params["invoiceId"] as UUID,
            );

            if (!invoice) {
                throw new NotFoundError("Invoice not found.");
            }

            response.status(200).json(invoice);
        }),
    );

    app.get(
        "/invoices",
        HandleErrors(async (request, response) => {
            const customerId = QueryValue(request.query["customerId"], "customerId") as UUID;
            const invoices = await options.service.ListInvoicesByCustomer(customerId);
            response.status(200).json(invoices);
        }),
    );

    app.post(
        "/payments",
        HandleErrors(async (request, response) => {
            const command = ParseApplyPaymentPayload(request.body);
            command.idempotencyKey =
                command.idempotencyKey ?? ReadIdempotencyKey(request);

            const result = await options.service.ApplyPayment(command);

            if (command.idempotencyKey) {
                response.setHeader("idempotency-key", command.idempotencyKey);
            }

            response.status(201).json(result);
        }),
    );

    app.post(
        "/invoices/:invoiceId/overdue-assessments",
        HandleErrors(async (request, response) => {
            const command = ParseAssessOverduePayload(
                request.body,
                request.params["invoiceId"] as UUID,
            );

            const invoice = await options.service.AssessInvoiceOverdue(command);

            response.status(200).json(invoice);
        }),
    );

    app.get(
        "/payments",
        HandleErrors(async (request, response) => {
            const invoiceId = QueryValue(request.query["invoiceId"], "invoiceId") as UUID;
            const payments = await options.service.ListPaymentsByInvoice(invoiceId);
            response.status(200).json(payments);
        }),
    );

    return app;
}
