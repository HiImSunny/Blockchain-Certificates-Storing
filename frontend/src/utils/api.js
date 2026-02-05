import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/cert';
const ADMIN_API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/cert', '/admin') || 'http://localhost:5000/api/admin';

console.log('API Config:', {
    API_BASE_URL,
    ADMIN_API_BASE_URL,
    MODE: import.meta.env.MODE
});

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

const adminApi = axios.create({
    baseURL: ADMIN_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Performance Telemetry Interceptors
const addTelemetry = (instance, name) => {
    instance.interceptors.request.use((config) => {
        config.metadata = { startTime: performance.now() };
        return config;
    });

    instance.interceptors.response.use(
        (response) => {
            const duration = (performance.now() - response.config.metadata.startTime).toFixed(2);
            console.groupCollapsed(`🚀 [API Speed] ${name} ${response.config.method.toUpperCase()} ${response.config.url} - ${duration}ms`);
            console.log('Status:', response.status);
            console.log('Data:', response.data);
            console.groupEnd();
            return response;
        },
        (error) => {
            const duration = error.config ? (performance.now() - error.config.metadata.startTime).toFixed(2) : 'N/A';
            console.error(`❌ [API Error] ${name} ${error.config?.url} - ${duration}ms`, error);
            return Promise.reject(error);
        }
    );
};

addTelemetry(api, 'UserAPI');
addTelemetry(adminApi, 'AdminAPI');

/**
 * Upload certificate file
 * @param {File} file
 * @returns {Promise<object>}
 */
export const uploadCertificate = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
};

/**
 * Create certificate with manual input
 * @param {object} certificateData
 * @returns {Promise<object>}
 */
export const createCertificate = async (certificateData) => {
    const response = await api.post('/create', certificateData);
    return response.data;
};

/**
 * Confirm blockchain transaction
 * @param {object} confirmData
 * @returns {Promise<object>}
 */
export const confirmCertificate = async (confirmData) => {
    const response = await api.post('/confirm', confirmData);
    return response.data;
};

/**
 * Verify certificate by ID
 * @param {string} certId
 * @returns {Promise<object>}
 */
export const verifyCertificateById = async (certId) => {
    const response = await api.get(`/verify/${certId}`);
    return response.data;
};

/**
 * Verify certificate by file
 * @param {File} file
 * @returns {Promise<object>}
 */
export const verifyCertificateByFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/verify-file', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
};

/**
 * Get certificate download URL
 * @param {string} certId
 * @returns {Promise<object>}
 */
export const getCertificateDownload = async (certId) => {
    const response = await api.get(`/${certId}/download`);
    return response.data;
};

/**
 * Revoke certificate
 * @param {string} certificateId
 * @param {string} txHash
 * @returns {Promise<object>}
 */
export const revokeCertificate = async (certificateId, txHash) => {
    const response = await api.post('/revoke', { certificateId, txHash });
    return response.data;
};

/**
 * List all certificates
 * @param {object} params - { page, limit, status, issuerAddress }
 * @returns {Promise<object>}
 */
export const listCertificates = async (params = {}) => {
    const response = await api.get('/list', { params });
    return response.data;
};

// Admin API calls

/**
 * Check if address is admin
 * @param {string} address
 * @returns {Promise<object>}
 */
export const checkAdmin = async (address) => {
    const response = await adminApi.get(`/check-admin/${address}`);
    return response.data;
};

/**
 * Check if address is officer
 * @param {string} address
 * @returns {Promise<object>}
 */
export const checkOfficer = async (address) => {
    const response = await adminApi.get(`/check-officer/${address}`);
    return response.data;
};

/**
 * Get admin address
 * @returns {Promise<object>}
 */
export const getAdminAddress = async () => {
    const response = await adminApi.get('/admin-address');
    return response.data;
};

/**
 * Get statistics
 * @returns {Promise<object>}
 */
export const getStats = async () => {
    const response = await adminApi.get('/stats');
    return response.data;
};

/**
 * Get officer list
 * @returns {Promise<object>}
 */
export const listOfficers = async () => {
    const response = await adminApi.get('/officers');
    return response.data;
};

export default api;
