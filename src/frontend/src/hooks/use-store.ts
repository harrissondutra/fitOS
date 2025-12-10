import { useState, useEffect, useCallback } from 'react';

interface StoreStats {
    totalSales: number;
    monthlySales: number;
    totalOrders: number;
    monthlyOrders: number;
    totalProducts: number;
    activeProducts: number;
    averageRating: number;
    totalReviews: number;
    storeViews: number;
    favorites: number;
    conversionRate: number;
    returnCustomers: number;
    avgTicket: number;
    outOfStockProducts: number;
}

interface StorePerformance {
    salesGrowth: number;
    orderGrowth: number;
    viewGrowth: number;
    ratingTrend: number;
}

interface StoreData {
    id: string;
    name: string;
    owner: string;
    email: string;
    phone: string;
    location: string;
    foundedYear: string;
    description: string;
    verified: boolean;
    badges: string[];
    specialties: string[];
    socialMedia: {
        website: string;
        instagram: string;
        facebook: string;
    };
    stats: StoreStats;
    performance: StorePerformance;
}

interface Product {
    id: string;
    name: string;
    quantity: number;
    revenue: number;
    growth: number;
}

interface Order {
    id: string;
    customer: string;
    total: number;
    status: string;
    createdAt: string;
}

interface Review {
    id: string;
    customer: string;
    product: string;
    rating: number;
    comment: string;
    createdAt: string;
    needsResponse: boolean;
}

interface UseStoreReturn {
    storeData: StoreData | null;
    topProducts: Product[];
    recentOrders: Order[];
    recentReviews: Review[];
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

export function useStore(userId?: string): UseStoreReturn {
    const [storeData, setStoreData] = useState<StoreData | null>(null);
    const [topProducts, setTopProducts] = useState<Product[]>([]);
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [recentReviews, setRecentReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchStoreData = useCallback(async () => {
        if (!userId) return;

        setLoading(true);
        setError(null);

        try {
            // Buscar dados da loja do marketplace
            const storeResponse = await fetch(`/api/marketplace/store/${userId}`, {
                credentials: 'include',
            });

            if (!storeResponse.ok) {
                throw new Error('Failed to fetch store data');
            }

            const data = await storeResponse.json();

            if (data.success && data.data) {
                setStoreData(data.data);
            }

            // Buscar produtos mais vendidos
            const productsResponse = await fetch(`/api/marketplace/products?sellerId=${userId}&limit=5&sortBy=sales`, {
                credentials: 'include',
            });

            if (productsResponse.ok) {
                const productsData = await productsResponse.json();
                if (productsData.success && productsData.data) {
                    setTopProducts(productsData.data.map((p: any) => ({
                        id: p.id,
                        name: p.name,
                        quantity: p.salesCount || 0,
                        revenue: p.totalRevenue || 0,
                        growth: p.growthPercentage || 0
                    })));
                }
            }

            // Buscar pedidos recentes
            const ordersResponse = await fetch(`/api/marketplace/orders?sellerId=${userId}&limit=5`, {
                credentials: 'include',
            });

            if (ordersResponse.ok) {
                const ordersData = await ordersResponse.json();
                if (ordersData.success && ordersData.data) {
                    setRecentOrders(ordersData.data.map((o: any) => ({
                        id: o.id,
                        customer: o.customerName || 'Cliente',
                        total: o.total || 0,
                        status: o.status || 'pending',
                        createdAt: o.createdAt
                    })));
                }
            }

            // Buscar avaliações recentes
            const reviewsResponse = await fetch(`/api/marketplace/reviews?sellerId=${userId}&limit=3`, {
                credentials: 'include',
            });

            if (reviewsResponse.ok) {
                const reviewsData = await reviewsResponse.json();
                if (reviewsData.success && reviewsData.data) {
                    setRecentReviews(reviewsData.data.map((r: any) => ({
                        id: r.id,
                        customer: r.customerName || 'Cliente',
                        product: r.productName || 'Produto',
                        rating: r.rating || 0,
                        comment: r.comment || '',
                        createdAt: r.createdAt,
                        needsResponse: !r.response
                    })));
                }
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            console.error('Error fetching store data:', err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (userId) {
            fetchStoreData();
        }
    }, [userId, fetchStoreData]);

    return {
        storeData,
        topProducts,
        recentOrders,
        recentReviews,
        loading,
        error,
        refetch: fetchStoreData,
    };
}
