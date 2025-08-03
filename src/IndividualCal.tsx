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
    <div
      style={{
        maxWidth: 900,
        margin: '2rem auto',
        padding: '2rem',
        background: '#fff',
        borderRadius: 8,
      }}
    >
      <h2>Individual Calendar</h2>
      <div
        style={{
          display: 'flex',
          gap: 16,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '2rem',
        }}
      >
        <label style={{ fontWeight: 'bold' }}>
          Group:
          <select
            value={selectedGroup}
            onChange={e =>
              setSelectedGroup(e.target.value as 'ASS' | 'EA' | 'EB' | 'PROP')
            }
            style={{
              marginLeft: 8,
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ccc',
            }}
          >
            <option value="ASS">ASS</option>
            <option value="EA">EA</option>
            <option value="EB">EB</option>
            <option value="PROP">PROP</option>
          </select>
        </label>
        <label style={{ fontWeight: 'bold' }}>
          Athlete:
          <select
            value={selectedFincode}
            onChange={e => setSelectedFincode(Number(e.target.value))}
            style={{
              marginLeft: 8,
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ccc',
            }}
          >
            <option value="">Select athlete</option>
            {athletes.map(a => (
              <option key={a.fincode} value={a.fincode}>
                {a.name} ({a.fincode})
              </option>
            ))}
          </select>
        </label>
        <label style={{ fontWeight: 'bold' }}>
          Session type:
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value as 'Swim' | 'Gym')}
            style={{
              marginLeft: 8,
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ccc',
            }}
          >
            <option value="Swim">Swim</option>
            <option value="Gym">Gym</option>
          </select>
        </label>
      </div>
      <div
        style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}
      >
        <button
          onClick={() => changeMonth(-1)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '8px',
          }}
        >
          {'<'}
        </button>
        <div
          style={{
            margin: '0 16px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {new Date(year, month - 1).toLocaleString('default', {
            month: 'long',
            year: 'numeric',
          })}
        </div>
        <button
          onClick={() => changeMonth(1)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginLeft: '8px',
          }}
        >
          {'>'}
        </button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <table
          style={{
            borderCollapse: 'collapse',
            background: '#fff',
            border: '1px solid #ddd',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5' }}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                <th
                  key={d}
                  style={{
                    padding: '12px',
                    fontWeight: 'bold',
                    border: '1px solid #ddd',
                    textAlign: 'center',
                    minWidth: '50px',
                  }}
                >
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week, i) => (
              <tr key={i}>
                {week.map((day, j) => {
                  if (!day)
                    return (
                      <td
                        key={j}
                        style={{
                          width: 50,
                          height: 50,
                          border: '1px solid #ddd',
                        }}
                      />
                    );
                  let bg = '';
                  if (day.status === 'P') bg = '#4caf50';
                  else if (day.status === 'J') bg = '#ffeb3b';
                  else if (day.status === 'A') bg = '#f44336';
                  else bg = '#f9f9f9';
                  return (
                    <td
                      key={j}
                      style={{
                        width: 50,
                        height: 50,
                        textAlign: 'center',
                        background: bg,
                        color:
                          bg === '#ffeb3b'
                            ? '#333'
                            : bg === '#f9f9f9'
                              ? '#333'
                              : '#fff',
                        border: '1px solid #ddd',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'background 0.2s, transform 0.1s',
                        position: 'relative',
                      }}
                      title={
                        day.status ? `Status: ${day.status}` : 'No session'
                      }
                      onMouseEnter={e => {
                        if (day.status) {
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
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
      <div
        style={{
          marginTop: '2rem',
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '8px 12px',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            border: '1px solid #ddd',
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              backgroundColor: '#4caf50',
              borderRadius: '3px',
            }}
          />
          <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Present</span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '8px 12px',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            border: '1px solid #ddd',
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              backgroundColor: '#ffeb3b',
              borderRadius: '3px',
            }}
          />
          <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
            Justified
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '8px 12px',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            border: '1px solid #ddd',
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              backgroundColor: '#f44336',
              borderRadius: '3px',
            }}
          />
          <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Absent</span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '8px 12px',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            border: '1px solid #ddd',
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              backgroundColor: '#f9f9f9',
              borderRadius: '3px',
              border: '1px solid #ddd',
            }}
          />
          <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
            No Session
          </span>
        </div>
      </div>
    </div>
  );
};
export default IndividualCal;
