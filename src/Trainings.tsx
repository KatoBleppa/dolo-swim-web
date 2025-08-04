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
      setFormError('ID non trovato nel record selezionato.');
      return;
    }
    setEditMode(true);
    setForm({ ...selectedTraining, session_id: trainingId });
    setFormError(null);
  };

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setForm((prev: any) => ({
      ...prev,
      [e.target.name]: e.target.value,
      session_id: prev.session_id, // always preserve session_id
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
    const { error } = await supabase
      .from('sessions')
      .update(updateFields)
      .eq('session_id', trainingId);
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
        const { data, count } = await query
          .order('date', { ascending: false })
          .range(from, to);
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
    if (!window.confirm('Are you sure you want to delete this session?'))
      return;
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('session_id', trainingId);
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
        const { data, count } = await query
          .order('date', { ascending: false })
          .range(from, to);
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
        const { data, count } = await query
          .order('date', { ascending: false })
          .range(from, to);
        setTrainings(data || []);
        setTotalCount(count || 0);
      };
      fetchTrainings();
    }
  };

  return (
    <div className="page-container">
      <h2 className="page-title">Trainings</h2>
      <div className="form-actions">
        <div className="form-group">
          <label htmlFor="type-filter" className="form-label">
            Filter by type:
          </label>
          <select
            id="type-filter"
            className="form-input"
            value={filter}
            onChange={e => {
              setFilter(e.target.value as 'All' | 'Swim' | 'Gym');
              setPage(1);
            }}
          >
            <option value="All">All</option>
            <option value="Swim">Swim</option>
            <option value="Gym">Gym</option>
          </select>
        </div>
        <button onClick={handleCreate} className="btn-success">
          + New Training
        </button>
      </div>
      {loading && <p>Loading...</p>}
      {error && <p className="error-message">{error}</p>}
      {!loading && !error && (
        <>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Title</th>
                  <th>Groups</th>
                  <th>Type</th>
                  <th>Volume</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {trainings.map(training => (
                  <tr key={getTrainingId(training) ?? training.date}>
                    <td>{training.date}</td>
                    <td>{training.title}</td>
                    <td>{training.groups}</td>
                    <td>{training.type}</td>
                    <td>{training.volume}</td>
                    <td>
                      <button
                        onClick={() => {
                          setSelectedTraining(training);
                          setEditMode(false);
                        }}
                        className="btn-primary"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className={page === 1 ? 'btn-secondary' : 'btn-primary'}
            >
              Previous
            </button>
            <span className="pagination-info">
              Page {page} of {totalPages || 1}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages || totalPages === 0}
              className={
                page === totalPages || totalPages === 0
                  ? 'btn-secondary'
                  : 'btn-primary'
              }
            >
              Next
            </button>
          </div>
        </>
      )}
      {!loading && !error && trainings.length === 0 && (
        <div className="no-data">No trainings found.</div>
      )}

      {/* Modal for details, edit, and create */}
      {(selectedTraining || creating) && (
        <div
          className="modal-overlay"
          onClick={() => {
            setSelectedTraining(null);
            setEditMode(false);
            setCreating(false);
          }}
        >
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => {
                setSelectedTraining(null);
                setEditMode(false);
                setCreating(false);
              }}
              className="modal-close"
              aria-label="Close"
            >
              ✕
            </button>
            {formError && <p className="error-message">{formError}</p>}
            {creating ? (
              <>
                //* New Training Session *//
                <h3 className="modal-title">New Training Session</h3>
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    handleSaveCreate();
                  }}
                  className="modal-form"
                >
                  <div className="table-container">
                    <table className="table">
                      <tbody>
                        <tr>
                          <td>
                            <strong>Date</strong>
                          </td>
                          <td>
                            <input
                              className="form-input"
                              type="date"
                              name="date"
                              value={form.date || ''}
                              onChange={handleFormChange}
                              required
                            />
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <strong>Start Time</strong>
                          </td>
                          <td>
                            <input
                              className="form-input"
                              type="time"
                              name="starttime"
                              value={form.starttime || ''}
                              onChange={handleFormChange}
                              required
                            />
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <strong>End Time</strong>
                          </td>
                          <td>
                            <input
                              className="form-input"
                              type="time"
                              name="endtime"
                              value={form.endtime || ''}
                              onChange={handleFormChange}
                              required
                            />
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <strong>Title</strong>
                          </td>
                          <td>
                            <input
                              className="form-input"
                              type="text"
                              name="title"
                              value={form.title || ''}
                              onChange={handleFormChange}
                              required
                            />
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <strong>Type</strong>
                          </td>
                          <td>
                            <select
                              className="form-input"
                              name="type"
                              value={form.type || 'Swim'}
                              onChange={handleFormChange}
                            >
                              <option value="Swim">Swim</option>
                              <option value="Gym">Gym</option>
                            </select>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <strong>Groups</strong>
                          </td>
                          <td>
                            <input
                              className="form-input"
                              type="text"
                              name="groups"
                              value={form.groups || ''}
                              onChange={handleFormChange}
                            />
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <strong>Volume</strong>
                          </td>
                          <td>
                            <input
                              className="form-input"
                              type="text"
                              name="volume"
                              value={form.volume || ''}
                              onChange={handleFormChange}
                            />
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <strong>Description</strong>
                          </td>
                          <td>
                            <textarea
                              className="form-input description-textarea"
                              name="description"
                              value={form.description || ''}
                              onChange={handleFormChange}
                              wrap="off"
                              spellCheck={false}
                            />
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <strong>Location</strong>
                          </td>
                          <td>
                            <input
                              className="form-input"
                              type="text"
                              name="location"
                              value={form.location || ''}
                              onChange={handleFormChange}
                            />
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <strong>Pool Name</strong>
                          </td>
                          <td>
                            <input
                              className="form-input"
                              type="text"
                              name="poolname"
                              value={form.poolname || ''}
                              onChange={handleFormChange}
                            />
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <strong>Pool Length</strong>
                          </td>
                          <td>
                            <input
                              className="form-input"
                              type="text"
                              name="poollength"
                              value={form.poollength || ''}
                              onChange={handleFormChange}
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="modal-buttons">
                    <button type="submit" className="btn-primary">
                      Create
                    </button>
                  </div>
                </form>
              </>
            ) : //* Edit Training Session *//
            editMode ? (
              <>
                <h3 className="modal-title">Edit Training Session</h3>
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    handleUpdate();
                  }}
                  className="modal-form"
                >
                  <div className="table-container">
                    <table className="table">
                      <tbody>
                        <tr>
                          <td>
                            <strong>Date</strong>
                          </td>
                          <td>
                            <input
                              className="form-input"
                              type="date"
                              name="date"
                              value={form.date || ''}
                              onChange={handleFormChange}
                              required
                            />
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <strong>Start Time</strong>
                          </td>
                          <td>
                            <input
                              className="form-input"
                              type="time"
                              name="starttime"
                              value={form.starttime || ''}
                              onChange={handleFormChange}
                              required
                            />
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <strong>End Time</strong>
                          </td>
                          <td>
                            <input
                              className="form-input"
                              type="time"
                              name="endtime"
                              value={form.endtime || ''}
                              onChange={handleFormChange}
                              required
                            />
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <strong>Title</strong>
                          </td>
                          <td>
                            <input
                              className="form-input"
                              type="text"
                              name="title"
                              value={form.title || ''}
                              onChange={handleFormChange}
                              required
                            />
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <strong>Type</strong>
                          </td>
                          <td>
                            <select
                              className="form-input"
                              name="type"
                              value={form.type || 'Swim'}
                              onChange={handleFormChange}
                            >
                              <option value="Swim">Swim</option>
                              <option value="Gym">Gym</option>
                            </select>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <strong>Groups</strong>
                          </td>
                          <td>
                            <input
                              className="form-input"
                              type="text"
                              name="groups"
                              value={form.groups || ''}
                              onChange={handleFormChange}
                            />
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <strong>Volume</strong>
                          </td>
                          <td>
                            <input
                              className="form-input"
                              type="text"
                              name="volume"
                              value={form.volume || ''}
                              onChange={handleFormChange}
                            />
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <strong>Description</strong>
                          </td>
                          <td>
                            <textarea
                              className="form-input description-textarea"
                              name="description"
                              value={form.description || ''}
                              onChange={handleFormChange}
                              rows={5}
                              wrap="off"
                              spellCheck={false}
                            />
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <strong>Location</strong>
                          </td>
                          <td>
                            <input
                              className="form-input"
                              type="text"
                              name="location"
                              value={form.location || ''}
                              onChange={handleFormChange}
                            />
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <strong>Pool Name</strong>
                          </td>
                          <td>
                            <input
                              className="form-input"
                              type="text"
                              name="poolname"
                              value={form.poolname || ''}
                              onChange={handleFormChange}
                            />
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <strong>Pool Length</strong>
                          </td>
                          <td>
                            <input
                              className="form-input"
                              type="text"
                              name="poollength"
                              value={form.poollength || ''}
                              onChange={handleFormChange}
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="modal-buttons">
                    <button type="submit" className="btn-primary">
                      Save
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                //* Session Details *//
                <h3 className="modal-title">Session Details</h3>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Field</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { field: 'Date', value: selectedTraining.date },
                        {
                          field: 'Start Time',
                          value: selectedTraining.starttime,
                        },
                        { field: 'End Time', value: selectedTraining.endtime },
                        { field: 'Title', value: selectedTraining.title },
                        { field: 'Type', value: selectedTraining.type },
                        {
                          field: 'Groups',
                          value: selectedTraining.groups || '-',
                        },
                        {
                          field: 'Volume',
                          value: selectedTraining.volume || '-',
                        },
                        {
                          field: 'Description',
                          value: selectedTraining.description || '-',
                        },
                        {
                          field: 'Location',
                          value: selectedTraining.location || '-',
                        },
                        {
                          field: 'Pool Name',
                          value: selectedTraining.poolname || '-',
                        },
                        {
                          field: 'Pool Length',
                          value: selectedTraining.poollength || '-',
                        },
                      ].map(item => (
                        <tr key={item.field}>
                          <td>
                            <strong>{item.field}</strong>
                          </td>
                          <td>
                            {item.field === 'Description' ? (
                              <div className="description-content">
                                {item.value}
                              </div>
                            ) : (
                              item.value
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="modal-buttons">
                  <button onClick={handleEdit} className="btn-primary">
                    Edit
                  </button>
                  <button onClick={handleDelete} className="btn-danger">
                    Delete
                  </button>
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
