import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AuctionForm from "@/components/auctions/AuctionForm";

const CreateAuctionPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 py-12 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">Create New Auction</h1>
            <p className="text-neutral-600">List your item for auction and start receiving bids.</p>
          </div>
          
          <AuctionForm />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CreateAuctionPage;
