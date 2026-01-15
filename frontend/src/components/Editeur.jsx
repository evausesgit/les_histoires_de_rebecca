import { useState, useEffect } from 'react';
import { getContenus, genererHistoire } from '../services/api';

function Editeur({ chapitre, onRetour }) {
  const [contenus, setContenus] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    chargerContenus();
  }, [chapitre.id]);

  const chargerContenus = async () => {
    try {
      const response = await getContenus(chapitre.id);
      setContenus(response.data);
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
      await genererHistoire(chapitre.id, prompt);
      setPrompt('');
      chargerContenus();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la génération. Vérifie que Claude est bien lancé.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <p>Chargement...</p>;

  return (
    <div className="editeur">
      <button onClick={onRetour} className="btn-retour">← Retour aux chapitres</button>

      <h2>{chapitre.titre}</h2>

      <form onSubmit={handleGenerer} className="form-generation">
        <textarea
          placeholder="Décris l'histoire que tu veux générer pour Rebecca...&#10;Ex: Une princesse qui découvre un jardin magique avec des fleurs qui parlent"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
        />
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
              <div className="prompt">
                <strong>Ton idée :</strong> {contenu.texte_utilisateur}
              </div>
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
