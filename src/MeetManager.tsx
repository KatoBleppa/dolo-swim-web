import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import editIcon from './assets/icons/icons8-create-100.png';
import deleteIcon from './assets/icons/icons8-delete-100.png';
import closeIcon from './assets/icons/icons8-close-100.png';

interface Meet {
  meetsid?: number;
  mindate: string;
  maxdate: string;
  meetname: string;
  place: string;
  course: number;
  groups: string[];
  poolname?: string;
  nation?: string;
}

interface Season {
  seasonid: number;
  description: string;
  seasonstart: string;
  seasonend: string;
}

const MeetManager = () => {
  const [meets, setMeets] = useState<Meet[]>([]);
  const [filteredMeets, setFilteredMeets] = useState<Meet[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [seasonsLoading, setSeasonsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentMeet, setCurrentMeet] = useState<Meet>({
    meetname: '',
    place: '',
    mindate: '',
    maxdate: '',
    course: 2,
    groups: [],
    poolname: '',
    nation: '',
  });

  // Fetch seasons
  useEffect(() => {
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

  // Fetch meets
  useEffect(() => {
    fetchMeets();
  }, []);

  const fetchMeets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('meets_teammanager')
        .select('meetsid, mindate, maxdate, meetname, place, course, groups, poolname, nation')
        .order('mindate', { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setMeets(data || []);
        setFilteredMeets(data || []);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Filter meets when season changes
  useEffect(() => {
    if (!selectedSeason || selectedSeason === '') {
      setFilteredMeets(meets);
    } else {
      const season = seasons.find(s => s.description === selectedSeason);
      if (season) {
        const filtered = meets.filter(meet => {
          const meetDate = new Date(meet.mindate);
          const seasonStart = new Date(season.seasonstart);
          const seasonEnd = new Date(season.seasonend);
          return meetDate >= seasonStart && meetDate <= seasonEnd;
        });
        setFilteredMeets(filtered);
      }
    }
  }, [selectedSeason, meets, seasons]);

  const openModal = (meet?: Meet) => {
    if (meet && meet.meetsid) {
      setEditMode(true);
      setCurrentMeet(meet);
    } else {
      setEditMode(false);
      setCurrentMeet({
        meetname: '',
        place: '',
        mindate: '',
        maxdate: '',
        course: 2,
        groups: [],
        poolname: '',
        nation: '',
      });
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditMode(false);
    setCurrentMeet({
      meetname: '',
      place: '',
      mindate: '',
      maxdate: '',
      course: 2,
      groups: [],
      poolname: '',
      nation: '',
    });
  };

  const handleSaveMeet = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let error;
    if (editMode && currentMeet.meetsid) {
      // Update existing meet
      const meetData = {
        meetname: currentMeet.meetname,
        place: currentMeet.place,
        mindate: currentMeet.mindate,
        maxdate: currentMeet.maxdate,
        course: currentMeet.course,
        groups: currentMeet.groups,
        poolname: currentMeet.poolname || null,
        nation: currentMeet.nation || null,
      };
      
      ({ error } = await supabase
        .from('meets_teammanager')
        .update(meetData)
        .eq('meetsid', currentMeet.meetsid));
    } else {
      // Insert new meet - get next meetsid
      const { data: maxIdData, error: maxIdError } = await supabase
        .from('meets_teammanager')
        .select('meetsid')
        .order('meetsid', { ascending: false })
        .limit(1);

      if (maxIdError) {
        alert('Error getting next ID: ' + maxIdError.message);
        return;
      }

      const nextId = maxIdData && maxIdData.length > 0 ? maxIdData[0].meetsid + 1 : 1;

      const meetData = {
        meetsid: nextId,
        meetname: currentMeet.meetname,
        place: currentMeet.place,
        mindate: currentMeet.mindate,
        maxdate: currentMeet.maxdate,
        course: currentMeet.course,
        groups: currentMeet.groups,
        poolname: currentMeet.poolname || null,
        nation: currentMeet.nation || null,
      };

      ({ error } = await supabase
        .from('meets_teammanager')
        .insert([meetData]));
    }

    if (error) {
      alert('Error saving meet: ' + error.message);
      return;
    }

    closeModal();
    fetchMeets();
  };

  const handleDeleteMeet = async (meet: Meet) => {
    if (!meet.meetsid) return;
    if (!window.confirm(`Delete meet "${meet.meetname}"?`)) return;

    const { error } = await supabase
      .from('meets_teammanager')
      .delete()
      .eq('meetsid', meet.meetsid);

    if (error) {
      alert('Error deleting meet: ' + error.message);
      return;
    }

    fetchMeets();
  };

  const handleGroupsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const selected: string[] = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    setCurrentMeet({ ...currentMeet, groups: selected });
  };

  if (loading) {
    return (
      <div className="page-container">
        <h2 className="page-title">Meet Manager</h2>
        <p>Loading meets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <h2 className="page-title">Meet Manager</h2>
        <p className="error-message">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h2 className="page-title">Meet Manager</h2>

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
            disabled={seasonsLoading}
          >
            <option value="">All Seasons</option>
            {seasons.map(season => (
              <option key={season.seasonid} value={season.description}>
                {season.description}
              </option>
            ))}
          </select>
        </div>
        <button 
          onClick={() => openModal()} 
          className="btn btn-primary"
          style={{ marginLeft: 'auto' }}
        >
          + Add Meet
        </button>
      </div>

      {filteredMeets.length === 0 ? (
        <div className="no-data">
          <p>No meets found{selectedSeason ? ` for season ${selectedSeason}` : ''}.</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="table" style={{ tableLayout: 'auto' }}>
              <thead>
                <tr>
                  <th>Meet Name</th>
                  <th>Place</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Course</th>
                  <th>Groups</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMeets.map((meet, index) => (
                  <tr key={`${meet.meetsid || meet.meetname}-${meet.mindate}-${index}`}>
                    <td>{meet.meetname}</td>
                    <td>{meet.place}</td>
                    <td>{new Date(meet.mindate).toLocaleDateString()}</td>
                    <td>{new Date(meet.maxdate).toLocaleDateString()}</td>
                    <td>{meet.course === 1 ? '50m' : meet.course === 2 ? '25m' : '-'}</td>
                    <td>{meet.groups?.join(', ') || '-'}</td>
                    <td>
                      <button
                        onClick={() => openModal(meet)}
                        title="Edit"
                        className="athlete-view-btn"
                        style={{ marginRight: '8px' }}
                      >
                        <img
                          src={editIcon}
                          alt="Edit"
                          className="athlete-view-icon"
                        />
                      </button>
                      <button
                        onClick={() => handleDeleteMeet(meet)}
                        title="Delete"
                        className="athlete-view-btn"
                      >
                        <img
                          src={deleteIcon}
                          alt="Delete"
                          className="athlete-view-icon"
                        />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="table-info">
            <p>Total meets: {filteredMeets.length}</p>
          </div>
        </>
      )}

      {/* Modal for Add/Edit Meet */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editMode ? 'Edit Meet' : 'Add New Meet'}
              </h3>
              <button
                onClick={closeModal}
                className="athlete-view-btn"
                title="Close"
              >
                <img
                  src={closeIcon}
                  alt="Close"
                  className="athlete-view-icon"
                />
              </button>
            </div>
            
            <form onSubmit={handleSaveMeet}>
              <div style={{ display: 'grid', gap: '16px', padding: '20px' }}>
                <div className="form-group">
                  <label htmlFor="meetname" className="form-label">
                    Meet Name *
                  </label>
                  <input
                    id="meetname"
                    type="text"
                    className="form-input"
                    value={currentMeet.meetname}
                    onChange={e => setCurrentMeet({ ...currentMeet, meetname: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="place" className="form-label">
                    Place *
                  </label>
                  <input
                    id="place"
                    type="text"
                    className="form-input"
                    value={currentMeet.place}
                    onChange={e => setCurrentMeet({ ...currentMeet, place: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label htmlFor="mindate" className="form-label">
                      Start Date *
                    </label>
                    <input
                      id="mindate"
                      type="date"
                      className="form-input"
                      value={currentMeet.mindate}
                      onChange={e => setCurrentMeet({ ...currentMeet, mindate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="maxdate" className="form-label">
                      End Date *
                    </label>
                    <input
                      id="maxdate"
                      type="date"
                      className="form-input"
                      value={currentMeet.maxdate}
                      onChange={e => setCurrentMeet({ ...currentMeet, maxdate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="course" className="form-label">
                    Course *
                  </label>
                  <select
                    id="course"
                    className="form-input"
                    value={currentMeet.course}
                    onChange={e => setCurrentMeet({ ...currentMeet, course: Number(e.target.value) })}
                    required
                  >
                    <option value={2}>25m</option>
                    <option value={1}>50m</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="groups" className="form-label">
                    Groups * (hold Ctrl/Cmd to select multiple)
                  </label>
                  <select
                    id="groups"
                    className="form-input"
                    multiple
                    value={currentMeet.groups}
                    onChange={handleGroupsChange}
                    style={{ minHeight: '100px' }}
                    required
                  >
                    <option value="ASS">ASS</option>
                    <option value="EA">EA</option>
                    <option value="EB">EB</option>
                    <option value="PROP">PROP</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="poolname" className="form-label">
                    Pool Name
                  </label>
                  <input
                    id="poolname"
                    type="text"
                    className="form-input"
                    value={currentMeet.poolname || ''}
                    onChange={e => setCurrentMeet({ ...currentMeet, poolname: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="nation" className="form-label">
                    Nation
                  </label>
                  <input
                    id="nation"
                    type="text"
                    className="form-input"
                    value={currentMeet.nation || ''}
                    onChange={e => setCurrentMeet({ ...currentMeet, nation: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-buttons" style={{ padding: '20px', paddingTop: '0' }}>
                <button type="submit" className="btn btn-primary">
                  {editMode ? 'Update Meet' : 'Create Meet'}
                </button>
                <button 
                  type="button" 
                  onClick={closeModal} 
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetManager;
