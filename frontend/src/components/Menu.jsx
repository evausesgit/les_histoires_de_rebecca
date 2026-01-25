import { useState, useRef, useEffect } from 'react';

const themes = [
  { id: 'crepuscule', name: 'Crépuscule', color: '#667eea' },
  { id: 'ocean', name: 'Océan', color: '#0891b2' },
  { id: 'foret', name: 'Forêt', color: '#588157' },
  { id: 'encre', name: 'Encre', color: '#f97316' }
];

function Menu({ currentTheme, onThemeChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectTheme = (themeId) => {
    onThemeChange(themeId);
  };

  return (
    <div className="menu-container" ref={menuRef}>
      <button className="menu-btn" onClick={() => setIsOpen(!isOpen)}>
        <span className="menu-icon">
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>

      {isOpen && (
        <div className="menu-dropdown">
          <div className="menu-section">
            <div className="menu-section-title">Thème</div>
            <div className="theme-options">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  className={`theme-btn ${currentTheme === theme.id ? 'active' : ''}`}
                  onClick={() => handleSelectTheme(theme.id)}
                  title={theme.name}
                >
                  <span
                    className="theme-color"
                    style={{ background: theme.color }}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Menu;
