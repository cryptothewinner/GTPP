'use client';

/**
 * AG Grid Enterprise initialization.
 * Import this once in a client component high up in the tree (e.g., QueryProvider).
 */
import { ModuleRegistry } from 'ag-grid-community';
import { AllCommunityModule } from 'ag-grid-community';
import { ServerSideRowModelModule } from 'ag-grid-enterprise';
import { AllEnterpriseModule } from 'ag-grid-enterprise';
import { LicenseManager } from 'ag-grid-enterprise';

// Register modules explicitly
ModuleRegistry.registerModules([AllCommunityModule, AllEnterpriseModule, ServerSideRowModelModule]);

const licenseKey = process.env.NEXT_PUBLIC_AG_GRID_LICENSE;

if (licenseKey) {
    console.log('AG Grid License Key detected, length:', licenseKey.length);
    LicenseManager.setLicenseKey(licenseKey);
} else {
    console.warn('AG Grid License Key NOT found in process.env');
}
