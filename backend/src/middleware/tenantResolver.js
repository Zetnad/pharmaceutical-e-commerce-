const Pharmacist = require('../models/Pharmacist');

/**
 * Middleware to resolve the tenant (Pharmacist) based on the request's origin/host.
 * This is crucial for the B2B2C architecture so we know which pharmacy the user is visiting.
 */
exports.resolveTenant = async (req, res, next) => {
    try {
        // The frontend should ideally send a custom header 'x-tenant-domain' or we infer from Origin
        const host = req.headers['x-tenant-domain'] || req.get('origin') || req.get('host');

        if (!host) {
            return next(); // Proceed without tenant (e.g., they are on the main SaaS platform)
        }

        // Clean the host string (remove http://, https://, and ports)
        const exactHost = host.replace(/^https?:\/\//, '').split(':')[0];

        // Check if the host is the main SaaS domain (e.g., localhost, medihub.com)
        // If we are on the main domain, we are NOT in a tenant context.
        // NOTE: In production, 'localhost' should be your actual SaaS domain string.
        if (exactHost === 'localhost' || exactHost.includes('medihub.com')) {
            // It might still be a subdomain like johnspharmacy.medihub.com
            const parts = exactHost.split('.');
            if (parts.length >= 3 && parts[1] === 'medihub') {
                const subdomain = parts[0];
                // Try to find the tenant by subdomain
                const tenant = await Pharmacist.findOne({ subdomain, status: 'verified' }).select('-bankDetails -stripeAccountId');
                if (tenant) {
                    req.tenant = tenant;
                }
            }
            return next();
        }

        // If it's not the main domain, it might be a custom domain (e.g., www.johnspharmacy.co.ke)
        const tenantByCustomDomain = await Pharmacist.findOne({ customDomain: exactHost, status: 'verified' }).select('-bankDetails -stripeAccountId');
        if (tenantByCustomDomain) {
            req.tenant = tenantByCustomDomain;
        }

        next();
    } catch (error) {
        console.error('Tenant resolution error:', error);
        next(); // Don't crash the request, just proceed without a tenant context
    }
};
