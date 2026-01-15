import { useState, useEffect } from 'react';
import { getLivres, creerLivre, supprimerLivre } from '../services/api';

function ListeLivres({ onSelectLivre }) {
  const [livres, setLivres] = useState([]);
  const [nouveauTitre, setNouveauTitre] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chargerLivres();
  }, []);

  const chargerLivres = async () => {
    try {
      const response = await getLivres();
      setLivres(response.data);
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
      await creerLivre({ titre: nouveauTitre, description });
      setNouveauTitre('');
      setDescription('');
      chargerLivres();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleSupprimer = async (id) => {
    if (!confirm('Supprimer ce livre et tous ses chapitres ?')) return;
    try {
      await supprimerLivre(id);
      chargerLivres();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  if (loading) return <p>Chargement...</p>;

  return (
    <div className="liste-livres">
      <h2>Mes Livres</h2>

      <form onSubmit={handleCreer} className="form-nouveau">
        <input
          type="text"
          placeholder="Titre du nouveau livre"
          value={nouveauTitre}
          onChange={(e) => setNouveauTitre(e.target.value)}
        />
        <input
          type="text"
          placeholder="Description (optionnel)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button type="submit">Créer</button>
      </form>

      <div className="livres-grid">
        {livres.length === 0 ? (
          <p className="empty">Aucun livre. Crée ton premier livre !</p>
        ) : (
          livres.map((livre) => (
            <div key={livre.id} className="livre-card">
              <h3 onClick={() => onSelectLivre(livre)}>{livre.titre}</h3>
              {livre.description && <p>{livre.description}</p>}
              <div className="actions">
                <button onClick={() => onSelectLivre(livre)}>Ouvrir</button>
                <button onClick={() => handleSupprimer(livre.id)} className="danger">
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

export default ListeLivres;
