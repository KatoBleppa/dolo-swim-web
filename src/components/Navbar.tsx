import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import sportProLogo from '../assets/SportProLogo_02.png';

const Navbar: React.FC = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/athletes', label: 'Athletes' },
    { path: '/personalbests', label: 'Personal Bests' },
    { path: '/trainings', label: 'Trainings' },
    { path: '/trainingscal', label: 'Calendar' },
    { path: '/attendance', label: 'Attendance' },
    { path: '/trend', label: 'Trend' },
    { path: '/results', label: 'Results' },
    { path: '/progress', label: 'Progress' },
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <img src={sportProLogo} className="navbar-logo" alt="SportPro logo" />

        {/* Mobile menu button */}
        <button
          className="navbar-toggle"
          onClick={toggleMenu}
          aria-label="Toggle navigation menu"
        >
          <span className={`hamburger-line ${isMenuOpen ? 'open' : ''}`}></span>
          <span className={`hamburger-line ${isMenuOpen ? 'open' : ''}`}></span>
          <span className={`hamburger-line ${isMenuOpen ? 'open' : ''}`}></span>
        </button>

        {/* Navigation menu */}
        <ul className={`navbar-menu ${isMenuOpen ? 'open' : ''}`}>
          {navItems.map(item => (
            <li key={item.path} className="navbar-item">
              <Link
                to={item.path}
                className={`navbar-link ${location.pathname === item.path ? 'active' : ''}`}
                onClick={closeMenu} // Close menu when link is clicked
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Overlay for mobile menu */}
        {isMenuOpen && (
          <div className="navbar-overlay" onClick={closeMenu}></div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
