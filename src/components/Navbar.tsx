import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar: React.FC = () => {
  const location = useLocation();

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

  return (
    <nav
      style={{
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #dee2e6',
        padding: '0.5rem 0',
        marginBottom: '1rem',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1rem',
        }}
      >
        <ul
          style={{
            display: 'flex',
            listStyle: 'none',
            margin: 0,
            padding: 0,
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          {navItems.map(item => (
            <li key={item.path}>
              <Link
                to={item.path}
                style={{
                  textDecoration: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  display: 'block',
                  color: location.pathname === item.path ? '#007bff' : '#333',
                  backgroundColor:
                    location.pathname === item.path ? '#e9ecef' : 'transparent',
                  fontWeight:
                    location.pathname === item.path ? 'bold' : 'normal',
                  transition: 'background-color 0.2s, color 0.2s',
                }}
                onMouseEnter={e => {
                  if (location.pathname !== item.path) {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                    e.currentTarget.style.color = '#007bff';
                  }
                }}
                onMouseLeave={e => {
                  if (location.pathname !== item.path) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#333';
                  }
                }}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
