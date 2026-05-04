export default function StatusBadge({ status }) {
  const map = {
    pending: 'badge-pending',
    approved: 'badge-approved',
    rejected: 'badge-rejected',
    open: 'badge-open',
    closed: 'badge-closed',
  };
  const labels = {
    pending: '⏳ Pending',
    approved: '✅ Approved',
    rejected: '❌ Rejected',
    open: '🟢 Open',
    closed: '🔒 Closed',
  };
  return <span className={map[status] || 'badge-pending'}>{labels[status] || status}</span>;
}
