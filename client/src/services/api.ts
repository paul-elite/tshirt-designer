import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: { name?: string; email?: string }) =>
    api.put('/auth/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/auth/password', data),
};

// Designs API
export const designsApi = {
  getAll: () => api.get('/designs'),
  getOne: (id: string) => api.get(`/designs/${id}`),
  create: (data: { name: string; canvasData: string; thumbnailUrl?: string; isDraft?: boolean }) =>
    api.post('/designs', data),
  update: (id: string, data: { name?: string; canvasData?: string; thumbnailUrl?: string; isDraft?: boolean }) =>
    api.put(`/designs/${id}`, data),
  delete: (id: string) => api.delete(`/designs/${id}`),
};

// Cart API
export const cartApi = {
  get: () => api.get('/cart'),
  addItem: (data: {
    designId: string;
    size: string;
    color: string;
    colorName: string;
    style: string;
    material: string;
    printArea: string;
    quantity?: number;
  }) => api.post('/cart/items', data),
  updateItem: (id: string, quantity: number) =>
    api.put(`/cart/items/${id}`, { quantity }),
  removeItem: (id: string) => api.delete(`/cart/items/${id}`),
  clear: () => api.delete('/cart'),
};

// Orders API
export const ordersApi = {
  getAll: () => api.get('/orders'),
  getOne: (id: string) => api.get(`/orders/${id}`),
  create: (data: {
    addressId: string;
    shippingMethod: string;
    discountCode?: string;
    stripePaymentId?: string;
  }) => api.post('/orders', data),
};

// Payments API
export const paymentsApi = {
  createIntent: (data: {
    addressId: string;
    shippingMethod: string;
    discountCode?: string;
  }) => api.post('/payments/create-intent', data),
  calculate: (data: {
    addressId?: string;
    shippingMethod?: string;
    discountCode?: string;
  }) => api.post('/payments/calculate', data),
};

// Uploads API
export const uploadsApi = {
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/uploads/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadBase64: (image: string, filename?: string) =>
    api.post('/uploads/base64', { image, filename }),
};

// AI API
export const aiApi = {
  generate: (data: { prompt: string; style?: string; count?: number }) =>
    api.post('/ai/generate', data),
  getStyles: () => api.get('/ai/styles'),
  getSuggestions: () => api.get('/ai/suggestions'),
};

// Addresses API
export const addressesApi = {
  getAll: () => api.get('/addresses'),
  getOne: (id: string) => api.get(`/addresses/${id}`),
  create: (data: {
    name: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string;
    isDefault?: boolean;
  }) => api.post('/addresses', data),
  update: (id: string, data: Partial<{
    name: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
    isDefault: boolean;
  }>) => api.put(`/addresses/${id}`, data),
  delete: (id: string) => api.delete(`/addresses/${id}`),
  setDefault: (id: string) => api.post(`/addresses/${id}/default`),
};

// Discounts API
export const discountsApi = {
  validate: (code: string, subtotal: number) =>
    api.post('/discounts/validate', { code, subtotal }),
};

export default api;
