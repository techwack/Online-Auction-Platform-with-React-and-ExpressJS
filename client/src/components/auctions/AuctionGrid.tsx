import { useState, useEffect } from "react";
import AuctionCard from "./AuctionCard";
import { Button } from "@/components/ui/button";
import { Auction } from "server/schema";
import { useAuctions, useWatchlist } from "@/hooks/use-auctions";
import { Loader2, AlertCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

type AuctionGridProps = {
  title: string;
  subtitle?: string;
  showLoadMore?: boolean;
  initialLimit?: number;
  categoryId?: number;
};

const AuctionGrid = ({ 
  title, 
  subtitle, 
  showLoadMore = false, 
  initialLimit = 6,
  categoryId
}: AuctionGridProps) => {
  const queryClient = useQueryClient();
  const [limit, setLimit] = useState(initialLimit);
  const { auctions, isLoading, isError } = useAuctions(categoryId);
  const { watchlist, isLoading: isWatchlistLoading } = useWatchlist();
  const [displayedAuctions, setDisplayedAuctions] = useState<Auction[]>([]);
  
  // Convert watchlist items to a list of auction IDs for easier checking
  const watchlistAuctionIds = watchlist.map(item => item.auctionId);

  useEffect(() => {
    if (auctions) {
      // Sort auctions by end time (soonest ending first)
      const sortedAuctions = [...auctions].sort((a, b) => {
        if (a.status === 'ended' && b.status !== 'ended') return 1;
        if (a.status !== 'ended' && b.status === 'ended') return -1;
        
        return new Date(a.endTime).getTime() - new Date(b.endTime).getTime();
      });
      
      setDisplayedAuctions(sortedAuctions.slice(0, limit));
    }
  }, [auctions, limit]);

  const loadMore = () => {
    setLimit(prevLimit => prevLimit + 6);
  };

  const refreshWatchlist = () => {
    // Invalidate watchlist query to trigger a refresh
    queryClient.invalidateQueries({ queryKey: ['/api/watchlist'] });
  };

  if (isLoading) {
    return (
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center p-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-neutral-600">Loading auctions...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center p-8 bg-red-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-red-600 mb-2">
              <AlertCircle size={24} />
              <h2 className="text-xl font-bold">Error Loading Auctions</h2>
            </div>
            <p className="mt-2 text-neutral-600">
              We couldn't load the auction listings. Please try again later or contact support if the problem persists.
            </p>
            <Button 
              variant="outline" 
              className="mt-4 border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => queryClient.invalidateQueries({ queryKey: [categoryId ? `/api/auctions/category/${categoryId}` : '/api/auctions'] })}
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900">{title}</h2>
            {subtitle && <p className="mt-2 text-neutral-600">{subtitle}</p>}
          </div>
          {!categoryId && (
            <div className="mt-4 md:mt-0 flex items-center">
              <span className="text-sm text-neutral-700 mr-2">Sort by:</span>
              <select className="px-3 py-1 rounded-md border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm">
                <option>Ending Soon</option>
                <option>Newly Listed</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
              </select>
            </div>
          )}
        </div>
        
        {displayedAuctions.length === 0 ? (
          <div className="text-center py-12 bg-neutral-50 rounded-lg">
            <p className="text-lg text-neutral-600">No auctions found.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {displayedAuctions.map((auction) => (
                <AuctionCard 
                  key={auction.id} 
                  auction={auction} 
                  isInWatchlist={watchlistAuctionIds.includes(auction.id)}
                  onWatchlistToggle={refreshWatchlist}
                />
              ))}
            </div>
            
            {showLoadMore && auctions.length > limit && (
              <div className="mt-8 flex justify-center">
                <Button 
                  variant="default" 
                  className="bg-orange-500 hover:bg-orange-600"
                  onClick={loadMore}
                >
                  Load More Auctions
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default AuctionGrid;
