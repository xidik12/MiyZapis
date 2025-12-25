#!/usr/bin/env node
export = PaymentCompletionTester;
declare class PaymentCompletionTester {
    socket: any;
    receivedEvents: any[];
    testResults: {
        paymentIntentCreated: boolean;
        websocketConnected: boolean;
        webhookProcessed: boolean;
        paymentCompletionReceived: boolean;
        bookingConfirmationReceived: boolean;
    };
    runTests(): Promise<void>;
    setupWebSocketConnection(): Promise<any>;
    createPaymentIntent(): Promise<any>;
    simulateWebhook(paymentIntent: any): Promise<void>;
    waitForEvents(): Promise<any>;
    displayResults(): void;
}
//# sourceMappingURL=test-payment-completion.d.ts.map