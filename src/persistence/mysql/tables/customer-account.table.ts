import { RowDataPacket } from "mysql2/promise";

import { UUID } from "#types/uuid.type";
import { Email } from "#types/email.type";
import { PhoneNumber } from "#types/phone.type";

/**
 * Represents a row in the `customer_accounts` table.
 *
 * @interface CustomerAccountTable
 * @extends {RowDataPacket}
 */
export interface CustomerAccountTable extends RowDataPacket {
    /**
     * The unique identifier of the `Customer`.
     *
     * @type {string}
     * @memberof CustomerAccountTable
     */
    id: UUID;

    /**
     * The account number of the `Customer`.
     *
     * @type {string}
     * @memberof CustomerAccountTable
     */
    account_number: string;

    /**
     * The external identifier of the `Customer`.
     *
     * @type {string}
     * @memberof CustomerAccountTable
     */
    external_id: string;

    /**
     * The full name of the `Customer`.
     *
     * @type {string}
     * @memberof CustomerAccountTable
     */
    full_name: string;

    /**
     * The email address of the `Customer`.
     *
     * @type {string}
     * @memberof CustomerAccountTable
     */
    email: Email;

    /**
     * The phone number of the `Customer`.
     *
     * @type {PhoneNumber}
     * @memberof CustomerAccountTable
     */
    phone: PhoneNumber;

    /**
     * The device identifier of the `Customer`.
     *
     * @type {string}
     * @memberof CustomerAccountTable
     */
    device_id: string;

    /**
     * The notification channels of the `Customer`.
     *
     * @type {string}
     * @memberof CustomerAccountTable
     */
    notification_channels: string;

    /**
     * The status of the `Customer`.
     *
     * @type {string}
     * @memberof CustomerAccountTable
     */
    status: string;

    /**
     * The service address of the `Customer`.
     *
     * @type {string}
     * @memberof CustomerAccountTable
     */
    service_address: string;

    /**
     * The billing address of the `Customer`.
     *
     * @type {string}
     * @memberof CustomerAccountTable
     */
    billing_address: string;
}
