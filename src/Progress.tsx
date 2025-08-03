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
    <div className="progress-container" style={{ padding: '20px' }}>
      <h1>Swimming Progress Analysis</h1>
      <h2>2023-24 to 2024-25</h2>
      <div
        className="filters"
        style={{
          marginBottom: '20px',
          display: 'flex',
          gap: '20px',
          alignItems: 'center',
        }}
      >
        <div>
          <label
            htmlFor="course-select"
            style={{ marginRight: '10px', fontWeight: 'bold' }}
          >
            Course:
          </label>
          <select
            id="course-select"
            value={selectedCourse}
            onChange={e => setSelectedCourse(e.target.value)}
            style={{
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ccc',
            }}
          >
            {courseOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="group-select"
            style={{ marginRight: '10px', fontWeight: 'bold' }}
          >
            Group:
          </label>
          <select
            id="group-select"
            value={selectedGroup}
            onChange={e => setSelectedGroup(e.target.value)}
            style={{
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ccc',
            }}
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
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Loading...' : 'Refresh Data'}
        </button>
      </div>

      {error && (
        <div
          style={{
            color: 'red',
            marginBottom: '20px',
            padding: '10px',
            backgroundColor: '#ffe6e6',
            borderRadius: '4px',
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          Loading progress data...
        </div>
      ) : (
        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              border: '1px solid #ddd',
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th
                  style={{
                    padding: '12px',
                    border: '1px solid #ddd',
                    textAlign: 'left',
                  }}
                >
                  Member ID
                </th>
                <th
                  style={{
                    padding: '12px',
                    border: '1px solid #ddd',
                    textAlign: 'left',
                  }}
                >
                  Name
                </th>

                <th
                  style={{
                    padding: '12px',
                    border: '1px solid #ddd',
                    textAlign: 'left',
                  }}
                >
                  Distance
                </th>
                <th
                  style={{
                    padding: '12px',
                    border: '1px solid #ddd',
                    textAlign: 'left',
                  }}
                >
                  Stroke
                </th>
                <th
                  style={{
                    padding: '12px',
                    border: '1px solid #ddd',
                    textAlign: 'left',
                  }}
                >
                  Date old
                </th>
                <th
                  style={{
                    padding: '12px',
                    border: '1px solid #ddd',
                    textAlign: 'left',
                  }}
                >
                  Time old
                </th>
                <th
                  style={{
                    padding: '12px',
                    border: '1px solid #ddd',
                    textAlign: 'left',
                  }}
                >
                  Date now
                </th>

                <th
                  style={{
                    padding: '12px',
                    border: '1px solid #ddd',
                    textAlign: 'left',
                  }}
                >
                  Time now
                </th>
                <th
                  style={{
                    padding: '12px',
                    border: '1px solid #ddd',
                    textAlign: 'left',
                  }}
                >
                  Delta (sec)
                </th>
                <th
                  style={{
                    padding: '12px',
                    border: '1px solid #ddd',
                    textAlign: 'left',
                  }}
                >
                  Improvement (%)
                </th>
              </tr>
            </thead>
            <tbody>
              {progressData.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    style={{
                      padding: '20px',
                      textAlign: 'center',
                      color: '#666',
                    }}
                  >
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
                          <tr
                            key={`${swimmerName}-${localIndex}`}
                            style={{
                              backgroundColor:
                                globalIndex % 2 === 0 ? '#f9f9f9' : 'white',
                            }}
                          >
                            <td
                              style={{
                                padding: '8px',
                                border: '1px solid #ddd',
                              }}
                            >
                              {row.membersid}
                            </td>
                            <td
                              style={{
                                padding: '8px',
                                border: '1px solid #ddd',
                              }}
                            >
                              {row.name}
                            </td>
                            <td
                              style={{
                                padding: '8px',
                                border: '1px solid #ddd',
                              }}
                            >
                              {row.distance}
                            </td>
                            <td
                              style={{
                                padding: '8px',
                                border: '1px solid #ddd',
                              }}
                            >
                              {row.stroke_shortname}
                            </td>
                            <td
                              style={{
                                padding: '8px',
                                border: '1px solid #ddd',
                              }}
                            >
                              {row.eventdate_prima}
                            </td>
                            <td
                              style={{
                                padding: '8px',
                                border: '1px solid #ddd',
                              }}
                            >
                              {row.tempo_prima}
                            </td>
                            <td
                              style={{
                                padding: '8px',
                                border: '1px solid #ddd',
                              }}
                            >
                              {row.eventdate_dopo}
                            </td>
                            <td
                              style={{
                                padding: '8px',
                                border: '1px solid #ddd',
                              }}
                            >
                              {row.tempo_dopo}
                            </td>
                            <td
                              style={{
                                padding: '8px',
                                border: '1px solid #ddd',
                                color:
                                  row.delta_sec < 0
                                    ? 'green'
                                    : row.delta_sec > 0
                                      ? 'red'
                                      : 'black',
                                fontWeight: 'bold',
                              }}
                            >
                              {row.delta_sec ? row.delta_sec.toFixed(2) : '-'}
                            </td>
                            <td
                              style={{
                                padding: '8px',
                                border: '1px solid #ddd',
                                color:
                                  row.miglioramento_perc > 0
                                    ? 'green'
                                    : row.miglioramento_perc < 0
                                      ? 'red'
                                      : 'black',
                                fontWeight: 'bold',
                              }}
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
                          style={{
                            backgroundColor: '#e6f3ff',
                            borderBottom: '2px solid #007bff',
                            fontWeight: 'bold',
                          }}
                        >
                          <td
                            style={{ padding: '8px', border: '1px solid #ddd' }}
                          >
                            -
                          </td>
                          <td
                            style={{
                              padding: '8px',
                              border: '1px solid #ddd',
                              fontStyle: 'italic',
                            }}
                          >
                            {swimmerName} - Average
                          </td>
                          <td
                            style={{ padding: '8px', border: '1px solid #ddd' }}
                          >
                            -
                          </td>
                          <td
                            style={{ padding: '8px', border: '1px solid #ddd' }}
                          >
                            -
                          </td>
                          <td
                            style={{ padding: '8px', border: '1px solid #ddd' }}
                          >
                            -
                          </td>
                          <td
                            style={{ padding: '8px', border: '1px solid #ddd' }}
                          >
                            -
                          </td>
                          <td
                            style={{ padding: '8px', border: '1px solid #ddd' }}
                          >
                            -
                          </td>
                          <td
                            style={{ padding: '8px', border: '1px solid #ddd' }}
                          >
                            -
                          </td>
                          <td
                            style={{ padding: '8px', border: '1px solid #ddd' }}
                          >
                            -
                          </td>
                          <td
                            style={{
                              padding: '8px',
                              border: '1px solid #ddd',
                              color:
                                avgImprovement > 0
                                  ? 'green'
                                  : avgImprovement < 0
                                    ? 'red'
                                    : 'black',
                              fontWeight: 'bold',
                              fontSize: '14px',
                            }}
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
          <div
            style={{
              marginTop: '30px',
              padding: '20px',
              backgroundColor: '#f8f9fa',
              border: '2px solid #007bff',
              borderRadius: '8px',
              textAlign: 'center',
            }}
          >
            <h3
              style={{
                margin: '0 0 15px 0',
                color: '#007bff',
                fontSize: '18px',
                fontWeight: 'bold',
              }}
            >
              Team Average - {selectedGroup} Group (
              {courseOptions.find(c => c.value === selectedCourse)?.label}m
              Course)
            </h3>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color:
                  calculateTeamAverage(progressData) > 0
                    ? '#28a745'
                    : calculateTeamAverage(progressData) < 0
                      ? '#dc3545'
                      : '#6c757d',
              }}
            >
              {formatPercentage(calculateTeamAverage(progressData))}
            </div>
            <div
              style={{
                fontSize: '14px',
                color: '#6c757d',
                marginTop: '8px',
              }}
            >
              Based on{' '}
              {
                progressData.filter(row => row.miglioramento_perc != null)
                  .length
              }{' '}
              improvement records
            </div>
          </div>

          {/* Existing summary section */}
          <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
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
