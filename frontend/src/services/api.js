import axios from 'axios';

// En production, utiliser des URLs relatives (même domaine)
// En développement, utiliser localhost:8000
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:8000');

const api = axios.create({
  baseURL: API_URL,
});

// Intercepteur : ajouter le token JWT sur chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur : supprimer le token si 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('utilisateur');
    }
    return Promise.reject(error);
  }
);

// Auth
export const loginGoogle = (token) => api.post('/auth/google', { token });
export const getMe = () => api.get('/auth/me');

// Admin
export const getUtilisateurs = () => api.get('/admin/utilisateurs');
export const modifierRole = (id, role) => api.put(`/admin/utilisateurs/${id}/role`, { role });

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
export const genererHistoire = (chapitreId, prompt, niveauStrictesse = 'modere', typesFaits = []) =>
  api.post(`/chapitres/${chapitreId}/generer`, { prompt, niveau_strictesse: niveauStrictesse, types_faits: typesFaits });
export const genererPreview = (prompt) =>
  api.post('/generer-preview', { prompt });

export default api;
