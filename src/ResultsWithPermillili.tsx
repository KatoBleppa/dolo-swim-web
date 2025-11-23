import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

interface PermilliliData {
  [key: string]: any;
}

const ResultsWithPermillili: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string>('2025-26');
  const [selectedGroup, setSelectedGroup] = useState<string>('ASS');
  const [filteredResults, setFilteredResults] = useState<PermilliliData[]>([]);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  
  // Define available seasons and groups
  const seasons = ['2023-24', '2024-25', '2025-26', '2026-27'];
  const groups = ['ASS', 'EA', 'EB', 'PROP'];

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

  useEffect(() => {
    const fetchPermilliliData = async () => {
      // Don't fetch anything if no season or group is selected
      if (!selectedSeason || !selectedGroup) {
        setFilteredResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Call the PostgreSQL function to get permillili results
        const { data, error } = await supabase.rpc('get_permillili_results', {
          p_season: selectedSeason,
          p_group: selectedGroup,
        });

        if (error) {
          throw error;
        }

        setFilteredResults(data || []);
      } catch (err: any) {
        setError(err.message);
        setFilteredResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPermilliliData();
  }, [selectedSeason, selectedGroup]);

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
        <h2 className="page-title">Results with permillili</h2>
        <p className="error-message">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h2 className="page-title">Results with permillili</h2>

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
        <div className="form-group">
          <label htmlFor="group-filter" className="form-label">
            Group:
          </label>
          <select
            id="group-filter"
            className="form-input"
            value={selectedGroup}
            onChange={e => setSelectedGroup(e.target.value)}
          >
            {groups.map(group => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredResults.length === 0 ? (
        <div className="no-data">No results found for this season.</div>
      ) : (
        <>
          {Object.entries(groupedResults).map(([athleteName, results]) => {
            // Get the first result to extract athlete information
            const firstResult = results[0];
            const gender = firstResult?.gender || '-';
            const fincode = firstResult?.fincode || '';
            const athleteImageUrl = getPortraitUrl(fincode);
            const hasImageError = imageErrors.has(fincode?.toString() || '');
            
            console.log('Athlete:', athleteName, 'Fincode:', fincode, 'Image URL:', athleteImageUrl);

            return (
              <div
                key={athleteName}
                style={{
                  marginBottom: '2rem',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              >
                {/* Athlete Header */}
                <div
                  style={{
                    backgroundColor: gender === 'W' ? '#ffcccb' : '#c7def5ff',
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                  }}
                >
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      backgroundColor: '#e0e0e0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      border: '2px solid white',
                      flexShrink: 0,
                    }}
                  >
                    {athleteImageUrl && !hasImageError ? (
                      <img
                        src={athleteImageUrl}
                        alt={athleteName}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                        onError={() => handleImageError(fincode)}
                      />
                    ) : (
                      <span style={{ fontSize: '24px', color: '#999' }}>👤</span>
                    )}
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{athleteName}</h3>
                </div>

                {/* Athlete Table */}
                <div className="table-container">
                  <table className="table">

                    <tbody>
                      {(() => {
                        // Sort by date descending (most recent first)
                        const sortedResults = [...results].sort((a, b) => {
                          const dateA = a.mindate || '';
                          const dateB = b.mindate || '';
                          return dateB.localeCompare(dateA);
                        });

                        // Group by meetname and date
                        const meetGroups: { [key: string]: PermilliliData[] } = {};
                        sortedResults.forEach(result => {
                          const key = `${result.meetname || 'Unknown'}_${result.mindate || 'Unknown'}`;
                          if (!meetGroups[key]) {
                            meetGroups[key] = [];
                          }
                          meetGroups[key].push(result);
                        });

                        return Object.entries(meetGroups).map(([, meetResults], meetIndex) => {
                          const firstMeetResult = meetResults[0];
                          return (
                            <React.Fragment key={`${athleteName}-meet-${meetIndex}`}>
                              {/* Meet header row */}
                              <tr style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
                                <td colSpan={5} style={{ textAlign: 'left', padding: '0.5rem' }}>
                                  {firstMeetResult.meetname || '-'} - {firstMeetResult.mindate || '-'}
                                </td>
                              </tr>
                              {/* Results for this meet */}
                              {meetResults.map((result, index) => (
                                <tr key={`${athleteName}-${meetIndex}-${index}`}>
                                  <td>{result.limit_dist || '-'}</td>
                                  <td>{result.limit_descr_short || '-'}</td>
                                  <td>{result.result_string || '-'}</td>
                                  <td>{result.limit_string || '-'}</td>
                                  <td>{result.permillili || '-'}</td>
                                </tr>
                              ))}
                            </React.Fragment>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </>
      )}

      <div className="table-info">
        <p>Total records: {filteredResults.length}</p>
        <p>
          Showing results for season: <strong>{selectedSeason}</strong> | Group: <strong>{selectedGroup}</strong>
        </p>
      </div>
    </div>
  );
};

export default ResultsWithPermillili;
