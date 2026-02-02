import { useState, useEffect } from 'react';
import { getContenus, genererHistoire, supprimerContenu } from '../services/api';

const NIVEAUX_STRICTESSE = [
  { id: 'libre', label: 'Libre', description: 'Liberté créative totale' },
  { id: 'modere', label: 'Modéré', description: 'Respecte les éléments principaux' },
  { id: 'strict', label: 'Strict', description: 'Suit exactement la description' }
];

const TYPES_FAITS = [
  { id: 'historique', label: 'Fait historique', description: 'Événement ou personnage historique réel' },
  { id: 'imaginaire', label: 'Fait imaginaire', description: 'Élément fantastique ou magique' },
  { id: 'effrayant', label: 'Fait effrayant', description: 'Moment de suspense ou légèrement effrayant' },
  { id: 'intrigant', label: 'Fait intrigant', description: 'Mystère ou énigme' },
  { id: 'drole', label: 'Fait drôle', description: 'Moment comique ou absurde' }
];

function Editeur({ chapitre, onRetour }) {
  const [contenus, setContenus] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [niveauStrictesse, setNiveauStrictesse] = useState('modere');
  const [typesFaits, setTypesFaits] = useState([]);
  const [showFaitsDropdown, setShowFaitsDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedPrompts, setExpandedPrompts] = useState({});
  const [expandedResumes, setExpandedResumes] = useState({});

  useEffect(() => {
    chargerContenus();
  }, [chapitre.id]);

  const chargerContenus = async () => {
    try {
      const response = await getContenus(chapitre.id);
      setContenus(response.data);
      // Par défaut, les résumés sont repliés
      const initialExpanded = {};
      response.data.forEach(c => { initialExpanded[c.id] = false; });
      setExpandedResumes(initialExpanded);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerer = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || generating) return;

    setGenerating(true);
    try {
      await genererHistoire(chapitre.id, prompt, niveauStrictesse, typesFaits);
      setPrompt('');
      setTypesFaits([]);
      chargerContenus();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la génération. Vérifie que Claude est bien lancé.');
    } finally {
      setGenerating(false);
    }
  };

  const toggleFait = (faitId) => {
    setTypesFaits(prev =>
      prev.includes(faitId)
        ? prev.filter(id => id !== faitId)
        : [...prev, faitId]
    );
  };

  const handleSupprimer = async (id) => {
    if (!confirm('Supprimer ce contenu ?')) return;
    try {
      await supprimerContenu(id);
      chargerContenus();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const togglePrompt = (id) => {
    setExpandedPrompts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleResume = (id) => {
    setExpandedResumes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) return <p>Chargement...</p>;

  return (
    <div className="editeur">
      <button onClick={onRetour} className="btn-retour">Retour aux chapitres</button>

      <h2>{chapitre.titre}</h2>

      <form onSubmit={handleGenerer} className="form-generation">
        <textarea
          placeholder="Décris l'histoire que tu veux générer...&#10;Ex: Une princesse qui découvre un jardin magique avec des fleurs qui parlent"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
        />

        <div className="strictesse-selector">
          <label>Niveau de fidélité à la description :</label>
          <div className="strictesse-options">
            {NIVEAUX_STRICTESSE.map((niveau) => (
              <button
                key={niveau.id}
                type="button"
                className={`strictesse-btn ${niveauStrictesse === niveau.id ? 'active' : ''}`}
                onClick={() => setNiveauStrictesse(niveau.id)}
                title={niveau.description}
              >
                {niveau.label}
              </button>
            ))}
          </div>
        </div>

        <div className="faits-selector">
          <label>Ajouter un piment (optionnel) :</label>
          <div className="faits-dropdown-container">
            <button
              type="button"
              className="faits-dropdown-trigger"
              onClick={() => setShowFaitsDropdown(!showFaitsDropdown)}
            >
              {typesFaits.length === 0
                ? 'Aucun'
                : typesFaits.map(id => TYPES_FAITS.find(f => f.id === id)?.label).join(', ')}
              <span className="dropdown-arrow">{showFaitsDropdown ? '▲' : '▼'}</span>
            </button>
            {showFaitsDropdown && (
              <div className="faits-dropdown-menu">
                {TYPES_FAITS.map((fait) => (
                  <label key={fait.id} className="fait-option" title={fait.description}>
                    <input
                      type="checkbox"
                      checked={typesFaits.includes(fait.id)}
                      onChange={() => toggleFait(fait.id)}
                    />
                    <span>{fait.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <button type="submit" disabled={generating}>
          {generating ? 'Claude écrit...' : 'Générer l\'histoire'}
        </button>
      </form>

      <div className="contenus">
        {contenus.length === 0 ? (
          <p className="empty">
            Aucune histoire dans ce chapitre.
            <br />Décris ton idée ci-dessus et laisse Claude créer la magie !
          </p>
        ) : (
          contenus.map((contenu) => (
            <div key={contenu.id} className="contenu-card">
              <div className="contenu-header">
                <div className="contenu-toggles">
                  <button
                    className="btn-toggle-prompt"
                    onClick={() => togglePrompt(contenu.id)}
                  >
                    {expandedPrompts[contenu.id] ? '▼' : '▶'} Description
                  </button>
                  {contenu.resume && (
                    <button
                      className="btn-toggle-resume"
                      onClick={() => toggleResume(contenu.id)}
                    >
                      {expandedResumes[contenu.id] ? '▼' : '▶'} Idée
                    </button>
                  )}
                  {contenu.niveau_strictesse && (
                    <span className={`badge-strictesse ${contenu.niveau_strictesse}`}>
                      {NIVEAUX_STRICTESSE.find(n => n.id === contenu.niveau_strictesse)?.label}
                    </span>
                  )}
                  {contenu.types_faits && contenu.types_faits.split(',').map(faitId => (
                    <span key={faitId} className="badge-fait">
                      {TYPES_FAITS.find(f => f.id === faitId)?.label || faitId}
                    </span>
                  ))}
                </div>
                <button
                  className="btn-supprimer-contenu"
                  onClick={() => handleSupprimer(contenu.id)}
                >
                  Supprimer
                </button>
              </div>

              {expandedPrompts[contenu.id] && (
                <div className="prompt">
                  {contenu.texte_utilisateur}
                </div>
              )}

              {expandedResumes[contenu.id] && contenu.resume && (
                <div className="resume">
                  <strong>Résumé / Éléments ajoutés :</strong>
                  <p>{contenu.resume}</p>
                </div>
              )}

              <div className="histoire">
                {contenu.texte_genere}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Editeur;
