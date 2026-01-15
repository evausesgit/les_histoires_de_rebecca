import { useState, useEffect } from 'react';
import { getChapitres, creerChapitre, supprimerChapitre } from '../services/api';

function ListeChapitres({ livre, onSelectChapitre, onLireChapitre, onRetour }) {
  const [chapitres, setChapitres] = useState([]);
  const [nouveauTitre, setNouveauTitre] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chargerChapitres();
  }, [livre.id]);

  const chargerChapitres = async () => {
    try {
      const response = await getChapitres(livre.id);
      setChapitres(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreer = async (e) => {
    e.preventDefault();
    if (!nouveauTitre.trim()) return;

    try {
      const ordre = chapitres.length + 1;
      await creerChapitre(livre.id, { titre: nouveauTitre, ordre });
      setNouveauTitre('');
      chargerChapitres();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleSupprimer = async (id) => {
    if (!confirm('Supprimer ce chapitre ?')) return;
    try {
      await supprimerChapitre(id);
      chargerChapitres();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  if (loading) return <p>Chargement...</p>;

  return (
    <div className="liste-chapitres">
      <button onClick={onRetour} className="btn-retour">← Retour aux livres</button>

      <h2>{livre.titre}</h2>
      {livre.description && <p className="description">{livre.description}</p>}

      <form onSubmit={handleCreer} className="form-nouveau">
        <input
          type="text"
          placeholder="Titre du nouveau chapitre"
          value={nouveauTitre}
          onChange={(e) => setNouveauTitre(e.target.value)}
        />
        <button type="submit">Ajouter</button>
      </form>

      <div className="chapitres-liste">
        {chapitres.length === 0 ? (
          <p className="empty">Aucun chapitre. Ajoute le premier chapitre !</p>
        ) : (
          chapitres.map((chapitre) => (
            <div key={chapitre.id} className="chapitre-item">
              <span className="ordre">Chapitre {chapitre.ordre}</span>
              <h3 onClick={() => onSelectChapitre(chapitre)}>{chapitre.titre}</h3>
              <div className="actions">
                <button onClick={() => onLireChapitre(chapitre)} className="btn-lire">Lire</button>
                <button onClick={() => onSelectChapitre(chapitre)}>Écrire</button>
                <button onClick={() => handleSupprimer(chapitre.id)} className="danger">
                  Supprimer
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ListeChapitres;
