import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import refreshIcon from './assets/icons/icons8-refresh-100.png';

interface ProgressData {
  fincode: number; // integer
  name: string; // text
  selgroup: string; // text
  stylesid: number; // integer
  distance: number; // integer
  stroke_shortname: string; // text
  course: number; // integer
  eventdate_prima: string; // date becomes string in JS
  totaltime_prima: string; // numeric(10,3) becomes string in JS
  tempo_prima: string; // text
  eventdate_dopo: string; // date becomes string in JS
  totaltime_dopo: string; // numeric(10,3) becomes string in JS
  tempo_dopo: string; // text
  delta_sec: string; // numeric(8,2) becomes string in JS
  miglioramento_perc: string; // numeric(8,2) becomes string in JS
}

const Progress: React.FC = () => {
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('1');
  const [selectedGroup, setSelectedGroup] = useState<string>('ASS');
  const [selectedSeason, setSelectedSeason] = useState<string>('2024-25');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // Helper function to safely convert PostgreSQL numeric strings to numbers
  const parseNumeric = (value: string | number): number => {
    if (typeof value === 'number') return value;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Helper function to generate Supabase storage URL for athlete portraits
  const getPortraitUrl = (fincode: number | string): string | null => {
    if (!fincode) return null;
    // Generate the Supabase storage URL using fincode
    console.log('Generating portrait URL for ID:', fincode);
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

  const courseOptions = [
    { label: '25', value: '2' },
    { label: '50', value: '1' },
  ];

  const groupOptions = [
    { label: 'ASS', value: 'ASS' },
    { label: 'EA', value: 'EA' },
    { label: 'EB', value: 'EB' },
    { label: 'PROP', value: 'PROP' },
  ];

  const seasonOptions = [
    { label: '2023-24', value: '2023-24' },
    { label: '2024-25', value: '2024-25' },
    { label: '2025-26', value: '2025-26' },
  ];

  const fetchProgressData = async () => {
    setLoading(true);
    setError('');
    setImageErrors(new Set()); // Clear previous image errors

    try {
      console.log('Calling RPC with params:', {
        course_param: parseInt(selectedCourse),
        group_param: selectedGroup,
        season_param: selectedSeason,
      });

      // Call the updated function with season support
      const { data, error } = await supabase.rpc(
        'fn_miglioramenti_tempi_estesa',
        {
          course_param: parseInt(selectedCourse),
          group_param: selectedGroup,
          season_param: selectedSeason,
        }
      );

      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      // Sort data by name first, then by improvement percentage descending
      const sortedData = (data || []).sort(
        (a: ProgressData, b: ProgressData) => {
          // First sort by name (ascending)
          if (a.name < b.name) return -1;
          if (a.name > b.name) return 1;

          // If names are equal, sort by improvement percentage (descending)
          const aPerc = parseNumeric(a.miglioramento_perc);
          const bPerc = parseNumeric(b.miglioramento_perc);
          return bPerc - aPerc;
        }
      );

      setProgressData(sortedData);
    } catch (err: any) {
      console.error('Error fetching progress data:', err);

      // More detailed error message
      let errorMessage = 'Failed to fetch progress data. ';
      if (err.message) {
        errorMessage += `Error: ${err.message}`;
      }
      if (err.code) {
        errorMessage += ` (Code: ${err.code})`;
      }
      if (err.details) {
        errorMessage += ` Details: ${err.details}`;
      }
      if (err.hint) {
        errorMessage += ` Hint: ${err.hint}`;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgressData();
  }, [selectedCourse, selectedGroup, selectedSeason]);

  const formatPercentage = (percentage: number) => {
    if (!percentage) return '-';
    return `${percentage.toFixed(2)}%`;
  };

  // Group data by swimmer and calculate averages
  const groupDataBySwimmer = (data: ProgressData[]) => {
    const grouped: { [key: string]: ProgressData[] } = {};

    data.forEach(row => {
      if (!grouped[row.name]) {
        grouped[row.name] = [];
      }
      grouped[row.name].push(row);
    });

    return grouped;
  };

  const calculateAverageImprovement = (rows: ProgressData[]) => {
    const validRows = rows.filter(row => row.miglioramento_perc != null);
    if (validRows.length === 0) return 0;

    const sum = validRows.reduce((acc, row) => acc + parseNumeric(row.miglioramento_perc), 0);
    return sum / validRows.length;
  };

  const calculateTeamAverage = (data: ProgressData[]) => {
    return calculateAverageImprovement(data);
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Swimming Progress Analysis</h1>
      <h2 className="text-center mb-4">{selectedSeason}</h2>
      <div className="form-group">
        <div>
          <label htmlFor="season-select" className="form-label">
            Season:
          </label>
          <select
            id="season-select"
            value={selectedSeason}
            onChange={e => setSelectedSeason(e.target.value)}
            className="form-select ml-1"
          >
            {seasonOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="course-select" className="form-label">
            Course:
          </label>
          <select
            id="course-select"
            value={selectedCourse}
            onChange={e => setSelectedCourse(e.target.value)}
            className="form-select ml-1"
          >
            {courseOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="group-select" className="form-label">
            Group:
          </label>
          <select
            id="group-select"
            value={selectedGroup}
            onChange={e => setSelectedGroup(e.target.value)}
            className="form-select ml-1"
          >
            {groupOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={fetchProgressData}
          disabled={loading}
          className="athlete-view-btn"
        >
                <img
                  src={refreshIcon}
                  alt="Refresh"
                  className="athlete-view-icon"
                />
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-message">Loading progress data...</div>
      ) : (
        <div className="progress-swimmers-container">
          {progressData.length === 0 ? (
            <div className="no-data" style={{ textAlign: 'center', padding: '2rem' }}>
              No data available for the selected filters
            </div>
          ) : (
            (() => {
              const groupedData = groupDataBySwimmer(progressData);
              
              return Object.entries(groupedData).map(([swimmerName, swimmerRows]) => {
                const avgImprovement = calculateAverageImprovement(swimmerRows);
                const fincode = swimmerRows[0]?.fincode;
                const athleteKey = fincode?.toString() || 'unknown';
                const hasImageError = imageErrors.has(athleteKey);
                const portraitUrl = fincode ? getPortraitUrl(fincode) : null;
                
                console.log('Debug swimmer:', {
                  swimmerName,
                  fincode,
                  athleteKey,
                  hasImageError,
                  portraitUrl
                });

                return (
                  <div key={swimmerName} className="swimmer-section" style={{
                    marginBottom: '2rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}>
                    {/* Swimmer Header */}
                    <div style={{
                      background: 'linear-gradient(to right, #f8f9fa, #e9ecef)',
                      padding: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      borderBottom: '1px solid #ddd'
                    }}>
                      {/* Portrait */}
                      <div style={{ 
                        flexShrink: 0,
                        width: '60px',
                        height: '60px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {portraitUrl && !hasImageError ? (
                          <img
                            src={portraitUrl}
                            alt={swimmerName ?? 'Athlete portrait'}
                            style={{
                              width: '60px',
                              height: '60px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '2px solid #007acc',
                              display: 'block'
                            }}
                            referrerPolicy="no-referrer"
                            onLoad={() => {
                              console.log(`Portrait loaded successfully for ${swimmerName} from ${portraitUrl}`);
                            }}
                            onError={() => {
                              console.log(
                                `Failed to load portrait for athlete ${swimmerName} (fincode: ${fincode}) from URL: ${portraitUrl}`
                              );
                              handleImageError(fincode);
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            border: '2px solid #007acc',
                            background: '#007acc',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: 'bold'
                          }}>
                            {(swimmerName || 'A').substring(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      
                      {/* Name and Average */}
                      <div style={{ flex: 1 }}>
                        <h3 style={{
                          margin: 0,
                          fontSize: '1.25rem',
                          fontWeight: '600',
                          color: '#333'
                        }}>
                          {swimmerName}
                        </h3>
                        <div style={{
                          fontSize: '1rem',
                          color: avgImprovement > 0 ? '#28a745' : avgImprovement < 0 ? '#dc3545' : '#6c757d',
                          fontWeight: '600',
                          marginTop: '0.25rem'
                        }}>
                          Global Average: {formatPercentage(avgImprovement)}
                        </div>
                      </div>
                      
                      {/* Stats Summary */}
                      <div style={{
                        textAlign: 'right',
                        fontSize: '0.9rem',
                        color: '#666'
                      }}>
                        <div>{swimmerRows.length} events</div>
                        <div>ID: {fincode}</div>
                      </div>
                    </div>

                    {/* Events Table */}
                    <div className="table-container">
                      <table className="table" style={{ margin: 0, tableLayout: 'auto' }}>
                        <thead className="table-header">
                          <tr>
                            <th>Distance</th>
                            <th>Stroke</th>
                            <th>Date Before</th>
                            <th>Time Before</th>
                            <th>Date After</th>
                            <th>Time After</th>
                            <th>Delta (sec)</th>
                            <th>Improvement (%)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {swimmerRows.map((row, index) => (
                            <tr key={`${swimmerName}-${index}`}>
                              <td>{row.distance}m</td>
                              <td>{row.stroke_shortname}</td>
                              <td>{row.eventdate_prima}</td>
                              <td>{row.tempo_prima}</td>
                              <td>{row.eventdate_dopo}</td>
                              <td>{row.tempo_dopo}</td>
                              <td
                                className={`progress-delta ${
                                  parseNumeric(row.delta_sec) < 0
                                    ? 'improvement'
                                    : parseNumeric(row.delta_sec) > 0
                                      ? 'decline'
                                      : 'neutral'
                                }`}
                              >
                                {row.delta_sec ? parseNumeric(row.delta_sec).toFixed(2) : '-'}
                              </td>
                              <td
                                className={`progress-percentage ${
                                  parseNumeric(row.miglioramento_perc) > 0
                                    ? 'improvement'
                                    : parseNumeric(row.miglioramento_perc) < 0
                                      ? 'decline'
                                      : 'neutral'
                                }`}
                              >
                                {formatPercentage(parseNumeric(row.miglioramento_perc))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              });
            })()
          )}
        </div>
      )}

      {progressData.length > 0 && (
        <>
          {/* Team Average Section */}
          <div className="team-average-container">
            <h3 className="team-average-title">
              Team Average - {selectedGroup} Group (
              {courseOptions.find(c => c.value === selectedCourse)?.label}m
              Course)
            </h3>
            <div
              className={`team-average-value ${
                calculateTeamAverage(progressData) > 0
                  ? 'text-success'
                  : calculateTeamAverage(progressData) < 0
                    ? 'text-danger'
                    : 'text-muted'
              }`}
            >
              {formatPercentage(calculateTeamAverage(progressData))}
            </div>
            <div className="team-average-note">
              Based on{' '}
              {
                progressData.filter(row => row.miglioramento_perc != null)
                  .length
              }{' '}
              improvement records
            </div>
          </div>

          {/* Existing summary section */}
          <div className="summary-section">
            <p>Showing {progressData.length} records</p>
            <p>
              <strong>Note:</strong> Green values indicate improvement, red
              values indicate decline
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default Progress;
