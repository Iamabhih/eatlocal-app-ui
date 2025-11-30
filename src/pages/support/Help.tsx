import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  ArrowLeft,
  Search,
  ShoppingBag,
  Truck,
  CreditCard,
  User,
  MessageCircle,
  Phone,
  Mail,
  Clock,
  HelpCircle
} from 'lucide-react';

const faqCategories = [
  {
    id: 'orders',
    title: 'Orders & Delivery',
    icon: ShoppingBag,
    faqs: [
      {
        question: 'How do I place an order?',
        answer: 'Browse restaurants, add items to your cart, proceed to checkout, and confirm your delivery address and payment method. You\'ll receive a confirmation once your order is placed.'
      },
      {
        question: 'Can I cancel my order?',
        answer: 'Orders can be cancelled before the restaurant starts preparation. Go to your order details and tap "Cancel Order". Once preparation begins, cancellation may not be possible.'
      },
      {
        question: 'How long does delivery take?',
        answer: 'Delivery times vary based on restaurant preparation time, distance, and traffic conditions. Estimated delivery time is shown before you place your order and updated in real-time.'
      },
      {
        question: 'What if my order is late or incorrect?',
        answer: 'Contact our support team immediately through the app. We\'ll work with the restaurant and delivery partner to resolve the issue and may offer a refund or credit.'
      },
    ]
  },
  {
    id: 'delivery',
    title: 'Delivery Partners',
    icon: Truck,
    faqs: [
      {
        question: 'How do I become a delivery partner?',
        answer: 'Sign up through our app or website, complete the registration process, submit required documents, and pass our background check. Once approved, you can start accepting deliveries.'
      },
      {
        question: 'When do I get paid?',
        answer: 'Earnings are calculated per delivery and deposited to your linked account weekly. You can view your earnings breakdown in the driver app.'
      },
      {
        question: 'What are the delivery requirements?',
        answer: 'You need a valid driver\'s license, registered vehicle, smartphone, and must pass our background check. Vehicle requirements vary by delivery type (bicycle, scooter, car).'
      },
    ]
  },
  {
    id: 'payments',
    title: 'Payments & Refunds',
    icon: CreditCard,
    faqs: [
      {
        question: 'What payment methods are accepted?',
        answer: 'We accept credit/debit cards, EFT, and mobile money. Cash on delivery is available for select restaurants and areas.'
      },
      {
        question: 'How do refunds work?',
        answer: 'Refunds are processed to your original payment method within 5-7 business days. You\'ll receive an email confirmation when your refund is processed.'
      },
      {
        question: 'Are my payment details secure?',
        answer: 'Yes, we use industry-standard encryption and partner with certified payment processors. We never store your full card details on our servers.'
      },
    ]
  },
  {
    id: 'account',
    title: 'Account & Profile',
    icon: User,
    faqs: [
      {
        question: 'How do I update my profile?',
        answer: 'Go to your Profile page from the menu. You can update your name, phone number, email, and saved addresses from there.'
      },
      {
        question: 'How do I reset my password?',
        answer: 'Tap "Forgot Password" on the login screen and enter your email. We\'ll send you a link to reset your password.'
      },
      {
        question: 'How do I delete my account?',
        answer: 'Contact our support team to request account deletion. We\'ll process your request within 30 days and delete all your personal data as per our privacy policy.'
      },
    ]
  },
];

export default function Help() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = faqCategories.map(category => ({
    ...category,
    faqs: category.faqs.filter(
      faq =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.faqs.length > 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">How can we help?</h1>
          <p className="text-muted-foreground">
            Find answers to common questions or contact our support team
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search for help..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Quick Contact Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Live Chat</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Chat with our support team
              </p>
              <Button size="sm" variant="outline">Start Chat</Button>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Call Us</h3>
              <p className="text-sm text-muted-foreground mb-3">
                +27 10 XXX XXXX
              </p>
              <Button size="sm" variant="outline" asChild>
                <a href="tel:+2710XXXXXXX">Call Now</a>
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">Email</h3>
              <p className="text-sm text-muted-foreground mb-3">
                support@eatlocal.co.za
              </p>
              <Button size="sm" variant="outline" asChild>
                <a href="mailto:support@eatlocal.co.za">Send Email</a>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Operating Hours */}
        <Card className="mb-8">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <div>
                <span className="font-medium">Support Hours: </span>
                <span className="text-muted-foreground">
                  Monday - Sunday, 8:00 AM - 10:00 PM SAST
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Categories */}
        {(searchQuery ? filteredCategories : faqCategories).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <HelpCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Results Found</h2>
              <p className="text-muted-foreground">
                Try searching with different keywords or contact our support team.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {(searchQuery ? filteredCategories : faqCategories).map((category) => (
              <Card key={category.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <category.icon className="w-5 h-5" />
                    {category.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible>
                    {category.faqs.map((faq, index) => (
                      <AccordionItem key={index} value={`${category.id}-${index}`}>
                        <AccordionTrigger className="text-left">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Footer Links */}
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p className="mb-2">
            Need more information? Check out our{' '}
            <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
