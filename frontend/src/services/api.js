import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
});

// Styles
export const getStyles = () => api.get('/styles');
export const creerStyle = (data) => api.post('/styles', data);
export const supprimerStyle = (id) => api.delete(`/styles/${id}`);

// Livres
export const getLivres = () => api.get('/livres');
export const creerLivre = (data) => api.post('/livres', data);
export const getLivre = (id) => api.get(`/livres/${id}`);
export const supprimerLivre = (id) => api.delete(`/livres/${id}`);

// Chapitres
export const getChapitres = (livreId) => api.get(`/livres/${livreId}/chapitres`);
export const creerChapitre = (livreId, data) => api.post(`/livres/${livreId}/chapitres`, data);
export const supprimerChapitre = (id) => api.delete(`/chapitres/${id}`);

// Contenus
export const getContenus = (chapitreId) => api.get(`/chapitres/${chapitreId}/contenus`);
export const creerContenu = (chapitreId, data) => api.post(`/chapitres/${chapitreId}/contenus`, data);
export const supprimerContenu = (id) => api.delete(`/contenus/${id}`);

// Génération
export const genererHistoire = (chapitreId, prompt) =>
  api.post(`/chapitres/${chapitreId}/generer`, { prompt });
export const genererPreview = (prompt) =>
  api.post('/generer-preview', { prompt });

export default api;
