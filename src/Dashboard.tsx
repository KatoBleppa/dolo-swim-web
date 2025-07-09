import './Dashboard.css';
import LottieIcon from './components/LottieIcon';
import { animations } from './data/animations';

const Dashboard = () => (
  <div className="dashboard-container">
    <h1>Dashboard</h1>
    <div className="dashboard-links">
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
        <a href="/athletes" target="_blank" title="Athlete profile" className="dashboard-icon">
          <LottieIcon animationData={animations.athlete} />
        </a>
      </div>
      <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginBottom: '2rem' }}>
        <a href="/trainings" target="_blank" title="Training list" className="dashboard-icon">
          <LottieIcon animationData={animations.checklist} />
        </a>
        <a href="/trainingscal" target="_blank" title="Training calendar" className="dashboard-icon">
          <LottieIcon animationData={animations.calendar} />
        </a>
        <a href="/attendance" target="_blank" title="Attendance summary" className="dashboard-icon">
          <LottieIcon animationData={animations.attendance} />
        </a>
      </div>
      <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center' }}>
        <a href="/results" target="_blank" title="Results" className="dashboard-icon">
          <LottieIcon animationData={animations.results} />
        </a>
        <a href="/tools" target="_blank" title="Tools" className="dashboard-icon">
          <LottieIcon animationData={animations.tools} />
        </a>
      </div>
    </div>
  </div>
);

export default Dashboard;
