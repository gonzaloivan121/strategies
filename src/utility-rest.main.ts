import { AddressInfo } from "node:net";

import { CreateUtilityRestServer } from "#applications/utility/utility-rest.server";
import { UtilityPersistence } from "#interfaces/utility-persistence.interface";
import { InMemoryUtilityPersistence } from "#persistence/in-memory/in-memory.utility-persistence";
import {
    MySqlUtilityPersistence,
    MySqlUtilityPersistenceConfiguration,
} from "#persistence/mysql/mysql.utility-persistence";
import { UtilityBillingService } from "#services/utility-billing.service";
import { defaultUtilityBillingWorkflowConfiguration } from "#workflows/billing/default-utility-billing.workflow-configuration";
import { UtilityBillingWorkflow } from "#workflows/billing/utility-billing.workflow";

function RequireEnvironment(name: string): string {
    const value = process.env[name];
    if (!value || value.trim().length === 0) {
        throw new Error(`Environment variable '${name}' is required.`);
    }

    return value;
}

function BuildMySqlConfiguration(): MySqlUtilityPersistenceConfiguration {
    return {
        host: RequireEnvironment("UTILITY_MYSQL_HOST"),
        port: Number(process.env["UTILITY_MYSQL_PORT"] ?? "3306"),
        user: RequireEnvironment("UTILITY_MYSQL_USER"),
        password: RequireEnvironment("UTILITY_MYSQL_PASSWORD"),
        database: RequireEnvironment("UTILITY_MYSQL_DATABASE"),
        connectionLimit: Number(
            process.env["UTILITY_MYSQL_CONNECTION_LIMIT"] ?? "8",
        ),
    };
}

async function Bootstrap(): Promise<void> {
    const mode =
        (process.env["UTILITY_PERSISTENCE_MODE"] ?? "memory").toLowerCase() as
            | "memory"
            | "mysql";

    let persistence: UtilityPersistence;
    let onDispose: (() => Promise<void>) | undefined;

    if (mode === "mysql") {
        const mysqlPersistence = MySqlUtilityPersistence.Create(
            BuildMySqlConfiguration(),
        );

        await mysqlPersistence.EnsureSchema();

        persistence = mysqlPersistence;
        onDispose = async () => {
            await mysqlPersistence.Dispose();
        };

        console.log("Utility API persistence mode: mysql");
    } else {
        persistence = new InMemoryUtilityPersistence();
        console.log("Utility API persistence mode: memory");
    }

    const workflow = new UtilityBillingWorkflow(
        defaultUtilityBillingWorkflowConfiguration,
    );

    const service = new UtilityBillingService(persistence, workflow);
    const app = CreateUtilityRestServer({ service });

    const port = Number(process.env["UTILITY_API_PORT"] ?? "3010");
    const host = process.env["UTILITY_API_HOST"] ?? "0.0.0.0";

    const server = app.listen(port, host, () => {
        const address = server.address() as AddressInfo | null;
        const runtimePort = address?.port ?? port;

        console.log(`Utility API server listening on ${host}:${runtimePort}`);
        console.log(`OpenAPI specification available at /openapi.json`);
    });

    const shutdown = async (signal: string): Promise<void> => {
        console.log(`Received ${signal}. Shutting down Utility API server...`);

        await new Promise<void>((resolve, reject) => {
            server.close((error?: Error) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve();
            });
        });

        if (onDispose) {
            await onDispose();
        }

        process.exit(0);
    };

    process.on("SIGINT", () => {
        void shutdown("SIGINT");
    });

    process.on("SIGTERM", () => {
        void shutdown("SIGTERM");
    });
}

void Bootstrap().catch((error) => {
    console.error(error);
    process.exit(1);
});
