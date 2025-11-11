import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

interface Athlete {
  fincode: number;
  name: string;
  birthdate: string;
  gender: string;
  email: string;
  phone: string;
  athleteid: number;
  groups: string;
}

interface Season {
  seasonid: number;
  description: string;
  seasonstart: string;
  seasonend: string;
}

interface Race {
  [key: string]: any; // Flexible interface for race data
}

interface PersonalBestRecord {
  distance: number;
  stroke_shortname: string;
  raceid: number;
  pool50m: {
    tempofin: string | null;
    eventdate: string | null;
    meet: string | null;
  };
  pool25m: {
    tempofin: string | null;
    eventdate: string | null;
    meet: string | null;
  };
}

const Personalbests: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [personalBests, setPersonalBests] = useState<PersonalBestRecord[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedAthlete, setSelectedAthlete] = useState<string>('');

  const groups = ['ASS', 'EA', 'EB', 'PROP'];

  // Fetch seasons and races on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch seasons
        const { data: seasonsData, error: seasonsError } = await supabase
          .from('_seasons')
          .select('*')
          .order('seasonstart', { ascending: false });

        if (seasonsError) {
          console.error('Supabase error when fetching seasons:', seasonsError);
          throw seasonsError;
        }

        // Fetch races with relaycount = 1
        const { data: racesData, error: racesError } = await supabase
          .from('_races')
          .select('*')
          .eq('relaycount', 1)
          .order('distance, stroke_shortname', { ascending: true });

        if (racesError) {
          console.error('Supabase error when fetching races:', racesError);
          throw racesError;
        }

        if (seasonsData && seasonsData.length > 0) {
          setSeasons(seasonsData);
          // Set the most recent season as default
          setSelectedSeason(seasonsData[0].description);
        }

        if (racesData) {
          setRaces(racesData);
        }
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Fetch athletes when season and group are selected
  useEffect(() => {
    const fetchAthletes = async () => {
      if (!selectedSeason || !selectedGroup) {
        setAthletes([]);
        setSelectedAthlete('');
        return;
      }

      try {
        const { data: athletesData, error: athletesError } = await supabase.rpc(
          'get_athletes_with_rosters',
          {
            paramseason: selectedSeason,
            paramgroups: selectedGroup,
          }
        );

        if (athletesError) {
          console.error('Error fetching athletes:', athletesError);
          throw athletesError;
        }

        if (athletesData) {
          setAthletes(athletesData);
        }
      } catch (err) {
        console.error('Error fetching athletes:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to fetch athletes'
        );
      }
    };

    fetchAthletes();
    // Reset selected athlete when season or group changes
    setSelectedAthlete('');
  }, [selectedSeason, selectedGroup]);

  // Process personal bests when athlete is selected
  useEffect(() => {
    const processPersonalBests = async () => {
      if (!selectedAthlete || races.length === 0) {
        setPersonalBests([]);
        return;
      }

      try {

        // Get unique distance+stroke combinations with raceid
        const uniqueEvents = Array.from(
          new Set(
            races.map(
              race => `${race.distance}-${race.stroke_shortname}-${race.raceid}`
            )
          )
        )
          .map(event => {
            const [distance, stroke, raceid] = event.split('-');
            return {
              distance: parseInt(distance),
              stroke_shortname: stroke,
              raceid: parseInt(raceid),
            };
          })
          .sort((a, b) => a.raceid - b.raceid); // Sort by raceid

        // Fetch personal best results for this athlete
        const { data: resultsData, error: resultsError } = await supabase
          .from('personal_bests')
          .select('*')
          .ilike('athlete_name', `%${selectedAthlete}%`);

        if (resultsError) {
          console.error('Error fetching personal bests:', resultsError);
          throw resultsError
        }   

        // Process each event
        const processedBests: PersonalBestRecord[] = uniqueEvents.map(event => {
          const pool50mRecord = resultsData?.find(
            result =>
              result.distance === event.distance &&
              result.stroke_shortname === event.stroke_shortname &&
              (result.course === 1 || result.course === '50m') // Try both numeric and string values
          );

          const pool25mRecord = resultsData?.find(
            result =>
              result.distance === event.distance &&
              result.stroke_shortname === event.stroke_shortname &&
              (result.course === 0 ||
                result.course === '25m' ||
                result.course === 2) // Try multiple possible values
          );

          // Debug logging for each event
          if (pool50mRecord || pool25mRecord) {
            console.log(`Event ${event.distance}m ${event.stroke_shortname}:`, {
              pool50m: pool50mRecord ? 'Found' : 'Not found',
              pool25m: pool25mRecord ? 'Found' : 'Not found',
              pool50mCourse: pool50mRecord?.course,
              pool25mCourse: pool25mRecord?.course,
            });
          }

          return {
            distance: event.distance,
            stroke_shortname: event.stroke_shortname,
            raceid: event.raceid,
            pool50m: {
              tempofin: pool50mRecord?.tempofin || null,
              eventdate: pool50mRecord?.eventdate || null,
              meet:
                pool50mRecord?.meet_name ||
                pool50mRecord?.meet ||
                pool50mRecord?.meetname ||
                null,
            },
            pool25m: {
              tempofin: pool25mRecord?.tempofin || null,
              eventdate: pool25mRecord?.eventdate || null,
              meet:
                pool25mRecord?.meet_name ||
                pool25mRecord?.meet ||
                pool25mRecord?.meetname ||
                null,
            },
          };
        });

        setPersonalBests(processedBests);
      } catch (err) {
        console.error('Error processing personal bests:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to process personal bests'
        );
      }
    };

    processPersonalBests();
  }, [selectedAthlete, races]);

  const formatTime = (time: string | null): string => {
    if (!time) return '-';
    return time;
  };

  const formatDate = (date: string | null): string => {
    if (!date) return '-';
    try {
      const dateObj = new Date(date);
      if (!isNaN(dateObj.getTime())) {
        // Format as yyyy-mm-dd
        return dateObj.toISOString().split('T')[0];
      }
    } catch {
      // If date parsing fails, return original value
    }
    return date;
  };

  const formatMeet = (meet: string | null): string => {
    if (!meet) return '-';
    // Limit to 30 characters
    return meet.length > 30 ? meet.substring(0, 30) + '...' : meet;
  };

  if (loading) {
    return (
      <div className="page-container">
        <h1 className="page-title">Personal Bests</h1>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          Loading personal bests...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <h1 className="page-title">Personal Bests</h1>
        <div style={{ color: 'red', textAlign: 'center', padding: '2rem' }}>
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Personal Bests</h1>

      {/* Filter dropdowns */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label htmlFor="season-select" className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>
            Season:
          </label>
          <select
            id="season-select"
            className="form-select"
            value={selectedSeason}
            onChange={e => setSelectedSeason(e.target.value)}
            style={{ flex: 1 }}
          >
            <option value="">Select Season...</option>
            {seasons.map(season => (
              <option key={season.seasonid} value={season.description}>
                {season.description}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label htmlFor="group-select" className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>
            Group:
          </label>
          <select
            id="group-select"
            className="form-select"
            value={selectedGroup}
            onChange={e => setSelectedGroup(e.target.value)}
            disabled={!selectedSeason}
            style={{ flex: 1 }}
          >
            <option value="">
              {selectedSeason ? 'Select Group...' : 'Select Season First'}
            </option>
            {groups.map(group => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label htmlFor="athlete-select" className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>
            Athlete:
          </label>
          <select
            id="athlete-select"
            className="form-select"
            value={selectedAthlete}
            onChange={e => setSelectedAthlete(e.target.value)}
            disabled={!selectedGroup || !selectedSeason}
            style={{ flex: 1 }}
          >
            <option value="">
              {selectedGroup && selectedSeason
                ? 'Select Athlete...'
                : 'Select Season & Group First'}
            </option>
            {athletes.map(athlete => (
              <option key={athlete.fincode} value={athlete.name}>
                {athlete.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {personalBests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          {selectedAthlete
            ? `No personal bests found for ${selectedAthlete}`
            : 'Select an athlete to view personal bests'}
        </div>
      ) : (
        <>
          {/* 25m Personal Bests */}
          <div className="table-container" style={{ marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 'bold' }}>
              25m Pool
            </h2>
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th>Distance</th>
                  <th>Stroke</th>
                  <th style={{ textAlign: 'center' }}>Time</th>
                  <th style={{ textAlign: 'center' }}>Date</th>
                  <th>Meet</th>
                </tr>
              </thead>
              <tbody>
                {personalBests.map((record, index) => (
                  <tr key={index}>
                    <td>{record.distance}m</td>
                    <td>{record.stroke_shortname}</td>
                    <td>{formatTime(record.pool25m.tempofin)}</td>
                    <td>{formatDate(record.pool25m.eventdate)}</td>
                    <td>{formatMeet(record.pool25m.meet)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 50m Personal Bests */}
          <div className="table-container">
            <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 'bold' }}>
              50m Pool
            </h2>
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th>Distance</th>
                  <th>Stroke</th>
                  <th style={{ textAlign: 'center' }}>Time</th>
                  <th style={{ textAlign: 'center' }}>Date</th>
                  <th>Meet</th>
                </tr>
              </thead>
              <tbody>
                {personalBests.map((record, index) => (
                  <tr key={index}>
                    <td>{record.distance}m</td>
                    <td>{record.stroke_shortname}</td>
                    <td>{formatTime(record.pool50m.tempofin)}</td>
                    <td>{formatDate(record.pool50m.eventdate)}</td>
                    <td>{formatMeet(record.pool50m.meet)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default Personalbests;
