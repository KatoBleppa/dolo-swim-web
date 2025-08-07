import React, { useState, useEffect } from 'react';
import { FaSwimmer, FaDumbbell } from 'react-icons/fa'; // Import gym icon
import { supabase } from './supabaseClient';
import AttendanceForm from './AttendanceForm';
import attendanceIcon from './assets/icons/icons8-checked-user-male-100.png';
import editIcon from './assets/icons/icons8-create-100.png';
import deleteIcon from './assets/icons/icons8-delete-100.png';
import closeIcon from './assets/icons/icons8-close-100.png';

console.log('TrainingsCalendar file loaded');

interface Session {
  session_id: number;
  date: string; // ISO date string, e.g. "2025-06-14"
  type: 'Gym' | 'Swim';
  description?: string;
  starttime?: string;
  endtime?: string;
  title?: string;
  groups?: string;
  volume?: number;
  location?: string;
  poolname?: string;
  poollength?: number;
}

async function fetchSessionsForMonth(
  year: number,
  month: number
): Promise<Session[]> {
  const monthStr = (month + 1).toString().padStart(2, '0');
  const fromDate = `${year}-${monthStr}-01`;
  const toDate = `${year}-${monthStr}-32`;

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .gte('date', fromDate)
    .lt('date', toDate)
    .order('date', { ascending: false });

  if (error) {
    console.error('Supabase error:', error);
    return [];
  }

  // Keep date as string
  return data || [];
}

function getMonthDays(year: number, month: number) {
  const lastDay = new Date(year, month + 1, 0);
  const days = [];
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }
  return days;
}

