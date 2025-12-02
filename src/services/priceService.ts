import axios from 'axios';

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

export interface PriceData {
    [key: string]: {
        usd: number;
    };
}

export interface SearchResult {
    id: string;
    name: string;
    symbol: string;
    thumb: string;
}

export const searchCoins = async (query: string): Promise<SearchResult[]> => {
    if (!query || query.length < 2) return [];

    try {
        const response = await axios.get(`${COINGECKO_API_URL}/search`, {
            params: {
                query: query
            }
        });
        return response.data.coins || [];
    } catch (error) {
        console.error('Error searching coins:', error);
        return [];
    }
};

export const fetchPrices = async (ids: string[]): Promise<PriceData> => {
    if (ids.length === 0) return {};

    try {
        const response = await axios.get(`${COINGECKO_API_URL}/simple/price`, {
            params: {
                ids: ids.join(','),
                vs_currencies: 'usd',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching prices:', error);
        return {};
    }
};
