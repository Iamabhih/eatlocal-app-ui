import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function Terms() {
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
            <CardTitle className="text-3xl">Terms of Service</CardTitle>
            <p className="text-muted-foreground">Last updated: November 2024</p>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using the EatLocal platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our Service.
            </p>

            <h2>2. Description of Service</h2>
            <p>
              EatLocal provides an online platform that connects customers with local restaurants for food ordering and delivery services. Our platform also includes ride-sharing services, hotel bookings, and venue experiences.
            </p>

            <h2>3. User Accounts</h2>
            <p>
              To use certain features of our Service, you must register for an account. You agree to:
            </p>
            <ul>
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Promptly update your account information if it changes</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>

            <h2>4. Orders and Payments</h2>
            <p>
              When you place an order through our platform:
            </p>
            <ul>
              <li>You agree to pay all charges at the prices listed at the time of order</li>
              <li>Prices may vary and are subject to change without notice</li>
              <li>You authorize us to charge your selected payment method</li>
              <li>Delivery fees, service fees, and taxes may apply</li>
            </ul>

            <h2>5. Cancellations and Refunds</h2>
            <p>
              Order cancellation policies vary depending on the status of your order:
            </p>
            <ul>
              <li>Orders may be cancelled before the restaurant starts preparation</li>
              <li>Once preparation has begun, cancellation may not be possible</li>
              <li>Refunds are processed according to our refund policy</li>
              <li>Disputes should be raised within 24 hours of delivery</li>
            </ul>

            <h2>6. User Conduct</h2>
            <p>
              You agree not to:
            </p>
            <ul>
              <li>Use the Service for any unlawful purpose</li>
              <li>Harass, abuse, or harm other users or service providers</li>
              <li>Provide false information or impersonate others</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
            </ul>

            <h2>7. Intellectual Property</h2>
            <p>
              The Service and its content are protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, or distribute any part of the Service without our prior written consent.
            </p>

            <h2>8. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, EatLocal shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.
            </p>

            <h2>9. Dispute Resolution</h2>
            <p>
              Any disputes arising from these Terms or your use of the Service shall be resolved through arbitration in accordance with South African law.
            </p>

            <h2>10. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify users of material changes via email or through the Service. Your continued use of the Service after changes become effective constitutes acceptance of the new Terms.
            </p>

            <h2>11. Contact Information</h2>
            <p>
              For questions about these Terms, please contact us at:
            </p>
            <ul>
              <li>Email: legal@eatlocal.co.za</li>
              <li>Phone: +27 10 900 0001</li>
              <li>Address: Johannesburg, South Africa</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
