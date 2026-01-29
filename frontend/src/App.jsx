import { useState, useEffect } from 'react';
import ListeLivres from './components/ListeLivres';
import ListeChapitres from './components/ListeChapitres';
import Editeur from './components/Editeur';
import Lecteur from './components/Lecteur';
import Menu from './components/Menu';
import './App.css';

function App() {
  const [livreSelectionne, setLivreSelectionne] = useState(null);
  const [chapitreSelectionne, setChapitreSelectionne] = useState(null);
  const [modeLecture, setModeLecture] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'ocean';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleSelectLivre = (livre) => {
    setLivreSelectionne(livre);
    setChapitreSelectionne(null);
    setModeLecture(false);
  };

  const handleSelectChapitre = (chapitre) => {
    setChapitreSelectionne(chapitre);
    setModeLecture(false);
  };

  const handleLireChapitre = (chapitre) => {
    setChapitreSelectionne(chapitre);
    setModeLecture(true);
  };

  const handleRetourLivres = () => {
    setLivreSelectionne(null);
    setChapitreSelectionne(null);
    setModeLecture(false);
  };

  const handleRetourChapitres = () => {
    setChapitreSelectionne(null);
    setModeLecture(false);
  };

  return (
    <div className="app">
      <Menu currentTheme={theme} onThemeChange={setTheme} />

      <header>
        <h1>Les Histoires de BK</h1>
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
            onLireChapitre={handleLireChapitre}
            onRetour={handleRetourLivres}
          />
        )}

        {chapitreSelectionne && !modeLecture && (
          <Editeur
            chapitre={chapitreSelectionne}
            onRetour={handleRetourChapitres}
          />
        )}

        {chapitreSelectionne && modeLecture && (
          <Lecteur
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
