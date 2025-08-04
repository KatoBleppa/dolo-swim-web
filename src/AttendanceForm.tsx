import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

interface Athlete {
  fincode: number;
  name: string;
  photo?: string;
  groups?: string;
  status?: string;
}

interface AttendanceFormProps {
  sessionId: number;
  sessionGroups?: string;
  onClose: () => void;
}

const statusColors: Record<string, string> = {
  N: '#e0e0e0', // Not set (gray)
  P: '#b6eab6', // Present (green)
  J: '#fff7b2', // Justified (yellow)
  A: '#f7b6b6', // Absent (red)
};

function cycleStatus(currentStatus?: string) {
  switch (currentStatus) {
    case 'N':
    case undefined:
      return 'P';
    case 'P':
      return 'J';
    case 'J':
      return 'A';
    case 'A':
    default:
      return 'N';
  }
}

const AttendanceForm: React.FC<AttendanceFormProps> = ({
  sessionId,
  sessionGroups,
  onClose,
}) => {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch athletes for the group(s)
        let { data: athletes, error: athletesError } = await supabase
          .from('athletes')
          .select('fincode, name, photo, groups');
        if (athletesError) throw athletesError;
        let filtered = athletes || [];
        if (sessionGroups && sessionGroups.trim() !== '') {
          const groupList = sessionGroups
            .split(',')
            .map(g => g.trim().toUpperCase());
          filtered = filtered.filter((athlete: Athlete) => {
            if (!athlete.groups) return false;
            const athleteGroups = athlete.groups
              .split(',')
              .map((t: string) => t.trim().toUpperCase());
            return groupList.some(g => athleteGroups.includes(g));
          });
        }
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        // Fetch attendance for the session
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('attendance')
          .select('fincode, status')
          .eq('session_id', sessionId);
        if (attendanceError) throw attendanceError;
        // Merge attendance status into athletes
        const merged = filtered.map(athlete => {
          const attendance = attendanceData?.find(
            a => a.fincode === athlete.fincode
          );
          return { ...athlete, status: attendance ? attendance.status : 'N' };
        });
        setAthletes(merged);
      } catch (err) {
        console.error('Failed to fetch athletes or attendance:', err);
      }
      setLoading(false);
    };
    fetchData();
  }, [sessionId, sessionGroups]);

  const handleNameClick = (fincode: number) => {
    setAthletes(prev =>
      prev.map(athlete =>
        athlete.fincode === fincode
          ? { ...athlete, status: cycleStatus(athlete.status) }
          : athlete
      )
    );
  };

  const handleSave = async () => {
    try {
      // Fetch current records for this session
      const { data: existingRecords, error: fetchError } = await supabase
        .from('attendance')
        .select('fincode')
        .eq('session_id', sessionId);
      if (fetchError) throw fetchError;
      // Determine fincodes that need deletion
      const fincodesToDelete = athletes
        .filter(
          a =>
            a.status === 'N' &&
            existingRecords?.some(r => r.fincode === a.fincode)
        )
        .map(a => a.fincode);
      if (fincodesToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('attendance')
          .delete()
          .in('fincode', fincodesToDelete)
          .eq('session_id', sessionId);
        if (deleteError) throw deleteError;
      }
      // Prepare attendance records for upsert, excluding those with status 'N'
      const attendanceRecords = athletes
        .filter(athlete => athlete.status && athlete.status !== 'N')
        .map(athlete => ({
          session_id: sessionId,
          fincode: athlete.fincode,
          status: athlete.status,
        }));
      const { error } = await supabase
        .from('attendance')
        .upsert(attendanceRecords, { onConflict: 'session_id,fincode' });
      if (error) throw error;
      alert('Attendance has been saved successfully.');
      onClose();
    } catch (err) {
      console.error('Failed to save attendance:', err);
      alert('Failed to save attendance.');
    }
  };

  return (
    <div className="modal-overlay">
      <div
        className="modal-content"
        style={{ minWidth: 340, maxHeight: 900, height: 800, maxWidth: 500 }}
      >
        <h3 className="modal-title">Attendance</h3>
        {loading ? (
          <div className="loading-message">Loading athletes...</div>
        ) : (
          <div>
            <div className="table-container">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th>Photo</th>
                    <th>Name</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {athletes.map(athlete => {
                    // Convert Google Drive URLs to direct links
                    let photoUrl = athlete.photo;
                    if (photoUrl && photoUrl.includes('drive.google.com')) {
                      const fileIdMatch = photoUrl.match(
                        /\/d\/([a-zA-Z0-9_-]+)/
                      );
                      if (fileIdMatch) {
                        photoUrl = `https://drive.google.com/uc?id=${fileIdMatch[1]}`;
                      }
                    }
                    return (
                      <tr
                        key={athlete.fincode}
                        style={{
                          backgroundColor: statusColors[athlete.status || 'N'],
                          cursor: 'pointer',
                        }}
                        onClick={() => handleNameClick(athlete.fincode)}
                      >
                        <td
                          style={{ padding: '8px', border: '1px solid #ddd' }}
                        >
                          {photoUrl ? (
                            <img
                              src={photoUrl}
                              alt={athlete.name}
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '20px',
                                objectFit: 'cover',
                              }}
                              onError={e =>
                                (e.currentTarget.src =
                                  'https://ui-avatars.com/api/?name=Avatar&background=cccccc&color=ffffff&size=40')
                              }
                            />
                          ) : (
                            <img
                              src={
                                'https://ui-avatars.com/api/?name=Avatar&background=cccccc&color=ffffff&size=40'
                              }
                              alt="Default avatar"
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '20px',
                                objectFit: 'cover',
                              }}
                            />
                          )}
                        </td>
                        <td
                          style={{
                            padding: '8px',
                            border: '1px solid #ddd',
                            fontWeight: 'bold',
                            fontSize: '16px',
                          }}
                        >
                          {athlete.name}
                        </td>
                        <td
                          style={{
                            padding: '8px',
                            border: '1px solid #ddd',
                            fontWeight: 'bold',
                            textAlign: 'center',
                          }}
                        >
                          {athlete.status || 'N'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="legend">
              <div className="legend-item">
                <div
                  className="legend-color"
                  style={{ backgroundColor: '#e0e0e0' }}
                ></div>
                <span className="legend-text">N - Not Set</span>
              </div>
              <div className="legend-item">
                <div
                  className="legend-color"
                  style={{ backgroundColor: '#b6eab6' }}
                ></div>
                <span className="legend-text">P - Present</span>
              </div>
              <div className="legend-item">
                <div
                  className="legend-color"
                  style={{ backgroundColor: '#fff7b2' }}
                ></div>
                <span className="legend-text">J - Justified</span>
              </div>
              <div className="legend-item">
                <div
                  className="legend-color"
                  style={{ backgroundColor: '#f7b6b6' }}
                ></div>
                <span className="legend-text">A - Absent</span>
              </div>
            </div>

            <div
              style={{
                marginTop: '10px',
                fontSize: '14px',
                color: '#666',
                textAlign: 'center',
              }}
            >
              <p>
                <strong>
                  Click on any row to cycle through attendance status
                </strong>
              </p>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-danger"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="btn btn-success"
              >
                Save Attendance
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceForm;
