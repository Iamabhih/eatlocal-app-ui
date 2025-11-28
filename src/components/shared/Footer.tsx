import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-card border-t mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <span className="text-white font-bold">S</span>
              </div>
              <span className="font-bold text-lg">Smash Local</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Your local everything, delivered. Supporting local businesses and communities.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Get Started */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Get Started</h3>
            <ul className="space-y-2">
              <li><Link to="/customer-info" className="text-muted-foreground hover:text-primary transition-colors">Order Food</Link></li>
              <li><Link to="/restaurant-info" className="text-muted-foreground hover:text-primary transition-colors">Become a Partner</Link></li>
              <li><Link to="/shop-info" className="text-muted-foreground hover:text-primary transition-colors">List Your Shop</Link></li>
              <li><Link to="/delivery-info" className="text-muted-foreground hover:text-primary transition-colors">Deliver with Us</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Support</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-muted-foreground hover:text-primary transition-colors">Help Center</Link></li>
              <li><Link to="/" className="text-muted-foreground hover:text-primary transition-colors">Contact Us</Link></li>
              <li><Link to="/" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link to="/" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Company</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-muted-foreground hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="/" className="text-muted-foreground hover:text-primary transition-colors">Careers</Link></li>
              <li><Link to="/" className="text-muted-foreground hover:text-primary transition-colors">Press</Link></li>
              <li><Link to="/" className="text-muted-foreground hover:text-primary transition-colors">Blog</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row items-center justify-between text-muted-foreground text-sm">
          <p>&copy; {new Date().getFullYear()} Smash Local. All rights reserved.</p>
          <p className="mt-2 md:mt-0">Made with ❤️ for local communities</p>
        </div>
      </div>
    </footer>
  );
};
