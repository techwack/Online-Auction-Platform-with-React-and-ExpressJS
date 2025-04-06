import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { insertAuctionSchema } from "server/schema";

// Extend the schema with more validation rules
const formSchema = insertAuctionSchema.extend({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  startingPrice: z.number().min(1, "Starting price must be at least $1"),
  imageUrl: z.string().url("Please enter a valid URL"),
  categoryId: z.number(),
  // Convert string dates to Date objects
  startTime: z.string().transform(str => new Date(str)),
  endTime: z.string().transform(str => new Date(str)),
});

type FormValues = z.infer<typeof formSchema>;

const AuctionForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [_, navigate] = useNavigate();
  const [categories, setCategories] = useState([
    { id: 1, name: "Collectibles" },
    { id: 2, name: "Electronics" },
    { id: 3, name: "Vintage & Antiques" },
    { id: 4, name: "Art & Decor" }
  ]);

  // Get current date for min date in form
  const today = new Date();
  const minDate = today.toISOString().split('T')[0];
  
  // Set default end time to 7 days from now
  const defaultEndDate = new Date();
  defaultEndDate.setDate(today.getDate() + 7);
  const defaultEndDateString = defaultEndDate.toISOString().split('T')[0];

  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
      startingPrice: 10,
      currentPrice: 10, // Same as starting price initially
      categoryId: 1,
      sellerId: user?.id || 0,
      startTime: today.toISOString(),
      endTime: defaultEndDate.toISOString(),
      status: "active",
      featured: false
    }
  });

  const onSubmit = async (data: FormValues) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to create an auction",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Set current price same as starting price
      data.currentPrice = data.startingPrice;
      
      // Create auction
      await apiRequest("POST", "/api/auctions", data);
      
      // Show success message
      toast({
        title: "Auction created",
        description: "Your auction has been successfully created",
      });
      
      // Invalidate auctions queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/auctions'] });
      
      // Redirect to auctions page
      navigate("/auctions");
    } catch (error: any) {
      toast({
        title: "Error creating auction",
        description: error.message || "There was an error creating your auction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Auction</CardTitle>
        <CardDescription>
          Fill out the form below to list your item for auction.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Vintage Camera Collection" {...field} />
                  </FormControl>
                  <FormDescription>
                    A clear, descriptive title for your item.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your item in detail, including condition, history, and any relevant details."
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Be detailed about condition and features.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="startingPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Starting Price ($)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/your-item-image.jpg" {...field} />
                  </FormControl>
                  <FormDescription>
                    Provide a URL to an image of your item.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        min={minDate}
                        {...field}
                        value={field.value.toString().split('T')[0]} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date"
                        min={minDate}
                        {...field}
                        value={field.value.toString().split('T')[0]}
                      />
                    </FormControl>
                    <FormDescription>
                      Auction will run until midnight on this date.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="pt-4">
              <Button type="submit" className="w-full md:w-auto" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Auction...
                  </>
                ) : (
                  "Create Auction"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default AuctionForm;
