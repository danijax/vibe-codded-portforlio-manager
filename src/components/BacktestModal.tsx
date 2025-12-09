
import { useState, useEffect } from 'react';
import { X, Play, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { fetchHistoricalPrices } from '../services/priceService';
import { calculateBacktest, type BacktestResult } from '../utils/backtest';
import type { Asset } from '../types';

interface BacktestModalProps {
    isOpen: boolean;
    onClose: () => void;
    assets: Asset[];
}

export function BacktestModal({ isOpen, onClose, assets }: BacktestModalProps) {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<BacktestResult[]>([]);
    const [timeframe, setTimeframe] = useState<number>(365);
    const [error, setError] = useState<string | null>(null);

    const runBacktest = async () => {
        setLoading(true);
        setError(null);
        setResults([]);

        try {
            // Fetch history for all assets
            // Rate limit mitigation: Sequential requests with small delay
            const historyData: Record<string, any[]> = {};

            for (const asset of assets) {
                // Check if we already have it? (Optimisation for later)
                const data = await fetchHistoricalPrices(asset.id, timeframe);
                if (data.length === 0) {
                    throw new Error(`Could not fetch data for ${asset.name}`);
                }
                historyData[asset.id] = data;

                // Small delay to be nice to public API
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            const calculation = calculateBacktest(assets, historyData, 10000, 30);
            setResults(calculation);

        } catch (err) {
            console.error(err);
            setError("Failed to run backtest. Data might be unavailable or API limits reached.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && assets.length > 0) {
            runBacktest();
        }
    }, [isOpen, timeframe]); // Auto-run when timeframe changes or modal opens

    if (!isOpen) return null;

    const initialValue = 10000;
    const finalRebalanced = results.length > 0 ? results[results.length - 1].rebalancedValue : initialValue;
    const finalHodl = results.length > 0 ? results[results.length - 1].hodlValue : initialValue;

    const returnRebalanced = ((finalRebalanced - initialValue) / initialValue) * 100;
    const returnHodl = ((finalHodl - initialValue) / initialValue) * 100;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700">
                    <div>
                        <h2 className="text-xl font-bold text-white">Strategy Backtest</h2>
                        <p className="text-slate-400 text-sm">Comparison: Monthly Rebalancing vs. Buy & Hold</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Controls */}
                <div className="p-6 border-b border-slate-700 flex flex-wrap gap-4 items-center bg-slate-900/50">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-400">Timeframe:</span>
                        <select
                            value={timeframe}
                            onChange={(e) => setTimeframe(Number(e.target.value))}
                            className="bg-slate-800 border border-slate-700 text-white rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            disabled={loading}
                        >
                            <option value={90}>Last 90 Days</option>
                            <option value={180}>Last 6 Months</option>
                            <option value={365}>Last 1 Year</option>
                        </select>
                    </div>

                    <button
                        onClick={runBacktest}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                    >
                        <Play className="w-4 h-4 fill-current" />
                        {loading ? 'Simulating...' : 'Rerun Simulation'}
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 overflow-y-auto">
                    {error ? (
                        <div className="flex flex-col items-center justify-center py-12 text-red-400">
                            <AlertTriangle className="w-12 h-12 mb-4" />
                            <p>{error}</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg bg-slate-700/30 border border-slate-700">
                                    <div className="text-sm text-slate-400 mb-1">Rebalanced Portfolio</div>
                                    <div className={`text-2xl font-bold ${returnRebalanced >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {returnRebalanced >= 0 ? '+' : ''}{returnRebalanced.toFixed(2)}%
                                    </div>
                                    <div className="text-sm text-slate-500 mt-1">
                                        End Value: ${finalRebalanced.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </div>
                                </div>
                                <div className="p-4 rounded-lg bg-slate-700/30 border border-slate-700">
                                    <div className="text-sm text-slate-400 mb-1">Buy & Hold (No Action)</div>
                                    <div className={`text-2xl font-bold ${returnHodl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {returnHodl >= 0 ? '+' : ''}{returnHodl.toFixed(2)}%
                                    </div>
                                    <div className="text-sm text-slate-500 mt-1">
                                        End Value: ${finalHodl.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </div>
                                </div>
                            </div>

                            {/* Chart */}
                            <div className="h-[400px] w-full bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={results}>
                                        <defs>
                                            <linearGradient id="colorRebalanced" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorHodl" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={(tick) => new Date(tick).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            stroke="#94a3b8"
                                        />
                                        <YAxis stroke="#94a3b8" />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                                            labelFormatter={(label) => new Date(label).toLocaleDateString()}
                                            formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                                        />
                                        <Legend />
                                        <Area
                                            type="monotone"
                                            dataKey="rebalancedValue"
                                            name="Rebalanced"
                                            stroke="#3b82f6"
                                            fillOpacity={1}
                                            fill="url(#colorRebalanced)"
                                            strokeWidth={2}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="hodlValue"
                                            name="Buy & Hold"
                                            stroke="#94a3b8"
                                            fillOpacity={1}
                                            fill="url(#colorHodl)"
                                            strokeWidth={2}
                                            strokeDasharray="5 5"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
