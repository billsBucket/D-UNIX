import AppSkeleton from "@/components/app-skeleton";
import Navbar from "@/components/navbar";
import SwapInterface from "@/components/swap-interface";
import PriceAlertForm from '@/components/price-alert-form';
import TokenPriceChart from '@/components/token-price-chart';

export default function Home() {
  return (
    <AppSkeleton>
      <main className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="container mx-auto px-3 md:px-4 pt-16 md:pt-20 pb-8">
          <h1 className="text-2xl md:text-3xl font-mono uppercase tracking-widest mb-4 md:mb-8">D-UNIX</h1>
          <div className="text-xs mb-4 opacity-70">[ SYSTEM/MULTI-CHAIN DEX PROTOCOL ]</div>

          <div className="mx-auto flex flex-col lg:flex-row gap-4">
            {/* Left side - Swap Interface */}
            <div className="lg:w-[40%] order-2 lg:order-1">
              <SwapInterface />
            </div>

            {/* Right side - Chart and Price Alerts */}
            <div className="flex-grow lg:w-[60%] space-y-4 order-1 lg:order-2">
              <TokenPriceChart baseToken="ETH" quoteToken="USDC" />
              <PriceAlertForm />
            </div>
          </div>
        </div>

        <footer className="border-t border-white/10 p-3 md:p-4 mt-6 md:mt-12">
          <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
            <div className="text-white/50 text-xs">SYS::READY</div>
            <div className="text-white/50 text-xs flex items-center">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
              CHAIN: ETHEREUM
            </div>
          </div>
        </footer>
      </main>
    </AppSkeleton>
  );
}
