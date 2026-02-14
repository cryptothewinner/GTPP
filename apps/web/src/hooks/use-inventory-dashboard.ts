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
        queryKey: ['business-partners', 'suppliers', 'summary'],
        queryFn: () => apiClient.get<any>('/business-partners?role=SUPPLIER&page=1&pageSize=1'),
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

    const isError =
        materials.isError ||
        stocks.isError ||
        products.isError ||
        suppliers.isError ||
        batches.isError;

    const expiredBatchCount = (() => {
        const list: any[] = batches.data?.data ?? [];
        const today = new Date();
        return list.filter((b: any) => b.expiryDate && new Date(b.expiryDate) < today).length;
    })();

    const suppliersData = {
        totalSuppliers:
            suppliers.data?.meta?.total ??
            suppliers.data?.data?.meta?.total ??
            suppliers.data?.totalSuppliers ??
            0,
    };

    return {
        isLoading,
        isError,
        materialsData: materials.data?.data ?? materials.data,
        stocksData: stocks.data?.data ?? stocks.data,
        productsData: products.data?.data ?? products.data,
        suppliersData,
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
