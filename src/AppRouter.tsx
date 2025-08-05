import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import Athletes from './Athletes';
import Personalbests from './Personalbests';
import Trainings from './Trainings';
import TrainingsCalendar from './TrainingsCal';
import AttendanceList from './AttendanceList';
import Trend from './Trend';
import IndividualCal from './IndividualCal';
import Progress from './Progress';
import Results from './Results';

const Tools = () => <div style={{padding:'2rem'}}><h2>Tools</h2><p>Tools page coming soon.</p></div>;

function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/athletes" element={<Athletes />} />
        <Route path="/personalbests" element={<Personalbests />} />
        <Route path="/trainings" element={<Trainings />} />
        <Route path="/trainingscal" element={<TrainingsCalendar />} />
        <Route path="/individualcal" element={<IndividualCal />} />
        <Route path="/results" element={<Results />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/tools" element={<Tools />} />
        <Route path="/attendance" element={<AttendanceList />} />
        <Route path="/results" element={<Results />} />
        <Route path="/trend" element={<Trend />} />
      </Routes>
    </Router>
  );
}

export default AppRouter;
