import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import ListAthletesPage from './ListTablesPage';
import TrainingsPage from './TrainingsPage';

const Results = () => <div style={{padding:'2rem'}}><h2>Results</h2><p>Results page coming soon.</p></div>;
const Tools = () => <div style={{padding:'2rem'}}><h2>Tools</h2><p>Tools page coming soon.</p></div>;

function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/athletes" element={<ListAthletesPage />} />
        <Route path="/trainings" element={<TrainingsPage />} />
        <Route path="/results" element={<Results />} />
        <Route path="/tools" element={<Tools />} />
      </Routes>
    </Router>
  );
}

export default AppRouter;
