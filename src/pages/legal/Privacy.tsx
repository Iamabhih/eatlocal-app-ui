import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Privacy Policy</CardTitle>
            <p className="text-muted-foreground">Last updated: November 2024</p>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <h2>1. Introduction</h2>
            <p>
              EatLocal ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform and services.
            </p>

            <h2>2. Information We Collect</h2>
            <h3>Personal Information</h3>
            <p>We may collect the following personal information:</p>
            <ul>
              <li>Name, email address, and phone number</li>
              <li>Delivery addresses and location data</li>
              <li>Payment information (processed securely via third-party providers)</li>
              <li>Order history and preferences</li>
              <li>Communication records with support</li>
            </ul>

            <h3>Automatically Collected Information</h3>
            <p>When you use our Service, we automatically collect:</p>
            <ul>
              <li>Device information (type, operating system, unique identifiers)</li>
              <li>Log data (IP address, browser type, pages visited)</li>
              <li>Location data (with your consent)</li>
              <li>Usage patterns and preferences</li>
            </ul>

            <h2>3. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul>
              <li>Process and fulfill your orders</li>
              <li>Provide customer support</li>
              <li>Send order updates and delivery notifications</li>
              <li>Improve our services and user experience</li>
              <li>Personalize content and recommendations</li>
              <li>Detect and prevent fraud</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2>4. Information Sharing</h2>
            <p>We may share your information with:</p>
            <ul>
              <li><strong>Restaurants:</strong> To fulfill your orders</li>
              <li><strong>Delivery Partners:</strong> To deliver your orders</li>
              <li><strong>Payment Processors:</strong> To process transactions securely</li>
              <li><strong>Service Providers:</strong> Who assist in operating our platform</li>
              <li><strong>Legal Authorities:</strong> When required by law or to protect our rights</li>
            </ul>

            <h2>5. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your data, including:
            </p>
            <ul>
              <li>Encryption of data in transit and at rest</li>
              <li>Secure payment processing through certified providers</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Access controls and authentication measures</li>
            </ul>

            <h2>6. Your Rights Under POPIA</h2>
            <p>
              Under the Protection of Personal Information Act (POPIA), you have the right to:
            </p>
            <ul>
              <li>Access your personal information</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Object to processing of your information</li>
              <li>Withdraw consent at any time</li>
              <li>Lodge a complaint with the Information Regulator</li>
            </ul>

            <h2>7. Cookies and Tracking</h2>
            <p>
              We use cookies and similar technologies to enhance your experience. You can control cookie preferences through your browser settings. Types of cookies we use:
            </p>
            <ul>
              <li><strong>Essential cookies:</strong> Required for basic functionality</li>
              <li><strong>Performance cookies:</strong> Help us understand usage patterns</li>
              <li><strong>Functional cookies:</strong> Remember your preferences</li>
              <li><strong>Marketing cookies:</strong> Used for personalized advertising</li>
            </ul>

            <h2>8. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this policy. When you delete your account, we will delete or anonymize your data within 90 days, except where retention is required by law.
            </p>

            <h2>9. Children's Privacy</h2>
            <p>
              Our Service is not intended for children under 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
            </p>

            <h2>10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes via email or through the Service. Your continued use after changes become effective constitutes acceptance.
            </p>

            <h2>11. Contact Us</h2>
            <p>
              For privacy-related inquiries or to exercise your rights, contact our Information Officer:
            </p>
            <ul>
              <li>Email: privacy@eatlocal.co.za</li>
              <li>Phone: +27 10 XXX XXXX</li>
              <li>Address: Johannesburg, South Africa</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
