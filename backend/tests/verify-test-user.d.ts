#!/usr/bin/env node
export function createVerifiedTestUser(): Promise<{
    id: string;
    email: string;
    password: string | null;
    passwordLastChanged: Date | null;
    authProvider: string | null;
    firstName: string;
    lastName: string;
    avatar: string | null;
    userType: string;
    phoneNumber: string | null;
    telegramId: string | null;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    isActive: boolean;
    lastLoginAt: Date | null;
    language: string;
    currency: string;
    timezone: string;
    emailNotifications: boolean;
    pushNotifications: boolean;
    telegramNotifications: boolean;
    loyaltyPoints: number;
    walletBalance: number;
    walletCurrency: string;
    subscriptionStatus: string;
    subscriptionValidUntil: Date | null;
    subscriptionEffectiveDate: Date | null;
    trialStartDate: Date | null;
    trialEndDate: Date | null;
    isInTrial: boolean;
    createdAt: Date;
    updatedAt: Date;
    loyaltyTierId: string | null;
}>;
export function getTestUserCredentials(): {
    email: string;
    password: string;
};
//# sourceMappingURL=verify-test-user.d.ts.map