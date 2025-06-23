import { Link } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => (
  <div className="dashboard-container">
    <h1>SwimTrack Dashboard</h1>
    <div className="dashboard-links">
      <Link className="dashboard-link" to="/athletes">Athletes</Link>
      <Link className="dashboard-link" to="/trainings">Trainings</Link>
      <Link className="dashboard-link" to="/trainingscal">Trainings Calendar</Link>
      <Link className="dashboard-link" to="/results">Results</Link>
      <Link className="dashboard-link" to="/tools">Tools</Link>
      <Link className="dashboard-link" to="/attendance">Test</Link>
    </div>
  </div>
);

export default Dashboard;
