export default function handler(req, res) {
  res.status(200).json({ ok: true, version: '1.2.3', time: new Date().toISOString() });
}
