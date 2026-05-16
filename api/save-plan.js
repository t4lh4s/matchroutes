const https = require('https')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { teamSlug, teamName, teamFlag, homeCity, itinerary } = req.body
    const key = process.env.SUPABASE_ANON_KEY
    const supabaseUrl = process.env.SUPABASE_URL
    if (!key || !supabaseUrl) return res.status(500).json({ error: 'Missing Supabase config' })

    const host = new URL(supabaseUrl).hostname
    const body = JSON.stringify({ team_slug: teamSlug, team_name: teamName, team_flag: teamFlag, home_city: homeCity, itinerary })

    const result = await new Promise((resolve, reject) => {
      const options = {
        hostname: host,
        path: '/rest/v1/plans?select=share_token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': key,
          'Authorization': 'Bearer ' + key,
          'Prefer': 'return=representation',
          'Content-Length': Buffer.byteLength(body)
        }
      }
      const r = https.request(options, resp => {
        let d = ''
        resp.on('data', c => d += c)
        resp.on('end', () => { try { resolve(JSON.parse(d)) } catch(e) { reject(new Error('Invalid JSON: ' + d.slice(0, 200))) } })
      })
      r.on('error', reject)
      r.write(body)
      r.end()
    })

    if (!Array.isArray(result) || !result[0]) {
      return res.status(500).json({ error: result?.message || result?.hint || JSON.stringify(result) })
    }
    res.status(200).json({ shareToken: result[0].share_token })
  } catch(e) {
    res.status(500).json({ error: e.message })
  }
}
