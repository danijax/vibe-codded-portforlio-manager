import type { Asset } from '../types';
import { Trash2, Edit2 } from 'lucide-react';

interface AssetListProps {
    assets: Asset[];
    onRemove: (id: string) => void;
    onEdit: (asset: Asset) => void;
}

export function AssetList({ assets, onRemove, onEdit }: AssetListProps) {
    return (
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
            <div className="p-6 border-b border-slate-700">
                <h2 className="text-xl font-semibold">Your Assets</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-750 text-slate-400 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">Asset</th>
                            <th className="px-6 py-4">Price</th>
                            <th className="px-6 py-4">Holdings</th>
                            <th className="px-6 py-4">Value</th>
                            <th className="px-6 py-4">Target %</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {assets.map((asset) => (
                            <tr key={asset.id} className="hover:bg-slate-750/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="font-medium">{asset.name}</div>
                                        <span className="text-slate-500 text-sm">{asset.symbol.toUpperCase()}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-mono">
                                    ${asset.currentPrice?.toLocaleString() || '0.00'}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-mono">{asset.quantity}</div>
                                </td>
                                <td className="px-6 py-4 font-mono font-medium text-emerald-400">
                                    ${(asset.value || 0).toLocaleString()}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500"
                                                style={{ width: `${asset.targetAllocation}%` }}
                                            />
                                        </div>
                                        <span className="text-sm text-slate-400">{asset.targetAllocation}%</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => onEdit(asset)}
                                            className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-blue-400 transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => onRemove(asset.id)}
                                            className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
