import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

interface ResultsTeamManager {
  [key: string]: any;
}

interface Event {
  ms_id: number;
  meet_id: number;
  event_numb: number;
  ms_race_id: number;
  gender: string;
  ms_cat: string;
  distance?: number;
  stroke_shortname?: string;
}

const Results: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [meets, setMeets] = useState<{ id: any; name: string }[]>([]);
  const [selectedMeet, setSelectedMeet] = useState<string>('');
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
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

  // Fetch events when meet is selected
  useEffect(() => {
    const fetchEvents = async () => {
      if (!selectedMeet) {
        setEvents([]);
        setSelectedEvent('');
        return;
      }

      try {
        console.log('Fetching events for meet:', selectedMeet);
        
        // Fetch events
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .eq('meet_id', parseInt(selectedMeet))
          .order('event_numb', { ascending: true });

        if (eventsError) throw eventsError;

        console.log('Events fetched:', eventsData);

        // Fetch race information for each event
        const eventsWithRaceData = await Promise.all(
          (eventsData || []).map(async (event) => {
            const { data: raceData, error: raceError } = await supabase
              .from('_races')
              .select('distance, stroke_shortname')
              .eq('raceid', event.ms_race_id)
              .single();

            if (!raceError && raceData) {
              return {
                ...event,
                distance: raceData.distance,
                stroke_shortname: raceData.stroke_shortname,
              };
            }
            
            return event;
          })
        );

        console.log('Events with race data:', eventsWithRaceData);
        setEvents(eventsWithRaceData);
        setSelectedEvent('');
      } catch (err: any) {
        console.error('Error fetching events:', err.message);
        console.error('Full error:', err);
        setError(`Failed to load events: ${err.message}`);
        setEvents([]);
      }
    };

    fetchEvents();
  }, [selectedMeet]);

  // Fetch results when event is selected
  useEffect(() => {
    const fetchResults = async () => {
      if (!selectedEvent) {
        setFilteredResults([]);
        setColumns([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Find the selected event details
        const event = events.find(e => String(e.ms_id) === selectedEvent);
        if (!event) {
          throw new Error('Event not found');
        }

        // Fetch results for the selected event with formatted time
        const { data, error } = await supabase
          .rpc('get_results_detail', {
            meet_id: parseInt(selectedMeet),
            event_num: event.event_numb
          });

        if (error) throw error;

        console.log('Results with formatted time:', data);
        setFilteredResults(data || []);
      } catch (err: any) {
        setError(err.message);
        setFilteredResults([]);
        setColumns([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [selectedEvent, events, selectedMeet]);

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



  if (loading) {
    return (
      <div className="page-container">
        <h2 className="page-title">Results</h2>
        <p>Loading results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <h2 className="page-title">Results</h2>
        <p className="error-message">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h2 className="page-title">Results</h2>

      <div className="form-actions">
        <div className="form-group">
          <label htmlFor="meet-filter" className="form-label">
            Meet:
          </label>
          <select
            id="meet-filter"
            className="form-input"
            value={selectedMeet}
            onChange={e => {
              setSelectedMeet(e.target.value);
              setSelectedEvent('');
            }}
          >
            <option value="">Select a meet...</option>
            {meets.map((meet, index) => (
              <option key={meet.id || index} value={String(meet.id)}>
                {meet.name}
              </option>
            ))}
          </select>
        </div>

        {selectedMeet && events.length > 0 && (
          <div className="form-group">
            <label htmlFor="event-filter" className="form-label">
              Event:
            </label>
            <select
              id="event-filter"
              className="form-input"
              value={selectedEvent}
              onChange={e => setSelectedEvent(e.target.value)}
            >
              <option value="">Select an event...</option>
              {events.map((event) => (
                <option key={event.ms_id} value={String(event.ms_id)}>
                  {event.event_numb} - {event.distance}m {event.stroke_shortname} - {event.gender} - {event.ms_cat}
                </option>
              ))}
            </select>
          </div>
        )}
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
            <table className="table" style={{ tableLayout: 'auto' }}>
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
          <p>Please select a meet from the dropdown to view events.</p>
        </div>
      ) : !selectedEvent ? (
        <div className="no-data">
          <p>Please select an event to view results.</p>
        </div>
      ) : filteredResults.length === 0 ? (
        <div className="no-data">No results found for this event.</div>
      ) : (
        <>
          <h3 className="modal-title">
            {events.find(e => String(e.ms_id) === selectedEvent)
              ? `${events.find(e => String(e.ms_id) === selectedEvent)!.event_numb} - ${events.find(e => String(e.ms_id) === selectedEvent)!.distance}m ${events.find(e => String(e.ms_id) === selectedEvent)!.stroke_shortname} - ${events.find(e => String(e.ms_id) === selectedEvent)!.gender} - ${events.find(e => String(e.ms_id) === selectedEvent)!.ms_cat}`
              : 'Results Data'}
          </h3>
          <div className="table-container">
            <table className="table" style={{ tableLayout: 'auto' }}>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Athlete</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((result, index) => (
                  <tr key={index}>
                    <td style={{ fontWeight: 'bold' }}>{index + 1}</td>
                    <td>{result.athletes?.name || '-'}</td>
                    <td>{result.formatted_time || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="table-info">
        {selectedEvent && (
          <>
            <p>Total records: {filteredResults.length}</p>
            <p>
              Showing results for:{' '}
              <strong>
                {meets.find(meet => String(meet.id) === selectedMeet)?.name ||
                  selectedMeet}
              </strong>
              {' - '}
              <strong>
                {events.find(event => String(event.ms_id) === selectedEvent)?.event_numb
                  ? `Event #${events.find(event => String(event.ms_id) === selectedEvent)?.event_numb}`
                  : 'Selected Event'}
              </strong>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Results;
