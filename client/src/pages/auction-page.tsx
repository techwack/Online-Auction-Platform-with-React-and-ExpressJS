import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { Auction, Bid } from "server/schema";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useAuction, useAuctionBids } from "@/hooks/use-auctions";
import { formatCurrency } from "@/utils/formatters";
import { apiRequest } from "@/lib/queryClient";
import BidModal from "@/components/auctions/BidModal";
import CountdownTimer from "@/components/auctions/CountdownTimer";
import { useWebSocket } from "@/hooks/use-websocket";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, HeartOff, Clock, User, BarChart2, Info, Award, Loader2 } from "lucide-react";

const AuctionPage = () => {
  const [_, params] = useRoute<{ id: string }>("/auction/:id");
  const auctionId = params?.id ? parseInt(params.id) : 0;
  const { auction, isLoading } = useAuction(auctionId);
  const { bids, isLoading: bidsLoading } = useAuctionBids(auctionId);
  const { user } = useAuth();
  const { toast } = useToast();
  const socket = useWebSocket();
  const [showBidModal, setShowBidModal] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [realtimeBids, setRealtimeBids] = useState<Bid[]>([]);

  // Check if auction is in user's watchlist
  useEffect(() => {
    if (user && auctionId) {
      const checkWatchlist = async () => {
        try {
          const response = await fetch(`/api/watchlist/check/${auctionId}`, {
            credentials: 'include'
          });
          if (response.ok) {
            const data = await response.json();
            setIsInWatchlist(data.isInWatchlist);
          }
        } catch (error) {
          console.error("Error checking watchlist:", error);
        }
      };
      
      checkWatchlist();
    }
  }, [user, auctionId]);

  // Set up WebSocket for real-time bids
  useEffect(() => {
    if (socket && socket.readyState === WebSocket.OPEN && auction) {
      // Join auction room
      socket.send(JSON.stringify({
        type: 'auction_update',
        payload: { auctionId }
      }));
      
      // Listen for bid updates
      const handleMessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'bid' && data.payload.auctionId === auctionId) {
            // Add new bid to our local state
            setRealtimeBids(prev => [data.payload, ...prev]);
            
            // Show toast notification for new bid
            toast({
              title: "New Bid Placed",
              description: `A new bid of ${formatCurrency(Number(data.payload.amount))} has been placed`,
            });
          }
        } catch (error) {
          console.error("Error handling WebSocket message:", error);
        }
      };
      
      socket.addEventListener('message', handleMessage);
      
      return () => {
        socket.removeEventListener('message', handleMessage);
      };
    }
  }, [socket, auctionId, auction, toast]);

  // Combine API bids with realtime bids
  const allBids = [...realtimeBids, ...(bids || [])].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const toggleWatchlist = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to add items to your watchlist",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isInWatchlist) {
        await apiRequest("DELETE", `/api/watchlist/${auctionId}`);
        setIsInWatchlist(false);
        toast({
          title: "Removed from watchlist",
          description: "The item has been removed from your watchlist",
        });
      } else {
        await apiRequest("POST", "/api/watchlist", { auctionId });
        setIsInWatchlist(true);
        toast({
          title: "Added to watchlist",
          description: "The item has been added to your watchlist",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "There was an error updating your watchlist",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center items-center min-h-[60vh]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">Auction Not Found</h2>
              <p className="text-neutral-600 mb-6">The auction you're looking for doesn't exist or has been removed.</p>
              <Button onClick={() => window.history.back()}>Go Back</Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Determine auction status badge
  const getStatusBadge = () => {
    const now = new Date();
    const endTime = new Date(auction.endTime);
    
    if (auction.status === 'active' && endTime.getTime() - now.getTime() < 3 * 60 * 60 * 1000) {
      return <Badge variant="ending">Ending Soon</Badge>;
    }
    
    switch (auction.status) {
      case 'active':
        return <Badge variant="active">Active</Badge>;
      case 'ended':
        return <Badge variant="ended">Ended</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{auction.status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 py-12 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Button variant="outline" onClick={() => window.history.back()} className="mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </Button>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h1 className="text-3xl font-bold text-neutral-900">{auction.title}</h1>
              <div className="flex items-center gap-2">
                {getStatusBadge()}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={toggleWatchlist}
                  className={isInWatchlist ? "text-primary-600" : ""}
                >
                  {isInWatchlist ? (
                    <>
                      <HeartOff className="h-4 w-4 mr-2" />
                      Remove from Watchlist
                    </>
                  ) : (
                    <>
                      <Heart className="h-4 w-4 mr-2" />
                      Add to Watchlist
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Auction Image and Details */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-0">
                  <div className="relative">
                    <img 
                      src={auction.imageUrl} 
                      alt={auction.title} 
                      className="w-full h-auto rounded-t-lg"
                    />
                  </div>
                  <div className="p-6">
                    <div className="mb-6">
                      <h2 className="text-xl font-semibold mb-4">Description</h2>
                      <p className="text-neutral-600">{auction.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-neutral-100 p-4 rounded-lg text-center">
                        <p className="text-sm text-neutral-500 mb-1">Current Bid</p>
                        <p className="text-lg font-bold text-neutral-900">{formatCurrency(Number(auction.currentPrice))}</p>
                      </div>
                      <div className="bg-neutral-100 p-4 rounded-lg text-center">
                        <p className="text-sm text-neutral-500 mb-1">Bids</p>
                        <p className="text-lg font-bold text-neutral-900">{allBids.length}</p>
                      </div>
                      <div className="bg-neutral-100 p-4 rounded-lg text-center">
                        <p className="text-sm text-neutral-500 mb-1">Time Left</p>
                        <div className="text-lg font-bold text-neutral-900">
                          {auction.status === 'active' ? (
                            <CountdownTimer endTime={auction.endTime} />
                          ) : (
                            <span>Auction Ended</span>
                          )}
                        </div>
                      </div>
                      <div className="bg-neutral-100 p-4 rounded-lg text-center">
                        <p className="text-sm text-neutral-500 mb-1">End Date</p>
                        <p className="text-lg font-bold text-neutral-900">
                          {new Date(auction.endTime).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    {auction.status === 'active' && (
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Button 
                          className="flex-1" 
                          onClick={() => setShowBidModal(true)}
                        >
                          Place Bid
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={toggleWatchlist}
                        >
                          {isInWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Bid History and Seller Info */}
            <div>
              <Tabs defaultValue="bids" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="bids">
                    <BarChart2 className="h-4 w-4 mr-2" />
                    Bids
                  </TabsTrigger>
                  <TabsTrigger value="seller">
                    <User className="h-4 w-4 mr-2" />
                    Seller
                  </TabsTrigger>
                  <TabsTrigger value="info">
                    <Info className="h-4 w-4 mr-2" />
                    Info
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="bids">
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="text-lg font-semibold mb-4">Bid History</h3>
                      {bidsLoading ? (
                        <div className="flex justify-center py-6">
                          <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
                        </div>
                      ) : allBids.length === 0 ? (
                        <div className="text-center py-8 bg-neutral-50 rounded-lg">
                          <Award className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
                          <p className="text-neutral-600">No bids yet. Be the first to bid!</p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto">
                          {allBids.map((bid, index) => (
                            <div 
                              key={bid.id || `realtime-${index}`} 
                              className="bg-neutral-50 p-3 rounded-lg"
                            >
                              <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                  <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center mr-2">
                                    <User className="h-4 w-4 text-primary-600" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">Bidder #{bid.userId}</p>
                                    <p className="text-xs text-neutral-500">
                                      {new Date(bid.createdAt).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                                <p className="font-bold text-neutral-900">
                                  {formatCurrency(Number(bid.amount))}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {auction.status === 'active' && (
                        <div className="mt-4">
                          <Button 
                            className="w-full" 
                            onClick={() => setShowBidModal(true)}
                          >
                            Place Bid
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="seller">
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="text-lg font-semibold mb-4">Seller Information</h3>
                      <div className="flex items-center mb-4">
                        <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                          <User className="h-6 w-6 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium">Seller #{auction.sellerId}</p>
                          <div className="flex items-center text-sm text-neutral-500">
                            <span className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.921-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                              </svg>
                              4.9/5 Rating
                            </span>
                            <span className="mx-2">•</span>
                            <span>Member since {new Date().getFullYear() - 2}</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" className="w-full">
                        Contact Seller
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="info">
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="text-lg font-semibold mb-4">Auction Details</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between pb-2 border-b border-neutral-100">
                          <span className="text-neutral-600">Auction ID</span>
                          <span className="font-medium">{auction.id}</span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-neutral-100">
                          <span className="text-neutral-600">Starting Price</span>
                          <span className="font-medium">{formatCurrency(Number(auction.startingPrice))}</span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-neutral-100">
                          <span className="text-neutral-600">Current Price</span>
                          <span className="font-medium">{formatCurrency(Number(auction.currentPrice))}</span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-neutral-100">
                          <span className="text-neutral-600">Start Date</span>
                          <span className="font-medium">{new Date(auction.startTime).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-neutral-100">
                          <span className="text-neutral-600">End Date</span>
                          <span className="font-medium">{new Date(auction.endTime).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between pb-2 border-b border-neutral-100">
                          <span className="text-neutral-600">Status</span>
                          <span className="font-medium">{auction.status.charAt(0).toUpperCase() + auction.status.slice(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-600">Bid Increment</span>
                          <span className="font-medium">$10.00</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {showBidModal && (
        <BidModal 
          auction={auction} 
          onClose={() => setShowBidModal(false)} 
        />
      )}
    </div>
  );
};

export default AuctionPage;
