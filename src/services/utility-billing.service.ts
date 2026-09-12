import { createHash, randomUUID } from "node:crypto";

import {
    ConflictError,
    NotFoundError,
    ValidationError,
} from "#errors/utility-api.error";
import { BillingCycle } from "#interfaces/billing-cycle.interface";
import { CustomerAccount } from "#interfaces/customer-account.interface";
import { IntervalBillingInput } from "#interfaces/interval-billing.interface";
import { Invoice } from "#interfaces/invoice.interface";
import { LateFeePolicy } from "#interfaces/late-fee-policy.interface";
import { MeterReadingBatch } from "#interfaces/meter-reading.interface";
import {
    InvoicePaymentRequest,
    PaymentMethod,
    PaymentRecord,
} from "#interfaces/payment.interface";
import { TariffPlan } from "#interfaces/tariff-plan.interface";
import { UtilityPersistence } from "#interfaces/utility-persistence.interface";

import { OverdueProcessor } from "#processors/billing/overdue.processor";

import { UUID } from "#types/uuid.type";

import {
    UtilityBillingPaymentResult,
    UtilityBillingRunResult,
    UtilityBillingWorkflow,
} from "#workflows/billing/utility-billing.workflow";
import { IdempotencyOperation } from "#types/idempotency.type";
import { BillingCycleStatus } from "#types/billing-cycle-status.type";

export interface GenerateInvoiceCommand {
    customerId: UUID;
    billingCycleId: UUID;
    tariffPlanId: UUID;
    meterId: UUID;
    invoiceNumber?: string;
    issuedAt?: Date;
    idempotencyKey?: string;
}

export interface ApplyPaymentCommand {
    invoiceId: UUID;
    amount: number;
    method: PaymentMethod;
    reference?: string;
    idempotencyKey?: string;
}

export interface AssessOverdueInvoiceCommand {
    invoiceId: UUID;
    policy: LateFeePolicy;
    asOf?: Date;
}

export class UtilityBillingService {
    private readonly overdueProcessor: OverdueProcessor =
        new OverdueProcessor();

    constructor(
        private readonly persistence: UtilityPersistence,
        private readonly workflow: UtilityBillingWorkflow,
    ) {}

    public GetPersistence(): UtilityPersistence {
        return this.persistence;
    }

    public async RegisterCustomerAccount(
        customerAccount: CustomerAccount,
    ): Promise<void> {
        await this.persistence.customerAccounts.Save(customerAccount);
    }

    public async GetCustomerAccountById(
        customerId: UUID,
    ): Promise<CustomerAccount | undefined> {
        return this.persistence.customerAccounts.GetById(customerId);
    }

    public async ListCustomerAccounts(): Promise<CustomerAccount[]> {
        return this.persistence.customerAccounts.List();
    }

    public async RegisterTariffPlan(tariffPlan: TariffPlan): Promise<void> {
        await this.persistence.tariffPlans.Save(tariffPlan);
    }

    public async GetTariffPlanById(
        tariffPlanId: UUID,
    ): Promise<TariffPlan | undefined> {
        return this.persistence.tariffPlans.GetById(tariffPlanId);
    }

    public async ListTariffPlans(): Promise<TariffPlan[]> {
        return this.persistence.tariffPlans.List();
    }

    public async RegisterBillingCycle(
        billingCycle: BillingCycle,
    ): Promise<void> {
        const customer = await this.persistence.customerAccounts.GetById(
            billingCycle.customerId,
        );

        if (!customer) {
            throw new NotFoundError(
                `Cannot create billing cycle for unknown customer: ${billingCycle.customerId}`,
            );
        }

        await this.persistence.billingCycles.Save(billingCycle);
    }

    public async ListBillingCyclesByCustomer(
        customerId: UUID,
    ): Promise<BillingCycle[]> {
        return this.persistence.billingCycles.ListByCustomer(customerId);
    }

    public async RecordMeterReadings(
        readingBatch: MeterReadingBatch,
    ): Promise<void> {
        const customer = await this.persistence.customerAccounts.GetById(
            readingBatch.customerId,
        );

        if (!customer) {
            throw new NotFoundError(
                `Cannot store meter readings for unknown customer: ${readingBatch.customerId}`,
            );
        }

        await this.persistence.meterReadings.SaveBatch(readingBatch);
    }

