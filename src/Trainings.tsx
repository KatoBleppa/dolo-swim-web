import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

const PAGE_SIZE = 20;

const TrainingsPage = () => {
  const [trainings, setTrainings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'All' | 'Swim' | 'Gym'>('All');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedTraining, setSelectedTraining] = useState<any | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<any>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Fetch trainings
  useEffect(() => {
    const fetchTrainings = async () => {
      setLoading(true);
      setError(null);

      let query = supabase.from('sessions').select('*', { count: 'exact' });
      if (filter !== 'All') {
        query = query.eq('type', filter);
      }
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error, count } = await query
        .order('date', { ascending: false })
        .range(from, to);

      if (error) {
        setError(error.message);
        setTrainings([]);
        setTotalCount(0);
      } else {
        setTrainings(data || []);
        setTotalCount(count || 0);
      }
      setLoading(false);
    };
    fetchTrainings();
  }, [filter, page]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Utility to get the correct id field (session_id)
  const getTrainingId = (training: any) => training?.session_id ?? null;

  // Handlers for CRUD
  const handleEdit = () => {
    const trainingId = getTrainingId(selectedTraining);
    if (!trainingId) {
      setFormError("ID non trovato nel record selezionato.");
      return;
    }
    setEditMode(true);
    setForm({ ...selectedTraining, session_id: trainingId });
    setFormError(null);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev: any) => ({
      ...prev,
      [e.target.name]: e.target.value,
      session_id: prev.session_id // always preserve session_id
    }));
  };

  const handleUpdate = async () => {
    setFormError(null);
    const { session_id, ...updateFields } = form;
    const trainingId = session_id;
    if (!trainingId) {
      setFormError('Session id is missing.');
      return;
    }
    Object.keys(updateFields).forEach(
      key => updateFields[key] === undefined && delete updateFields[key]
    );
    const { error } = await supabase.from('sessions').update(updateFields).eq('session_id', trainingId);
    if (error) {
      setFormError(error.message);
    } else {
      setEditMode(false);
      setSelectedTraining({ ...form, session_id: trainingId });
      // Refresh list
      const fetchTrainings = async () => {
        let query = supabase.from('sessions').select('*', { count: 'exact' });
        if (filter !== 'All') query = query.eq('type', filter);
        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        const { data, count } = await query.order('date', { ascending: false }).range(from, to);
        setTrainings(data || []);
        setTotalCount(count || 0);
      };
      fetchTrainings();
    }
  };

  const handleDelete = async () => {
    const trainingId = getTrainingId(selectedTraining);
    if (!trainingId) {
      setFormError('Session id is missing.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this session?')) return;
    const { error } = await supabase.from('sessions').delete().eq('session_id', trainingId);
    if (error) {
      setFormError(error.message);
    } else {
      setSelectedTraining(null);
      // Refresh list
      const fetchTrainings = async () => {
        let query = supabase.from('sessions').select('*', { count: 'exact' });
        if (filter !== 'All') query = query.eq('type', filter);
        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        const { data, count } = await query.order('date', { ascending: false }).range(from, to);
        setTrainings(data || []);
        setTotalCount(count || 0);
      };
      fetchTrainings();
    }
  };

  const handleCreate = () => {
    setCreating(true);
    setForm({
      date: '',
      starttime: '',
      endtime: '',
      title: '',
      groups: '',
      type: 'Swim',
      volume: '',
      description: '',
      location: '',
      poolname: '',
      poollength: '',
    });
    setFormError(null);
  };

  const handleSaveCreate = async () => {
    setFormError(null);
  const { session_id, ...insertFields } = form;
  const { error } = await supabase.from('sessions').insert([insertFields]);
    if (error) {
      setFormError(error.message);
    } else {
      setCreating(false);
      setSelectedTraining(null);
      setPage(1);
      // Refresh list
      const fetchTrainings = async () => {
        let query = supabase.from('sessions').select('*', { count: 'exact' });
        if (filter !== 'All') query = query.eq('type', filter);
        const from = 0;
        const to = PAGE_SIZE - 1;
        const { data, count } = await query.order('date', { ascending: false }).range(from, to);
        setTrainings(data || []);
        setTotalCount(count || 0);
      };
      fetchTrainings();
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '2rem auto', padding: '2rem', background: '#fff', borderRadius: 8 }}>
      <h2>Trainings</h2>
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
        <label>
          Filter by type:&nbsp;
          <select value={filter} onChange={e => { setFilter(e.target.value as 'All' | 'Swim' | 'Gym'); setPage(1); }}>
            <option value="All">All</option>
            <option value="Swim">Swim</option>
            <option value="Gym">Gym</option>
          </select>
        </label>
        <button onClick={handleCreate} style={{ padding: '6px 12px', borderRadius: 4 }}>+ New Training</button>
      </div>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #ccc', padding: '8px' }}>Date</th>
                <th style={{ border: '1px solid #ccc', padding: '8px' }}>Title</th>
                <th style={{ border: '1px solid #ccc', padding: '8px' }}>Groups</th>
                <th style={{ border: '1px solid #ccc', padding: '8px' }}>Type</th>
                <th style={{ border: '1px solid #ccc', padding: '8px' }}>Volume</th>
                <th style={{ border: '1px solid #ccc', padding: '8px' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {trainings.map((training) => (
                <tr key={getTrainingId(training) ?? training.date}>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>{training.date}</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>{training.title}</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>{training.groups}</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>{training.type}</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>{training.volume}</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                    <button onClick={() => { setSelectedTraining(training); setEditMode(false); }}>View Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: 8 }}>
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              style={{ padding: '6px 12px', borderRadius: 4 }}
            >
              Previous
            </button>
            <span>Page {page} of {totalPages || 1}</span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages || totalPages === 0}
              style={{ padding: '6px 12px', borderRadius: 4 }}
            >
              Next
            </button>
          </div>
        </>
      )}
      {!loading && !error && trainings.length === 0 && <p>No trainings found.</p>}

      {/* Modal for details, edit, and create */}
      {(selectedTraining || creating) && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => { setSelectedTraining(null); setEditMode(false); setCreating(false); }}
        >
          <div
            style={{
              background: '#fff',
              padding: 24,
              borderRadius: 8,
              minWidth: 320,
              maxWidth: 500,
              position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => { setSelectedTraining(null); setEditMode(false); setCreating(false); }}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: 'transparent',
                border: 'none',
                fontSize: 20,
                cursor: 'pointer'
              }}
              aria-label="Close"
            >
              &times;
            </button>
            {formError && <p style={{ color: 'red' }}>{formError}</p>}
            {creating ? (
              <>
                <h3>New Training Session</h3>
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    handleSaveCreate();
                  }}
                >
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: 6, fontWeight: 'bold' }}>Date:</td>
                        <td>
                          <input type="date" name="date" value={form.date || ''} onChange={handleFormChange} required />
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: 6, fontWeight: 'bold' }}>Start time:</td>
                        <td>
                          <input type="starttime" name="starttime" value={form.starttime || ''} onChange={handleFormChange} required />
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: 6, fontWeight: 'bold' }}>End time:</td>
                        <td>
                          <input type="endtime" name="endtime" value={form.endtime || ''} onChange={handleFormChange} required />
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: 6, fontWeight: 'bold' }}>Title:</td>
                        <td>
                          <input type="text" name="title" value={form.title || ''} onChange={handleFormChange} required />
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: 6, fontWeight: 'bold' }}>Groups:</td>
                        <td>
                          <input type="text" name="groups" value={form.groups || ''} onChange={handleFormChange} />
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: 6, fontWeight: 'bold' }}>Type:</td>
                        <td>
                          <select name="type" value={form.type || 'Swim'} onChange={handleFormChange}>
                            <option value="Swim">Swim</option>
                            <option value="Gym">Gym</option>
                          </select>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: 6, fontWeight: 'bold' }}>Volume:</td>
                        <td>
                          <input type="text" name="volume" value={form.volume || ''} onChange={handleFormChange} />
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: 6, fontWeight: 'bold' }}>Description:</td>
                        <td>
                          <textarea name="description" value={form.description || ''} onChange={handleFormChange} />
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: 6, fontWeight: 'bold' }}>Location:</td>
                        <td>
                          <textarea name="location" value={form.location || ''} onChange={handleFormChange} />
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: 6, fontWeight: 'bold' }}>Pool name:</td>
                        <td>
                          <textarea name="poolname" value={form.poolname || ''} onChange={handleFormChange} />
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: 6, fontWeight: 'bold' }}>Pool length:</td>
                        <td>
                          <textarea name="poollength" value={form.poollength || ''} onChange={handleFormChange} />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <button type="submit" style={{ marginTop: 12 }}>Create</button>
                </form>
              </>
            ) : editMode ? (
              <>
                <h3>Edit Training Session</h3>
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    handleUpdate();
                  }}
                >
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: 6, fontWeight: 'bold' }}>Date:</td>
                        <td>
                          <input type="date" name="date" value={form.date || ''} onChange={handleFormChange} required />
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: 6, fontWeight: 'bold' }}>Title:</td>
                        <td>
                          <input type="text" name="title" value={form.title || ''} onChange={handleFormChange} required />
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: 6, fontWeight: 'bold' }}>Groups:</td>
                        <td>
                          <input type="text" name="groups" value={form.groups || ''} onChange={handleFormChange} />
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: 6, fontWeight: 'bold' }}>Type:</td>
                        <td>
                          <select name="type" value={form.type || 'Swim'} onChange={handleFormChange}>
                            <option value="Swim">Swim</option>
                            <option value="Gym">Gym</option>
                          </select>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: 6, fontWeight: 'bold' }}>Volume:</td>
                        <td>
                          <input type="text" name="volume" value={form.volume || ''} onChange={handleFormChange} />
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: 6, fontWeight: 'bold' }}>Description:</td>
                        <td>
                          <textarea name="description" value={form.description || ''} onChange={handleFormChange} />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <button type="submit" style={{ marginTop: 12 }}>Save</button>
                </form>
              </>
            ) : (
              <>
                <h3>Session Details</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {Object.entries(selectedTraining || {}).map(([key, value]) => (
                      <tr key={key}>
                        <td style={{ padding: 6, fontWeight: 'bold', width: '40%' }}>{key}:</td>
                        <td style={{ padding: 6 }}>{String(value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop: 16 }}>
                  <button onClick={handleEdit} style={{ marginRight: 8 }}>Edit</button>
                  <button onClick={handleDelete} style={{ marginRight: 8, color: 'red' }}>Delete</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingsPage;