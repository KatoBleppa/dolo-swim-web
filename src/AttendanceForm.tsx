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
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // Helper function to generate Supabase storage URL for athlete portraits
  const getPortraitUrl = (fincode: number | string): string | null => {
    if (!fincode) {
      return null;
    }

    // Generate the Supabase storage URL using fincode
    return `https://rxwlwfhytiwzvntpwlyj.supabase.co/storage/v1/object/public/PortraitPics/${fincode}.jpg`;
  };

  // Helper function to handle image errors
  const handleImageError = (fincode: number | string) => {
    const key = fincode?.toString() || 'unknown';
    setImageErrors(prev => new Set([...prev, key]));
    console.log(
      `Portrait not found in Supabase storage for fincode: ${fincode}. Using default avatar.`
    );
  };

  // Helper function to count attendance statuses
  const getStatusCounts = () => {
    const counts = { P: 0, J: 0, A: 0, N: 0 };
    athletes.forEach(athlete => {
      const status = athlete.status || 'N';
      if (status in counts) {
        counts[status as keyof typeof counts]++;
      }
    });
    return counts;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setImageErrors(new Set()); // Clear previous image errors
      try {
        // First, get the session date to determine the season
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .select('date')
          .eq('session_id', sessionId)
          .single();

        if (sessionError) throw sessionError;

        const sessionDate = sessionData.date;

        // Find the season that contains this session date
        const { data: seasonsData, error: seasonsError } = await supabase
          .from('_seasons')
          .select('description, seasonstart, seasonend')
          .lte('seasonstart', sessionDate)
          .gte('seasonend', sessionDate)
          .single();

        if (seasonsError) {
          console.error('Season lookup error:', seasonsError);
          throw new Error(
            'Could not determine season for session date: ' + sessionDate
          );
        }

        const seasonDescription = seasonsData.description;
        console.log(
          'Found season:',
          seasonDescription,
          'for date:',
          sessionDate
        );

        // Use the get_athletes_with_rosters function with season and groups
        const { data: athletesData, error: athletesError } = await supabase.rpc(
          'get_athletes_with_rosters',
          {
            paramseason: seasonDescription,
            paramgroups: sessionGroups,
          }
        );

        if (athletesError) throw athletesError;

        const athletes = athletesData || [];
        console.log('Athletes from function:', athletes);

        // Sort athletes by name
        athletes.sort((a: Athlete, b: Athlete) => a.name.localeCompare(b.name));

        // Fetch attendance for the session
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('attendance')
          .select('fincode, status')
          .eq('session_id', sessionId);
        if (attendanceError) throw attendanceError;

        // Merge attendance status into athletes
        const merged = athletes.map((athlete: Athlete) => {
          const attendance = attendanceData?.find(
            a => a.fincode === athlete.fincode
          );
          return { ...athlete, status: attendance ? attendance.status : 'N' };
        });

        setAthletes(merged);
      } catch (err) {
        console.error('Failed to fetch athletes or attendance:', err);
        alert('Error: ' + (err as Error).message);
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

  const statusCounts = getStatusCounts();

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
              <table className="table" style={{ tableLayout: 'auto' }}>
                <thead className="table-header">
                  <tr>
                    <th>Photo</th>
                    <th>Name</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {athletes.map(athlete => {
                    const athleteKey =
                      athlete.fincode?.toString() || athlete.name || 'unknown';
                    const hasImageError = imageErrors.has(athleteKey);
                    const portraitUrl = athlete.fincode
                      ? getPortraitUrl(athlete.fincode)
                      : null;

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
                          {portraitUrl && !hasImageError ? (
                            <img
                              src={portraitUrl}
                              alt={athlete.name}
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '20px',
                                objectFit: 'cover',
                              }}
                              onError={e => {
                                console.log(
                                  `Failed to load portrait for athlete ${athlete.name} (fincode: ${athlete.fincode})`
                                );
                                handleImageError(athlete.fincode);
                                e.currentTarget.src =
                                  'https://ui-avatars.com/api/?name=Avatar&background=cccccc&color=ffffff&size=40';
                              }}
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

            {/* Live Counter */}
            <div
              style={{
                marginTop: '15px',
                padding: '10px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #dee2e6',
              }}
            >
              <h4
                style={{
                  margin: '0 0 10px 0',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  color: '#333',
                }}
              >
                Attendance Summary
              </h4>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-around',
                  textAlign: 'center',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: '#28a745',
                    }}
                  >
                    {statusCounts.P}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Present</div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: '#ffc107',
                    }}
                  >
                    {statusCounts.J}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    Justified
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: '#dc3545',
                    }}
                  >
                    {statusCounts.A}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Absent</div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: '#6c757d',
                    }}
                  >
                    {statusCounts.N}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Not Set</div>
                </div>
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
