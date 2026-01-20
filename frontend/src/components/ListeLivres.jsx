import { useState, useEffect } from 'react';
import { getLivres, creerLivre, supprimerLivre, getStyles, creerStyle, supprimerStyle } from '../services/api';

function ListeLivres({ onSelectLivre }) {
  const [livres, setLivres] = useState([]);
  const [styles, setStyles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mode création
  const [modeCreation, setModeCreation] = useState(false);
  const [nouveauTitre, setNouveauTitre] = useState('');
  const [description, setDescription] = useState('');
  const [styleId, setStyleId] = useState(null);

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
      const response = await creerLivre({ titre: nouveauTitre, description, style_id: styleId });
      setNouveauTitre('');
      setDescription('');
      setStyleId(null);
      setModeCreation(false);
      chargerDonnees();
      // Ouvrir directement le livre créé
      onSelectLivre(response.data);
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

  const handleAnnulerCreation = () => {
    setModeCreation(false);
    setNouveauTitre('');
    setDescription('');
    setStyleId(null);
    setShowNouveauStyle(false);
  };

  if (loading) return <p>Chargement...</p>;

  // Mode création de livre
  if (modeCreation) {
    return (
      <div className="liste-livres">
        <div className="creation-header">
          <button onClick={handleAnnulerCreation} className="btn-retour">
            Retour
          </button>
          <h2>Créer un nouveau livre</h2>
        </div>

        <form onSubmit={handleCreer} className="form-nouveau">
          <input
            type="text"
            placeholder="Titre du livre"
            value={nouveauTitre}
            onChange={(e) => setNouveauTitre(e.target.value)}
            autoFocus
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

          <button type="submit" className="btn-creer-livre">Créer le livre</button>
        </form>
      </div>
    );
  }

  // Mode liste des livres (par défaut)
  return (
    <div className="liste-livres">
      <div className="liste-header">
        <h2>Mes Livres</h2>
        <button onClick={() => setModeCreation(true)} className="btn-nouveau-livre">
          + Créer un nouveau livre
        </button>
      </div>

      <div className="livres-grid">
        {livres.length === 0 ? (
          <div className="empty-state">
            <p>Aucun livre pour le moment.</p>
            <p>Commence par créer ton premier livre !</p>
          </div>
        ) : (
          livres.map((livre) => (
            <div key={livre.id} className="livre-card" onClick={() => onSelectLivre(livre)}>
              <h3>{livre.titre}</h3>
              {livre.description && <p className="livre-description">{livre.description}</p>}
              {livre.style && <span className="livre-style">{livre.style.nom}</span>}
              <div className="actions">
                <button onClick={(e) => { e.stopPropagation(); onSelectLivre(livre); }}>
                  Ouvrir
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleSupprimer(livre.id); }}
                  className="danger"
                >
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
