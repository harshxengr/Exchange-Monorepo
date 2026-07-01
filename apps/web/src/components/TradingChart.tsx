'use client';

import { useEffect, useMemo, useRef } from 'react';
import { createChart, ColorType, CandlestickSeries, UTCTimestamp } from 'lightweight-charts';
import { LiveTrade } from '@/hooks/useOrderbook';

interface TradingChartProps {
  trades: LiveTrade[];
}

interface Candle {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
}

function buildCandlesFromTrades(trades: LiveTrade[]) {
  const candles = new Map<number, Candle>();
  const sortedTrades = trades
    .filter((trade) => Number.isFinite(trade.price) && Number.isFinite(trade.timestamp))
    .sort((a, b) => a.timestamp - b.timestamp);

  for (const trade of sortedTrades) {
    const price = Number(trade.price);
    const bucketTime = Math.floor(trade.timestamp / 60000) * 60;
    const existing = candles.get(bucketTime);

    if (!existing) {
      candles.set(bucketTime, {
        time: bucketTime as UTCTimestamp,
        open: price,
        high: price,
        low: price,
        close: price,
      });
      continue;
    }

    existing.high = Math.max(existing.high, price);
    existing.low = Math.min(existing.low, price);
    existing.close = price;
  }

  return Array.from(candles.values()).sort((a, b) => Number(a.time) - Number(b.time));
}

export function TradingChart({ trades }: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
  const seriesRef = useRef<ReturnType<ReturnType<typeof createChart>['addSeries']> | null>(null);
  const candles = useMemo(() => buildCandlesFromTrades(trades), [trades]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#111722' },
        textColor: '#707a8a',
      },
      grid: {
        vertLines: { color: '#1e2430' },
        horzLines: { color: '#1e2430' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: { 
        borderColor: '#1e2430',
        timeVisible: true,
        secondsVisible: true,
      },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#0ecb81',
      downColor: '#f6465d',
      borderVisible: false,
      wickUpColor: '#0ecb81',
      wickDownColor: '#f6465d',
    });

    seriesRef.current = candlestickSeries;
    chartRef.current = chart;
    candlestickSeries.setData([]);
    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight || 400,
        });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartRef.current = null;
      seriesRef.current = null;
      chart.remove();
    };
  }, []);

  useEffect(() => {
    seriesRef.current?.setData(candles);
    if (candles.length > 0) {
      chartRef.current?.timeScale().fitContent();
    }
  }, [candles]);

  return (
    <div className="relative w-full h-full bg-[#111722] rounded-lg overflow-hidden border border-[#1e2430]">
      <div ref={chartContainerRef} className="w-full h-full" />
      {candles.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-[11px] font-mono text-[#707a8a] pointer-events-none">
          Waiting for executed trades...
        </div>
      )}
    </div>
  );
}
