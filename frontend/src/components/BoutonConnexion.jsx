import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

function BoutonConnexion() {
  const { login, loading } = useAuth();
  const btnRef = useRef(null);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || !window.google?.accounts?.id) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        try {
          await login(response.credential);
        } catch (err) {
          console.error('Erreur connexion Google:', err);
        }
      },
    });

    if (btnRef.current) {
      window.google.accounts.id.renderButton(btnRef.current, {
        theme: 'outline',
        size: 'medium',
        text: 'signin_with',
        locale: 'fr',
      });
    }
  }, [login]);

  if (loading) return <span className="auth-loading">Connexion...</span>;

  return <div ref={btnRef} className="google-btn-container" />;
}

export default BoutonConnexion;
