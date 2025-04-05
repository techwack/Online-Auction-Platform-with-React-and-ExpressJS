import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useWatchlist } from "@/hooks/use-auctions";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Heart, Package, History, Settings, User as UserIcon } from "lucide-react";
import AuctionCard from "@/components/auctions/AuctionCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { queryClient } from "@/lib/queryClient";

const ProfilePage = () => {
  const { user, logoutMutation } = useAuth();
  const { watchlist, isLoading: watchlistLoading } = useWatchlist();
  const [userAuctions, setUserAuctions] = useState<any[]>([]);
  const [isLoadingAuctions, setIsLoadingAuctions] = useState(true);

  useEffect(() => {
    const fetchUserAuctions = async () => {
      if (user) {
        try {
          setIsLoadingAuctions(true);
          const response = await fetch(`/api/auctions/seller/${user.id}`, { 
            credentials: 'include' 
          });
          
          if (response.ok) {
            const data = await response.json();
            setUserAuctions(data);
          }
        } catch (error) {
          console.error("Error fetching user auctions:", error);
        } finally {
          setIsLoadingAuctions(false);
        }
      }
    };
    
    fetchUserAuctions();
  }, [user]);

  const refreshWatchlist = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/watchlist'] });
  };

  if (!user) {
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

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 py-12 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">My Profile</h1>
            <p className="text-neutral-600">Manage your account, auctions and watchlist.</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Profile Summary Card */}
            <Card className="lg:col-span-1">
              <CardContent className="p-6">
                <div className="flex flex-col items-center">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage 
                      src={user.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"} 
                      alt={user.username} 
                    />
                    <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-bold text-center">{user.fullName || user.username}</h2>
                  <p className="text-neutral-500 text-sm mb-4">{user.email}</p>
                  <Button variant="outline" className="w-full mb-2">
                    Edit Profile
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="w-full" 
                    onClick={() => logoutMutation.mutate()}
                    disabled={logoutMutation.isPending}
                  >
                    {logoutMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging out...
                      </>
                    ) : (
                      "Logout"
                    )}
                  </Button>
                </div>
                
                <div className="mt-8 space-y-2">
                  <div className="flex justify-between py-2 border-b border-neutral-100">
                    <span className="text-neutral-600">Member since</span>
                    <span className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-neutral-100">
                    <span className="text-neutral-600">My auctions</span>
                    <span className="font-medium">{userAuctions.length}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-neutral-600">Watchlist items</span>
                    <span className="font-medium">{watchlist.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Tabs Section */}
            <div className="lg:col-span-3">
              <Tabs defaultValue="watchlist">
                <TabsList className="grid grid-cols-4 mb-6">
                  <TabsTrigger value="watchlist">
                    <Heart className="h-4 w-4 mr-2" />
                    Watchlist
                  </TabsTrigger>
                  <TabsTrigger value="myauctions">
                    <Package className="h-4 w-4 mr-2" />
                    My Auctions
                  </TabsTrigger>
                  <TabsTrigger value="history">
                    <History className="h-4 w-4 mr-2" />
                    Bid History
                  </TabsTrigger>
                  <TabsTrigger value="settings">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="watchlist">
                  <Card>
                    <CardHeader>
                      <CardTitle>My Watchlist</CardTitle>
                      <CardDescription>Items you're watching</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {watchlistLoading ? (
                        <div className="flex justify-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
                        </div>
                      ) : watchlist.length === 0 ? (
                        <div className="text-center py-12 bg-neutral-50 rounded-lg">
                          <Heart className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                          <h3 className="text-lg font-medium text-neutral-700 mb-1">Your watchlist is empty</h3>
                          <p className="text-neutral-500 mb-4">Add items to your watchlist to track auctions you're interested in.</p>
                          <Button>Browse Auctions</Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {watchlist.map((item: any) => (
                            <AuctionCard 
                              key={item.auction.id} 
                              auction={item.auction} 
                              isInWatchlist={true}
                              onWatchlistToggle={refreshWatchlist}
                            />
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="myauctions">
                  <Card>
                    <CardHeader>
                      <CardTitle>My Auctions</CardTitle>
                      <CardDescription>Items you've listed for auction</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoadingAuctions ? (
                        <div className="flex justify-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
                        </div>
                      ) : userAuctions.length === 0 ? (
                        <div className="text-center py-12 bg-neutral-50 rounded-lg">
                          <Package className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                          <h3 className="text-lg font-medium text-neutral-700 mb-1">You haven't listed any auctions yet</h3>
                          <p className="text-neutral-500 mb-4">Start selling by creating your first auction listing.</p>
                          <Button>Create Auction</Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {userAuctions.map((auction) => (
                            <AuctionCard 
                              key={auction.id} 
                              auction={auction} 
                            />
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="history">
                  <Card>
                    <CardHeader>
                      <CardTitle>Bid History</CardTitle>
                      <CardDescription>Your bidding activity</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12 bg-neutral-50 rounded-lg">
                        <History className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-neutral-700 mb-1">No bid history yet</h3>
                        <p className="text-neutral-500 mb-4">Your bidding activity will appear here.</p>
                        <Button>Browse Auctions</Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="settings">
                  <Card>
                    <CardHeader>
                      <CardTitle>Account Settings</CardTitle>
                      <CardDescription>Manage your account preferences</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form className="space-y-6">
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input id="fullName" defaultValue={user.fullName || ""} />
                          </div>
                          <div>
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" defaultValue={user.email} />
                          </div>
                          <div>
                            <Label htmlFor="username">Username</Label>
                            <Input id="username" defaultValue={user.username} />
                          </div>
                          <div>
                            <Label htmlFor="avatar">Avatar URL</Label>
                            <Input id="avatar" defaultValue={user.avatar || ""} />
                          </div>
                          <div>
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input id="newPassword" type="password" />
                          </div>
                          <div>
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input id="confirmPassword" type="password" />
                          </div>
                        </div>
                        <Button className="w-full sm:w-auto">Save Changes</Button>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProfilePage;
