import { useState, useEffect } from 'react';
import { getContenus } from '../services/api';

function Lecteur({ chapitre, onRetour }) {
  const [contenus, setContenus] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <p>Chargement...</p>;

  return (
    <div className="lecteur">
      <button onClick={onRetour} className="btn-retour btn-retour-lecteur">
        ← Fermer
      </button>

      <div className="livre-ouvert">
        <h2 className="titre-chapitre">{chapitre.titre}</h2>

        <div className="pages">
          {contenus.length === 0 ? (
            <p className="empty">Ce chapitre est vide.</p>
          ) : (
            contenus.map((contenu, index) => (
              <div key={contenu.id} className="page">
                {index > 0 && <hr className="separateur" />}
                <div className="texte-livre">
                  {contenu.texte_genere.split('\n').map((paragraphe, i) => (
                    paragraphe.trim() && <p key={i}>{paragraphe}</p>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Lecteur;
