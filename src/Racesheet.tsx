import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

interface Meet {
  meetsid: number;
  meetname: string;
  mindate: string;
}

interface RaceResult {
  resultsid: number;
  fincode: number;
  athlete_name: string;
  eventnumb: number;
  stylesid: number;
  totaltime: number;
  meetsid: number;
  distance: number;
  stroke_shortname: string;
  personal_best: string | null;
  limit_str: string | null;
}

const Racesheet: React.FC = () => {
  const [meets, setMeets] = useState<Meet[]>([]);
  const [selectedMeet, setSelectedMeet] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [results, setResults] = useState<RaceResult[]>([]);
  const [loadingResults, setLoadingResults] = useState<boolean>(false);

  useEffect(() => {
    const fetchMeets = async () => {
      setLoading(true);
      setError('');

      try {
        // Get meets where all related results have totaltime = 0
        const { data, error } = await supabase
          .from('meets_teammanager')
          .select('meetsid, meetname, mindate')
          .order('mindate', { ascending: false });

        if (error) throw error;

        // Filter meets where all results have totaltime = 0
        const meetsWithZeroTimes: Meet[] = [];
        
        for (const meet of data || []) {
          const { data: results, error: resultsError } = await supabase
            .from('results_teammanager')
            .select('totaltime')
            .eq('meetsid', meet.meetsid);

          if (resultsError) throw resultsError;

          // Check if all results have totaltime = 0
          const allZero = results && results.length > 0 && results.every(r => r.totaltime === 0);
          
          if (allZero) {
            meetsWithZeroTimes.push(meet);
          }
        }

        setMeets(meetsWithZeroTimes);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMeets();
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      if (!selectedMeet) {
        setResults([]);
        return;
      }

      setLoadingResults(true);
      try {
        // Call SQL function to get results for selected meet
        const { data, error: rpcError } = await supabase
          .rpc('fn_racesheet_results', { meetsid_param: parseInt(selectedMeet) });

        if (rpcError) throw rpcError;

        setResults(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoadingResults(false);
      }
    };

    fetchResults();
  }, [selectedMeet]);

  return (
    <div className="page-container">
      <h2 className="page-title">Race Sheet</h2>
      
      {loading && <p>Loading meets...</p>}
      {error && <p className="error-message">Error: {error}</p>}

      {!loading && !error && (
        <div className="form-group">
          <label htmlFor="meet-select" className="form-label">
            Select Meet:
          </label>
          <select
            id="meet-select"
            className="form-input"
            value={selectedMeet}
            onChange={(e) => setSelectedMeet(e.target.value)}
          >
            <option value="">-- Select a meet --</option>
            {meets.map((meet) => (
              <option key={meet.meetsid} value={meet.meetsid}>
                {meet.meetname} - {meet.mindate}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedMeet && (
        <div className="content">
          {loadingResults && <p>Loading results...</p>}
          
          {!loadingResults && results.length > 0 && (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Athlete</th>
                    <th>Dist</th>
                    <th>Event</th>
                    <th>PB</th>
                    <th>Limit</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result) => (
                    <tr key={result.resultsid}>
                      <td>{result.eventnumb}</td>
                      <td className="athlete">{result.athlete_name}</td>
                      <td>{result.distance}</td>
                      <td>{result.stroke_shortname}</td>
                      <td>{result.personal_best || '-'}</td>
                      <td>{result.limit_str || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {!loadingResults && results.length === 0 && (
            <p>No results found for this meet.</p>

          )}
        </div>
      )}
    </div>
  );
};

export default Racesheet;
