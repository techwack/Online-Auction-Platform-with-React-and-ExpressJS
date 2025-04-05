import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/auctions/HeroSection";
import FeaturedAuctions from "@/components/auctions/FeaturedAuctions";
import Categories from "@/components/auctions/Categories";
import AuctionGrid from "@/components/auctions/AuctionGrid";
import HowItWorks from "@/components/auctions/HowItWorks";
import Newsletter from "@/components/auctions/Newsletter";

const HomePage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <FeaturedAuctions />
        <Categories />
        <AuctionGrid 
          title="Current Auctions" 
          showLoadMore={true}
          initialLimit={6}
        />
        <HowItWorks />
        <Newsletter />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
