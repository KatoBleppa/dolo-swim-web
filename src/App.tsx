import './styles/App.css';
import AppRouter from './AppRouter';
import Navbar from './components/Navbar';
import { BrowserRouter as Router } from 'react-router-dom';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
      
  }, []);

  return (
    <Router>

      <Navbar />

      <div style={{ marginTop: 0 }}>
        <AppRouter />
      </div>
    </Router>
  );
}

export default App;
