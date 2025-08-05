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
    <div
      style={{
        maxWidth: 800,
        margin: '2rem auto',
        padding: '2rem',
        background: '#fff',
        borderRadius: 8,
      }}
    >
      <h2>Athletes</h2>

      <div
        style={{
          marginBottom: '20px',
          display: 'flex',
          gap: '20px',
          alignItems: 'center',
          justifyContent: 'center', // Center align items horizontally
        }}
      >
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
                    Portrait
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
                    Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAthletes.map((athlete, idx) => (
                  <tr
                    key={idx}
                    style={{
                      backgroundColor: idx % 2 === 0 ? '#f9f9f9' : 'white',
                    }}
                  >
                    <td
                      style={{
                        padding: '8px',
                        border: '1px solid #ddd',
                        textAlign: 'center',
                      }}
                    >
                      {athlete.photo ? (
                        <img
                          src={athlete.photo}
                          alt={athlete.name ?? 'Athlete portrait'}
                          style={{
                            width: 50,
                            height: 50,
                            borderRadius: 25,
                            marginRight: 10,
                            objectFit: 'cover',
                          }}
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
                          style={{
                            width: 50,
                            height: 50,
                            borderRadius: 25,
                            marginRight: 10,
                            objectFit: 'cover',
                          }}
                        />
                      )}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                      {athlete.name}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                      <button
                        onClick={() => setSelectedAthlete(athlete)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        View Details
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
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#fff',
              padding: 32,
              borderRadius: 12,
              minWidth: 320,
              maxWidth: 500,
              position: 'relative',
            }}
          >
            <button
              onClick={() => setSelectedAthlete(null)}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                fontSize: 18,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#666',
              }}
            >
              ✕
            </button>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              {selectedAthlete.photo ? (
                <img
                  src={selectedAthlete.photo}
                  alt={selectedAthlete.name ?? 'Athlete portrait'}
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    marginRight: 15,
                    objectFit: 'cover',
                  }}
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
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    marginRight: 15,
                    objectFit: 'cover',
                  }}
                />
              )}
              <h3 style={{ margin: 0 }}>{selectedAthlete.name}</h3>
            </div>

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
                        fontWeight: 'bold',
                      }}
                    >
                      Field
                    </th>
                    <th
                      style={{
                        padding: '12px',
                        border: '1px solid #ddd',
                        textAlign: 'left',
                        fontWeight: 'bold',
                      }}
                    >
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(selectedAthlete).map(
                    ([key, value], index) =>
                      key !== 'portrait' &&
                      key !== 'photo' &&
                      key !== 'name' && (
                        <tr
                          key={key}
                          style={{
                            backgroundColor:
                              index % 2 === 0 ? '#f9f9f9' : 'white',
                          }}
                        >
                          <td
                            style={{
                              padding: '8px',
                              border: '1px solid #ddd',
                              fontWeight: 'bold',
                              textTransform: 'capitalize',
                            }}
                          >
                            {key.replace(/_/g, ' ')}
                          </td>
                          <td
                            style={{ padding: '8px', border: '1px solid #ddd' }}
                          >
                            {String(value) || '-'}
                          </td>
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
        <p style={{ textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
          Please select a group from the dropdown to view athletes.
        </p>
      )}
      {!loading && !error && athletes.length === 0 && <p>No records found.</p>}
    </div>
  );
};

export default ListAthletesPage;
