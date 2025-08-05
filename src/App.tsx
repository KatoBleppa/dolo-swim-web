import sportProLogo from './assets/SportProLogo_02.png';
import './App.css';
import AppRouter from './AppRouter';
import Navbar from './components/Navbar';
import { BrowserRouter as Router } from 'react-router-dom';
import { useEffect } from 'react';
import { initializeAnonymousAuth } from './supabaseClient';

function App() {
  useEffect(() => {
    // Initialize anonymous authentication on app start
    initializeAnonymousAuth();
  }, []);

  return (
    <Router>
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginTop: 16,
          marginBottom: 8,
        }}
      >
        <img
          src={sportProLogo}
          className="logo"
          alt="SportPro logo"
          style={{ width: 320, height: 'auto', marginBottom: 8 }}
        />
        <h2 style={{ margin: 0, marginBottom: 20 }}>SwimTrack 4.0</h2>
      </div>
      <Navbar />
      <div style={{ marginTop: 0 }}>
        <AppRouter />
      </div>
    </Router>
  );
}

export default App;
