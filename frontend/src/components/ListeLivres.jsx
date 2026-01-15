import { useState, useEffect } from 'react';
import { getLivres, creerLivre, supprimerLivre, getStyles, creerStyle, supprimerStyle } from '../services/api';

function ListeLivres({ onSelectLivre }) {
  const [livres, setLivres] = useState([]);
  const [styles, setStyles] = useState([]);
  const [nouveauTitre, setNouveauTitre] = useState('');
  const [description, setDescription] = useState('');
  const [styleId, setStyleId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Pour le formulaire de nouveau style
  const [showNouveauStyle, setShowNouveauStyle] = useState(false);
  const [nouveauStyleNom, setNouveauStyleNom] = useState('');
  const [nouveauStyleDescription, setNouveauStyleDescription] = useState('');

  useEffect(() => {
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    try {
      const [livresRes, stylesRes] = await Promise.all([getLivres(), getStyles()]);
      console.log('Styles chargés:', stylesRes.data);
      setLivres(livresRes.data);
      setStyles(stylesRes.data);
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreer = async (e) => {
    e.preventDefault();
    if (!nouveauTitre.trim()) return;

    try {
      await creerLivre({ titre: nouveauTitre, description, style_id: styleId });
      setNouveauTitre('');
      setDescription('');
      setStyleId(null);
      chargerDonnees();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleSupprimer = async (id) => {
    if (!confirm('Supprimer ce livre et tous ses chapitres ?')) return;
    try {
      await supprimerLivre(id);
      chargerDonnees();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleCreerStyle = async (e) => {
    e.preventDefault();
    if (!nouveauStyleNom.trim() || !nouveauStyleDescription.trim()) return;

    try {
      await creerStyle({ nom: nouveauStyleNom, description: nouveauStyleDescription });
      setNouveauStyleNom('');
      setNouveauStyleDescription('');
      setShowNouveauStyle(false);
      chargerDonnees();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur: ' + (error.response?.data?.detail || 'Impossible de créer le style'));
    }
  };

  const handleSupprimerStyle = async (id) => {
    if (!confirm('Supprimer ce style ?')) return;
    try {
      await supprimerStyle(id);
      if (styleId === id) setStyleId(null);
      chargerDonnees();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur: ' + (error.response?.data?.detail || 'Impossible de supprimer le style'));
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

        <div className="style-section">
          <label>Style d'écriture</label>
          <div className="style-selector">
            {styles.map((style) => (
              <div
                key={style.id}
                className={`style-option ${styleId === style.id ? 'selected' : ''}`}
                onClick={() => setStyleId(styleId === style.id ? null : style.id)}
              >
                <div className="style-header">
                  <h4>{style.nom}</h4>
                  {!style.est_predefini && (
                    <button
                      type="button"
                      className="delete-style"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSupprimerStyle(style.id);
                      }}
                    >
                      x
                    </button>
                  )}
                </div>
                <p>{style.description}</p>
              </div>
            ))}
            <div
              className="style-option add-style"
              onClick={() => setShowNouveauStyle(!showNouveauStyle)}
            >
              <h4>+ Ajouter</h4>
              <p>Créer un nouveau style</p>
            </div>
          </div>

          {showNouveauStyle && (
            <div className="nouveau-style-form">
              <input
                type="text"
                placeholder="Nom du style"
                value={nouveauStyleNom}
                onChange={(e) => setNouveauStyleNom(e.target.value)}
              />
              <input
                type="text"
                placeholder="Description du style"
                value={nouveauStyleDescription}
                onChange={(e) => setNouveauStyleDescription(e.target.value)}
              />
              <div className="nouveau-style-actions">
                <button type="button" onClick={handleCreerStyle}>Créer le style</button>
                <button type="button" className="secondary" onClick={() => setShowNouveauStyle(false)}>Annuler</button>
              </div>
            </div>
          )}
        </div>

        <button type="submit">Créer le livre</button>
      </form>

      <div className="livres-grid">
        {livres.length === 0 ? (
          <p className="empty">Aucun livre. Crée ton premier livre !</p>
        ) : (
          livres.map((livre) => (
            <div key={livre.id} className="livre-card">
              <h3 onClick={() => onSelectLivre(livre)}>{livre.titre}</h3>
              {livre.description && <p>{livre.description}</p>}
              {livre.style && <span className="livre-style">{livre.style.nom}</span>}
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