    public async GenerateInvoice(
        command: GenerateInvoiceCommand,
    ): Promise<UtilityBillingRunResult> {
        const idempotencyKey = this.NormalizeIdempotencyKey(
            command.idempotencyKey,
        );

        const idempotencyState =
            await this.ReplayIdempotentResult<UtilityBillingRunResult>(
                "GenerateInvoice",
                idempotencyKey,
                {
                    customerId: command.customerId,
                    billingCycleId: command.billingCycleId,
                    tariffPlanId: command.tariffPlanId,
                    meterId: command.meterId,
                    invoiceNumber: command.invoiceNumber ?? null,
                    issuedAt: command.issuedAt?.toISOString() ?? null,
                },
            );

        if (idempotencyState.result) {
            return idempotencyState.result;
        }

        const customer = await this.persistence.customerAccounts.GetById(
            command.customerId,
        );
        if (!customer) {
            throw new NotFoundError(
                `Customer not found: ${command.customerId}`,
            );
        }

        const billingCycle = await this.persistence.billingCycles.GetById(
            command.billingCycleId,
        );
        if (!billingCycle) {
            throw new NotFoundError(
                `Billing cycle not found: ${command.billingCycleId}`,
            );
        }

        if (billingCycle.customerId !== command.customerId) {
            throw new ValidationError(
                "Billing cycle customer does not match the billing request customer.",
            );
        }

        const tariffPlan = await this.persistence.tariffPlans.GetById(
            command.tariffPlanId,
        );
        if (!tariffPlan) {
            throw new NotFoundError(
                `Tariff plan not found: ${command.tariffPlanId}`,
            );
        }

        const meterReadingBatches =
            await this.persistence.meterReadings.GetBatchesForCustomer(
                command.customerId,
            );

        const meterIntervals = meterReadingBatches
            .filter((batch) => batch.meterId === command.meterId)
            .flatMap((batch) => batch.intervals)
            .filter(
                (interval) =>
                    interval.startedAt >= billingCycle.startsAt &&
                    interval.endedAt <= billingCycle.endsAt,
            );

        if (meterIntervals.length === 0) {
            throw new ValidationError(
                `No interval readings found for meter ${command.meterId} in the selected cycle.`,
            );
        }

        const workflowInput: IntervalBillingInput = {
            customer,
            billingCycle,
            meterReadings: {
                meterId: command.meterId,
                customerId: command.customerId,
                timezone: meterReadingBatches[0]?.timezone ?? "UTC",
                intervals: meterIntervals,
            },
            tariffPlan,
            invoiceNumber:
                command.invoiceNumber ??
                this.GenerateDefaultInvoiceNumber(customer.accountNumber),
            issuedAt: command.issuedAt ?? new Date(),
        };

        const result = await this.workflow.RunBilling(workflowInput);

        await this.persistence.invoices.Save(result.invoice);
        await this.persistence.billingCycles.UpdateStatus(
            billingCycle.id,
            "Issued",
        );

        await this.StoreIdempotentResult(
            "GenerateInvoice",
            idempotencyKey,
            idempotencyState.requestHash,
            result,
        );

        return result;
    }

    public async ApplyPayment(
        command: ApplyPaymentCommand,
    ): Promise<UtilityBillingPaymentResult> {
        const idempotencyKey = this.NormalizeIdempotencyKey(
            command.idempotencyKey,
        );

        const idempotencyState =
            await this.ReplayIdempotentResult<UtilityBillingPaymentResult>(
                "ApplyPayment",
                idempotencyKey,
                {
                    invoiceId: command.invoiceId,
                    amount: command.amount,
                    method: command.method,
                    reference: command.reference ?? null,
                },
            );

        if (idempotencyState.result) {
            return idempotencyState.result;
        }

        const invoice = await this.persistence.invoices.GetById(
            command.invoiceId,
        );
        if (!invoice) {
            throw new NotFoundError(`Invoice not found: ${command.invoiceId}`);
        }

        const customer = await this.persistence.customerAccounts.GetById(
            invoice.customerId,
        );
        if (!customer) {
            throw new NotFoundError(
                `Customer not found: ${invoice.customerId}`,
            );
        }

        const paymentRequest: InvoicePaymentRequest = {
            amount: command.amount,
            method: command.method,
            reference:
                command.reference ??
                `PMT-${invoice.invoiceNumber}-${Date.now().toString()}`,
        };

        const result = await this.workflow.ApplyPayment({
            invoice,
            customer,
            paymentRequest,
        });

        await this.persistence.payments.Save(result.payment);

        if (result.payment.status === "Captured") {
            await this.persistence.invoices.Update(result.invoice);
            await this.persistence.billingCycles.UpdateStatus(
                result.invoice.billingCycleId,
                this.ResolveBillingCycleStatus(result.invoice),
            );
        }

        await this.StoreIdempotentResult(
            "ApplyPayment",
            idempotencyKey,
            idempotencyState.requestHash,
            result,
        );

        return result;
    }

