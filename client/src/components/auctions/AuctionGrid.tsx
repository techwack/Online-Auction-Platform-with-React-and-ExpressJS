import { useState, useEffect } from "react";
import AuctionCard from "./AuctionCard";
import { Button } from "@/components/ui/button";
import { Auction } from "@shared/schema";
import { useAuctions } from "@/hooks/use-auctions";
import { Loader2 } from "lucide-react";

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
  const [limit, setLimit] = useState(initialLimit);
  const { auctions, isLoading, isError } = useAuctions(categoryId);
  const [displayedAuctions, setDisplayedAuctions] = useState<Auction[]>([]);
  const [watchlistItems, setWatchlistItems] = useState<number[]>([]);

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

  // Load user's watchlist if user is logged in
  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        const response = await fetch('/api/watchlist', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setWatchlistItems(data.map((item: any) => item.auctionId));
        }
      } catch (error) {
        console.error('Error fetching watchlist:', error);
      }
    };
    
    fetchWatchlist();
  }, []);

  const loadMore = () => {
    setLimit(prevLimit => prevLimit + 6);
  };

  const refreshWatchlist = async () => {
    try {
      const response = await fetch('/api/watchlist', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setWatchlistItems(data.map((item: any) => item.auctionId));
      }
    } catch (error) {
      console.error('Error refreshing watchlist:', error);
    }
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
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold text-red-500">Error</h2>
            <p className="mt-2 text-neutral-600">Unable to load auctions. Please try again later.</p>
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
                  isInWatchlist={watchlistItems.includes(auction.id)}
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
