import './styles/Dashboard.css';
import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

interface Meet {
  mindate: string;
  maxdate: string;
  meetname: string;
  place: string;
  course: number;
  groups: string[];
}

interface Session {
  date: string;
  starttime: string;
  type: string;
  groups: string;
}

interface SeasonSummary {
  season: string;
  totalKm: number;
  totalSessions: number;
  averageKm: number;
  eventCount: number;
}

const Dashboard = () => {
  const [nextEvents, setNextEvents] = useState<Meet[]>([]);
  const [nextWorkouts, setNextWorkouts] = useState<Session[]>([]);
  const [seasonSummaries, setSeasonSummaries] = useState<SeasonSummary[]>([]);
  const [seasonFilter, setSeasonFilter] = useState<string>('ASS');
  const [loading, setLoading] = useState(true);
  const [workoutLoading, setWorkoutLoading] = useState(true);
  const [seasonLoading, setSeasonLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workoutError, setWorkoutError] = useState<string | null>(null);
  const [seasonError, setSeasonError] = useState<string | null>(null);

  // Helper function to format date as dd.mm.yyyy
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  useEffect(() => {
    const fetchNextEvents = async () => {
      try {
        setLoading(true);
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
          .from('meets_teammanager')
          .select('mindate, maxdate, meetname, place, course, groups')
          .gte('mindate', today)
          .order('mindate', { ascending: true })
          .limit(2);

        if (error) {
          setError(error.message);
        } else {
          setNextEvents(data || []);
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    const fetchNextWorkouts = async () => {
      try {
        setWorkoutLoading(true);
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
          .from('sessions')
          .select('date, starttime, type, groups')
          .gte('date', today)
          .order('date', { ascending: true })
          .order('starttime', { ascending: true })
          .limit(2);

        if (error) {
          setWorkoutError(error.message);
        } else {
          setNextWorkouts(data || []);
        }
      } catch (err: any) {
        setWorkoutError(err.message || 'An error occurred');
      } finally {
        setWorkoutLoading(false);
      }
    };

    const fetchSeasonSummaries = async () => {
      try {
        setSeasonLoading(true);
        const summaries: SeasonSummary[] = [];

        // First, get the latest date from sessions table to determine which seasons to include
        const { data: latestSessionData, error: latestSessionError } =
          await supabase
            .from('sessions')
            .select('date')
            .order('date', { ascending: false })
            .limit(1);

        if (latestSessionError) {
          console.error('Error fetching latest session:', latestSessionError);
          setSeasonError('Error fetching latest session data');
          return;
        }

        if (!latestSessionData || latestSessionData.length === 0) {
          console.log('No sessions found in database');
          setSeasonSummaries([]);
          return;
        }

        const latestDate = latestSessionData[0].date;
        console.log(`Latest session date: ${latestDate}`);

        // Parse the latest date to determine the latest season to include
        const latestDateObj = new Date(latestDate);
        const latestYear = latestDateObj.getFullYear();
        const latestMonth = latestDateObj.getMonth() + 1; // getMonth() is 0-indexed

        // Determine the latest season to include based on the latest session date
        let endYear: number;
        if (latestMonth >= 9) {
          // If latest session is in September or later, include that season (e.g., Sept 2024 -> include 2024/2025 season)
          endYear = latestYear;
        } else {
          // If latest session is before September, include the previous season (e.g., Aug 2024 -> include 2023/2024 season)
          endYear = latestYear - 1;
        }

        console.log(
          `Latest session: ${latestDate} (Year: ${latestYear}, Month: ${latestMonth})`
        );
        console.log(`End year for seasons: ${endYear}`);

        // Generate seasons starting from 2023-09-01 up to the determined end year
        for (let year = 2023; year <= endYear; year++) {
          const seasonStart = `${year}-09-01`;
          const seasonEnd = `${year + 1}-08-31`;
          const seasonLabel = `${year}/${year + 1}`;

          console.log(
            `Processing season ${seasonLabel}: ${seasonStart} to ${seasonEnd}`
          );

          // Fetch total volume from sessions
          const { data: volumeData, error: volumeError } = await supabase
            .from('sessions')
            .select('volume')
            .eq('groups', seasonFilter)
            .gte('date', seasonStart)
            .lte('date', seasonEnd);

          if (volumeError) {
            console.error(
              `Error fetching volume for ${seasonLabel}:`,
              volumeError
            );
            continue;
          }

          // Fetch swim sessions count separately
          const { data: swimSessionsData, error: swimSessionsError } =
            await supabase
              .from('sessions')
              .select('session_id', { count: 'exact' })
              .eq('type', 'Swim')
              .eq('groups', seasonFilter)
              .gte('date', seasonStart)
              .lte('date', seasonEnd);

          if (swimSessionsError) {
            console.error(
              `Error fetching swim sessions for ${seasonLabel}:`,
              swimSessionsError
            );
            continue;
          }

          console.log(`Volume data for ${seasonLabel}:`, volumeData);
          console.log(
            `Swim sessions data for ${seasonLabel}:`,
            swimSessionsData
          );

          const totalKm =
            (volumeData?.reduce(
              (sum, session) => sum + (session.volume || 0),
              0
            ) || 0) / 1000; // Convert from meters to kilometers

          const totalSessions = swimSessionsData?.length || 0;
          const averageKm = totalSessions > 0 ? totalKm / totalSessions : 0;

          // Fetch event count from meets_teammanager
          const { data: eventsData, error: eventsError } = await supabase
            .from('meets_teammanager')
            .select('meetsid', { count: 'exact' })
            .contains('groups', [seasonFilter])
            .gte('mindate', seasonStart)
            .lte('maxdate', seasonEnd);

          if (eventsError) {
            console.error(
              `Error fetching events for ${seasonLabel}:`,
              eventsError
            );
            continue;
          }

          const eventCount = eventsData?.length || 0;

          summaries.push({
            season: seasonLabel,
            totalKm: totalKm,
            totalSessions: totalSessions,
            averageKm: averageKm,
            eventCount: eventCount,
          });

          console.log(
            `Added summary for ${seasonLabel}: ${totalKm} km, ${totalSessions} sessions, ${averageKm.toFixed(1)} avg km, ${eventCount} events`
          );
        }

        setSeasonSummaries(summaries);
      } catch (err: any) {
        console.error('Season summary error:', err);
        setSeasonError(err.message || 'An error occurred');
      } finally {
        setSeasonLoading(false);
      }
    };

    fetchNextEvents();
    fetchNextWorkouts();
    fetchSeasonSummaries();
  }, [seasonFilter]);
  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>
      <div className="dashboard-links">
        <div
          style={{
            display: 'flex',
            gap: '2rem',
            justifyContent: 'center',
            background: 'linear-gradient(to right, #e0e0e0, #f5f5f5)',
            borderRadius: '8px',
            marginBottom: '1rem',
            padding: '1rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <h2>Next Events</h2>
            {loading ? (
              <p>Loading events...</p>
            ) : error ? (
              <p style={{ color: 'red' }}>Error: {error}</p>
            ) : nextEvents.length === 0 ? (
              <p>No upcoming events found.</p>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '1rem',
                  width: '100%',
                  maxWidth: '800px'
                }}
              >
                {nextEvents.map((event, index) => (
                  <div
                    key={index}
                    style={{
                      background: 'white',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      padding: '1rem',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                    }}
                  >
                    <div style={{ 
                      fontSize: '1.1rem', 
                      fontWeight: 'bold', 
                      marginBottom: '0.5rem',
                      color: '#333'
                    }}>
                      {event.meetname}
                    </div>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.5rem',
                      fontSize: '0.9rem'
                    }}>
                      <div>
                        <strong>Start:</strong><br />
                        {formatDate(event.mindate)}
                      </div>
                      <div>
                        <strong>End:</strong><br />
                        {formatDate(event.maxdate)}
                      </div>
                      <div>
                        <strong>City:</strong><br />
                        {event.place}
                      </div>
                      <div>
                        <strong>Course:</strong><br />
                        {event.course === 1
                          ? '50m'
                          : event.course === 2
                            ? '25m'
                            : event.course}
                      </div>
                    </div>
                    <div style={{ 
                      marginTop: '0.5rem',
                      fontSize: '0.9rem'
                    }}>
                      <strong>Groups:</strong><br />
                      <span style={{ 
                        color: '#666',
                        fontStyle: event.groups && event.groups.length > 0 ? 'normal' : 'italic'
                      }}>
                        {event.groups ? event.groups.join(', ') : 'No groups specified'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="dashboard-links">
        <div
          style={{
            display: 'flex',
            gap: '2rem',
            justifyContent: 'center',
            background: 'linear-gradient(to right, #e0e0e0, #f5f5f5)',
            borderRadius: '8px',
            marginBottom: '1rem',
            padding: '1rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <h2>Next Workouts</h2>
            {workoutLoading ? (
              <p>Loading workouts...</p>
            ) : workoutError ? (
              <p style={{ color: 'red' }}>Error: {workoutError}</p>
            ) : nextWorkouts.length === 0 ? (
              <p>No upcoming workouts found.</p>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '1rem',
                  width: '100%',
                  maxWidth: '800px'
                }}
              >
                {nextWorkouts.map((workout, index) => (
                  <div
                    key={index}
                    style={{
                      background: 'white',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      padding: '1rem',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                    }}
                  >
                    <div style={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.75rem'
                    }}>
                      <div style={{ 
                        fontSize: '1.1rem', 
                        fontWeight: 'bold',
                        color: '#333'
                      }}>
                        {workout.type}
                      </div>
                      <div style={{
                        fontSize: '1rem',
                        color: '#007acc',
                        fontWeight: '600'
                      }}>
                        {workout.starttime.substring(0, 5)}
                      </div>
                    </div>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.5rem',
                      fontSize: '0.9rem',
                      marginBottom: '0.5rem'
                    }}>
                      <div>
                        <strong>Date:</strong><br />
                        {formatDate(workout.date)}
                      </div>
                      <div>
                        <strong>Groups:</strong><br />
                        <span style={{ 
                          color: '#666',
                          fontStyle: workout.groups ? 'normal' : 'italic'
                        }}>
                          {workout.groups || 'No groups specified'}
                        </span>
                      </div>
                    </div>
                    <div style={{
                      borderTop: '1px solid #eee',
                      paddingTop: '0.5rem',
                      fontSize: '0.8rem',
                      color: '#888',
                      textAlign: 'center'
                    }}>
                      Training Session
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="dashboard-links">
        <div
          style={{
            display: 'flex',
            gap: '2rem',
            justifyContent: 'center',
            background: 'linear-gradient(to right, #e0e0e0, #f5f5f5)',
            borderRadius: '8px',
            marginBottom: '1rem',
            padding: '1rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <h2>Season Summaries</h2>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="season-filter" style={{ marginRight: '0.5rem' }}>
                Filter by Group:
              </label>
              <select
                id="season-filter"
                value={seasonFilter}
                onChange={e => setSeasonFilter(e.target.value)}
                style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  fontSize: '14px',
                }}
              >
                <option value="ASS">ASS</option>
                <option value="EA">EA</option>
                <option value="EB">EB</option>
                <option value="PROP">PROP</option>
              </select>
            </div>
            {seasonLoading ? (
              <p>Loading season summaries...</p>
            ) : seasonError ? (
              <p style={{ color: 'red' }}>Error: {seasonError}</p>
            ) : seasonSummaries.length === 0 ? (
              <p>No season data found.</p>
            ) : (
              <div
                className="table-container"
                style={{ width: '100%', maxWidth: '600px' }}
              >
                <table className="table" style={{ tableLayout: 'auto' }}>
                  <thead className="table-header">
                    <tr>
                      <th>Season</th>
                      <th>Total KM</th>
                      <th>Sessions</th>
                      <th>Avg KM</th>
                      <th>Events</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seasonSummaries.map((summary, index) => (
                      <tr key={index}>
                        <td>{summary.season}</td>
                        <td>{summary.totalKm.toFixed(1)} km</td>
                        <td>{summary.totalSessions}</td>
                        <td>{summary.averageKm.toFixed(1)} km</td>
                        <td>{summary.eventCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
