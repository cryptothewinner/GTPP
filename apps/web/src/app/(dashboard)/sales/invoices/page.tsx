import { Suspense } from 'react';
import InvoicesPageClient from './invoices-page-client';

export default function InvoicesPage() {
    return (
        <Suspense fallback={<div className="p-6">Yükleniyor...</div>}>
            <InvoicesPageClient />
        </Suspense>
    );
}
