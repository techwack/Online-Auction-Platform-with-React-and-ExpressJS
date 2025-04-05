import { useQuery } from "@tanstack/react-query";
import { Auction } from "@shared/schema";

export function useAuctions(categoryId?: number) {
  const endpoint = categoryId 
    ? `/api/auctions/category/${categoryId}` 
    : "/api/auctions";

  const { data, isLoading, isError } = useQuery<Auction[]>({
    queryKey: [endpoint],
    refetchInterval: 30000, // Refetch every 30 seconds to check for updates
  });

  return {
    auctions: data || [],
    isLoading,
    isError,
  };
}

export function useFeaturedAuctions() {
  const { data, isLoading, isError } = useQuery<Auction[]>({
    queryKey: ["/api/auctions/featured"],
  });

  return {
    featuredAuctions: data || [],
    isLoading,
    isError,
  };
}

export function useAuction(id: number | string) {
  const { data, isLoading, isError } = useQuery<Auction>({
    queryKey: [`/api/auctions/${id}`],
    enabled: !!id,
  });

  return {
    auction: data,
    isLoading,
    isError,
  };
}

export function useAuctionBids(auctionId: number | string) {
  const { data, isLoading, isError } = useQuery<any[]>({
    queryKey: [`/api/auctions/${auctionId}/bids`],
    enabled: !!auctionId,
  });

  return {
    bids: data || [],
    isLoading,
    isError,
  };
}

export function useWatchlist() {
  const { data, isLoading, isError } = useQuery<any[]>({
    queryKey: ["/api/watchlist"],
  });

  return {
    watchlist: data || [],
    isLoading,
    isError,
  };
}
