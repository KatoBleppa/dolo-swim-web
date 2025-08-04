import './Dashboard.css';
import { icons } from './assets/icons/icons.ts';

const Dashboard = () => (
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
            <a
              href="/athletes"
              target="_blank"
              title="Athlete profile"
              className="dashboard-icon"
            >
              <img
                src={icons.person}
                alt="Athlete profile"
                style={{ width: '100px', height: '100px' }}
              />
            </a>
            <h2>Athletes</h2>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <a
              href="/personalbests"
              target="_blank"
              title="Personal Bests"
              className="dashboard-icon"
            >
              <img
                src={icons.personalbest}
                alt="Personal Bests"
                style={{ width: '100px', height: '100px' }}
              />
            </a>
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
            <a
              href="/trainings"
              target="_blank"
              title="Training list"
              className="dashboard-icon"
            >
              <img
                src={icons.list}
                alt="Trainings list"
                style={{ width: '100px', height: '100px' }}
              />
            </a>
            <h2>List</h2>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <a
              href="/trainingscal"
              target="_blank"
              title="Training calendar"
              className="dashboard-icon"
            >
              <img
                src={icons.calendar}
                alt="Trainings calendar"
                style={{ width: '100px', height: '100px' }}
              />
            </a>
            <h2>Calendar</h2>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <a
              href="/individualcal"
              target="_blank"
              title="Individual training calendar"
              className="dashboard-icon"
            >
              <img
                src={icons.transfer}
                alt="Individual training calendar"
                style={{ width: '100px', height: '100px' }}
              />
            </a>
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
            <a
              href="/attendance"
              target="_blank"
              title="Attendance summary"
              className="dashboard-icon"
            >
              <img
                src={icons.positive}
                alt="Attendance"
                style={{ width: '100px', height: '100px' }}
              />
            </a>
            <h2>Attendance</h2>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <a
              href="/trend"
              target="_blank"
              title="Trend"
              className="dashboard-icon"
            >
              <img
                src={icons.graph}
                alt="Trend"
                style={{ width: '100px', height: '100px' }}
              />
            </a>
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
        <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <a
              href="/results"
              target="_blank"
              title="Results"
              className="dashboard-icon"
            >
              <img
                src={icons.trophy}
                alt="Results"
                style={{ width: '100px', height: '100px' }}
              />
            </a>
            <h2>Results</h2>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <a
              href="/progress"
              target="_blank"
              title="Progress"
              className="dashboard-icon"
            >
              <img
                src={icons.tasks}
                alt="Progress"
                style={{ width: '100px', height: '100px' }}
              />
            </a>
            <h2>Progress</h2>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <a
              href="/tools"
              target="_blank"
              title="Tools"
              className="dashboard-icon"
            >
              <img
                src={icons.settings}
                alt="Tools"
                style={{ width: '100px', height: '100px' }}
              />
            </a>
            <h2>Tools</h2>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default Dashboard;
