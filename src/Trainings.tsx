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
    <div
      style={{
        maxWidth: 900,
        margin: '2rem auto',
        padding: '2rem',
        background: '#fff',
        borderRadius: 8,
      }}
    >
      <h2>Trainings</h2>
      <div
        style={{
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <label
            htmlFor="type-filter"
            style={{ marginRight: '10px', fontWeight: 'bold' }}
          >
            Filter by type:
          </label>
          <select
            id="type-filter"
            value={filter}
            onChange={e => {
              setFilter(e.target.value as 'All' | 'Swim' | 'Gym');
              setPage(1);
            }}
            style={{
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ccc',
            }}
          >
            <option value="All">All</option>
            <option value="Swim">Swim</option>
            <option value="Gym">Gym</option>
          </select>
        </div>
        <button
          onClick={handleCreate}
          style={{
            padding: '8px 16px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          + New Training
        </button>
      </div>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && (
        <>
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
                    Date
                  </th>
                  <th
                    style={{
                      padding: '12px',
                      border: '1px solid #ddd',
                      textAlign: 'left',
                    }}
                  >
                    Title
                  </th>
                  <th
                    style={{
                      padding: '12px',
                      border: '1px solid #ddd',
                      textAlign: 'left',
                    }}
                  >
                    Groups
                  </th>
                  <th
                    style={{
                      padding: '12px',
                      border: '1px solid #ddd',
                      textAlign: 'left',
                    }}
                  >
                    Type
                  </th>
                  <th
                    style={{
                      padding: '12px',
                      border: '1px solid #ddd',
                      textAlign: 'left',
                    }}
                  >
                    Volume
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
                {trainings.map((training, index) => (
                  <tr
                    key={getTrainingId(training) ?? training.date}
                    style={{
                      backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white',
                    }}
                  >
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                      {training.date}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                      {training.title}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                      {training.groups}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                      {training.type}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                      {training.volume}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                      <button
                        onClick={() => {
                          setSelectedTraining(training);
                          setEditMode(false);
                        }}
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
          <div
            style={{
              marginTop: '1rem',
              display: 'flex',
              justifyContent: 'center',
              gap: 8,
              alignItems: 'center',
            }}
          >
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              style={{
                padding: '8px 16px',
                backgroundColor: page === 1 ? '#e9ecef' : '#007bff',
                color: page === 1 ? '#6c757d' : 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: page === 1 ? 'not-allowed' : 'pointer',
              }}
            >
              Previous
            </button>
            <span style={{ padding: '0 16px', fontWeight: 'bold' }}>
              Page {page} of {totalPages || 1}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages || totalPages === 0}
              style={{
                padding: '8px 16px',
                backgroundColor:
                  page === totalPages || totalPages === 0
                    ? '#e9ecef'
                    : '#007bff',
                color:
                  page === totalPages || totalPages === 0 ? '#6c757d' : 'white',
                border: 'none',
                borderRadius: '4px',
                cursor:
                  page === totalPages || totalPages === 0
                    ? 'not-allowed'
                    : 'pointer',
              }}
            >
              Next
            </button>
          </div>
        </>
      )}
      {!loading && !error && trainings.length === 0 && (
        <p>No trainings found.</p>
      )}

      {/* Modal for details, edit, and create */}
      {(selectedTraining || creating) && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => {
            setSelectedTraining(null);
            setEditMode(false);
            setCreating(false);
          }}
        >
          <div
            style={{
              background: '#fff',
              padding: 24,
              borderRadius: 8,
              minWidth: 320,
              maxWidth: 500,
              position: 'relative',
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setSelectedTraining(null);
                setEditMode(false);
                setCreating(false);
              }}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: 'none',
                border: 'none',
                fontSize: 18,
                cursor: 'pointer',
                color: '#666',
              }}
              aria-label="Close"
            >
              ✕
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
                  <div style={{ marginBottom: 8 }}>
                    <strong>Date:</strong>{' '}
                    <input
                      type="date"
                      name="date"
                      value={form.date || ''}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Start Time:</strong>{' '}
                    <input
                      type="starttime"
                      name="starttime"
                      value={form.starttime || ''}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>End Time:</strong>{' '}
                    <input
                      type="endtime"
                      name="endtime"
                      value={form.endtime || ''}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Title:</strong>{' '}
                    <input
                      type="text"
                      name="title"
                      value={form.title || ''}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Type:</strong>{' '}
                    <select
                      name="type"
                      value={form.type || 'Swim'}
                      onChange={handleFormChange}
                    >
                      <option value="Swim">Swim</option>
                      <option value="Gym">Gym</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Groups:</strong>{' '}
                    <input
                      type="text"
                      name="groups"
                      value={form.groups || ''}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Volume:</strong>{' '}
                    <input
                      type="text"
                      name="volume"
                      value={form.volume || ''}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Description:</strong>
                    <div style={{ marginTop: 4 }}>
                      <textarea
                        name="description"
                        value={form.description || ''}
                        onChange={handleFormChange}
                        style={{
                          width: '100%',
                          height: 80,
                          fontFamily: 'monospace',
                          whiteSpace: 'pre',
                          tabSize: 4,
                        }}
                        wrap="off"
                        spellCheck={false}
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Location:</strong>{' '}
                    <input
                      type="text"
                      name="location"
                      value={form.location || ''}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Pool Name:</strong>{' '}
                    <input
                      type="text"
                      name="poolname"
                      value={form.poolname || ''}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Pool Length:</strong>{' '}
                    <input
                      type="text"
                      name="poollength"
                      value={form.poollength || ''}
                      onChange={handleFormChange}
                    />
                  </div>
                  <button type="submit" style={{ marginTop: 12 }}>
                    Create
                  </button>
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
                  <div style={{ marginBottom: 8 }}>
                    <strong>Date:</strong>{' '}
                    <input
                      type="date"
                      name="date"
                      value={form.date || ''}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Start Time:</strong>{' '}
                    <input
                      type="starttime"
                      name="starttime"
                      value={form.starttime || ''}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>End Time:</strong>{' '}
                    <input
                      type="endtime"
                      name="endtime"
                      value={form.endtime || ''}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Title:</strong>{' '}
                    <input
                      type="text"
                      name="title"
                      value={form.title || ''}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Type:</strong>{' '}
                    <select
                      name="type"
                      value={form.type || 'Swim'}
                      onChange={handleFormChange}
                    >
                      <option value="Swim">Swim</option>
                      <option value="Gym">Gym</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Groups:</strong>{' '}
                    <input
                      type="text"
                      name="groups"
                      value={form.groups || ''}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Volume:</strong>{' '}
                    <input
                      type="text"
                      name="volume"
                      value={form.volume || ''}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Description:</strong>
                    <div style={{ marginTop: 4 }}>
                      <textarea
                        name="description"
                        value={form.description || ''}
                        onChange={handleFormChange}
                        style={{
                          width: '100%',
                          height: 80,
                          fontFamily: 'monospace',
                          whiteSpace: 'pre',
                          tabSize: 4,
                          overflowWrap: 'break-word',
                          resize: 'vertical',
                        }}
                        rows={5}
                        wrap="off"
                        spellCheck={false}
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Location:</strong>{' '}
                    <input
                      type="text"
                      name="location"
                      value={form.location || ''}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Pool Name:</strong>{' '}
                    <input
                      type="text"
                      name="poolname"
                      value={form.poolname || ''}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Pool Length:</strong>{' '}
                    <input
                      type="text"
                      name="poollength"
                      value={form.poollength || ''}
                      onChange={handleFormChange}
                    />
                  </div>
                  <button type="submit" style={{ marginTop: 12 }}>
                    Save
                  </button>
                </form>
              </>
            ) : (
              <>
                <h3>Session Details</h3>
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
                      ].map((item, index) => (
                        <tr
                          key={item.field}
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
                            }}
                          >
                            {item.field}
                          </td>
                          <td
                            style={{
                              padding: '8px',
                              border: '1px solid #ddd',
                              textAlign:
                                item.field === 'Description' ? 'left' : 'left',
                            }}
                          >
                            {item.field === 'Description' ? (
                              <div
                                style={{
                                  whiteSpace: 'pre-wrap',
                                  textAlign: 'left',
                                }}
                              >
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
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <button
                    onClick={handleEdit}
                    style={{
                      marginRight: 8,
                      padding: '8px 16px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    style={{
                      marginRight: 8,
                      padding: '8px 16px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
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
