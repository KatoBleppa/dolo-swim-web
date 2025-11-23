import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

interface PermilliliData {
  [key: string]: any;
}

const Permillili: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>('2025-26');
  const [filteredResults, setFilteredResults] = useState<PermilliliData[]>([]);
  
  // Define available seasons
  const seasons = ['2023-24', '2024-25', '2025-26', '2026-27'];

  useEffect(() => {
    const fetchPermilliliData = async () => {
      // Don't fetch anything if no season is selected
      if (!selectedSeason) {
        setFilteredResults([]);
        setColumns([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Call the PostgreSQL function to get permillili results
        const { data, error } = await supabase.rpc('get_permillili_results', {
          p_season: selectedSeason,
        });

        if (error) {
          throw error;
        }

        setFilteredResults(data || []);

        // Extract column names from the first row if data exists
        if (data && data.length > 0) {
          const allColumns = Object.keys(data[0]);
          // Only show relevant columns
          const columnsToShow = [
            'meetname',
            'mindate',
            'name',
            'gender',
            'groups',
            'cat',
            'limit_descr_short',
            'result_string',
            'limit_string',
            'permillili',
          ];
          const resultColumns = allColumns.filter(col =>
            columnsToShow.includes(col)
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

    fetchPermilliliData();
  }, [selectedSeason]);

  // Group results by athlete name
  const groupedResults = React.useMemo(() => {
    const groups: { [key: string]: PermilliliData[] } = {};

    filteredResults.forEach(result => {
      const athleteName = result.name || 'unknown';

      if (!groups[athleteName]) {
        groups[athleteName] = [];
      }
      groups[athleteName].push(result);
    });

    return groups;
  }, [filteredResults]);

  if (loading) {
    return (
      <div className="page-container">
        <h2 className="page-title">Permillili Results</h2>
        <p>Loading results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <h2 className="page-title">Permillili Results</h2>
        <p className="error-message">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h2 className="page-title">Permillili Results</h2>

      <div className="form-actions">
        <div className="form-group">
          <label htmlFor="season-filter" className="form-label">
            Season:
          </label>
          <select
            id="season-filter"
            className="form-input"
            value={selectedSeason}
            onChange={e => setSelectedSeason(e.target.value)}
          >
            {seasons.map(season => (
              <option key={season} value={season}>
                {season}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredResults.length === 0 ? (
        <div className="no-data">No results found for this season.</div>
      ) : (
        <>
          <h3 className="modal-title">Permillili Data</h3>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  {columns.map(column => (
                    <th key={column}>
                      {column === 'meetname'
                        ? 'Meet'
                        : column === 'mindate'
                          ? 'Date'
                          : column === 'limit_descr_short'
                            ? 'Event'
                            : column === 'result_string'
                              ? 'Result'
                              : column === 'limit_string'
                                ? 'Limit'
                                : column.charAt(0).toUpperCase() +
                                  column.slice(1).replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedResults).map(([athleteName, results]) => {
                  // Get the first result to extract athlete information
                  const firstResult = results[0];
                  const gender = firstResult?.gender || '-';

                  return (
                    <React.Fragment key={athleteName}>
                      {/* Header row for each athlete */}
                      <tr
                        style={{
                          backgroundColor:
                            gender === 'W' ? '#ffcccb' : '#c7def5ff',
                          fontWeight: 'bold',
                        }}
                      >
                        <td colSpan={columns.length}>
                          <strong>{athleteName}</strong>
                        </td>
                      </tr>
                      {/* Data rows for this athlete */}
                      {results.map((result, index) => (
                        <tr key={`${athleteName}-${index}`}>
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
        <p>Total records: {filteredResults.length}</p>
        <p>
          Showing results for season: <strong>{selectedSeason}</strong>
        </p>
      </div>
    </div>
  );
};

export default Permillili;
