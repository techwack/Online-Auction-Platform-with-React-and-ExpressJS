import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import AuctionCard from "./AuctionCard";
import { Auction } from "server/schema";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

const FeaturedAuctions = () => {
  // Use React Query to fetch featured auctions
  const {
    data: featuredAuctions = [],
    isLoading: isFeaturedLoading,
    error: featuredError,
  } = useQuery<Auction[]>({
    queryKey: ['/api/auctions/featured'],
    staleTime: 60000, // 1 minute
    retry: 2,
  });
  
  // Use React Query to fetch all auctions as fallback
  const {
    data: allAuctions = [],
    isLoading: isAllLoading,
    error: allError,
  } = useQuery<Auction[]>({
    queryKey: ['/api/auctions'],
    staleTime: 60000, // 1 minute
    retry: 2,
    // Only fetch all auctions if there are no featured auctions
    enabled: !isFeaturedLoading && featuredAuctions.length === 0,
  });
  
  // Determine which auctions to display
  const auctions = featuredAuctions.length > 0 
    ? featuredAuctions 
    : allAuctions.slice(0, 3);
    
  // Determine loading and error states
  const isLoading = isFeaturedLoading || (isAllLoading && featuredAuctions.length === 0);
  const hasError = featuredError || (featuredAuctions.length === 0 && allError);
  const errorMessage = hasError
    ? ((featuredError || allError) as Error)?.message || "Failed to load auctions"
    : null;

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-neutral-900">Featured Auctions</h2>
          <Link href="/auctions" className="text-primary-600 hover:text-primary-700 flex items-center font-medium">
            View all <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
        
        {isLoading ? (
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
        ) : errorMessage ? (
          <div className="text-center p-8 bg-red-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-red-600 mb-2">
              <AlertCircle size={20} />
              <p className="font-medium">Error loading auctions</p>
            </div>
            <p className="text-neutral-600">Unable to load featured auctions. Please try again later.</p>
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
