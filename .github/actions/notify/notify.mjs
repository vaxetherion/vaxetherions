// .github/actions/notify/notify.mjs
// Dipanggil oleh action.yml (composite). Membaca env NOTIFY_* dan mengirim
// pesan ke SEMUA kanal yang terkonfigurasi:
//   - Discord  : POST JSON ke webhook (content)
//   - Telegram : POST sendMessage ke api.telegram.org (text plain)
// Kegagalan pengiriman hanya dicatat sebagai warning — tidak menggagalkan
// step, agar notifikasi yang rusak tidak menutupi status run yang sebenarnya.

const message = process.env.NOTIFY_MESSAGE ?? '';

let sent = 0;

if (process.env.NOTIFY_DISCORD_WEBHOOK) {
  try {
    const res = await fetch(process.env.NOTIFY_DISCORD_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message }),
    });
    if (res.ok) {
      sent++;
      console.log('✅ Notifikasi Discord terkirim.');
    } else {
      console.log(`⚠️ Discord merespons HTTP ${res.status} — periksa webhook URL.`);
    }
  } catch (error) {
    console.log(`⚠️ Gagal kirim ke Discord: ${error.message}`);
  }
}

if (process.env.NOTIFY_TELEGRAM_TOKEN && process.env.NOTIFY_TELEGRAM_CHAT) {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${process.env.NOTIFY_TELEGRAM_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: process.env.NOTIFY_TELEGRAM_CHAT,
          text: message,
        }),
      },
    );
    if (res.ok) {
      sent++;
      console.log('✅ Notifikasi Telegram terkirim.');
    } else {
      console.log(`⚠️ Telegram merespons HTTP ${res.status} — periksa bot token / chat id.`);
    }
  } catch (error) {
    console.log(`⚠️ Gagal kirim ke Telegram: ${error.message}`);
  }
}

console.log(`📨 ${sent} kanal notifikasi terkirim.`);
