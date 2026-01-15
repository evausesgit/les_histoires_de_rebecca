import { useState } from 'react';
import ListeLivres from './components/ListeLivres';
import ListeChapitres from './components/ListeChapitres';
import Editeur from './components/Editeur';
import './App.css';

function App() {
  const [livreSelectionne, setLivreSelectionne] = useState(null);
  const [chapitreSelectionne, setChapitreSelectionne] = useState(null);

  const handleSelectLivre = (livre) => {
    setLivreSelectionne(livre);
    setChapitreSelectionne(null);
  };

  const handleSelectChapitre = (chapitre) => {
    setChapitreSelectionne(chapitre);
  };

  const handleRetourLivres = () => {
    setLivreSelectionne(null);
    setChapitreSelectionne(null);
  };

  const handleRetourChapitres = () => {
    setChapitreSelectionne(null);
  };

  return (
    <div className="app">
      <header>
        <h1>Les Histoires de Rebecca</h1>
        <p className="subtitle">Des histoires magiques créées avec amour</p>
      </header>

      <main>
        {!livreSelectionne && (
          <ListeLivres onSelectLivre={handleSelectLivre} />
        )}

        {livreSelectionne && !chapitreSelectionne && (
          <ListeChapitres
            livre={livreSelectionne}
            onSelectChapitre={handleSelectChapitre}
            onRetour={handleRetourLivres}
          />
        )}

        {chapitreSelectionne && (
          <Editeur
            chapitre={chapitreSelectionne}
            onRetour={handleRetourChapitres}
          />
        )}
      </main>

      <footer>
        <p>Fait avec amour pour Rebecca</p>
      </footer>
    </div>
  );
}

export default App;
