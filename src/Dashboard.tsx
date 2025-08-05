import './Dashboard.css';
import { icons } from './assets/icons/icons.ts';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>
      <div className="dashboard-links">
        {/* ----------------- athletes -----------------*/}
        <div
          style={{
            display: 'flex',
            gap: '2rem',
            justifyContent: 'center',
            background: 'linear-gradient(to right, #e0e0e0, #f5f5f5)',
            borderRadius: '8px',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '2rem',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <Link
                to="/athletes"
                title="Athlete profile"
                className="dashboard-icon"
              >
                <img
                  src={icons.person}
                  alt="Athlete profile"
                  style={{ width: '100px', height: '100px' }}
                />
              </Link>
              <h2>Athletes</h2>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <Link
                to="/personalbests"
                title="Personal Bests"
                className="dashboard-icon"
              >
                <img
                  src={icons.personalbest}
                  alt="Personal Bests"
                  style={{ width: '100px', height: '100px' }}
                />
              </Link>
              <h2>Personal Bests</h2>
            </div>
          </div>
        </div>
        {/* ----------------- trainings ----------------*/}
        <div
          style={{
            display: 'flex',
            gap: '2rem',
            justifyContent: 'center',
            background: 'linear-gradient(to right, #d5d5d5, #ececec)',
            borderRadius: '8px',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '2rem',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <Link
                to="/trainings"
                title="Training list"
                className="dashboard-icon"
              >
                <img
                  src={icons.list}
                  alt="Trainings list"
                  style={{ width: '100px', height: '100px' }}
                />
              </Link>
              <h2>List</h2>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <Link
                to="/trainingscal"
                title="Training calendar"
                className="dashboard-icon"
              >
                <img
                  src={icons.calendar}
                  alt="Trainings calendar"
                  style={{ width: '100px', height: '100px' }}
                />
              </Link>
              <h2>Calendar</h2>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <Link
                to="/individualcal"
                title="Individual training calendar"
                className="dashboard-icon"
              >
                <img
                  src={icons.transfer}
                  alt="Individual training calendar"
                  style={{ width: '100px', height: '100px' }}
                />
              </Link>
              <h2>Individual</h2>
            </div>
          </div>
        </div>
        {/* ----------------- attendance ---------------*/}
        <div
          style={{
            display: 'flex',
            gap: '2rem',
            justifyContent: 'center',
            background: 'linear-gradient(to right, #c8c8c8, #e0e0e0)',
            borderRadius: '8px',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '2rem',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <Link
                to="/attendance"
                title="Attendance summary"
                className="dashboard-icon"
              >
                <img
                  src={icons.positive}
                  alt="Attendance"
                  style={{ width: '100px', height: '100px' }}
                />
              </Link>
              <h2>Attendance</h2>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <Link to="/trend" title="Trend" className="dashboard-icon">
                <img
                  src={icons.graph}
                  alt="Trend"
                  style={{ width: '100px', height: '100px' }}
                />
              </Link>
              <h2>Trend</h2>
            </div>
          </div>
        </div>
        {/* ----------------- Results -----------------*/}
        <div
          style={{
            display: 'flex',
            gap: '2rem',
            justifyContent: 'center',
            background: 'linear-gradient(to right, #bbbbbb, #d4d4d4)',
            borderRadius: '8px',
          }}
        >
          <div
            style={{ display: 'flex', gap: '2rem', justifyContent: 'center' }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <Link to="/results" title="Results" className="dashboard-icon">
                <img
                  src={icons.trophy}
                  alt="Results"
                  style={{ width: '100px', height: '100px' }}
                />
              </Link>
              <h2>Results</h2>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <Link to="/progress" title="Progress" className="dashboard-icon">
                <img
                  src={icons.tasks}
                  alt="Progress"
                  style={{ width: '100px', height: '100px' }}
                />
              </Link>
              <h2>Progress</h2>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <Link to="/tools" title="Tools" className="dashboard-icon">
                <img
                  src={icons.settings}
                  alt="Tools"
                  style={{ width: '100px', height: '100px' }}
                />
              </Link>
              <h2>Tools</h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
