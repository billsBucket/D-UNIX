"use client";

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Button } from '@/components/ui/button';
import { TOKENS } from '@/lib/ethereum';

type TimeframeType = '1D' | '1W' | '1M' | '3M' | '1Y';

interface PriceDataPoint {
  timestamp: number;
  price: number;
  formattedTime: string;
}

interface TokenPriceChartProps {
  baseToken: string;
  quoteToken: string;
}

export default function TokenPriceChart({ baseToken, quoteToken }: TokenPriceChartProps) {
  const [timeframe, setTimeframe] = useState<TimeframeType>('1D');
  const [loading, setLoading] = useState(true);
  const [priceData, setPriceData] = useState<PriceDataPoint[]>([]);
  const [percentChange, setPercentChange] = useState<number>(0);

  // Function to generate sample price data
  // In a real app, you would fetch this from an API like CoinGecko or similar
  const generatePriceData = (timeframe: TimeframeType): PriceDataPoint[] => {
    const now = Date.now();
    let dataPoints: PriceDataPoint[] = [];
    let startPrice: number;
    let volatility: number;
    let dataPointCount: number;
    let timeInterval: number;

    // Set parameters based on timeframe
    switch(timeframe) {
      case '1D':
        startPrice = getBasePrice(baseToken, quoteToken) * (0.95 + Math.random() * 0.1);
        volatility = 0.003;
        dataPointCount = 24;
        timeInterval = 60 * 60 * 1000; // 1 hour
        break;
      case '1W':
        startPrice = getBasePrice(baseToken, quoteToken) * (0.9 + Math.random() * 0.2);
        volatility = 0.007;
        dataPointCount = 7;
        timeInterval = 24 * 60 * 60 * 1000; // 1 day
        break;
      case '1M':
        startPrice = getBasePrice(baseToken, quoteToken) * (0.85 + Math.random() * 0.3);
        volatility = 0.01;
        dataPointCount = 30;
        timeInterval = 24 * 60 * 60 * 1000; // 1 day
        break;
      case '3M':
        startPrice = getBasePrice(baseToken, quoteToken) * (0.7 + Math.random() * 0.6);
        volatility = 0.015;
        dataPointCount = 12;
        timeInterval = 7 * 24 * 60 * 60 * 1000; // 1 week
        break;
      case '1Y':
        startPrice = getBasePrice(baseToken, quoteToken) * (0.5 + Math.random() * 1);
        volatility = 0.03;
        dataPointCount = 12;
        timeInterval = 30 * 24 * 60 * 60 * 1000; // 1 month
        break;
      default:
        startPrice = getBasePrice(baseToken, quoteToken);
        volatility = 0.005;
        dataPointCount = 24;
        timeInterval = 60 * 60 * 1000; // 1 hour
    }

    let currentPrice = startPrice;

    for (let i = dataPointCount - 1; i >= 0; i--) {
      const timestamp = now - (i * timeInterval);
      const change = (Math.random() * 2 - 1) * volatility;
      currentPrice = currentPrice * (1 + change);

      // Format time based on timeframe
      let formattedTime: string;
      const date = new Date(timestamp);

      if (timeframe === '1D') {
        formattedTime = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      } else if (timeframe === '1W' || timeframe === '1M') {
        formattedTime = date.toLocaleDateString([], {month: 'short', day: 'numeric'});
      } else {
        formattedTime = date.toLocaleDateString([], {month: 'short', year: '2-digit'});
      }

      dataPoints.push({
        timestamp,
        price: currentPrice,
        formattedTime
      });
    }

    // Calculate percent change
    const firstPrice = dataPoints[0].price;
    const lastPrice = dataPoints[dataPoints.length - 1].price;
    const change = ((lastPrice - firstPrice) / firstPrice) * 100;
    setPercentChange(change);

    return dataPoints;
  };

  // Get base price for token pair
  const getBasePrice = (base: string, quote: string): number => {
    // Simplified price mapping - in a real app, these would come from an API
    const prices: Record<string, number> = {
      'ETH': 3000,
      'WETH': 3000,
      'USDC': 1,
      'USDT': 1,
      'DAI': 1,
      'WBTC': 60000,
      'MATIC': 0.8,
      'LINK': 15,
      'UNI': 6,
      'AAVE': 90,
      'CRV': 0.5
    };

    if (quote === 'USDC' || quote === 'USDT' || quote === 'DAI') {
      return prices[base] || 1;
    } else {
      return (prices[base] || 1) / (prices[quote] || 1);
    }
  };

  useEffect(() => {
    setLoading(true);

    // Simulate API call delay
    const timer = setTimeout(() => {
      const data = generatePriceData(timeframe);
      setPriceData(data);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [timeframe, baseToken, quoteToken]);

  // Get token logos
  const getTokenLogo = (symbol: string) => {
    const tokenInfo = Object.values(TOKENS).find(token => token.symbol === symbol);
    return tokenInfo?.logoUrl || 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png'; // Default to ETH
  };

  // Format price with appropriate decimals
  const formatPrice = (price: number): string => {
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    if (price < 1000) return price.toFixed(2);
    return price.toFixed(2);
  };

  const currentPrice = priceData.length > 0 ? priceData[priceData.length - 1].price : 0;

  return (
    <div className="border border-white/10 bg-black/20 p-3 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="relative flex items-center mr-2">
            <img
              src={getTokenLogo(baseToken)}
              alt={baseToken}
              className="w-6 h-6 rounded-full"
            />
            <img
              src={getTokenLogo(quoteToken)}
              alt={quoteToken}
              className="w-6 h-6 rounded-full -ml-1"
            />
          </div>
          <div>
            <div className="text-sm font-medium">{baseToken}/{quoteToken}</div>
            <div className="flex items-center">
              <span className="text-xs font-mono mr-2">{formatPrice(currentPrice)}</span>
              <span className={`text-xs ${percentChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {percentChange >= 0 ? '+' : ''}{percentChange.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        <div className="flex space-x-1">
          {(['1D', '1W', '1M', '3M', '1Y'] as TimeframeType[]).map((tf) => (
            <Button
              key={tf}
              variant="outline"
              size="sm"
              className={`py-1 px-2 h-7 text-xs border-white/10 ${
                timeframe === tf ? 'bg-white/10' : 'bg-transparent'
              }`}
              onClick={() => setTimeframe(tf)}
            >
              {tf}
            </Button>
          ))}
        </div>
      </div>

      <div className="h-[200px] w-full">
        {loading ? (
          <div className="h-full w-full flex items-center justify-center">
            <div className="animate-spin w-6 h-6 border-2 border-white/10 border-t-white/80 rounded-full"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={priceData}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={percentChange >= 0 ? "#4caf50" : "#f44336"}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor={percentChange >= 0 ? "#4caf50" : "#f44336"}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="formattedTime"
                tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                tickLine={false}
              />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                tickLine={false}
                tickFormatter={(value) => formatPrice(value)}
                width={40}
              />
              <Tooltip
                formatter={(value: number) => [formatPrice(value), 'Price']}
                labelFormatter={(label) => `Time: ${label}`}
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  fontSize: '12px',
                  color: 'white'
                }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke={percentChange >= 0 ? "#4caf50" : "#f44336"}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                fillOpacity={1}
                fill="url(#colorPrice)"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
