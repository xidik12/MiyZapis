import React from 'react';
import { environment } from '@/config/environment';

const TermsPage: React.FC = () => {
  const lastUpdated = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-white dark:bg-gray-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">Terms of Service</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Last updated: {lastUpdated}
          </p>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
            <p className="text-blue-800 dark:text-blue-200 mb-0">
              These Terms of Service ("Terms") govern your use of {environment.APP_NAME} ("we", "our", or "us"), 
              a platform that connects customers with professional service specialists.
            </p>
          </div>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using {environment.APP_NAME}, you agree to be bound by these Terms. 
            If you disagree with any part of these terms, you may not access the service.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            {environment.APP_NAME} is a platform that allows customers to discover, book, and pay for 
            professional services provided by independent specialists. We facilitate connections 
            but are not responsible for the actual delivery of services.
          </p>

          <h2>3. User Accounts</h2>
          <h3>3.1 Account Creation</h3>
          <ul>
            <li>You must provide accurate and complete information</li>
            <li>You are responsible for maintaining account security</li>
            <li>One person or entity may not maintain multiple accounts</li>
            <li>You must be at least 18 years old to create an account</li>
          </ul>

          <h3>3.2 Account Types</h3>
          <p>We offer two types of accounts:</p>
          <ul>
            <li><strong>Customer Accounts:</strong> For booking and receiving services</li>
            <li><strong>Specialist Accounts:</strong> For providing professional services</li>
          </ul>

          <h2>4. Customer Responsibilities</h2>
          <ul>
            <li>Provide accurate booking information and special requirements</li>
            <li>Arrive on time for scheduled appointments</li>
            <li>Treat specialists with respect and professionalism</li>
            <li>Pay for services as agreed upon</li>
            <li>Cancel bookings according to cancellation policies</li>
          </ul>

          <h2>5. Specialist Responsibilities</h2>
          <ul>
            <li>Provide services as described and agreed upon</li>
            <li>Maintain professional qualifications and certifications</li>
            <li>Respond to booking requests in a timely manner</li>
            <li>Keep accurate availability calendars</li>
            <li>Deliver services with reasonable skill and care</li>
          </ul>

          <h2>6. Booking and Payment Terms</h2>
          <h3>6.1 Booking Process</h3>
          <p>
            Bookings are confirmed when payment is processed. All bookings are subject 
            to specialist availability and acceptance.
          </p>

          <h3>6.2 Payment</h3>
          <ul>
            <li>Payments are processed securely through Stripe</li>
            <li>Deposits may be required for certain services</li>
            <li>Full payment is typically required before service delivery</li>
            <li>Platform fees are included in displayed prices</li>
          </ul>

          <h3>6.3 Cancellation and Refunds</h3>
          <ul>
            <li>Cancellation policies vary by specialist and service type</li>
            <li>Refunds are processed according to the applicable cancellation policy</li>
            <li>Platform fees may not be refundable in certain circumstances</li>
          </ul>

          <h2>7. Platform Fees</h2>
          <p>
            {environment.APP_NAME} charges service fees to facilitate bookings:
          </p>
          <ul>
            <li>Customer service fee: Included in booking price</li>
            <li>Specialist commission: 8% of booking value</li>
            <li>Payment processing fees: As charged by Stripe</li>
          </ul>

          <h2>8. Quality and Safety</h2>
          <h3>8.1 Specialist Verification</h3>
          <p>
            While we conduct basic verification checks, customers should independently 
            verify specialist qualifications for their specific needs.
          </p>

          <h3>8.2 Reviews and Ratings</h3>
          <ul>
            <li>Reviews must be honest and based on actual experiences</li>
            <li>False or misleading reviews are prohibited</li>
            <li>We reserve the right to remove inappropriate reviews</li>
          </ul>

          <h2>9. Prohibited Activities</h2>
          <p>Users may not:</p>
          <ul>
            <li>Violate any applicable laws or regulations</li>
            <li>Harass, abuse, or harm other users</li>
            <li>Post false, misleading, or inappropriate content</li>
            <li>Attempt to bypass platform fees</li>
            <li>Use automated systems to access the platform</li>
            <li>Interfere with platform operation or security</li>
          </ul>

          <h2>10. Intellectual Property</h2>
          <p>
            The {environment.APP_NAME} platform, including its design, code, and content, 
            is protected by intellectual property laws. Users retain rights to their 
            own content but grant us license to use it for platform operations.
          </p>

          <h2>11. Privacy and Data</h2>
          <p>
            Your privacy is important to us. Please review our Privacy Policy, 
            which also governs your use of the service.
          </p>

          <h2>12. Dispute Resolution</h2>
          <h3>12.1 Platform Mediation</h3>
          <p>
            We offer mediation services for disputes between customers and specialists. 
            Contact our support team for assistance.
          </p>

          <h3>12.2 Limitation of Liability</h3>
          <p>
            {environment.APP_NAME} acts as an intermediary and is not liable for disputes 
            between customers and specialists or the quality of services provided.
          </p>

          <h2>13. Termination</h2>
          <p>
            We reserve the right to suspend or terminate accounts that violate these Terms. 
            Users may close their accounts at any time through account settings.
          </p>

          <h2>14. Changes to Terms</h2>
          <p>
            We may modify these Terms from time to time. Material changes will be 
            communicated via email or platform notifications. Continued use 
            constitutes acceptance of updated Terms.
          </p>

          <h2>15. Governing Law</h2>
          <p>
            These Terms are governed by the laws of [Jurisdiction]. Disputes will be 
            resolved in the courts of [Jurisdiction].
          </p>

          <h2>16. Contact Information</h2>
          <p>
            For questions about these Terms, contact us at:
          </p>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mt-6">
            <p className="mb-2"><strong>Email:</strong> legal@{environment.APP_NAME.toLowerCase()}.com</p>
            <p className="mb-2"><strong>Support:</strong> support@{environment.APP_NAME.toLowerCase()}.com</p>
            <p className="mb-0"><strong>Address:</strong> 123 Legal Street, Terms City, TC 12345</p>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mt-8">
            <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">Important</h3>
            <p className="text-red-700 dark:text-red-300 mb-0">
              By using {environment.APP_NAME}, you acknowledge that you have read, 
              understood, and agree to be bound by these Terms of Service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;