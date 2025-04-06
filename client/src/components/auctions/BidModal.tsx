import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Auction } from "server/schema";
import { formatCurrency } from "@/utils/formatters";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useWebSocket } from "@/hooks/use-websocket";

type BidModalProps = {
  auction: Auction;
  onClose: () => void;
};

const BidModal = ({ auction, onClose }: BidModalProps) => {
  const [bidAmount, setBidAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [minBid, setMinBid] = useState(Number(auction.currentPrice) + 10);
  const { user } = useAuth();
  const { toast } = useToast();
  const socket = useWebSocket();

  useEffect(() => {
    // Connect to auction websocket room
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'auction_update',
        payload: { auctionId: auction.id }
      }));
    }
  }, [socket, auction.id]);

  const handleQuickBid = (amount: number) => {
    setBidAmount(amount.toString());
  };

  const calculateFee = (amount: number) => {
    return amount * 0.03; // 3% service fee
  };

  const parsedBid = parseFloat(bidAmount) || 0;
  const serviceFee = calculateFee(parsedBid);
  const total = parsedBid + serviceFee;

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to place a bid",
        variant: "destructive",
      });
      return;
    }

    if (parsedBid < minBid) {
      toast({
        title: "Invalid bid",
        description: `Minimum bid amount is ${formatCurrency(minBid)}`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // If websocket is connected, send bid through there
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'bid',
          payload: {
            auctionId: auction.id,
            userId: user.id,
            amount: parsedBid
          }
        }));
        
        toast({
          title: "Bid placed",
          description: `You've successfully placed a bid of ${formatCurrency(parsedBid)}`,
        });
        
        // Close modal after successful bid
        onClose();
      } else {
        // Fallback to REST API if websocket isn't available
        await apiRequest("POST", "/api/bids", {
          auctionId: auction.id,
          amount: parsedBid
        });
        
        // Invalidate auction queries to refetch the data
        queryClient.invalidateQueries({ queryKey: ['/api/auctions'] });
        queryClient.invalidateQueries({ queryKey: [`/api/auctions/${auction.id}`] });
        
        toast({
          title: "Bid placed",
          description: `You've successfully placed a bid of ${formatCurrency(parsedBid)}`,
        });
        
        // Close modal after successful bid
        onClose();
      }
    } catch (error: any) {
      toast({
        title: "Error placing bid",
        description: error.message || "There was an error placing your bid. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Place a Bid</DialogTitle>
          <DialogDescription>
            Enter your bid amount for this auction.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <img 
              src={auction.imageUrl} 
              alt={auction.title} 
              className="w-20 h-20 object-cover rounded-md mr-4"
            />
            <div>
              <h4 className="font-medium">{auction.title}</h4>
              <p className="text-sm text-neutral-500">Current bid: {formatCurrency(Number(auction.currentPrice))}</p>
              <p className="text-sm text-orange-600">
                <span className="mr-1">⏱️</span>
                <span>Time remaining: </span>
                <span>{new Date(auction.endTime).toLocaleString()}</span>
              </p>
            </div>
          </div>
          
          <div className="mb-4">
            <Label htmlFor="bidAmount" className="block text-sm font-medium text-neutral-700 mb-1">
              Your Bid Amount
            </Label>
            <div className="flex items-center">
              <span className="bg-neutral-100 px-3 py-2 rounded-l-md border border-r-0 border-neutral-300">$</span>
              <Input
                id="bidAmount"
                type="number"
                min={minBid}
                step="5"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                className="rounded-l-none"
                placeholder={minBid.toString()}
              />
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Minimum bid: {formatCurrency(minBid)} (current bid + $10.00)
            </p>
          </div>
          
          <div className="flex justify-between gap-2 mb-4">
            <Button
              variant="secondary"
              className="flex-1 text-sm"
              onClick={() => handleQuickBid(minBid)}
            >
              ${minBid}
            </Button>
            <Button
              variant="secondary"
              className="flex-1 text-sm"
              onClick={() => handleQuickBid(minBid + 10)}
            >
              ${minBid + 10}
            </Button>
            <Button
              variant="secondary"
              className="flex-1 text-sm"
              onClick={() => handleQuickBid(minBid + 20)}
            >
              ${minBid + 20}
            </Button>
            <Button
              variant="secondary"
              className="flex-1 text-sm"
              onClick={() => handleQuickBid(minBid + 50)}
            >
              ${minBid + 50}
            </Button>
          </div>
          
          <div className="bg-neutral-50 p-3 rounded-md mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm">Bid amount:</span>
              <span className="text-sm font-medium">{formatCurrency(parsedBid)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-sm">Service fee (3%):</span>
              <span className="text-sm font-medium">{formatCurrency(serviceFee)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-neutral-200">
              <span className="text-sm font-medium">Total:</span>
              <span className="text-sm font-bold">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex flex-col gap-3 sm:flex-row">
          <Button
            className="w-full sm:w-auto"
            onClick={handleSubmit}
            disabled={!parsedBid || parsedBid < minBid || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Place Bid Now"
            )}
          </Button>
          <DialogClose asChild>
            <Button 
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={onClose}
            >
              Cancel
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BidModal;
