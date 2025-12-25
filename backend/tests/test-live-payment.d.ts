#!/usr/bin/env node
declare function testCoinbaseDirectly(fetch: any): Promise<any>;
declare function testServerHealth(fetch: any): Promise<boolean>;
declare function testDepositConfig(fetch: any): Promise<any>;
declare function createTestUser(fetch: any): Promise<any>;
declare function runLiveTests(): Promise<void>;
declare const API_BASE: "http://localhost:3030/api/v1";
declare namespace TEST_PAYMENT {
    let amount: number;
    let currency: string;
    let name: string;
    let description: string;
    namespace metadata {
        let test: boolean;
        let platform: string;
        let timestamp: string;
    }
}
//# sourceMappingURL=test-live-payment.d.ts.map