
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, FileText, ShoppingCart, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useSalesOrderList } from '@/hooks/use-sales-orders';
import { useSalesQuotationList } from '@/hooks/use-sales-quotations';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function CustomerSalesDocumentsTab({ customerId }: { customerId: string }) {
    const { data: orders, isLoading: isLoadingOrders } = useSalesOrderList({ customerId });
    const { data: quotes, isLoading: isLoadingQuotes } = useSalesQuotationList({ customerId });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Satış Belgeleri</h3>
                <div className="flex gap-2">
                    <Link href={`/sales/quotations/new?customerId=${customerId}`}>
                        <Button variant="outline" size="sm" className="gap-2">
                            <FileText className="w-4 h-4" />
                            Yeni Teklif
                        </Button>
                    </Link>
                    <Link href={`/sales/orders/new?customerId=${customerId}`}>
                        <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700">
                            <ShoppingCart className="w-4 h-4" />
                            Yeni Sipariş
                        </Button>
                    </Link>
                </div>
            </div>

            <Tabs defaultValue="orders" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="orders">Siparişler ({orders?.length || 0})</TabsTrigger>
                    <TabsTrigger value="quotes">Teklifler ({quotes?.length || 0})</TabsTrigger>
                </TabsList>

                <TabsContent value="orders" className="mt-4">
                    <Card>
                        <CardContent className="p-0">
                            <div className="rounded-md border overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 border-b text-xs uppercase text-slate-500 font-medium">
                                        <tr>
                                            <th className="px-4 py-3">Sipariş No</th>
                                            <th className="px-4 py-3">Tarih</th>
                                            <th className="px-4 py-3 text-right">Tutar</th>
                                            <th className="px-4 py-3">Durum</th>
                                            <th className="px-4 py-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {isLoadingOrders ? (
                                            <tr><td colSpan={5} className="p-4 text-center">Yükleniyor...</td></tr>
                                        ) : orders && orders.length > 0 ? (
                                            orders.map((order) => (
                                                <tr key={order.id} className="hover:bg-slate-50/50 group">
                                                    <td className="px-4 py-3 font-medium">{order.orderNumber}</td>
                                                    <td className="px-4 py-3 text-slate-500">
                                                        {format(new Date(order.orderDate), 'd MMM yyyy', { locale: tr })}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-medium">
                                                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: order.currency }).format(order.totalGrossAmount)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge variant="outline" className="text-xs">{order.status}</Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <Link href={`/sales/orders/${order.id}`}>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <ArrowRight className="w-4 h-4" />
                                                            </Button>
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan={5} className="p-8 text-center text-slate-500">Kayıt bulunamadı.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="quotes" className="mt-4">
                    <Card>
                        <CardContent className="p-0">
                            <div className="rounded-md border overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 border-b text-xs uppercase text-slate-500 font-medium">
                                        <tr>
                                            <th className="px-4 py-3">Teklif No</th>
                                            <th className="px-4 py-3">Geçerlilik</th>
                                            <th className="px-4 py-3 text-right">Tutar</th>
                                            <th className="px-4 py-3">Durum</th>
                                            <th className="px-4 py-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {isLoadingQuotes ? (
                                            <tr><td colSpan={5} className="p-4 text-center">Yükleniyor...</td></tr>
                                        ) : quotes && quotes.length > 0 ? (
                                            quotes.map((quote) => (
                                                <tr key={quote.id} className="hover:bg-slate-50/50 group">
                                                    <td className="px-4 py-3 font-medium">{quote.quoteNumber}</td>
                                                    <td className="px-4 py-3 text-slate-500">
                                                        {format(new Date(quote.validTo), 'd MMM yyyy', { locale: tr })}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-medium">
                                                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: quote.currency }).format(quote.totalGrossAmount)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge variant="outline" className="text-xs">{quote.status}</Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <Link href={`/sales/quotations/${quote.id}`}>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <ArrowRight className="w-4 h-4" />
                                                            </Button>
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan={5} className="p-8 text-center text-slate-500">Kayıt bulunamadı.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
