import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

interface ProgressData {
  membersid: number;
  name: string;
  selgroup: string;
  stylesid: number;
  distance: number;
  stroke_shortname: string;
  course: number;
  eventdate_prima: string;
  totaltime_prima: number;
  tempo_prima: string;
  eventdate_dopo: string;
  totaltime_dopo: number;
  tempo_dopo: number;
  delta_sec: number;
  miglioramento_perc: number;
}

const Progress: React.FC = () => {
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('1');
  const [selectedGroup, setSelectedGroup] = useState<string>('ASS');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const courseOptions = [
    { label: '50', value: '1' },
    { label: '25', value: '2' },
  ];

  const groupOptions = [
    { label: 'ASS', value: 'ASS' },
    { label: 'EA', value: 'EA' },
    { label: 'EB', value: 'EB' },
    { label: 'PROP', value: 'PROP' },
  ];

  const fetchProgressData = async () => {
    setLoading(true);
    setError('');

    try {
      console.log('Calling RPC with params:', {
        course_param: parseInt(selectedCourse),
        group_param: selectedGroup,
      });

      // Use the correct parameter names from the hint
      const { data, error } = await supabase.rpc(
        'fn_miglioramenti_tempi_estesa',
        {
          course_param: parseInt(selectedCourse),
          group_param: selectedGroup,
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
          return (b.miglioramento_perc || 0) - (a.miglioramento_perc || 0);
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
  }, [selectedCourse, selectedGroup]);

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

    const sum = validRows.reduce((acc, row) => acc + row.miglioramento_perc, 0);
    return sum / validRows.length;
  };

  const calculateTeamAverage = (data: ProgressData[]) => {
    return calculateAverageImprovement(data);
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Swimming Progress Analysis</h1>
      <h2 className="text-center mb-4">2023-24 to 2024-25</h2>
      <div className="form-group">
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
          className={`btn ${loading ? 'btn-secondary' : 'btn-primary'}`}
        >
          {loading ? 'Loading...' : 'Refresh Data'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-message">Loading progress data...</div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th>Member ID</th>
                <th>Name</th>
                <th>Distance</th>
                <th>Stroke</th>
                <th>Date old</th>
                <th>Time old</th>
                <th>Date now</th>
                <th>Time now</th>
                <th>Delta (sec)</th>
                <th>Impr (%)</th>
              </tr>
            </thead>
            <tbody>
              {progressData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="no-data">
                    No data available for the selected filters
                  </td>
                </tr>
              ) : (
                (() => {
                  const groupedData = groupDataBySwimmer(progressData);
                  const rows: React.ReactElement[] = [];
                  let globalIndex = 0;

                  Object.entries(groupedData).forEach(
                    ([swimmerName, swimmerRows]) => {
                      // Add swimmer's data rows
                      swimmerRows.forEach((row, localIndex) => {
                        rows.push(
                          <tr key={`${swimmerName}-${localIndex}`}>
                            <td>{row.membersid}</td>
                            <td>{row.name}</td>
                            <td>{row.distance}</td>
                            <td>{row.stroke_shortname}</td>
                            <td>{row.eventdate_prima}</td>
                            <td>{row.tempo_prima}</td>
                            <td>{row.eventdate_dopo}</td>
                            <td>{row.tempo_dopo}</td>
                            <td
                              className={`progress-delta ${
                                row.delta_sec < 0
                                  ? 'improvement'
                                  : row.delta_sec > 0
                                    ? 'decline'
                                    : 'neutral'
                              }`}
                            >
                              {row.delta_sec ? row.delta_sec.toFixed(2) : '-'}
                            </td>
                            <td
                              className={`progress-percentage ${
                                row.miglioramento_perc > 0
                                  ? 'improvement'
                                  : row.miglioramento_perc < 0
                                    ? 'decline'
                                    : 'neutral'
                              }`}
                            >
                              {formatPercentage(row.miglioramento_perc)}
                            </td>
                          </tr>
                        );
                        globalIndex++;
                      });

                      // Add average row for this swimmer
                      const avgImprovement =
                        calculateAverageImprovement(swimmerRows);
                      rows.push(
                        <tr
                          key={`${swimmerName}-average`}
                          className="swimmer-average-row"
                        >
                          <td>-</td>
                          <td className="swimmer-average-name">
                            {swimmerName} - Average
                          </td>
                          <td>-</td>
                          <td>-</td>
                          <td>-</td>
                          <td>-</td>
                          <td>-</td>
                          <td>-</td>
                          <td>-</td>
                          <td
                            className={`swimmer-average-percentage ${
                              avgImprovement > 0
                                ? 'text-success'
                                : avgImprovement < 0
                                  ? 'text-danger'
                                  : 'text-muted'
                            }`}
                          >
                            {formatPercentage(avgImprovement)}
                          </td>
                        </tr>
                      );
                      globalIndex++;
                    }
                  );

                  return rows;
                })()
              )}
            </tbody>
          </table>
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
