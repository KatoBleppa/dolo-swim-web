import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

// This page lists all records from the 'athletes' table
const ListAthletesPage = () => {
  const [athletes, setAthletes] = useState<any[]>([]);
  const [filteredAthletes, setFilteredAthletes] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>(''); // Changed from 'ALL' to empty string
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAthlete, setSelectedAthlete] = useState<any | null>(null);

  const groupOptions = [
    { label: 'Select a group...', value: '' }, // Added default option
    { label: 'All Groups', value: 'ALL' },
    { label: 'ASS', value: 'ASS' },
    { label: 'EA', value: 'EA' },
    { label: 'EB', value: 'EB' },
    { label: 'PROP', value: 'PROP' },
  ];

  useEffect(() => {
    const fetchAthletes = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.from('athletes').select('*');
      if (error) {
        setError(error.message);
        setAthletes([]);
        setFilteredAthletes([]);
      } else {
        const processed = (data || []).map((item: any) => {
          return item;
        });

        // Sort athletes by name alphabetically
        const sortedAthletes = processed.sort((a, b) => {
          if (a.name < b.name) return -1;
          if (a.name > b.name) return 1;
          return 0;
        });

        setAthletes(sortedAthletes);
        // Don't apply initial filtering - wait for user selection
        setFilteredAthletes([]); // Start with empty filtered list
      }
      setLoading(false);
    };
    fetchAthletes();
  }, []);

  // Filter athletes when group selection changes
  useEffect(() => {
    filterAthletes(athletes, selectedGroup);
  }, [selectedGroup, athletes]);

  const filterAthletes = (athleteList: any[], group: string) => {
    if (group === '' || group === null || group === undefined) {
      setFilteredAthletes([]); // Show nothing when no group is selected
    } else if (group === 'ALL') {
      setFilteredAthletes(athleteList);
    } else {
      const filtered = athleteList.filter(athlete => athlete.groups === group);
      setFilteredAthletes(filtered);
    }
  };

  return (
    <div className="athletes-container">
      <h2>Athletes</h2>

      <div className="athletes-filter-section">
        <div>
          <label htmlFor="group-select" className="form-label">
            Group:
          </label>
          <select
            id="group-select"
            value={selectedGroup}
            onChange={e => setSelectedGroup(e.target.value)}
            className="form-select"
          >
            {groupOptions
              .filter(option => option.value !== 'ALL')
              .map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
          </select>
        </div>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading &&
        !error &&
        selectedGroup !== '' &&
        filteredAthletes.length > 0 && (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr className="table-header">
                  <th>Portrait</th>
                  <th>Name</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredAthletes.map((athlete, idx) => (
                  <tr key={idx}>
                    <td className="athlete-portrait-cell">
                      {athlete.photo ? (
                        <img
                          src={athlete.photo}
                          alt={athlete.name ?? 'Athlete portrait'}
                          className="athlete-avatar"
                          referrerPolicy="no-referrer"
                          onError={e => {
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
                    <td>{athlete.name}</td>
                    <td align="center">
                      <button
                        onClick={() => setSelectedAthlete(athlete)}
                        title="View Details"
                        className="athlete-view-btn"
                      >
                        <img
                          src="src\assets\icons\icons8-eye-100.png"
                          alt="View"
                          className="athlete-view-icon"
                        />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      {/* Modal for athlete details */}
      {selectedAthlete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button
              onClick={() => setSelectedAthlete(null)}
              className="modal-close"
            >
              ✕
            </button>

            <div className="athlete-modal-header">
              {selectedAthlete.photo ? (
                <img
                  src={selectedAthlete.photo}
                  alt={selectedAthlete.name ?? 'Athlete portrait'}
                  className="athlete-modal-avatar"
                  referrerPolicy="no-referrer"
                  onError={e => {
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
              )}
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
          </div>
        </div>
      )}
      {!loading &&
        !error &&
        selectedGroup !== '' &&
        filteredAthletes.length === 0 &&
        athletes.length > 0 && <p>No athletes found for the selected group.</p>}
      {!loading && !error && selectedGroup === '' && athletes.length > 0 && (
        <p className="athlete-no-selection">
          Please select a group from the dropdown to view athletes.
        </p>
      )}
      {!loading && !error && athletes.length === 0 && <p>No records found.</p>}
    </div>
  );
};

export default ListAthletesPage;
