import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLang } from '../../context/AppContext';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const empty = { title: '', description: '', location: '', date_time: '', max_players: '', price: '' };

export default function AdminMeetupForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const { t } = useLang();
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      api.get(`/meetups/${id}`).then(r => {
        const m = r.data;
        setForm({
          title: m.title || '',
          description: m.description || '',
          location: m.location || '',
          date_time: m.date_time ? m.date_time.slice(0, 16) : '',
          max_players: m.max_players || '',
          price: m.price || '',
        });
      });
    }
  }, [id]);

  const f = (k) => ({
    value: form[k],
    onChange: e => setForm({ ...form, [k]: e.target.value })
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/meetups/${id}`, form);
        toast.success('Meetup updated!');
      } else {
        await api.post('/meetups', form);
        toast.success('Meetup created!');
      }
      navigate('/admin/meetups');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title={isEdit ? t('editMeetup') : t('createMeetup')} back>
      <div className="py-2">
        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">{t('title')} *</label>
            <input className="input" {...f('title')} required placeholder="e.g. Friday Night Game" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">{t('description')}</label>
            <textarea className="input resize-none" rows={3} {...f('description')}
              placeholder="Optional details about this meetup..." />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">{t('location')} *</label>
            <input className="input" {...f('location')} required placeholder="e.g. Bole Stadium, Addis Ababa" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">{t('dateTime')} *</label>
            <input className="input" type="datetime-local" {...f('date_time')} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">{t('maxPlayers')} *</label>
              <input className="input" type="number" min="2" max="100" {...f('max_players')} required placeholder="22" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">{t('price')} *</label>
              <input className="input" type="number" min="0" step="0.01" {...f('price')} required placeholder="150" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? t('loading') : isEdit ? t('saveChanges') : t('createMeetup')}
            </button>
            <button type="button" onClick={() => navigate('/admin/meetups')} className="btn-secondary flex-1">
              {t('cancel')}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
