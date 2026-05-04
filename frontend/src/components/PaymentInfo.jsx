import { useLang } from '../context/AppContext';

export default function PaymentInfo({ info, total, refCode }) {
  if (!info) return null;
  const { t } = useLang();

  return (
    <div className="space-y-3">
      {/* Ticket card */}
      <div className="rounded-2xl overflow-hidden">
        <div style={{ background:'#4CAF82' }} className="px-5 py-4">
          <div className="text-xs font-bold tracking-widest text-white/60 uppercase mb-1">Match Ticket</div>
          <div className="text-lg font-black text-white mb-1">Payment Due</div>
          <div className="text-sm text-white/80 font-mono">Code: {refCode}</div>
        </div>
        <div className="bg-white border border-t-0 border-gray-200 divide-y divide-gray-100">
          {total && (
            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-sm text-gray-500">Total Amount</span>
              <span className="text-xl font-black" style={{ color:'#4CAF82' }}>{Number(total).toLocaleString('en', { minimumFractionDigits: total%1!==0?2:0, maximumFractionDigits:2 })} ETB</span>
            </div>
          )}
          <div className="flex justify-between items-center px-4 py-3">
            <span className="text-sm text-gray-500">Reference Code</span>
            <span className="font-mono font-bold text-sm" style={{ color:'#4CAF82' }}>{refCode}</span>
          </div>
          <div className="flex justify-between items-center px-4 py-3">
            <span className="text-sm text-gray-500">Status</span>
            <span className="text-amber-600 font-bold text-sm">⏳ Pending Payment</span>
          </div>
        </div>
      </div>

      {/* Bank details */}
      {(info.bank_name || info.telebirr_number) && (
        <div className="rounded-2xl overflow-hidden">
          <div style={{ background:'#1e2330' }} className="px-5 py-3">
            <div className="text-xs font-bold tracking-widest text-white/50 uppercase mb-1">Transfer Money To</div>
            <div className="text-base font-bold text-white">{info.bank_name || 'Bank Transfer'}</div>
          </div>
          <div className="bg-white border border-t-0 border-gray-200 divide-y divide-gray-100">
            {info.bank_account && (
              <div className="flex justify-between px-4 py-3 text-sm">
                <span className="text-gray-500">{t('bankAccount')}</span>
                <span className="font-mono font-bold" style={{ color:'#4CAF82' }}>{info.bank_account}</span>
              </div>
            )}
            {info.telebirr_number && (
              <div className="flex justify-between px-4 py-3 text-sm">
                <span className="text-gray-500">{t('telebirr')}</span>
                <span className="font-mono font-bold" style={{ color:'#4CAF82' }}>{info.telebirr_number}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Telegram */}
      {info.telegram_username && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
          <div className="text-3xl mb-3">📨</div>
          <div className="font-bold text-gray-900 mb-2">Send Screenshot on Telegram</div>
          <div className="text-xs text-gray-500 mb-4">After transferring, send your screenshot with code <span style={{ color:'#4CAF82' }} className="font-bold">{refCode}</span></div>
          <a href={`https://t.me/${info.telegram_username.replace('@','')}`} target="_blank" rel="noreferrer"
            style={{ background:'#229ED9' }}
            className="flex items-center justify-center gap-2 w-full text-white font-bold py-3 rounded-xl text-sm hover:opacity-90 transition">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.19 13.668l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.958.891z"/></svg>
            Message {info.telegram_username}
          </a>
        </div>
      )}

      {/* Steps */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <div className="font-bold mb-3">What to do next</div>
        {[
          ['Transfer the exact amount to the bank account or Telebirr number shown above.'],
          ['Screenshot your payment confirmation screen.'],
          [`Open Telegram and message us at ${info.telegram_username || '@AddisMeetupAdmin'}.`],
          [`Include your ticket code (${refCode}) in the message.`],
          ["We'll confirm your spot within a few hours. You'll see it in My Spots. ✅"],
        ].map(([txt], i) => (
          <div key={i} className="flex gap-3 mb-3 last:mb-0">
            <div style={{ background:'#4CAF82' }} className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{i+1}</div>
            <p className="text-sm text-gray-700 leading-relaxed pt-0.5" dangerouslySetInnerHTML={{ __html: txt.replace(refCode, `<strong style="color:#4CAF82">${refCode}</strong>`) }} />
          </div>
        ))}
      </div>
    </div>
  );
}