function groupSessionsByDate(sessions: Session[]) {
  return sessions.reduce(
    (acc, session) => {
      const date = session.date.split('T')[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push(session);
      return acc;
    },
    {} as Record<string, Session[]>
  );
}

// Weekday headers starting from Monday
const weekdayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Adjust so Monday is 0, Sunday is 6
function getMondayStartIndex(day: number) {
  return (day + 6) % 7;
}

const TrainingsCalendar: React.FC = () => {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [newType, setNewType] = useState<'Gym' | 'Swim'>('Swim');
  const [newDesc, setNewDesc] = useState('');
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newGroups, setNewGroups] = useState('');
  const [newVolume, setNewVolume] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newPoolName, setNewPoolName] = useState('');
  const [newPoolLength, setNewPoolLength] = useState('');
  const [sessionDetailsOpen, setSessionDetailsOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editSessionId, setEditSessionId] = useState<number | null>(null);
  const [attendanceOpen, setAttendanceOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchSessionsForMonth(currentYear, currentMonth)
      .then(setSessions)
      .finally(() => setLoading(false));
  }, [currentYear, currentMonth]);

  const days = getMonthDays(currentYear, currentMonth);
  // Adjust first day index for Monday start
  const firstDayWeekday = getMondayStartIndex(days[0].getDay());
  const calendarCells = Array(firstDayWeekday).fill(null);
  days.forEach(day => calendarCells.push(day));
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  const sessionsByDate = groupSessionsByDate(sessions);

  // --- Cell width calculation ---
  // Render all cell contents to a hidden div to measure the widest
  const [cellWidth, setCellWidth] = React.useState<number>(80);
  const cellMeasureRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (cellMeasureRef.current) {
      setCellWidth(cellMeasureRef.current.offsetWidth + 8); // add a little padding
    }
  }, [sessions, currentMonth, currentYear]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => {
      if (prev === 11) {
        setCurrentYear(y => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  const openModal = (dateStr: string) => {
    setSelectedDate(dateStr);
    setNewStartTime('18:00:00');
    setNewEndTime('20:00:00');
    setNewTitle('');
    setNewGroups('ASS');
    setNewType('Swim');
    setNewVolume('');
    setNewDesc('');
    setNewLocation('Bolzano');
    setNewPoolName('Lido');
    setNewPoolLength('50');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedDate(null);
    setNewDesc('');
    setEditMode(false);
    setEditSessionId(null);
  };

  // Add this handler
  const openSessionDetails = (session: Session) => {
    setSelectedSession(session);
    setSessionDetailsOpen(true);
  };

  const closeSessionDetails = () => {
    setSessionDetailsOpen(false);
    setSelectedSession(null);
  };

  // Open modal for editing
  const openEditModal = (session: Session) => {
    setSelectedDate(session.date.split('T')[0]);
    setNewStartTime(session.starttime || '');
    setNewEndTime(session.endtime || '');
    setNewTitle(session.title || '');
    setNewGroups(session.groups || '');
    setNewType(session.type);
    setNewVolume(session.volume ? String(session.volume) : '');
    setNewDesc(session.description || '');
    setNewLocation(session.location || '');
    setNewPoolName(session.poolname || '');
    setNewPoolLength(session.poollength ? String(session.poollength) : '');
    setEditSessionId(session.session_id);
    setEditMode(true);
    setModalOpen(true);
    setSessionDetailsOpen(false);
  };

  // Reset edit state on close

  // Insert or update session
  const handleInsertOrUpdateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;
    const sessionObj = {
      date: selectedDate,
      starttime: newStartTime,
      endtime: newEndTime,
      title: newTitle,
      groups: newGroups,
      type: newType,
      volume: newVolume ? Number(newVolume) : null,
      description: newDesc,
      location: newLocation,
      poolname: newPoolName,
      poollength: newPoolLength ? Number(newPoolLength) : null,
    };
    let error;
    if (editMode && editSessionId) {
      // Update without sending the session_id field
      ({ error } = await supabase
        .from('sessions')
        .update(sessionObj)
        .eq('session_id', editSessionId));
    } else {
      // Insert
      ({ error } = await supabase.from('sessions').insert([sessionObj]));
    }
    if (error) {
      alert('Error saving session: ' + error.message);
      return;
    }
    closeModal();
    setLoading(true);
    fetchSessionsForMonth(currentYear, currentMonth)
      .then(setSessions)
      .finally(() => setLoading(false));
  };

  // Delete session
  const handleDeleteSession = async () => {
    if (!selectedSession) return;
    if (!window.confirm('Delete this session?')) return;
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('session_id', selectedSession.session_id);
    if (error) {
      alert('Error deleting session: ' + error.message);
      return;
    }
    closeSessionDetails();
    setLoading(true);
    fetchSessionsForMonth(currentYear, currentMonth)
      .then(setSessions)
      .finally(() => setLoading(false));
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Calendar of Trainings</h1>
      <div className="nav-container">
        <button onClick={handlePrevMonth} className="btn btn-secondary">
          &lt;
        </button>
        <h2 className="nav-title">
          {new Date(currentYear, currentMonth).toLocaleString('default', {
            month: 'long',
          })}{' '}
          {currentYear}
        </h2>
        <button onClick={handleNextMonth} className="btn btn-secondary">
          &gt;
        </button>
      </div>

      {loading ? (
        <div className="loading-message">Loading calendar data...</div>
      ) : (
        <>
          {/* Hidden measure cell */}
          <div
            style={{
              position: 'absolute',
              left: -9999,
              top: -9999,
              visibility: 'hidden',
            }}
            ref={cellMeasureRef}
          >
            <div style={{ fontWeight: 'bold', color: '#1976d2' }}>
              30{' '}
              <span style={{ marginLeft: 4, fontSize: 14, color: '#888' }}>
                +
              </span>
            </div>
            <div>
              {Array(3)
                .fill(0)
                .map((_, i) => (
                  <span
                    key={i}
                    style={{ display: 'inline-block', marginRight: 4 }}
                  >
                    <FaSwimmer /> <FaDumbbell />
                  </span>
                ))}
            </div>
          </div>
          <div className="table-container">
            <table className="calendar-table">
              <thead className="calendar-header">
                <tr>
                  {weekdayHeaders.map(d => (
                    <th key={d} className="calendar-header th">
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: calendarCells.length / 7 }).map(
                  (_, weekIdx) => (
                    <tr key={weekIdx}>
                      {calendarCells
                        .slice(weekIdx * 7, weekIdx * 7 + 7)
                        .map((day, idx) => {
                          if (!day)
                            return (
                              <td
                                key={idx}
                                style={{
                                  width: cellWidth,
                                  minWidth: cellWidth,
                                  maxWidth: cellWidth,
                                }}
                              />
                            );
                          const year = day.getFullYear();
                          const month = (day.getMonth() + 1)
                            .toString()
                            .padStart(2, '0');
                          const date = day
                            .getDate()
                            .toString()
                            .padStart(2, '0');
                          const dateStr = `${year}-${month}-${date}`;
                          const daySessions = sessionsByDate[dateStr] || [];
                          return (
                            <td
                              key={idx}
                              style={{
                                border: '1px solid #ccc',
                                verticalAlign: 'top',
                                height: 80,
                                width: cellWidth,
                                minWidth: cellWidth,
                                maxWidth: cellWidth,
                              }}
                            >
                              <div
                                style={{
                                  fontWeight: 'bold',
                                  cursor: 'pointer',
                                  color: '#1976d2',
                                }}
                                onClick={() => openModal(dateStr)}
                                title="Add session"
                              >
                                {day.getDate()}
                                <span
                                  style={{
                                    marginLeft: 4,
                                    fontSize: 14,
                                    color: '#888',
                                  }}
                                >
                                  +
                                </span>
                              </div>
                              <div>
                                {daySessions.map(session =>
                                  session.type === 'Gym' ? (
                                    <div
                                      key={session.session_id}
                                      style={{
                                        color: '#2e7d32',
                                        fontSize: 16,
                                        cursor: 'pointer',
                                        display: 'inline-block',
                                        marginRight: 4,
                                      }}
                                      onClick={() =>
                                        openSessionDetails(session)
                                      }
                                      title="View gym session details"
                                    >
                                      <FaDumbbell />
                                    </div>
                                  ) : (
                                    <div
                                      key={session.session_id}
                                      style={{
                                        color: '#1976d2',
                                        fontSize: 16,
                                        cursor: 'pointer',
                                        display: 'inline-block',
                                        marginRight: 4,
                                      }}
                                      onClick={() =>
                                        openSessionDetails(session)
                                      }
                                      title="View swim session details"
                                    >
                                      <FaSwimmer />
                                    </div>
                                  )
                                )}
                              </div>
                            </td>
                          );
                        })}
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button
              onClick={closeModal}
              className="modal-close"
              aria-label="Close"
            >
              ✕
            </button>
            <h3 className="modal-title">
              {editMode ? 'Edit Session' : `Add Session for ${selectedDate}`}
            </h3>
            <form onSubmit={handleInsertOrUpdateSession} className="modal-form">
              <div className="table-container">
                <table className="table">
                  <tbody>
                    <tr>
                      <td>
                        <strong>Start Time</strong>
                      </td>
                      <td>
                        <input
                          className="form-input"
                          type="time"
                          value={newStartTime}
                          onChange={e => setNewStartTime(e.target.value)}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>End Time</strong>
                      </td>
                      <td>
                        <input
                          className="form-input"
                          type="time"
                          value={newEndTime}
                          onChange={e => setNewEndTime(e.target.value)}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Title</strong>
                      </td>
                      <td>
                        <input
                          className="form-input"
                          type="text"
                          value={newTitle}
                          onChange={e => setNewTitle(e.target.value)}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Type</strong>
                      </td>
                      <td>
                        <select
                          className="form-input"
                          value={newType}
                          onChange={e =>
                            setNewType(e.target.value as 'Gym' | 'Swim')
                          }
                        >
                          <option value="Swim">Swim</option>
                          <option value="Gym">Gym</option>
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Groups</strong>
                      </td>
                      <td>
                        <input
                          className="form-input"
                          type="text"
                          value={newGroups}
                          onChange={e => setNewGroups(e.target.value)}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Volume</strong>
                      </td>
                      <td>
                        <input
                          className="form-input"
                          type="text"
                          value={newVolume}
                          onChange={e => setNewVolume(e.target.value)}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Description</strong>
                      </td>
                      <td>
                        <textarea
                          className="form-input description-textarea"
                          value={newDesc}
                          onChange={e => setNewDesc(e.target.value)}
                          rows={5}
                          wrap="off"
                          spellCheck={false}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Location</strong>
                      </td>
                      <td>
                        <input
                          className="form-input"
                          type="text"
                          value={newLocation}
                          onChange={e => setNewLocation(e.target.value)}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Pool Name</strong>
                      </td>
                      <td>
                        <input
                          className="form-input"
                          type="text"
                          value={newPoolName}
                          onChange={e => setNewPoolName(e.target.value)}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Pool Length</strong>
                      </td>
                      <td>
                        <input
                          className="form-input"
                          type="text"
                          value={newPoolLength}
                          onChange={e => setNewPoolLength(e.target.value)}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="modal-buttons">
                <button type="submit" className="btn-primary">
                  {editMode ? 'Save' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Session Details Modal */}
      {sessionDetailsOpen && selectedSession && (
        <div className="modal-overlay" onClick={closeSessionDetails}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button
              onClick={closeSessionDetails}
              className="modal-close"
              aria-label="Close"
            >
              ✕
            </button>
            <h3 className="modal-title">Session Details</h3>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { field: 'Date', value: selectedSession.date },
                    { field: 'Start Time', value: selectedSession.starttime },
                    { field: 'End Time', value: selectedSession.endtime },
                    { field: 'Title', value: selectedSession.title },
                    { field: 'Type', value: selectedSession.type },
                    { field: 'Groups', value: selectedSession.groups || '-' },
                    { field: 'Volume', value: selectedSession.volume || '-' },
                    {
                      field: 'Description',
                      value: selectedSession.description || '-',
                    },
                    {
                      field: 'Location',
                      value: selectedSession.location || '-',
                    },
                    {
                      field: 'Pool Name',
                      value: selectedSession.poolname || '-',
                    },
                    {
                      field: 'Pool Length',
                      value: selectedSession.poollength || '-',
                    },
                  ].map(item => (
                    <tr key={item.field}>
                      <td>
                        <strong>{item.field}</strong>
                      </td>
                      <td>
                        {item.field === 'Description' ? (
                          <div className="description-content">
                            {item.value}
                          </div>
                        ) : (
                          item.value
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-buttons">
              <button
                onClick={() => setAttendanceOpen(true)}
                title="Attendance"
                className="athlete-view-btn"
              >
                <img
                  src={attendanceIcon}
                  alt="Attendance"
                  className="athlete-view-icon"
                />
              </button>

              <button
                onClick={() => openEditModal(selectedSession)}
                title="Edit"
                className="athlete-view-btn"
              >
                <img src={editIcon} alt="Edit" className="athlete-view-icon" />
              </button>
              <button
                onClick={handleDeleteSession}
                title="Delete"
                className="athlete-view-btn"
              >
                <img
                  src={deleteIcon}
                  alt="Delete"
                  className="athlete-view-icon"
                />
              </button>
              <button
                onClick={closeSessionDetails}
                title="Close"
                className="athlete-view-btn"
              >
                <img
                  src={closeIcon}
                  alt="Close"
                  className="athlete-view-icon"
                />
              </button>
            </div>
            {attendanceOpen && selectedSession && (
              <AttendanceForm
                sessionId={selectedSession.session_id}
                sessionGroups={selectedSession.groups}
                onClose={() => setAttendanceOpen(false)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default TrainingsCalendar;
