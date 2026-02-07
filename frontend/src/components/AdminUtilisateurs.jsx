import { useState, useEffect } from 'react';
import { getUtilisateurs, modifierRole } from '../services/api';

function AdminUtilisateurs({ onRetour }) {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    charger();
  }, []);

  const charger = async () => {
    try {
      const response = await getUtilisateurs();
      setUtilisateurs(response.data);
    } catch (error) {
      setErreur('Erreur lors du chargement des utilisateurs');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (id, newRole) => {
    try {
      await modifierRole(id, newRole);
      charger();
    } catch (error) {
      console.error('Erreur changement de role:', error);
      alert('Erreur: ' + (error.response?.data?.detail || 'Impossible de changer le role'));
    }
  };

  const roleLabels = { admin: 'Admin', ecrivain: 'Ecrivain', lecteur: 'Lecteur' };

  if (loading) return <p>Chargement...</p>;
  if (erreur) return <p className="erreur">{erreur}</p>;

  return (
    <div className="admin-utilisateurs">
      <button onClick={onRetour} className="btn-retour">← Retour</button>
      <h2>Gestion des utilisateurs</h2>

      <div className="utilisateurs-liste">
        {utilisateurs.map((user) => (
          <div key={user.id} className="utilisateur-card">
            <div className="utilisateur-card-info">
              {user.photo_url ? (
                <img src={user.photo_url} alt="" className="avatar" referrerPolicy="no-referrer" />
              ) : (
                <span className="avatar-placeholder">
                  {user.nom?.charAt(0)?.toUpperCase()}
                </span>
              )}
              <div>
                <strong>{user.nom}</strong>
                <div className="utilisateur-email">{user.email}</div>
              </div>
            </div>
            <div className="utilisateur-card-role">
              <select
                value={user.role}
                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                className="role-select"
              >
                <option value="lecteur">{roleLabels.lecteur}</option>
                <option value="ecrivain">{roleLabels.ecrivain}</option>
                <option value="admin">{roleLabels.admin}</option>
              </select>
              <span className={`badge-role ${user.role}`}>
                {roleLabels[user.role]}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminUtilisateurs;
