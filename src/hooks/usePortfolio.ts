import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { Asset, Portfolio } from '../types';
import { fetchPrices } from '../services/priceService';

const INITIAL_PORTFOLIOS: Portfolio[] = [
    {
        id: 'main',
        name: 'Main Portfolio',
        assets: []
    }
];

export function usePortfolio() {
    const { user } = useAuth();
    const [portfolios, setPortfolios] = useState<Portfolio[]>(INITIAL_PORTFOLIOS);
    const [activePortfolioId, setActivePortfolioId] = useState<string>('main');
    const [loading, setLoading] = useState(true);

    // Subscribe to user's portfolios in Firestore
    useEffect(() => {
        if (!user) {
            setPortfolios(INITIAL_PORTFOLIOS);
            setLoading(false);
            return;
        }

        const userDocRef = doc(db, 'users', user.uid);

        const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                const data = docSnapshot.data();
                if (data.portfolios && data.portfolios.length > 0) {
                    setPortfolios(data.portfolios);
                    // Ensure active portfolio exists
                    setActivePortfolioId(prev => {
                        const exists = data.portfolios.find((p: Portfolio) => p.id === prev);
                        return exists ? prev : data.portfolios[0].id;
                    });
                } else {
                    // Initialize if empty
                    setDoc(userDocRef, { portfolios: INITIAL_PORTFOLIOS }, { merge: true });
                }
            } else {
                // Create user doc if not exists
                setDoc(userDocRef, { portfolios: INITIAL_PORTFOLIOS });
            }
            setLoading(false);
        }, (error) => {
            console.error("Error listening to portfolio updates:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const activePortfolio = portfolios.find(p => p.id === activePortfolioId) || portfolios[0];
    const assets = activePortfolio.assets;

    const savePortfolios = async (newPortfolios: Portfolio[]) => {
        if (!user) return;
        try {
            await setDoc(doc(db, 'users', user.uid), {
                portfolios: newPortfolios
            }, { merge: true });
        } catch (error) {
            console.error('Error saving portfolios:', error);
        }
    };

    const updatePrices = useCallback(async () => {
        const ids = assets.map(a => a.id);
        if (ids.length === 0) return;

        const prices = await fetchPrices(ids);

        setPortfolios(prev => prev.map(portfolio => {
            if (portfolio.id === activePortfolioId) {
                return {
                    ...portfolio,
                    assets: portfolio.assets.map(asset => {
                        const price = prices[asset.id]?.usd || asset.currentPrice || 0;
                        return {
                            ...asset,
                            currentPrice: price,
                            value: price * asset.quantity
                        };
                    })
                };
            }
            return portfolio;
        }));
    }, [activePortfolioId, assets]);

    useEffect(() => {
        updatePrices();
        const interval = setInterval(updatePrices, 60000);
        return () => clearInterval(interval);
    }, [updatePrices]);

    const addAsset = (asset: Asset) => {
        const newPortfolios = portfolios.map(p => {
            if (p.id === activePortfolioId) {
                return { ...p, assets: [...p.assets, asset] };
            }
            return p;
        });
        // Optimistic update
        setPortfolios(newPortfolios);
        savePortfolios(newPortfolios);
    };

    const updateAsset = (id: string, updates: Partial<Asset>) => {
        const newPortfolios = portfolios.map(p => {
            if (p.id === activePortfolioId) {
                const updatedAssets = p.assets.map(a => {
                    if (a.id === id) {
                        const updated = { ...a, ...updates };
                        if (updates.quantity !== undefined || updates.currentPrice !== undefined) {
                            updated.value = (updated.currentPrice || 0) * updated.quantity;
                        }
                        return updated;
                    }
                    return a;
                });
                return { ...p, assets: updatedAssets };
            }
            return p;
        });
        setPortfolios(newPortfolios);
        savePortfolios(newPortfolios);
    };

    const removeAsset = (id: string) => {
        const newPortfolios = portfolios.map(p => {
            if (p.id === activePortfolioId) {
                return { ...p, assets: p.assets.filter(a => a.id !== id) };
            }
            return p;
        });
        setPortfolios(newPortfolios);
        savePortfolios(newPortfolios);
    };

    const createPortfolio = (name: string) => {
        const newPortfolio: Portfolio = {
            id: crypto.randomUUID(),
            name,
            assets: []
        };
        const newPortfolios = [...portfolios, newPortfolio];
        setPortfolios(newPortfolios);
        setActivePortfolioId(newPortfolio.id);
        savePortfolios(newPortfolios);
    };

    const deletePortfolio = (id: string) => {
        if (portfolios.length <= 1) return;

        const newPortfolios = portfolios.filter(p => p.id !== id);
        setPortfolios(newPortfolios);

        if (activePortfolioId === id) {
            setActivePortfolioId(newPortfolios[0].id);
        }
        savePortfolios(newPortfolios);
    };

    const refreshPrices = () => {
        updatePrices();
    };

    return {
        assets,
        portfolios,
        activePortfolioId,
        setActivePortfolioId,
        createPortfolio,
        deletePortfolio,
        addAsset,
        updateAsset,
        removeAsset,
        refreshPrices,
        loading
    };
}
