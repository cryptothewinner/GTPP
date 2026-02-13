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

const licenseKey = "[TRIAL]_this_{AG_Charts_and_AG_Grid}_Enterprise_key_{AG-120775}_is_granted_for_evaluation_only___Use_in_production_is_not_permitted___Please_report_misuse_to_legal@ag-grid.com___For_help_with_purchasing_a_production_key_please_contact_info@ag-grid.com___You_are_granted_a_{Single_Application}_Developer_License_for_one_application_only___All_Front-End_JavaScript_developers_working_on_the_application_would_need_to_be_licensed___This_key_will_deactivate_on_{15 March 2026}____[v3]_[0102]_MTc3MzUzMjgwMDAwMA==212d6fb9d319f14bdd95637098cd5dac";

try {
    console.log('AG Grid License Key detected, length:', licenseKey.length);
    LicenseManager.setLicenseKey(licenseKey);
} catch (e) {
    console.warn('[AG Grid] License key setup failed:', e);
}

// Suppress AG Grid Enterprise license validation promise rejections (code 403)
// These are non-critical and only occur with trial/evaluation keys.
if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
        const reason = event.reason;
        if (
            reason &&
            typeof reason === 'object' &&
            'code' in reason &&
            reason.code === 403
        ) {
            event.preventDefault();
            // Optional: console.debug('Suppressed AG Grid 403 error', reason);
        }
    });
}
