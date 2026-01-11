import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Create a new price alert
 * @param {Object} alertData - { userEmail, userPhone, productName, targetPrice, stores, productUrl, currentPrice }
 */
export const createAlert = async (alertData) => {
    try {
        const response = await axios.post(`${API_URL}/alerts/create`, alertData);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error(error.message);
    }
};

/**
 * Get all alerts for a user
 * @param {string} userEmail 
 */
export const getUserAlerts = async (userEmail) => {
    try {
        const response = await axios.get(`${API_URL}/alerts/list/${userEmail}`);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error(error.message);
    }
};

/**
 * Get triggered notifications for a user
 * @param {string} userEmail 
 */
export const getNotifications = async (userEmail) => {
    try {
        const response = await axios.get(`${API_URL}/alerts/notifications/${userEmail}`);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error(error.message);
    }
};

/**
 * Delete an alert by ID
 * @param {string} alertId 
 */
export const deleteAlert = async (alertId) => {
    try {
        const response = await axios.delete(`${API_URL}/alerts/${alertId}`);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error(error.message);
    }
};
