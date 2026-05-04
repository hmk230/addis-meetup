import { useEffect, useState } from 'react';
import { useLang } from '../../context/AppContext';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Building2, CreditCard, Smartphone, Send } from 'lucide-react';

export default function AdminSettings() {
  const { t } = useLang();
  const [form, setForm] = useState({ bank_name: '', bank_account: '', telebirr_number: '', telegram_username: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/admin/settings').then(r => {
      if (r.data) setForm({
        bank_name: r.data.bank_name || '',
        bank_account: r.data.bank_account || '',
        telebirr_number: r.data.telebirr_number || '',
        telegram_username: r.data.telegram_username || '',
      });
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/admin/settings', form);
      toast.success('Settings saved!');
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const f = (k) => ({ value: form[k], onChange: e => setForm({ ...form, [k]: e.target.value }) });

  if (loading) return <Layout title={t('settings')}><div className="py-8 text-center text-gray-400">{t('loading')}</div></Layout>;

  return (
    <Layout title={t('settings')}>
      <div className="py-2">
        <p className="text-sm text-gray-500 mb-4">
          These details are shown to players after registering for a meetup.
        </p>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="card space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Building2 size={16} className="text-brand-500" /> Bank Details
            </h3>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">{t('bankName')}</label>
              <input className="input" {...f('bank_name')} placeholder="e.g. Commercial Bank of Ethiopia" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">{t('bankAccount')}</label>
              <input className="input font-mono" {...f('bank_account')} placeholder="e.g. 1000123456789" />
            </div>
          </div>

          <div className="card space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Smartphone size={16} className="text-brand-500" /> Telebirr
            </h3>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">{t('telebirr')} Number</label>
              <input className="input font-mono" {...f('telebirr_number')} placeholder="e.g. 0911234567" />
            </div>
          </div>

          <div className="card space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Send size={16} className="text-[#229ED9]" /> Telegram
            </h3>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">{t('telegramUser')}</label>
              <input className="input" {...f('telegram_username')} placeholder="@addismeetup" />
            </div>
          </div>

          {/* Preview */}
          {(form.bank_name || form.telebirr_number) && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
              <p className="text-xs font-semibold text-green-800 mb-2">Preview (what players see):</p>
              {form.bank_name && (
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Bank</span>
                  <span className="font-semibold">{form.bank_name}</span>
                </div>
              )}
              {form.bank_account && (
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Account</span>
                  <span className="font-mono font-semibold">{form.bank_account}</span>
                </div>
              )}
              {form.telebirr_number && (
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Telebirr</span>
                  <span className="font-mono font-semibold">{form.telebirr_number}</span>
                </div>
              )}
              {form.telegram_username && (
                <div className="mt-2 text-center bg-[#229ED9] text-white text-xs rounded-xl py-2 font-semibold">
                  📤 Send screenshot → {form.telegram_username}
                </div>
              )}
            </div>
          )}

          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? t('loading') : t('saveChanges')}
          </button>
        </form>
      </div>
    </Layout>
  );
}
