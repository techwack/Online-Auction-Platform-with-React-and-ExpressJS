import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

const HeroSection = () => {
  const { user } = useAuth();

  return (
    <section className="relative bg-neutral-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Discover Unique Items and Place Your Bid</h1>
            <p className="text-neutral-300 text-lg mb-8">Join thousands of collectors and bargain hunters on BidHub, the premier online auction platform.</p>
            <div className="flex flex-wrap gap-4">
              <Link href={user ? "/auctions" : "/auth"}>
                <Button className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 font-medium">
                  Start Bidding
                </Button>
              </Link>
              <Link href={user ? "/create-auction" : "/auth"}>
                <Button variant="secondary" className="bg-white text-neutral-900">
                  Sell an Item
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative mt-10 md:mt-0">
            <div className="bg-white p-4 rounded-lg shadow-lg transform rotate-3 z-10 max-w-md mx-auto">
              <div className="relative">
                <img 
                  src="https://images.unsplash.com/photo-1611148768128-5cffa43f8037?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                  alt="Vintage watch auction" 
                  className="rounded-md w-full"
                />
                <div className="absolute bottom-3 right-3 bg-white bg-opacity-90 px-4 py-2 rounded-md shadow">
                  <p className="text-lg font-bold text-primary-600">Current Bid: $780</p>
                  <p className="text-neutral-800 flex items-center">
                    <span className="mr-1">⏱️</span> 4h 32m left
                  </p>
                </div>
              </div>
              <div className="mt-3 text-neutral-900">
                <h3 className="font-semibold text-lg">Vintage Omega Seamaster Watch</h3>
                <p className="text-neutral-700">1960s, excellent condition with original box</p>
              </div>
            </div>
            <div className="absolute -bottom-6 -left-6 bg-orange-500 p-4 rounded-lg shadow-lg transform -rotate-2 z-0 max-w-xs">
              <div className="text-neutral-900">
                <h3 className="font-semibold">Just Sold!</h3>
                <p className="text-sm">Antique Oak Writing Desk - $1,250</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
