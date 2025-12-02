export interface Asset {
    id: string;
    symbol: string;
    name: string;
    quantity: number;
    targetAllocation: number; // Percentage (0-100)
    currentPrice?: number;
    value?: number;
}

export interface Portfolio {
    id: string;
    name: string;
    assets: Asset[];
}

export interface PortfolioStats {
    totalValue: number;
    totalTargetAllocation: number;
}
