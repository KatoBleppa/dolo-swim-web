import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

interface Athlete {
  fincode: number;
  name: string;
  groups?: string; // Optional, used for filtering by group
}
// Moved AttendanceDay interface after Athlete

interface AttendanceDay {
  attendance_id: number;
  session_id: number;
  fincode: number;
  status: string;
  type: string;
  groups: string;
  date: string; // YYYY-MM-DD
}

const IndividualCal: React.FC = () => {
  const [selectedGroup, setSelectedGroup] = useState<
    'ASS' | 'EA' | 'EB' | 'PROP'
  >('ASS');
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selectedFincode, setSelectedFincode] = useState<number | ''>('');
  const [selectedType, setSelectedType] = useState<'Swim' | 'Gym'>('Swim');
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [attendance, setAttendance] = useState<AttendanceDay[]>([]);

  useEffect(() => {
    const fetchAthletes = async () => {
      const { data, error } = await supabase
        .from('athletes')
        .select('fincode, name, groups')
        .eq('groups', selectedGroup)
        .order('name', { ascending: true });
      if (!error) setAthletes(data || []);
    };
    fetchAthletes();
  }, [selectedGroup]);

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!selectedFincode || !currentMonth || !selectedType) {
        setAttendance([]);
        return;
      }
      const { data, error } = await supabase.rpc(
        'get_swimmer_attendance_by_month',
        {
          input_fincode: selectedFincode,
          input_month: currentMonth,
          input_type: selectedType,
        }
      );
      if (!error) setAttendance(data || []);
      else setAttendance([]);
    };
    fetchAttendance();
  }, [selectedFincode, currentMonth, selectedType]);

  // Calendar helpers
  function getDaysInMonth(year: number, month: number) {
    return new Date(year, month, 0).getDate();
  }
  function getFirstDayOfWeekMonday(year: number, month: number) {
    // 0=Sun, 1=Mon, ... => convert so 0=Mon, 6=Sun
    const jsDay = new Date(year, month - 1, 1).getDay();
    return (jsDay + 6) % 7; // 0=Mon, 6=Sun
  }
  const [year, month] = currentMonth.split('-').map(Number);
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfWeek = getFirstDayOfWeekMonday(year, month);

  // Attendance map for quick lookup
  const attendanceMap = new Map<string, AttendanceDay>();
  attendance.forEach(a => attendanceMap.set(a.date, a));

  // Calendar grid: 0=Mon, 6=Sun
  const weeks: (AttendanceDay | null)[][] = [];
  let week: (AttendanceDay | null)[] = Array(firstDayOfWeek).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    week.push(
      attendanceMap.get(dateStr) || {
        date: dateStr,
        status: '',
        attendance_id: 0,
        session_id: 0,
        fincode: 0,
        type: '',
        groups: '',
      }
    );
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) weeks.push([...week, ...Array(7 - week.length).fill(null)]);

  // Calendar navigation
  function changeMonth(offset: number) {
    const d = new Date(year, month - 1 + offset, 1);
    setCurrentMonth(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    );
  }

  return (
    <div className="page-container">
      <h2 className="page-title">Individual Calendar</h2>
      <div className="form-group">
        <label className="form-label">
          Group:
          <select
            value={selectedGroup}
            onChange={e =>
              setSelectedGroup(e.target.value as 'ASS' | 'EA' | 'EB' | 'PROP')
            }
            className="form-select ml-1"
          >
            <option value="ASS">ASS</option>
            <option value="EA">EA</option>
            <option value="EB">EB</option>
            <option value="PROP">PROP</option>
          </select>
        </label>
        <label className="form-label">
          Athlete:
          <select
            value={selectedFincode}
            onChange={e => setSelectedFincode(Number(e.target.value))}
            className="form-select ml-1"
          >
            <option value="">Select athlete</option>
            {athletes.map(a => (
              <option key={a.fincode} value={a.fincode}>
                {a.name} ({a.fincode})
              </option>
            ))}
          </select>
        </label>
        <label className="form-label">
          Session type:
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value as 'Swim' | 'Gym')}
            className="form-select ml-1"
          >
            <option value="Swim">Swim</option>
            <option value="Gym">Gym</option>
          </select>
        </label>
      </div>
      <div className="nav-container">
        <button onClick={() => changeMonth(-1)} className="btn btn-primary">
          {'<'}
        </button>
        <div className="nav-title">
          {new Date(year, month - 1).toLocaleString('default', {
            month: 'long',
            year: 'numeric',
          })}
        </div>
        <button onClick={() => changeMonth(1)} className="btn btn-primary">
          {'>'}
        </button>
      </div>
      <div className="d-flex justify-center">
        <table className="calendar-table">
          <thead className="calendar-header">
            <tr>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                <th key={d}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week, i) => (
              <tr key={i}>
                {week.map((day, j) => {
                  if (!day)
                    return <td key={j} className="calendar-cell empty" />;

                  let cellClass = 'calendar-cell ';
                  if (day.status === 'P') cellClass += 'present';
                  else if (day.status === 'J') cellClass += 'justified';
                  else if (day.status === 'A') cellClass += 'absent';
                  else cellClass += 'no-session';

                  return (
                    <td
                      key={j}
                      className={cellClass}
                      title={
                        day.status ? `Status: ${day.status}` : 'No session'
                      }
                    >
                      {parseInt(day.date.slice(-2), 10)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="legend">
        <div className="legend-item">
          <div
            className="legend-color"
            style={{ backgroundColor: '#4caf50' }}
          />
          <span className="legend-text">Present</span>
        </div>
        <div className="legend-item">
          <div
            className="legend-color"
            style={{ backgroundColor: '#ffeb3b' }}
          />
          <span className="legend-text">Justified</span>
        </div>
        <div className="legend-item">
          <div
            className="legend-color"
            style={{ backgroundColor: '#f44336' }}
          />
          <span className="legend-text">Absent</span>
        </div>
        <div className="legend-item">
          <div
            className="legend-color"
            style={{ backgroundColor: '#f9f9f9', border: '1px solid #ddd' }}
          />
          <span className="legend-text">No Session</span>
        </div>
      </div>
    </div>
  );
};
export default IndividualCal;
