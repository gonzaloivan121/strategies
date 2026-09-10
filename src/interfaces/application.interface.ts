/**
 * Interface representing an `Application`.
 *
 * @export
 * @interface Application
 */
export interface Application {
    /**
     * Starts the `Application`.
     *
     * @memberof Application
     */
    Start(): Promise<void> | void;

    /**
     * Updates the `Application`.
     *
     * @memberof Application
     */
    Update(): Promise<void> | void;

    /**
     * Stops the `Application`.
     *
     * @memberof Application
     */
    Stop(): Promise<void> | void;
}

/**
 * Interface representing an `Application` constructor.
 *
 * @export
 * @interface ApplicationConstructor
 */
export interface ApplicationConstructor<
    TApplication extends Application = Application,
    TConfiguration extends ApplicationConfiguration = ApplicationConfiguration,
> {
    new (config: TConfiguration): TApplication;
}

/**
 * Creates an `Application` instance using a constructor that requires configuration.
 *
 * @export
 * @template TApplication - The type of the `Application` being created.
 * @template TConfiguration - The type of the configuration required by the `Application` being created.
 * @param {ApplicationConstructor<TApplication, TConfiguration>} application - The constructor of the `Application` being created.
 * @param {TConfiguration} appConfig - The configuration required by the `Application` being created.
 * @returns {TApplication}
 */
export function CreateApplication<
    TApplication extends Application,
    TConfiguration extends ApplicationConfiguration,
>(
    application: ApplicationConstructor<TApplication, TConfiguration>,
    appConfig: TConfiguration,
): Promise<TApplication> {
    return new Promise<TApplication>((resolve, reject) => {
        const app = new application(appConfig);

        if (!app) {
            reject(new Error("Failed to create application instance."));
            return;
        }

        app.Start();

        resolve(app);
    });
}

/**
 * Interface representing the configuration of an `Application`.
 *
 * @export
 * @interface ApplicationConfiguration
 */
export interface ApplicationConfiguration {

}