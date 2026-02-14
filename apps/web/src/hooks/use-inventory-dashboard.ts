import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useInventoryDashboard() {
    const materials = useQuery({
        queryKey: ['materials', 'summary'],
        queryFn: () => apiClient.get<any>('/materials/summary'),
        staleTime: 60 * 1000,
    });

    const stocks = useQuery({
        queryKey: ['stock-summary'],
        queryFn: () => apiClient.get<any>('/stocks/summary'),
        staleTime: 60 * 1000,
    });

    const products = useQuery({
        queryKey: ['products', 'summary'],
        queryFn: () => apiClient.get<any>('/products/summary'),
        staleTime: 60 * 1000,
    });

    const suppliers = useQuery({
        queryKey: ['suppliers', 'summary'],
        queryFn: () => apiClient.get<any>('/suppliers/summary'),
        staleTime: 60 * 1000,
    });

    const batches = useQuery({
        queryKey: ['material-batches', 'list', { page: 1, pageSize: 500 }],
        queryFn: () => apiClient.get<any>('/material-batches?page=1&pageSize=500'),
        staleTime: 60 * 1000,
    });

    const isLoading =
        materials.isLoading ||
        stocks.isLoading ||
        products.isLoading ||
        suppliers.isLoading;

    const expiredBatchCount = (() => {
        const list: any[] = batches.data?.data ?? [];
        const today = new Date();
        return list.filter((b: any) => b.expiryDate && new Date(b.expiryDate) < today).length;
    })();

    return {
        isLoading,
        materialsData: materials.data?.data,
        stocksData: stocks.data?.data,
        productsData: products.data?.data,
        suppliersData: suppliers.data?.data,
        expiredBatchCount,
        refetchAll: () => {
            materials.refetch();
            stocks.refetch();
            products.refetch();
            suppliers.refetch();
            batches.refetch();
        },
    };
}
