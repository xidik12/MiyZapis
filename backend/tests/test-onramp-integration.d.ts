#!/usr/bin/env node
declare function testOnrampIntegration(): Promise<void>;
declare const API_BASE: "http://localhost:3030/api/v1";
declare namespace TEST_ONRAMP {
    let amount: number;
    let currency: string;
    let purpose: string;
    let userAddress: string;
    namespace metadata {
        let test: boolean;
        let platform: string;
        let timestamp: string;
    }
}
//# sourceMappingURL=test-onramp-integration.d.ts.map