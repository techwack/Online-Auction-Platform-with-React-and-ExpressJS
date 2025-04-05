import { Link } from "wouter";
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-neutral-900 text-neutral-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">BidHub</h3>
            <p className="text-sm">The premier online auction platform for unique and collectible items.</p>
            <div className="mt-4 flex space-x-4">
              <a href="#" className="text-neutral-400 hover:text-white">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-white">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-white">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-white">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-white text-sm font-semibold uppercase mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/">
                  <a className="hover:text-white">Home</a>
                </Link>
              </li>
              <li>
                <Link href="/featured">
                  <a className="hover:text-white">Featured Auctions</a>
                </Link>
              </li>
              <li>
                <Link href="/categories">
                  <a className="hover:text-white">Categories</a>
                </Link>
              </li>
              <li>
                <Link href="/how-it-works">
                  <a className="hover:text-white">How It Works</a>
                </Link>
              </li>
              <li>
                <Link href="/create-auction">
                  <a className="hover:text-white">Sell an Item</a>
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white text-sm font-semibold uppercase mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/help">
                  <a className="hover:text-white">Help Center</a>
                </Link>
              </li>
              <li>
                <Link href="/faq">
                  <a className="hover:text-white">FAQs</a>
                </Link>
              </li>
              <li>
                <Link href="/contact">
                  <a className="hover:text-white">Contact Us</a>
                </Link>
              </li>
              <li>
                <Link href="/shipping">
                  <a className="hover:text-white">Shipping Information</a>
                </Link>
              </li>
              <li>
                <Link href="/disputes">
                  <a className="hover:text-white">Dispute Resolution</a>
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white text-sm font-semibold uppercase mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms">
                  <a className="hover:text-white">Terms of Service</a>
                </Link>
              </li>
              <li>
                <Link href="/privacy">
                  <a className="hover:text-white">Privacy Policy</a>
                </Link>
              </li>
              <li>
                <Link href="/cookies">
                  <a className="hover:text-white">Cookie Policy</a>
                </Link>
              </li>
              <li>
                <Link href="/auction-rules">
                  <a className="hover:text-white">Auction Rules</a>
                </Link>
              </li>
              <li>
                <Link href="/seller-policies">
                  <a className="hover:text-white">Seller Policies</a>
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-neutral-800 text-sm text-center">
          <p>&copy; {new Date().getFullYear()} BidHub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
