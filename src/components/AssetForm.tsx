import { useState, useEffect, useRef } from 'react';
import type { Asset } from '../types';
import { X, Search, Loader2 } from 'lucide-react';
import { searchCoins, type SearchResult } from '../services/priceService';

interface AssetFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (asset: Asset) => void;
    initialData?: Asset | null;
}

export function AssetForm({ isOpen, onClose, onSubmit, initialData }: AssetFormProps) {
    const [formData, setFormData] = useState<Partial<Asset>>({
        symbol: '',
        name: '',
        quantity: 0,
        targetAllocation: 0,
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedCoinId, setSelectedCoinId] = useState<string | null>(null);
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
            setSearchQuery(initialData.name);
            setSelectedCoinId(initialData.id);
        } else {
            setFormData({
                symbol: '',
                name: '',
                quantity: 0,
                targetAllocation: 0,
            });
            setSearchQuery('');
            setSelectedCoinId(null);
        }
        setSearchResults([]);
        setShowDropdown(false);
    }, [initialData, isOpen]);

    useEffect(() => {
        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        if (!searchQuery || searchQuery.length < 2 || selectedCoinId) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }

        setIsSearching(true);
        setShowDropdown(true);

        searchTimeout.current = setTimeout(async () => {
            const results = await searchCoins(searchQuery);
            setSearchResults(results);
            setIsSearching(false);
        }, 500);

        return () => {
            if (searchTimeout.current) clearTimeout(searchTimeout.current);
        };
    }, [searchQuery, selectedCoinId]);

    if (!isOpen) return null;

    const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setFormData(prev => ({ ...prev, name: e.target.value }));
        setSelectedCoinId(null); // Reset selected ID if user types
    };

    const selectCoin = (coin: SearchResult) => {
        setFormData(prev => ({
            ...prev,
            name: coin.name,
            symbol: coin.symbol.toUpperCase()
        }));
        setSearchQuery(coin.name);
        setSelectedCoinId(coin.id);
        setShowDropdown(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            id: selectedCoinId || initialData?.id || crypto.randomUUID(),
            symbol: formData.symbol || '',
            name: formData.name || '',
            quantity: Number(formData.quantity) || 0,
            targetAllocation: Number(formData.targetAllocation) || 0,
            currentPrice: initialData?.currentPrice || 0,
            value: initialData?.value || 0,
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-2xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">
                        {initialData ? 'Edit Asset' : 'Add New Asset'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <label className="block text-sm font-medium text-slate-400 mb-1">
                            Asset Name
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                required
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                placeholder="Search coin (e.g. Bitcoin)"
                                value={searchQuery}
                                onChange={handleSearchInput}
                                onFocus={() => {
                                    if (searchQuery.length >= 2 && !selectedCoinId) setShowDropdown(true);
                                }}
                            />
                            <div className="absolute left-3 top-2.5 text-slate-500">
                                {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                            </div>
                        </div>

                        {showDropdown && searchResults.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                {searchResults.map(coin => (
                                    <button
                                        key={coin.id}
                                        type="button"
                                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-700 transition-colors text-left"
                                        onClick={() => selectCoin(coin)}
                                    >
                                        <img src={coin.thumb} alt={coin.name} className="w-6 h-6 rounded-full" />
                                        <div>
                                            <div className="font-medium text-white">{coin.name}</div>
                                            <div className="text-xs text-slate-400">{coin.symbol}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">
                            Symbol
                        </label>
                        <input
                            type="text"
                            required
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase"
                            placeholder="e.g. BTC"
                            value={formData.symbol}
                            onChange={e => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">
                                Quantity
                            </label>
                            <input
                                type="number"
                                step="any"
                                required
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                value={formData.quantity}
                                onChange={e => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">
                                Target Allocation (%)
                            </label>
                            <input
                                type="number"
                                step="any"
                                required
                                min="0"
                                max="100"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                value={formData.targetAllocation}
                                onChange={e => setFormData({ ...formData, targetAllocation: parseFloat(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 rounded-lg transition-colors"
                        >
                            {initialData ? 'Update Asset' : 'Add Asset'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
