'use client';

import { useEffect, useRef } from 'react';
import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts';

export function TradingChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // 1. Initialize core chart context
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#111722' }, // Matching your dark UI mock
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
        secondsVisible: false,
      },
    });

    // 2. Fix the error: Use the new V5 addSeries factory system
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#0ecb81',     // Exchange green
      downColor: '#f6465d',   // Exchange red
      borderVisible: false,
      wickUpColor: '#0ecb81',
      wickDownColor: '#f6465d',
    });

    // 3. Set data
    const mockData = [
      { time: '2026-06-11', open: 132.50, high: 135.20, low: 131.00, close: 134.10 },
      { time: '2026-06-12', open: 134.10, high: 136.80, low: 133.00, close: 136.60 },
      { time: '2026-06-13', open: 136.60, high: 137.40, low: 132.50, close: 133.10 },
      { time: '2026-06-14', open: 133.10, high: 135.90, low: 131.20, close: 134.70 },
      { time: '2026-06-15', open: 134.70, high: 136.00, low: 132.10, close: 133.90 },
      { time: '2026-06-16', open: 133.90, high: 135.50, low: 132.80, close: 134.64 },
    ];
    candlestickSeries.setData(mockData);

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  return (
    <div className="w-full h-full bg-[#111722] rounded-lg overflow-hidden border border-[#1e2430]">
      <div ref={chartContainerRef} className="w-full" />
    </div>
  );
}