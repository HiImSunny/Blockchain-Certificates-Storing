import NodeCache from 'node-cache';

// Standard TTL: 10 minutes (600 seconds)
// Check period: 2 minutes (120 seconds)
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

export const CacheKeys = {
    ALL_CERTIFICATES: 'ALL_CERTIFICATES',
    OFFICERS_LIST: 'OFFICERS_LIST',
    CERTIFICATE_PREFIX: 'CERT_',
    TX_HASH_PREFIX: 'TX_HASH_',
};

/**
 * Get data from cache
 * @param {string} key 
 * @returns {any|undefined}
 */
export const getFromCache = (key) => {
    return cache.get(key);
};

/**
 * Set data to cache
 * @param {string} key 
 * @param {any} value 
 * @param {number} [ttl] - Optional custom TTL in seconds
 * @returns {boolean}
 */
export const setCache = (key, value, ttl) => {
    if (ttl) {
        return cache.set(key, value, ttl);
    }
    return cache.set(key, value);
};

/**
 * Delete data from cache
 * @param {string} key 
 * @returns {number}
 */
export const deleteFromCache = (key) => {
    return cache.del(key);
};

/**
 * Flush all cache
 */
export const flushCache = () => {
    cache.flushAll();
};

export default cache;
