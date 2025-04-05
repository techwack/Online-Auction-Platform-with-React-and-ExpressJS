import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import AuctionCard from "./AuctionCard";
import { Auction } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";

const FeaturedAuctions = () => {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedAuctions = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/auctions/featured');
        
        if (!response.ok) {
          throw new Error('Failed to fetch featured auctions');
        }
        
        const data = await response.json();
        setAuctions(data);
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching featured auctions:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFeaturedAuctions();
  }, []);

  // If there are no featured auctions yet, get the first 3 auctions
  useEffect(() => {
    const fetchAllAuctions = async () => {
      if (!loading && auctions.length === 0) {
        try {
          const response = await fetch('/api/auctions');
          
          if (!response.ok) {
            throw new Error('Failed to fetch auctions');
          }
          
          const data = await response.json();
          // Take the first 3 auctions
          setAuctions(data.slice(0, 3));
        } catch (err) {
          console.error('Error fetching all auctions:', err);
        }
      }
    };
    
    fetchAllAuctions();
  }, [loading, auctions.length]);

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-neutral-900">Featured Auctions</h2>
          <Link href="/auctions" className="text-primary-600 hover:text-primary-700 flex items-center font-medium">
            View all <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg overflow-hidden">
                <Skeleton className="w-full h-48" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <div className="flex justify-between">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center p-8 bg-red-50 rounded-lg">
            <p className="text-red-600">{error}</p>
            <p className="mt-2 text-neutral-600">Unable to load featured auctions. Please try again later.</p>
          </div>
        ) : auctions.length === 0 ? (
          <div className="text-center p-8 bg-neutral-50 rounded-lg">
            <p className="text-neutral-600">No featured auctions available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {auctions.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedAuctions;
