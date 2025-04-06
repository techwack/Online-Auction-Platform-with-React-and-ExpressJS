import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart } from "lucide-react";
import { Auction } from "server/schema";
import CountdownTimer from "./CountdownTimer";
import BidModal from "./BidModal";
import { formatCurrency } from "@/utils/formatters";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

type AuctionCardProps = {
  auction: Auction;
  onWatchlistToggle?: () => void;
  isInWatchlist?: boolean;
};

const AuctionCard = ({ auction, onWatchlistToggle, isInWatchlist = false }: AuctionCardProps) => {
  const [showBidModal, setShowBidModal] = useState(false);
  const [isWatchlisted, setIsWatchlisted] = useState(isInWatchlist);
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Update local state when prop changes
  useEffect(() => {
    setIsWatchlisted(isInWatchlist);
  }, [isInWatchlist]);

  // Add to watchlist mutation
  const addToWatchlistMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/watchlist", { auctionId: auction.id });
    },
    onSuccess: () => {
      setIsWatchlisted(true);
      if (onWatchlistToggle) onWatchlistToggle();
      queryClient.invalidateQueries({ queryKey: ['/api/watchlist'] });
      toast({
        title: "Added to watchlist",
        description: "The item has been added to your watchlist",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "There was an error updating your watchlist",
        variant: "destructive",
      });
    }
  });

  // Remove from watchlist mutation
  const removeFromWatchlistMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/watchlist/${auction.id}`);
    },
    onSuccess: () => {
      setIsWatchlisted(false);
      if (onWatchlistToggle) onWatchlistToggle();
      queryClient.invalidateQueries({ queryKey: ['/api/watchlist'] });
      toast({
        title: "Removed from watchlist",
        description: "The item has been removed from your watchlist",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "There was an error updating your watchlist",
        variant: "destructive",
      });
    }
  });

  const toggleWatchlist = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to add items to your watchlist",
        variant: "destructive",
      });
      return;
    }

    if (isWatchlisted) {
      removeFromWatchlistMutation.mutate();
    } else {
      addToWatchlistMutation.mutate();
    }
  };

  const getStatusBadge = () => {
    const now = new Date();
    const endTime = new Date(auction.endTime);
    
    // Less than 3 hours left
    if (auction.status === 'active' && endTime.getTime() - now.getTime() < 3 * 60 * 60 * 1000) {
      return <Badge variant="ending" className="absolute top-3 right-3">Ending Soon</Badge>;
    }
    
    switch (auction.status) {
      case 'active':
        return <Badge variant="active" className="absolute top-3 right-3">Active</Badge>;
      case 'ended':
        return <Badge variant="ended" className="absolute top-3 right-3">Ended</Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="absolute top-3 right-3">Cancelled</Badge>;
      default:
        return <Badge variant="secondary" className="absolute top-3 right-3">{auction.status}</Badge>;
    }
  };
  
  return (
    <>
      <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
        <div className="relative">
          <img 
            src={auction.imageUrl} 
            alt={auction.title} 
            className="w-full object-cover aspect-[4/3]"
          />
          {getStatusBadge()}
        </div>
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <Link href={`/auction/${auction.id}`}>
              <span className="font-semibold text-lg text-neutral-900 hover:underline cursor-pointer">
                {auction.title}
              </span>
            </Link>
            <button 
              className={`text-neutral-400 hover:text-neutral-700 ${isWatchlisted ? 'text-primary-500 hover:text-primary-700' : ''}`}
              onClick={toggleWatchlist}
            >
              <Heart className={`h-5 w-5 ${isWatchlisted ? 'fill-current' : ''}`} />
            </button>
          </div>
          <p className="text-neutral-600 text-sm mb-3 line-clamp-2">{auction.description}</p>
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="text-xs text-neutral-500">
                {auction.status === 'ended' ? 'Sold For' : 'Current Bid'}
              </p>
              <p className="text-xl font-bold text-neutral-900">
                {formatCurrency(Number(auction.currentPrice))}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-neutral-500">
                {auction.status === 'ended' ? 'Status' : 'Time Left'}
              </p>
              {auction.status === 'active' ? (
                <CountdownTimer endTime={auction.endTime} />
              ) : (
                <p className="text-neutral-700 font-medium text-sm">Auction Ended</p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {auction.status === 'active' ? (
              <>
                <Button onClick={() => setShowBidModal(true)}>Place Bid</Button>
                <Link href={`/auction/${auction.id}`}>
                  <Button variant="secondary" className="text-sm w-full">View Details</Button>
                </Link>
              </>
            ) : (
              <>
                <Button variant="secondary" disabled={true} className="text-sm">
                  Auction Ended
                </Button>
                <Link href={`/auction/${auction.id}`}>
                  <Button variant="secondary" className="text-sm w-full">View Details</Button>
                </Link>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {showBidModal && (
        <BidModal 
          auction={auction} 
          onClose={() => setShowBidModal(false)} 
        />
      )}
    </>
  );
};

export default AuctionCard;
