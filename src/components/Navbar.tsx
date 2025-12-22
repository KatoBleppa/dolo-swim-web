import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import sportProLogo from '../assets/SportProLogo_02.png';

const Navbar: React.FC = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Dashboard' },
    {
      category: 'Athletes',
      items: [
        { path: '/athletes', label: 'Personal data' },
        { path: '/personalbests', label: 'Personal bests' },
      ],
    },
    {
      category: 'Training',
      items: [
        { path: '/trainings', label: 'List' },
        { path: '/trainingscal', label: 'Calendar' },
        { path: '/attendance', label: 'Attendance' },
        { path: '/trend', label: 'Trend' },
      ],
    },
    {
      category: 'Meets',
      items: [
        { path: '/meetmanager', label: 'Meet Manager' },
        { path: '/results', label: 'Results' },
        { path: '/permillili', label: 'Results with permillili' },
        { path: '/bestpermillili', label: 'Best Permillili' },
        { path: '/progress', label: 'Progress' },
        { path: '/racesheet', label: 'Race Sheet' },
      ],
    },
    { path: '/tools', label: 'Tools' },
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
          {navItems.map((item, index) => {
            // Handle Dashboard (simple item)
            if (item.path) {
              return (
                <li key={item.path} className="navbar-item">
                  <Link
                    to={item.path}
                    className={`navbar-link ${location.pathname === item.path ? 'active' : ''}`}
                    onClick={closeMenu}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            }

            // Handle dropdown categories
            return (
              <li key={index} className="navbar-item navbar-dropdown">
                <span className="navbar-dropdown-trigger">{item.category}</span>
                <ul className="navbar-dropdown-menu">
                  {item.items?.map(subItem => (
                    <li key={subItem.path} className="navbar-dropdown-item">
                      <Link
                        to={subItem.path}
                        className={`navbar-dropdown-link ${location.pathname === subItem.path ? 'active' : ''}`}
                        onClick={closeMenu}
                      >
                        {subItem.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>{' '}
        {/* Overlay for mobile menu */}
        {isMenuOpen && (
          <div className="navbar-overlay" onClick={closeMenu}></div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
