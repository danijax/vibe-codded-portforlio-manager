
import type { Asset } from '../types';
import type { HistoricalPrice } from '../services/priceService';

export interface BacktestResult {
    date: number;
    rebalancedValue: number;
    hodlValue: number;
}

export const calculateBacktest = (
    assets: Asset[],
    historyData: Record<string, HistoricalPrice[]>,
    initialInvestment: number = 10000,
    rebalanceIntervalDays: number = 30
): BacktestResult[] => {
    if (assets.length === 0 || Object.keys(historyData).length === 0) return [];

    // 1. Find common start date (the latest "first available data" among all assets)
    let startDate = 0;

    // Filter out assets that don't have history data
    const validAssets = assets.filter(a => historyData[a.id] && historyData[a.id].length > 0);
    if (validAssets.length === 0) return [];

    validAssets.forEach(asset => {
        const assetHistory = historyData[asset.id];
        const assetStart = assetHistory[0].timestamp;
        if (assetStart > startDate) {
            startDate = assetStart;
        }
    });

    // 2. Align all histories to this start date and create a time map
    const timeMap: Record<number, Record<string, number>> = {}; // timestamp -> { assetId: price }
    const timestamps: number[] = [];

    // We use the first asset's history as the master timeline for simplicity, 
    // assuming daily interval consistency from CoinGecko
    const masterHistory = historyData[validAssets[0].id]
        .filter(h => h.timestamp >= startDate);

    masterHistory.forEach(point => {
        // Round to nearest day to fuzzy match other assets if timestamps slightly differ
        // CoinGecko usually gives consistent midnight UTC timestamps for daily data, but let's be safe
        timeMap[point.timestamp] = {};
        timestamps.push(point.timestamp);
    });

    // Fill the price map
    validAssets.forEach(asset => {
        historyData[asset.id].forEach(point => {
            if (point.timestamp >= startDate) {
                // Find nearest timestamp in our master list to avoid "missing data" gaps
                // Simple approach: exact match first
                if (timeMap[point.timestamp]) {
                    timeMap[point.timestamp][asset.id] = point.price;
                }
            }
        });
    });

    // 3. Initialize Strategies
    // Strategy A: Rebalanced
    // We allocate initialInvestment according to target weights
    const rebalancedDetails = validAssets.map(asset => {
        // Assuming targets sum to 100 inside the subset or normalized? 
        // Better: Validate targets sum to 100. If <100, we assume cash? Let's normalize targets for the backtest subset.
        // If users have 50% BTC, 50% ETH, and we backtest only those, it works.
        // If they have 50% BTC, 20% ETH (total 70%), we normalize to 100% for the backtest.
        return {
            id: asset.id,
            shares: 0,
            targetWeight: asset.targetAllocation
        };
    });

    const totalTargetWeight = rebalancedDetails.reduce((sum, item) => sum + item.targetWeight, 0);

    // Initial purchase for Rebalanced
    const startPrices = timeMap[timestamps[0]];
    rebalancedDetails.forEach(item => {
        const normalizedWeight = item.targetWeight / totalTargetWeight;
        const allocation = initialInvestment * normalizedWeight;
        const price = startPrices[item.id] || 0;
        if (price > 0) {
            item.shares = allocation / price;
        }
    });

    // Strategy B: HODL
    // Buy once at the start with the SAME allocation as Rebalanced, but never touch it again.
    const hodlDetails = rebalancedDetails.map(item => ({ ...item })); // Copy initial state

    const results: BacktestResult[] = [];
    let lastRebalanceTime = timestamps[0];

    // 4. Run Simulation
    for (let i = 0; i < timestamps.length; i++) {
        const time = timestamps[i];
        const prices = timeMap[time];

        // Skip if we have partial data for this day
        if (!prices || Object.keys(prices).length < validAssets.length) continue;

        // --- Calculate Current Values ---

        // HODL Value
        let currentHodlValue = 0;
        hodlDetails.forEach(item => {
            currentHodlValue += item.shares * prices[item.id];
        });

        // Rebalanced Value (before rebalancing action)
        let currentRebalancedValue = 0;
        rebalancedDetails.forEach(item => {
            currentRebalancedValue += item.shares * prices[item.id];
        });

        // --- Check Rebalance Trigger ---
        const daysSinceRebalance = (time - lastRebalanceTime) / (1000 * 60 * 60 * 24);

        if (daysSinceRebalance >= rebalanceIntervalDays) {
            // EXECUTE REBALANCE
            // Reset shares based on current total value and target weights
            rebalancedDetails.forEach(item => {
                const normalizedWeight = item.targetWeight / totalTargetWeight;
                const targetValue = currentRebalancedValue * normalizedWeight;
                const price = prices[item.id];
                if (price > 0) {
                    item.shares = targetValue / price;
                }
            });
            lastRebalanceTime = time;
        }

        results.push({
            date: time,
            rebalancedValue: currentRebalancedValue,
            hodlValue: currentHodlValue
        });
    }

    return results;
};