    public async GetInvoiceById(invoiceId: UUID): Promise<Invoice | undefined> {
        return this.persistence.invoices.GetById(invoiceId);
    }

    public async ListInvoicesByCustomer(customerId: UUID): Promise<Invoice[]> {
        return this.persistence.invoices.ListByCustomer(customerId);
    }

    public async ListPaymentsByInvoice(
        invoiceId: UUID,
    ): Promise<PaymentRecord[]> {
        return this.persistence.payments.ListByInvoice(invoiceId);
    }

    public async AssessInvoiceOverdue(
        command: AssessOverdueInvoiceCommand,
    ): Promise<Invoice> {
        const invoice = await this.persistence.invoices.GetById(
            command.invoiceId,
        );
        if (!invoice) {
            throw new NotFoundError(`Invoice not found: ${command.invoiceId}`);
        }

        const assessmentResult = this.overdueProcessor.Assess(
            invoice,
            command.policy,
            command.asOf ?? new Date(),
        );

        if (assessmentResult.applied || assessmentResult.statusChanged) {
            await this.persistence.invoices.Update(assessmentResult.invoice);
            await this.persistence.billingCycles.UpdateStatus(
                assessmentResult.invoice.billingCycleId,
                this.ResolveBillingCycleStatus(assessmentResult.invoice),
            );
        }

        return assessmentResult.invoice;
    }

    private ResolveBillingCycleStatus(invoice: Invoice): BillingCycleStatus {
        if (invoice.status === "Paid") {
            return "Paid";
        }

        if (invoice.status === "Overdue") {
            return "Overdue";
        }

        if (invoice.status === "PartiallyPaid") {
            return "PartiallyPaid";
        }

        return "Issued";
    }

    private GenerateDefaultInvoiceNumber(accountNumber: string): string {
        return `${accountNumber}-${new Date().getUTCFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
    }

    private NormalizeIdempotencyKey(
        idempotencyKey: string | undefined,
    ): string | undefined {
        if (idempotencyKey === undefined) {
            return undefined;
        }

        const normalized = idempotencyKey.trim();
        if (normalized.length === 0) {
            throw new ValidationError("Idempotency key cannot be empty.");
        }

        return normalized;
    }

    private BuildRequestHash(payload: unknown): string {
        const normalizedPayload = this.NormalizeValue(payload);
        const serializedPayload = JSON.stringify(normalizedPayload);

        return createHash("sha256").update(serializedPayload).digest("hex");
    }

    private NormalizeValue(value: unknown): unknown {
        if (value === null || value === undefined) {
            return value;
        }

        if (value instanceof Date) {
            return value.toISOString();
        }

        if (Array.isArray(value)) {
            return value.map((entry) => this.NormalizeValue(entry));
        }

        if (typeof value !== "object") {
            return value;
        }

        const entries = Object.entries(value as Record<string, unknown>).sort(
            ([left], [right]) => left.localeCompare(right),
        );

        const normalizedObject: Record<string, unknown> = {};

        for (const [key, entry] of entries) {
            if (entry === undefined) {
                continue;
            }

            normalizedObject[key] = this.NormalizeValue(entry);
        }

        return normalizedObject;
    }

    private async ReplayIdempotentResult<T>(
        operation: IdempotencyOperation,
        idempotencyKey: string | undefined,
        requestPayload: unknown,
    ): Promise<{ result?: T; requestHash?: string }> {
        if (!idempotencyKey) {
            return {};
        }

        const requestHash = this.BuildRequestHash(requestPayload);

        const existingRecord = await this.persistence.idempotency.Get(
            operation,
            idempotencyKey,
        );

        if (!existingRecord) {
            return { requestHash };
        }

        if (existingRecord.requestHash !== requestHash) {
            throw new ConflictError(
                `Idempotency key conflict for ${operation}: the same key was already used with a different request payload.`,
                "idempotency_conflict",
            );
        }

        return {
            result: structuredClone(existingRecord.responseData as T),
            requestHash,
        };
    }

    private async StoreIdempotentResult<T>(
        operation: IdempotencyOperation,
        idempotencyKey: string | undefined,
        requestHash: string | undefined,
        responseData: T,
    ): Promise<void> {
        if (!idempotencyKey || !requestHash) {
            return;
        }

        const now = new Date();

        await this.persistence.idempotency.Save({
            operation,
            key: idempotencyKey,
            requestHash,
            responseData,
            createdAt: now,
            updatedAt: now,
        });
    }
}
