import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

function UtilisateurMenu({ onAdminClick }) {
  const { utilisateur, estAdmin, logout } = useAuth();
  const [ouvert, setOuvert] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOuvert(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roleLabels = { admin: 'Admin', ecrivain: 'Ecrivain', lecteur: 'Lecteur' };

  return (
    <div className="utilisateur-menu" ref={menuRef}>
      <button className="utilisateur-btn" onClick={() => setOuvert(!ouvert)}>
        {utilisateur.photo_url ? (
          <img src={utilisateur.photo_url} alt="" className="avatar" referrerPolicy="no-referrer" />
        ) : (
          <span className="avatar-placeholder">
            {utilisateur.nom?.charAt(0)?.toUpperCase()}
          </span>
        )}
      </button>

      {ouvert && (
        <div className="utilisateur-dropdown">
          <div className="utilisateur-info">
            <strong>{utilisateur.nom}</strong>
            <span className={`badge-role ${utilisateur.role}`}>
              {roleLabels[utilisateur.role] || utilisateur.role}
            </span>
          </div>
          <div className="utilisateur-email">{utilisateur.email}</div>
          <div className="utilisateur-actions">
            {estAdmin && (
              <button
                className="secondary"
                onClick={() => { setOuvert(false); onAdminClick(); }}
              >
                Gestion utilisateurs
              </button>
            )}
            <button className="danger" onClick={logout}>
              Se deconnecter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UtilisateurMenu;
