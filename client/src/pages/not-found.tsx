import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4 shadow-lg border-t-4 border-t-primary">
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">404</h1>
            <h2 className="text-xl font-medium text-foreground mt-1">Page Not Found</h2>
          </div>

          <p className="mt-4 text-muted-foreground text-center">
            The page you are looking for doesn't exist or has been moved.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center gap-4 pt-2 pb-6">
          <Button variant="outline" size="sm" asChild>
            <Link href="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <Button variant="default" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
