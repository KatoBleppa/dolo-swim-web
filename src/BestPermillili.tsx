import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

interface PermilliliData {
  [key: string]: any;
}

const BestPermillili: React.FC = () => {
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

        // Filter to get only the best permillili for each athlete
        const bestResults: { [key: string]: PermilliliData } = {};
        
        (data || []).forEach((result: PermilliliData) => {
          const athleteKey = result.fincode || result.name;
          const permillili = result.permillili;
          
          // Only consider results with valid permillili values
          if (permillili !== null && permillili !== undefined) {
            if (!bestResults[athleteKey] || permillili > bestResults[athleteKey].permillili) {
              bestResults[athleteKey] = result;
            }
          }
        });

        // Convert to array and sort by permillili descending
        const sortedResults = Object.values(bestResults).sort((a, b) => {
          const permA = a.permillili || 0;
          const permB = b.permillili || 0;
          return permB - permA;
        });

        setFilteredResults(sortedResults);
      } catch (err: any) {
        setError(err.message);
        setFilteredResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPermilliliData();
  }, [selectedSeason, selectedGroup]);

  if (loading) {
    return (
      <div className="page-container">
        <h2 className="page-title">Best Permillili</h2>
        <p>Loading results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <h2 className="page-title">Best Permillili</h2>
        <p className="error-message">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h2 className="page-title">Best Permillili</h2>

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
          <h3 className="modal-title">Best Permillili Rankings</h3>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th style={{ width: '250px' }}>Athlete</th>
                  <th>Distance</th>
                  <th>Event</th>
                  <th>Date</th>
                  <th>Meet</th>
                  <th>Result</th>
                  <th>Limit</th>
                  <th>Permillili</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((result, index) => {
                  const fincode = result.fincode || '';
                  const athleteImageUrl = getPortraitUrl(fincode);
                  const hasImageError = imageErrors.has(fincode?.toString() || '');
                  const gender = result.gender || '-';

                  return (
                    <tr
                      key={`${result.fincode || index}`}
                      style={{
                        backgroundColor:
                          index % 2 === 0
                            ? 'transparent'
                            : gender === 'W'
                              ? '#fff0f0'
                              : '#f0f5ff',
                      }}
                    >
                      <td style={{ fontWeight: 'bold' }}>{index + 1}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              backgroundColor: '#e0e0e0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                              flexShrink: 0,
                            }}
                          >
                            {athleteImageUrl && !hasImageError ? (
                              <img
                                src={athleteImageUrl}
                                alt={result.name}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                }}
                                onError={() => handleImageError(fincode)}
                              />
                            ) : (
                              <span style={{ fontSize: '20px', color: '#999' }}>👤</span>
                            )}
                          </div>
                          <strong>{result.name || '-'}</strong>
                        </div>
                      </td>
                      <td>{result.limit_dist || '-'}</td>
                      <td>{result.limit_descr_short || '-'}</td>
                      <td>{result.mindate || '-'}</td>
                      <td>{result.meetname || '-'}</td>
                      <td>{result.result_string || '-'}</td>
                      <td>{result.limit_string || '-'}</td>
                      <td style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                        {result.permillili || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="table-info">
        <p>Total athletes: {filteredResults.length}</p>
        <p>
          Showing best permillili for season: <strong>{selectedSeason}</strong> | Group:{' '}
          <strong>{selectedGroup}</strong>
        </p>
      </div>
    </div>
  );
};

export default BestPermillili;
