"use client";

import React from 'react';
import TransactionVolumeChart from './transaction-volume-chart';

export default function ChartTest() {
  return (
    <div className="min-h-screen bg-black text-white p-4">
      <h1 className="text-xl font-mono mb-4">TRANSACTION VOLUME CHART TEST</h1>
      <div className="max-w-6xl mx-auto">
        <TransactionVolumeChart />
      </div>
    </div>
  );
}
