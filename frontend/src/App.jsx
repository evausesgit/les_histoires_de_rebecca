import { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import ListeLivres from './components/ListeLivres';
import ListeChapitres from './components/ListeChapitres';
import Editeur from './components/Editeur';
import Lecteur from './components/Lecteur';
import Menu from './components/Menu';
import BoutonConnexion from './components/BoutonConnexion';
import UtilisateurMenu from './components/UtilisateurMenu';
import AdminUtilisateurs from './components/AdminUtilisateurs';
import './App.css';

function App() {
  const { estConnecte, estEcrivain, estAdmin } = useAuth();
  const [livreSelectionne, setLivreSelectionne] = useState(null);
  const [chapitreSelectionne, setChapitreSelectionne] = useState(null);
  const [modeLecture, setModeLecture] = useState(false);
  const [pageAdmin, setPageAdmin] = useState(false);
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
    setPageAdmin(false);
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

  const handleAdminClick = () => {
    setPageAdmin(true);
    setLivreSelectionne(null);
    setChapitreSelectionne(null);
    setModeLecture(false);
  };

  const handleRetourAdmin = () => {
    setPageAdmin(false);
  };

  return (
    <div className="app">
      <Menu currentTheme={theme} onThemeChange={setTheme} />

      <div className="auth-zone">
        {estConnecte ? (
          <UtilisateurMenu onAdminClick={handleAdminClick} />
        ) : (
          <BoutonConnexion />
        )}
      </div>

      <header>
        <h1>Les Histoires de BK</h1>
        <p className="subtitle">Des histoires magiques creees avec amour</p>
      </header>

      <main>
        {pageAdmin && estAdmin && (
          <AdminUtilisateurs onRetour={handleRetourAdmin} />
        )}

        {!pageAdmin && !livreSelectionne && (
          <ListeLivres onSelectLivre={handleSelectLivre} estEcrivain={estEcrivain} />
        )}

        {!pageAdmin && livreSelectionne && !chapitreSelectionne && (
          <ListeChapitres
            livre={livreSelectionne}
            onSelectChapitre={handleSelectChapitre}
            onLireChapitre={handleLireChapitre}
            onRetour={handleRetourLivres}
            estEcrivain={estEcrivain}
          />
        )}

        {!pageAdmin && chapitreSelectionne && !modeLecture && (
          <Editeur
            chapitre={chapitreSelectionne}
            onRetour={handleRetourChapitres}
          />
        )}

        {!pageAdmin && chapitreSelectionne && modeLecture && (
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
