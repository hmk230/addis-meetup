import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useLang } from '../../context/AppContext';
import Layout from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { GripVertical, Edit, Trash2, Lock, Users, Download } from 'lucide-react';

export default function AdminMeetups() {
  const { t } = useLang();
  const [meetups, setMeetups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/meetups').then(r => setMeetups(r.data)).finally(() => setLoading(false));
  }, []);

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const items = Array.from(meetups);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setMeetups(items);
    const order = items.map((m, i) => ({ id: m.id, order_index: i }));
    try {
      await api.put('/meetups/reorder', { order });
    } catch {
      toast.error('Reorder failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this meetup and all its registrations?')) return;
    try {
      await api.delete(`/meetups/${id}`);
      setMeetups(meetups.filter(m => m.id !== id));
      toast.success('Deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleClose = async (id) => {
    try {
      const { data } = await api.patch(`/meetups/${id}/close`);
      setMeetups(meetups.map(m => m.id === id ? data : m));
      toast.success('Meetup closed');
    } catch {
      toast.error('Failed');
    }
  };

  const handleExport = (id, title) => {
    const token = localStorage.getItem('token');
    const url = `${import.meta.env.VITE_API_URL || '/api'}/meetups/${id}/export`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob()).then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${title}-attendance.csv`;
        a.click();
      });
  };

  return (
    <Layout title={t('meetups')}>
      <div className="py-2">
        <Link to="/admin/meetups/new">
          <button className="btn-primary w-full mb-4">+ {t('createMeetup')}</button>
        </Link>
        <p className="text-xs text-gray-400 mb-3 text-center">Drag to reorder meetups</p>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="card h-20 animate-pulse bg-gray-100" />)}</div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="meetups">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                  {meetups.map((m, index) => (
                    <Draggable key={m.id} draggableId={m.id} index={index}>
                      {(provided, snapshot) => (
                        <div ref={provided.innerRef} {...provided.draggableProps}
                          className={`card ${snapshot.isDragging ? 'shadow-lg rotate-1' : ''}`}>
                          <div className="flex items-start gap-2">
                            <div {...provided.dragHandleProps} className="text-gray-300 pt-0.5">
                              <GripVertical size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-sm truncate">{m.title}</span>
                                <StatusBadge status={m.status} />
                              </div>
                              <p className="text-xs text-gray-400">{m.location} · {m.spots_remaining}/{m.max_players} spots</p>
                              <div className="flex items-center gap-2 mt-3 flex-wrap">
                                <Link to={`/admin/meetups/${m.id}/registrations`}>
                                  <button className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 rounded-lg font-medium transition">
                                    <Users size={12} /> Registrations
                                  </button>
                                </Link>
                                <Link to={`/admin/meetups/${m.id}/edit`}>
                                  <button className="flex items-center gap-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 px-2.5 py-1.5 rounded-lg font-medium transition">
                                    <Edit size={12} /> Edit
                                  </button>
                                </Link>
                                {m.status === 'open' && (
                                  <button onClick={() => handleClose(m.id)}
                                    className="flex items-center gap-1 text-xs bg-amber-50 hover:bg-amber-100 text-amber-600 px-2.5 py-1.5 rounded-lg font-medium transition">
                                    <Lock size={12} /> Close
                                  </button>
                                )}
                                <button onClick={() => handleExport(m.id, m.title)}
                                  className="flex items-center gap-1 text-xs bg-green-50 hover:bg-green-100 text-green-600 px-2.5 py-1.5 rounded-lg font-medium transition">
                                  <Download size={12} /> CSV
                                </button>
                                <button onClick={() => handleDelete(m.id)}
                                  className="flex items-center gap-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 px-2.5 py-1.5 rounded-lg font-medium transition">
                                  <Trash2 size={12} /> Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
    </Layout>
  );
}
