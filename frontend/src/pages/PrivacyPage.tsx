import React from 'react';
import { environment } from '@/config/environment';

const PrivacyPage: React.FC = () => {
  const lastUpdated = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-white dark:bg-gray-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">Privacy Policy</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Last updated: {lastUpdated}
          </p>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
            <p className="text-blue-800 dark:text-blue-200 mb-0">
              This Privacy Policy describes how {environment.APP_NAME} ("we", "our", or "us") 
              collects, uses, and protects your personal information when you use our service booking platform.
            </p>
          </div>

          <h2>Information We Collect</h2>
          <h3>Personal Information</h3>
          <p>
            When you create an account, we collect information such as:
          </p>
          <ul>
            <li>Full name and contact information (email, phone number)</li>
            <li>Profile information (avatar, bio, specialties for specialists)</li>
            <li>Payment information (processed securely through Stripe)</li>
            <li>Location data (to match you with nearby specialists)</li>
          </ul>

          <h3>Usage Data</h3>
          <p>
            We automatically collect information about how you use our platform:
          </p>
          <ul>
            <li>Booking history and preferences</li>
            <li>Search queries and interactions</li>
            <li>Device information and IP address</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>

          <h2>How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul>
            <li>Provide and improve our booking services</li>
            <li>Process payments and transactions</li>
            <li>Send booking confirmations and reminders</li>
            <li>Provide customer support</li>
            <li>Personalize your experience</li>
            <li>Prevent fraud and ensure platform security</li>
          </ul>

          <h2>Information Sharing</h2>
          <p>
            We share your information only in specific circumstances:
          </p>
          <ul>
            <li><strong>With specialists:</strong> We share necessary booking details when you make a reservation</li>
            <li><strong>With customers:</strong> Specialists can see customer information relevant to bookings</li>
            <li><strong>Service providers:</strong> Payment processing, hosting, and other essential services</li>
            <li><strong>Legal requirements:</strong> When required by law or to protect our rights</li>
          </ul>

          <h2>Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your information:
          </p>
          <ul>
            <li>Encryption of data in transit and at rest</li>
            <li>Secure payment processing through Stripe</li>
            <li>Regular security audits and monitoring</li>
            <li>Access controls and authentication systems</li>
          </ul>

          <h2>Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access and review your personal information</li>
            <li>Update or correct your information</li>
            <li>Delete your account and associated data</li>
            <li>Opt-out of marketing communications</li>
            <li>Request a copy of your data</li>
          </ul>

          <h2>Cookies and Tracking</h2>
          <p>
            We use cookies and similar technologies to improve your experience. 
            You can control cookie settings through your browser preferences.
          </p>

          <h2>Third-Party Services</h2>
          <p>
            Our platform integrates with third-party services:
          </p>
          <ul>
            <li><strong>Stripe:</strong> Payment processing</li>
            <li><strong>Google Maps:</strong> Location services</li>
            <li><strong>Telegram:</strong> Optional messaging integration</li>
          </ul>

          <h2>Data Retention</h2>
          <p>
            We retain your information for as long as your account is active or as needed 
            to provide services. We may retain certain information for legal compliance 
            or legitimate business purposes.
          </p>

          <h2>Children's Privacy</h2>
          <p>
            Our services are not intended for users under 18 years of age. 
            We do not knowingly collect personal information from children.
          </p>

          <h2>International Data Transfers</h2>
          <p>
            Your information may be transferred to and processed in countries other than 
            your own. We ensure appropriate safeguards are in place for such transfers.
          </p>

          <h2>Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of 
            any material changes by email or through our platform.
          </p>

          <h2>Contact Information</h2>
          <p>
            If you have questions about this Privacy Policy or our data practices, 
            please contact us at:
          </p>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mt-6">
            <p className="mb-2"><strong>Email:</strong> privacy@{environment.APP_NAME.toLowerCase()}.com</p>
            <p className="mb-2"><strong>Address:</strong> 123 Privacy Street, Data City, DC 12345</p>
            <p className="mb-0"><strong>Phone:</strong> +1 (555) 123-4567</p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mt-8">
            <h3 className="text-yellow-800 dark:text-yellow-200 font-semibold mb-2">Important Note</h3>
            <p className="text-yellow-700 dark:text-yellow-300 mb-0">
              By using {environment.APP_NAME}, you consent to the collection and use of 
              your information as described in this Privacy Policy. If you do not agree 
              with this policy, please do not use our services.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;