import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

// This page lists all records from the 'athletes' table
const ListAthletesPage = () => {
  const [athletes, setAthletes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAthlete, setSelectedAthlete] = useState<any | null>(null);

  useEffect(() => {
    const fetchAthletes = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.from('athletes').select('*');
      if (error) {
        setError(error.message);
        setAthletes([]);
      } else {

        const processed = (data || []).map((item: any) => {
          return item;
        });
        setAthletes(processed);
      }
      setLoading(false);
    };
    fetchAthletes();
  }, []);

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
      <h2>Athletes Table</h2>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && athletes.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>Portrait</th>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>Name</th>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {athletes.map((athlete, idx) => (
              <tr key={idx}>
                <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>
                { 
                athlete.photo ? (
                  <img
                    src={athlete.photo}
                    alt={athlete.name ?? 'Athlete portrait'}
                    style={{ width: 50, height: 50, borderRadius: 25, marginRight: 10, objectFit: 'cover' }}
                    referrerPolicy="no-referrer"
                    onError={e => { e.currentTarget.src = 'https://ui-avatars.com/api/?name=Avatar&background=cccccc&color=ffffff&size=50'; }}
                  />
                ) : (
                  <img
                    src="https://ui-avatars.com/api/?name=Avatar&background=cccccc&color=ffffff&size=50"
                    alt="Default avatar"
                    style={{ width: 50, height: 50, borderRadius: 25, marginRight: 10, objectFit: 'cover' }}
                  />
                )}
                </td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{athlete.name}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                  <button onClick={() => setSelectedAthlete(athlete)}>View Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {/* Modal for athlete details */}
      {selectedAthlete && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 12, minWidth: 320, maxWidth: 500, position: 'relative' }}>
            <button onClick={() => setSelectedAthlete(null)} style={{ position: 'absolute', top: 8, right: 8, fontSize: 18 }}>✕</button>
            <h3>{selectedAthlete.name}</h3>
            {selectedAthlete.photo ? (
              <img
                src={selectedAthlete.photo}
                alt={selectedAthlete.name ?? 'Athlete portrait'}
                style={{ width: 50, height: 50, borderRadius: 25, marginRight: 10, objectFit: 'cover' }}
                referrerPolicy="no-referrer"
                onError={e => { e.currentTarget.src = 'https://ui-avatars.com/api/?name=Avatar&background=cccccc&color=ffffff&size=50'; }}
              />
            ) : (
              <img
                src="https://ui-avatars.com/api/?name=Avatar&background=cccccc&color=ffffff&size=50"
                alt="Default avatar"
                style={{ width: 50, height: 50, borderRadius: 25, marginRight: 10, objectFit: 'cover' }}
              />
            )}
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {Object.entries(selectedAthlete).map(([key, value]) => (
                key !== 'portrait' && key !== 'photo' && key !== 'name' && (
                  <li key={key}><strong>{key}:</strong> {String(value)}</li>
                )
              ))}
            </ul>
          </div>
        </div>
      )}
      {!loading && !error && athletes.length === 0 && (
        <p>No records found.</p>
      )}
    </div>
  );
};

export default ListAthletesPage;
