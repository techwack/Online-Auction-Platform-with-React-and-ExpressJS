import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { UserPlus, Search, Gavel } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const HowItWorks = () => {
  const { user } = useAuth();

  return (
    <section className="py-12 bg-neutral-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-4">How BidHub Works</h2>
          <p className="text-neutral-600 max-w-2xl mx-auto">Our platform makes it easy to buy and sell unique items through a transparent auction process.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="text-primary-600 h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold mb-2">1. Create an Account</h3>
            <p className="text-neutral-600">Sign up for free and set up your profile with payment information.</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="text-primary-600 h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold mb-2">2. Browse or List Items</h3>
            <p className="text-neutral-600">Find items to bid on or list your own items for auction.</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gavel className="text-primary-600 h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold mb-2">3. Bid or Sell</h3>
            <p className="text-neutral-600">Place competitive bids or watch as others bid on your listings.</p>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <Link href={user ? "/auctions" : "/auth"}>
            <Button>Get Started Now</Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
