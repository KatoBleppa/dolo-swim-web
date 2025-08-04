import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

interface ResultsTeamManager {
  [key: string]: any; // Since we don't know the exact structure, we'll use a flexible interface
}

const Results: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [meets, setMeets] = useState<{ id: any; name: string }[]>([]);
  const [selectedMeet, setSelectedMeet] = useState<string>('');
  const [filteredResults, setFilteredResults] = useState<ResultsTeamManager[]>(
    []
  );
  const [selectedMeetDetails, setSelectedMeetDetails] = useState<any | null>(
    null
  );
  const [allMeetsData, setAllMeetsData] = useState<any[]>([]);

  useEffect(() => {
    const fetchMeets = async () => {
      try {
        const { data, error } = await supabase
          .from('meets_teammanager')
          .select('*')
          .order('mindate', { ascending: true });

        if (error) {
          console.error('Supabase error when fetching meets:', error);
          throw error;
        }

        console.log('Raw meets data from database:', data);

        // Extract meet names and IDs from the meets table
        const meetData = (data || [])
          .map(meet => {
            // Try common field names for meet names
            const possibleName =
              meet.meetname ||
              meet.name ||
              meet.title ||
              meet.meet_name ||
              meet.meetName;

            // Try common field names for meet IDs
            const possibleId =
              meet.meetsid || meet.id || meet.meet_id || meet.meetId;

            return possibleName && possibleId
              ? { id: possibleId, name: String(possibleName) }
              : null;
          })
          .filter((meet): meet is { id: any; name: string } => meet !== null);

        setMeets(meetData);
        setAllMeetsData(data || []);
      } catch (err: any) {
        console.error('Error fetching meets:', err.message);
        setMeets([]);
      }
    };

    fetchMeets();
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      // Don't fetch anything if no meet is selected
      if (!selectedMeet) {
        setFilteredResults([]);
        setColumns([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let data, error;

        // First, let's check what's actually in the results_overview table for debugging
        const debugResponse = await supabase
          .from('results_overview')
          .select('meetsid')
          .limit(10);
        console.log(
          'Sample meetsid values from results_overview:',
          debugResponse.data
        );

        // Try multiple filtering approaches to handle different data types
        let response;

        // Try filtering with the original value first
        response = await supabase
          .from('results_overview')
          .select('*')
          .eq('meetsid', selectedMeet)
          .order('stylesid, totaltime', { ascending: true });

        // If no results with string, try with integer
        if (!response.data || response.data.length === 0) {
          response = await supabase
            .from('results_overview')
            .select('*')
            .eq('meetsid', parseInt(selectedMeet))
            .order('stylesid, totaltime', { ascending: true });
        }

        // If still no results, try with different possible field names
        if (!response.data || response.data.length === 0) {
          const alternativeFields = ['meet_id', 'meetId', 'id'];

          for (const field of alternativeFields) {
            try {
              const altResponse = await supabase
                .from('results_overview')
                .select('*')
                .eq(field, selectedMeet)
                .order('stylesid, totaltime', { ascending: true });

              if (altResponse.data && altResponse.data.length > 0) {
                response = altResponse;
                break;
              }
            } catch (altError) {}
          }
        }

        data = response.data;
        error = response.error;

        if (error) {
          throw error;
        }

        setFilteredResults(data || []);

        // Extract column names from the first row if data exists
        if (data && data.length > 0) {
          const allColumns = Object.keys(data[0]);
          // Filter out meet-related columns and unwanted result columns
          const meetColumns = [
            'meetsid',
            'name',
            'poolname',
            'place',
            'nation',
            'mindate',
            'maxdate',
            'course',
          ];
          const unwantedColumns = [
            'stylesid',
            'totaltime',
            'distance',
            'stroke shortname',
            'Stroke shortname',
            'strokeshortname',
            'stroke_shortname',
            'strokename',
            'stroke',
            'style',
            'gender',
          ];
          const resultColumns = allColumns.filter(
            col =>
              !meetColumns.includes(col.toLowerCase()) &&
              !unwantedColumns.includes(col.toLowerCase())
          );
          setColumns(resultColumns);
        }
      } catch (err: any) {
        setError(err.message);
        setFilteredResults([]);
        setColumns([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [selectedMeet]);

  // Update selected meet details when meet changes
  useEffect(() => {
    if (selectedMeet === '') {
      setSelectedMeetDetails(null);
    } else {
      // Find the selected meet details
      const meetDetails = allMeetsData.find(meet => {
        const meetId = meet.meetsid || meet.id || meet.meet_id || meet.meetId;
        return String(meetId) === selectedMeet;
      });
      setSelectedMeetDetails(meetDetails);
    }
  }, [selectedMeet, allMeetsData]);

  // Group results by stylesid and gender
  const groupedResults = React.useMemo(() => {
    const groups: { [key: string]: ResultsTeamManager[] } = {};

    filteredResults.forEach(result => {
      const styleId = result.stylesid || 'unknown';
      const gender = result.gender || 'unknown';
      const groupKey = `${styleId}-${gender}`;

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(result);
    });

    return groups;
  }, [filteredResults]);

  if (loading) {
    return (
      <div className="page-container">
        <h2 className="page-title">Results Team Manager</h2>
        <p>Loading results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <h2 className="page-title">Results Team Manager</h2>
        <p className="error-message">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h2 className="page-title">Results Team Manager</h2>

      <div className="form-actions">
        <div className="form-group">
          <label htmlFor="meet-filter" className="form-label">
            Filter by meet:
          </label>
          <select
            id="meet-filter"
            className="form-input"
            value={selectedMeet}
            onChange={e => setSelectedMeet(e.target.value)}
          >
            <option value="">Select a meet...</option>
            {meets.map((meet, index) => (
              <option key={meet.id || index} value={String(meet.id)}>
                {meet.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Meet Details as Table */}
      {selectedMeetDetails && (
        <div
          className="form-actions"
          style={{
            marginBottom: '20px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '16px',
            backgroundColor: '#f9f9f9',
          }}
        >
          <h3
            className="modal-title"
            style={{ marginTop: '0', marginBottom: '16px' }}
          >
            Meet Details
          </h3>
          <div className="table-container">
            <table className="table">
              <tbody>
                <tr>
                  <td>
                    <strong>Meets ID:</strong>
                  </td>
                  <td>
                    {selectedMeetDetails.meetsid ||
                      selectedMeetDetails.id ||
                      '-'}
                  </td>
                  <td>
                    <strong>Name:</strong>
                  </td>
                  <td>
                    {selectedMeetDetails.meetname ||
                      selectedMeetDetails.name ||
                      '-'}
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Pool Name:</strong>
                  </td>
                  <td>{selectedMeetDetails.poolname || '-'}</td>
                  <td>
                    <strong>Place:</strong>
                  </td>
                  <td>{selectedMeetDetails.place || '-'}</td>
                </tr>
                <tr>
                  <td>
                    <strong>Nation:</strong>
                  </td>
                  <td>{selectedMeetDetails.nation || '-'}</td>
                  <td>
                    <strong>Start Date:</strong>
                  </td>
                  <td>{selectedMeetDetails.mindate || '-'}</td>
                </tr>
                <tr>
                  <td>
                    <strong>End Date:</strong>
                  </td>
                  <td>{selectedMeetDetails.maxdate || '-'}</td>
                  <td>
                    <strong>Course:</strong>
                  </td>
                  <td>
                    {selectedMeetDetails.course
                      ? selectedMeetDetails.course === 1
                        ? '50m'
                        : '25m'
                      : '-'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!selectedMeet ? (
        <div className="no-data">
          <p>Please select a meet from the dropdown to view results.</p>
        </div>
      ) : filteredResults.length === 0 ? (
        <div className="no-data">No results found.</div>
      ) : (
        <>
          <h3 className="modal-title">Results Data</h3>
          <div
            className="table-container"
            style={{
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px solid #ddd',
            }}
          >
            <table className="table">
              <thead>
                <tr>
                  {columns.map(column => (
                    <th key={column}>
                      {column.toLowerCase() === 'stroke shortname'
                        ? 'Stroke'
                        : column.charAt(0).toUpperCase() +
                          column.slice(1).replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedResults).map(([groupKey, results]) => {
                  // Get the first result to extract style information
                  const firstResult = results[0];

                  // Debug: log all available fields in the first result
                  console.log('First result fields:', Object.keys(firstResult));
                  console.log('First result data:', firstResult);

                  const distance = firstResult?.distance || '-';
                  const stroke =
                    firstResult?.['stroke shortname'] ||
                    firstResult?.['Stroke shortname'] ||
                    firstResult?.stroke ||
                    firstResult?.strokeshortname ||
                    firstResult?.stroke_shortname ||
                    firstResult?.strokename ||
                    firstResult?.style ||
                    '-';
                  const gender = firstResult?.gender || '-';

                  return (
                    <React.Fragment key={groupKey}>
                      {/* Header row for each style and gender combination */}
                      <tr
                        style={{
                          backgroundColor:
                            gender === 'W' ? '#ffcccb' : '#c7def5ff',
                          fontWeight: 'bold',
                        }}
                      >
                        <td colSpan={columns.length}>
                          <strong>
                            {distance}m {stroke} - {gender}
                          </strong>
                        </td>
                      </tr>
                      {/* Data rows for this style and gender */}
                      {results.map((result, index) => (
                        <tr key={`${groupKey}-${index}`}>
                          {columns.map(column => (
                            <td key={column}>
                              {result[column] !== null &&
                              result[column] !== undefined
                                ? String(result[column])
                                : '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="table-info">
        {selectedMeet && (
          <>
            <p>Total records: {filteredResults.length}</p>
            {selectedMeet !== 'All' && (
              <p>
                Showing results for:{' '}
                <strong>
                  {meets.find(meet => String(meet.id) === selectedMeet)?.name ||
                    selectedMeet}
                </strong>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Results;
