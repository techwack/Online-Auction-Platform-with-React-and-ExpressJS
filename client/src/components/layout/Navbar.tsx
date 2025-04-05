import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Bell, Search, Menu } from "lucide-react";

const Navbar = () => {
  const { user, logoutMutation } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/">
              <a className="flex items-center">
                <span className="text-primary-600 text-2xl font-bold">Bid<span className="text-orange-500">Hub</span></span>
              </a>
            </Link>
            {/* Desktop Navigation */}
            <nav className="hidden md:ml-8 md:flex md:space-x-8">
              <Link href="/">
                <a className={`px-3 py-2 text-sm font-medium ${location === "/" ? "text-neutral-900 border-b-2 border-primary-500" : "text-neutral-700 hover:text-neutral-900"}`}>
                  Home
                </a>
              </Link>
              <Link href="/categories">
                <a className={`px-3 py-2 text-sm font-medium ${location === "/categories" ? "text-neutral-900 border-b-2 border-primary-500" : "text-neutral-700 hover:text-neutral-900"}`}>
                  Categories
                </a>
              </Link>
              <Link href="/featured">
                <a className={`px-3 py-2 text-sm font-medium ${location === "/featured" ? "text-neutral-900 border-b-2 border-primary-500" : "text-neutral-700 hover:text-neutral-900"}`}>
                  Featured
                </a>
              </Link>
              <Link href="/how-it-works">
                <a className={`px-3 py-2 text-sm font-medium ${location === "/how-it-works" ? "text-neutral-900 border-b-2 border-primary-500" : "text-neutral-700 hover:text-neutral-900"}`}>
                  How It Works
                </a>
              </Link>
            </nav>
          </div>

          {user ? (
            <div className="hidden md:flex items-center">
              <div className="relative mr-4">
                <Input type="text" className="pl-10" placeholder="Search auctions..." />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-neutral-400" />
                </div>
              </div>
              <Button variant="secondary" className="mr-4 relative" size="icon">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">2</span>
              </Button>
              <div className="flex items-center">
                <img 
                  className="h-8 w-8 rounded-full" 
                  src={user.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"} 
                  alt="User profile" 
                />
                <span className="ml-2 text-sm font-medium text-neutral-700">
                  {user.username}
                </span>
                <Button variant="ghost" className="ml-2" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/auth">
                <Button variant="secondary">Login</Button>
              </Link>
              <Link href="/auth">
                <Button>Register</Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button className="p-2 rounded-md text-neutral-700" onClick={toggleMenu}>
              <Search className="h-5 w-5 mr-4" />
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-neutral-200 pb-3">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/">
              <a className={`block px-3 py-2 rounded-md text-base font-medium ${location === "/" ? "bg-primary-50 text-primary-700" : "text-neutral-700 hover:bg-neutral-100"}`}>
                Home
              </a>
            </Link>
            <Link href="/categories">
              <a className={`block px-3 py-2 rounded-md text-base font-medium ${location === "/categories" ? "bg-primary-50 text-primary-700" : "text-neutral-700 hover:bg-neutral-100"}`}>
                Categories
              </a>
            </Link>
            <Link href="/featured">
              <a className={`block px-3 py-2 rounded-md text-base font-medium ${location === "/featured" ? "bg-primary-50 text-primary-700" : "text-neutral-700 hover:bg-neutral-100"}`}>
                Featured
              </a>
            </Link>
            <Link href="/how-it-works">
              <a className={`block px-3 py-2 rounded-md text-base font-medium ${location === "/how-it-works" ? "bg-primary-50 text-primary-700" : "text-neutral-700 hover:bg-neutral-100"}`}>
                How It Works
              </a>
            </Link>
          </div>
          {user ? (
            <div className="pt-4 pb-3 border-t border-neutral-200">
              <div className="flex items-center px-5">
                <div className="flex-shrink-0">
                  <img 
                    className="h-10 w-10 rounded-full" 
                    src={user.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"} 
                    alt="User profile" 
                  />
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-neutral-800">{user.fullName || user.username}</div>
                  <div className="text-sm font-medium text-neutral-500">{user.email}</div>
                </div>
              </div>
              <div className="mt-3 px-2 space-y-1">
                <Link href="/profile">
                  <a className="block px-3 py-2 rounded-md text-base font-medium text-neutral-700 hover:bg-neutral-100">
                    Your Profile
                  </a>
                </Link>
                <Link href="/watchlist">
                  <a className="block px-3 py-2 rounded-md text-base font-medium text-neutral-700 hover:bg-neutral-100">
                    Watchlist
                  </a>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-neutral-700 hover:bg-neutral-100"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-4 pb-3 border-t border-neutral-200 px-5 space-y-2">
              <Link href="/auth">
                <a className="block w-full">
                  <Button className="w-full">Login</Button>
                </a>
              </Link>
              <Link href="/auth">
                <a className="block w-full">
                  <Button variant="outline" className="w-full">Register</Button>
                </a>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
