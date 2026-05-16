const https = require('https')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { token } = req.query
    if (!token) return res.status(400).json({ error: 'Missing token' })

    const key = process.env.SUPABASE_ANON_KEY
    const supabaseUrl = process.env.SUPABASE_URL
    if (!key || !supabaseUrl) return res.status(500).json({ error: 'Missing Supabase config' })

    const host = new URL(supabaseUrl).hostname

    const result = await new Promise((resolve, reject) => {
      const options = {
        hostname: host,
        path: '/rest/v1/plans?share_token=eq.' + encodeURIComponent(token) + '&limit=1',
        method: 'GET',
        headers: {
          'apikey': key,
          'Authorization': 'Bearer ' + key
        }
      }
      const r = https.request(options, resp => {
        let d = ''
        resp.on('data', c => d += c)
        resp.on('end', () => { try { resolve(JSON.parse(d)) } catch(e) { reject(new Error('Invalid JSON: ' + d.slice(0, 200))) } })
      })
      r.on('error', reject)
      r.end()
    })

    if (!Array.isArray(result) || !result[0]) return res.status(404).json({ error: 'Plan not found' })
    res.status(200).json(result[0])
  } catch(e) {
    res.status(500).json({ error: e.message })
  }
}
