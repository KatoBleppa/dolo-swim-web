import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import eyeIcon from './assets/icons/icons8-eye-100.png';
import closeIcon from './assets/icons/icons8-close-100.png';

// Interface for season data
interface Season {
  seasonid: number;
  description: string;
  seasonstart: string;
  seasonend: string;
}

// This page lists all records from the 'athletes' table
const ListAthletesPage = () => {
  const [athletes, setAthletes] = useState<any[]>([]);
  const [filteredAthletes, setFilteredAthletes] = useState<any[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>(''); // Changed from 'ALL' to empty string
  const [loading, setLoading] = useState(true);
  const [seasonsLoading, setSeasonsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAthlete, setSelectedAthlete] = useState<any | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const groupOptions = [
    { label: 'Select a group...', value: '' }, // Added default option
    { label: 'ASS', value: 'ASS' },
    { label: 'EA', value: 'EA' },
    { label: 'EB', value: 'EB' },
    { label: 'PROP', value: 'PROP' },
  ];

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
    // Fetch seasons from the database
    const fetchSeasons = async () => {
      setSeasonsLoading(true);
      try {
        const { data, error } = await supabase
          .from('_seasons')
          .select('*')
          .order('seasonid', { ascending: false });

        if (error) {
          console.error('Error fetching seasons:', error);
        } else {
          setSeasons(data || []);
        }
      } catch (err) {
        console.error('Error fetching seasons:', err);
      }
      setSeasonsLoading(false);
    };

    fetchSeasons();
  }, []);

  // Fetch athletes when season or group changes
  useEffect(() => {
    if (selectedSeason && selectedGroup && selectedGroup !== '') {
      fetchAthletesForSeasonAndGroup(selectedSeason, selectedGroup);
    } else {
      setAthletes([]);
      setFilteredAthletes([]);
      setLoading(false);
    }
  }, [selectedSeason, selectedGroup]);

  const fetchAthletesForSeasonAndGroup = async (
    season: string,
    group: string
  ) => {
    setLoading(true);
    setError(null);
    setImageErrors(new Set()); // Clear previous image errors

    try {
      // Call the database function get_athletes_with_rosters with both parameters
      const { data, error } = await supabase.rpc('get_athletes_with_rosters', {
        paramseason: season,
        paramgroups: group,
      });

      if (error) {
        console.error('Database error:', error);
        setError(error.message);
        setAthletes([]);
        setFilteredAthletes([]);
      } else {
        console.log('Raw data received:', data); // Debug log
        const processed = (data || []).map((item: any) => {
          return item;
        });

        console.log('Processed data:', processed); // Debug log

        // Sort athletes by name alphabetically
        const sortedAthletes = processed.sort((a: any, b: any) => {
          if (a.name < b.name) return -1;
          if (a.name > b.name) return 1;
          return 0;
        });

        console.log('Sorted athletes:', sortedAthletes); // Debug log
        setAthletes(sortedAthletes);
        // Since filtering is now done by the database function, set filtered athletes directly
        setFilteredAthletes(sortedAthletes);
      }
    } catch (err) {
      setError('Error fetching athletes for selected season and group');
      setAthletes([]);
      setFilteredAthletes([]);
    }
    setLoading(false);
  };

  return (
    <div className="athletes-container">
      <h2>Athletes</h2>

      <div className="athletes-filter-section">
        <div>
          <label htmlFor="season-select" className="form-label">
            Season:
          </label>
          <select
            id="season-select"
            value={selectedSeason}
            onChange={e => setSelectedSeason(e.target.value)}
            className="form-select"
            disabled={seasonsLoading}
          >
            <option value="">Select a season...</option>
            {seasons.map(season => (
              <option key={season.seasonid} value={season.description}>
                {season.description}
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
            className="form-select"
            disabled={!selectedSeason || loading}
          >
            {groupOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {seasonsLoading && <p>Loading seasons...</p>}
      {loading && selectedSeason && <p>Loading athletes...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading &&
        !error &&
        selectedSeason &&
        selectedGroup !== '' &&
        filteredAthletes.length > 0 && (
          <div className="table-container">
            <table
              className="table"
              style={{ borderSpacing: '0', borderCollapse: 'collapse' }}
            >
              <thead>
                <tr className="table-header">
                  <th>Portrait</th>
                  <th>Name</th>
                  <th>Det</th>
                </tr>
              </thead>
              <tbody>
                {filteredAthletes.map((athlete, idx) => {
                  const athleteKey =
                    athlete.fincode?.toString() || athlete.name || 'unknown';
                  const hasImageError = imageErrors.has(athleteKey);
                  const portraitUrl = athlete.fincode
                    ? getPortraitUrl(athlete.fincode)
                    : null;

                  return (
                    <tr key={idx} style={{ margin: '0', padding: '0' }}>
                      <td
                        className="athlete-portrait-cell"
                        style={{ padding: '2px', margin: '0' }}
                      >
                        {portraitUrl && !hasImageError ? (
                          <img
                            src={portraitUrl}
                            alt={athlete.name ?? 'Athlete portrait'}
                            className="athlete-avatar"
                            referrerPolicy="no-referrer"
                            onError={e => {
                              console.log(
                                `Failed to load portrait for athlete ${athlete.name} (fincode: ${athlete.fincode})`
                              );
                              handleImageError(athlete.fincode);
                              e.currentTarget.src =
                                'https://ui-avatars.com/api/?name=Avatar&background=cccccc&color=ffffff&size=50';
                            }}
                          />
                        ) : (
                          <img
                            src="https://ui-avatars.com/api/?name=Avatar&background=cccccc&color=ffffff&size=50"
                            alt="Default avatar"
                            className="athlete-avatar"
                          />
                        )}
                      </td>
                      <td style={{ padding: '2px', margin: '0' }}>
                        {athlete.name}
                      </td>
                      <td
                        align="center"
                        style={{ padding: '2px', margin: '0' }}
                      >
                        <button
                          onClick={() => setSelectedAthlete(athlete)}
                          title="View Details"
                          className="athlete-view-btn"
                        >
                          <img
                            src={eyeIcon}
                            alt="View"
                            className="athlete-view-icon"
                          />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      {/* Modal for athlete details */}
      {selectedAthlete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="athlete-modal-header">
              {(() => {
                const athleteKey =
                  selectedAthlete.fincode?.toString() ||
                  selectedAthlete.name ||
                  'unknown';
                const hasImageError = imageErrors.has(athleteKey);
                const portraitUrl = selectedAthlete.fincode
                  ? getPortraitUrl(selectedAthlete.fincode)
                  : null;

                return portraitUrl && !hasImageError ? (
                  <img
                    src={portraitUrl}
                    alt={selectedAthlete.name ?? 'Athlete portrait'}
                    className="athlete-modal-avatar"
                    referrerPolicy="no-referrer"
                    onError={e => {
                      console.log(
                        `Failed to load portrait for athlete ${selectedAthlete.name} (fincode: ${selectedAthlete.fincode})`
                      );
                      handleImageError(selectedAthlete.fincode);
                      e.currentTarget.src =
                        'https://ui-avatars.com/api/?name=Avatar&background=cccccc&color=ffffff&size=60';
                    }}
                  />
                ) : (
                  <img
                    src="https://ui-avatars.com/api/?name=Avatar&background=cccccc&color=ffffff&size=60"
                    alt="Default avatar"
                    className="athlete-modal-avatar"
                  />
                );
              })()}
              <h3 className="athlete-modal-name">{selectedAthlete.name}</h3>
            </div>

            <div className="table-container">
              <table className="athlete-details-table">
                <thead>
                  <tr className="table-header">
                    <th>Field</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(selectedAthlete).map(
                    ([key, value]) =>
                      key !== 'portrait' &&
                      key !== 'photo' &&
                      key !== 'name' && (
                        <tr key={key}>
                          <td className="athlete-field-name">
                            {key.replace(/_/g, ' ')}
                          </td>
                          <td>{String(value) || '-'}</td>
                        </tr>
                      )
                  )}
                </tbody>
              </table>
            </div>
            <div className="modal-buttons">
              <button
                onClick={() => setSelectedAthlete(null)}
                title="Close"
                className="athlete-view-btn"
              >
                <img
                  src={closeIcon}
                  alt="Close"
                  className="athlete-view-icon"
                />
              </button>
            </div>
          </div>
        </div>
      )}
      {!loading &&
        !error &&
        selectedSeason &&
        selectedGroup !== '' &&
        filteredAthletes.length === 0 &&
        athletes.length > 0 && <p>No athletes found for the selected group.</p>}
      {!loading && !error && selectedSeason === '' && (
        <p className="athlete-no-selection">
          Please select a season from the dropdown to view athletes.
        </p>
      )}
      {!loading && !error && selectedSeason && selectedGroup === '' && (
        <p className="athlete-no-selection">
          Please select a group from the dropdown to view athletes.
        </p>
      )}
      {!loading &&
        !error &&
        selectedSeason &&
        selectedGroup &&
        selectedGroup !== '' &&
        filteredAthletes.length === 0 && (
          <p>
            No athletes found for the selected season and group combination.
          </p>
        )}
    </div>
  );
};

export default ListAthletesPage;
