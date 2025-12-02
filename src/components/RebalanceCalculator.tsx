import type { Asset } from '../types';
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';

interface RebalanceCalculatorProps {
    assets: Asset[];
    totalValue: number;
}

export function RebalanceCalculator({ assets, totalValue }: RebalanceCalculatorProps) {
    const calculateRebalance = (asset: Asset) => {
        const currentAllocation = (asset.value || 0) / totalValue * 100;
        const targetValue = (totalValue * asset.targetAllocation) / 100;
        const difference = targetValue - (asset.value || 0);
        const action = difference > 0 ? 'Buy' : 'Sell';

        return {
            currentAllocation,
            difference,
            action,
            amount: Math.abs(difference)
        };
    };

    return (
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
            <div className="p-6 border-b border-slate-700">
                <h2 className="text-xl font-semibold">Rebalancing Suggestions</h2>
            </div>
            <div className="p-6">
                <div className="space-y-4">
                    {assets.map(asset => {
                        const { action, amount } = calculateRebalance(asset);
                        if (amount < 1) return null; // Skip small differences

                        return (
                            <div key={asset.id} className="flex items-center justify-between p-4 bg-slate-750/50 rounded-lg border border-slate-700">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-full ${action === 'Buy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {action === 'Buy' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <div className="font-medium text-lg">{asset.name}</div>
                                        <div className="text-slate-400 text-sm">Target: {asset.targetAllocation}%</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className={`font-bold text-lg ${action === 'Buy' ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {action} ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                        </div>
                                        <div className="text-slate-500 text-sm">
                                            {asset.currentPrice ? `≈ ${(amount / asset.currentPrice).toFixed(4)} ${asset.symbol}` : ''}
                                        </div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-slate-600" />
                                </div>
                            </div>
                        );
                    })}
                    {assets.every(a => Math.abs(calculateRebalance(a).difference) < 1) && (
                        <div className="text-center text-slate-400 py-8">
                            Your portfolio is perfectly balanced!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
