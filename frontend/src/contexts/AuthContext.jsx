import { createContext, useContext, useState, useEffect } from 'react';
import { loginGoogle as apiLoginGoogle } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [utilisateur, setUtilisateur] = useState(() => {
    const saved = localStorage.getItem('utilisateur');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  const estConnecte = !!utilisateur;
  const estEcrivain = utilisateur?.role === 'ecrivain' || utilisateur?.role === 'admin';
  const estAdmin = utilisateur?.role === 'admin';

  useEffect(() => {
    if (utilisateur) {
      localStorage.setItem('utilisateur', JSON.stringify(utilisateur));
    } else {
      localStorage.removeItem('utilisateur');
    }
  }, [utilisateur]);

  const login = async (googleToken) => {
    setLoading(true);
    try {
      const response = await apiLoginGoogle(googleToken);
      const { access_token, utilisateur: user } = response.data;
      localStorage.setItem('token', access_token);
      setUtilisateur(user);
      return user;
    } catch (error) {
      console.error('Erreur login:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('utilisateur');
    setUtilisateur(null);
    // Révoquer la session Google si GSI est chargé
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }
  };

  return (
    <AuthContext.Provider value={{
      utilisateur,
      loading,
      estConnecte,
      estEcrivain,
      estAdmin,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
}
