import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import refreshIcon from './assets/icons/icons8-refresh-100.png';

interface ProgressData {
  membersid: number; // bigint from PostgreSQL becomes number in JS
  name: string; // text
  selgroup: string; // text
  stylesid: number; // integer
  distance: number; // bigint from PostgreSQL becomes number in JS
  stroke_shortname: string; // text
  course: number; // integer
  eventdate_prima: string; // date becomes string in JS
  totaltime_prima: string; // numeric becomes string in JS
  tempo_prima: string; // text
  eventdate_dopo: string; // date becomes string in JS
  totaltime_dopo: string; // numeric becomes string in JS
  tempo_dopo: string; // text
  delta_sec: number; // Actually returning bigint, not numeric
  miglioramento_perc: string; // numeric becomes string in JS
}

const Progress: React.FC = () => {
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('1');
  const [selectedGroup, setSelectedGroup] = useState<string>('ASS');
  const [selectedSeason, setSelectedSeason] = useState<string>('2024-25');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Helper function to safely convert PostgreSQL numeric strings to numbers
  const parseNumeric = (value: string | number): number => {
    if (typeof value === 'number') return value;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

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

  const seasonOptions = [
    { label: '2023-24', value: '2023-24' },
    { label: '2024-25', value: '2024-25' },
    { label: '2025-26', value: '2025-26' },
  ];

  const fetchProgressData = async () => {
    setLoading(true);
    setError('');

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
                  let globalIndex = 0; // eslint-disable-line @typescript-eslint/no-unused-vars

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
