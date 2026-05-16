const https = require('https')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { teamSlug, teamName, teamFlag, homeCity, itinerary } = req.body
  const key = process.env.SUPABASE_ANON_KEY
  const host = new URL(process.env.SUPABASE_URL).hostname

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
      resp.on('end', () => { try { resolve(JSON.parse(d)) } catch(e) { reject(e) } })
    })
    r.on('error', reject)
    r.write(body)
    r.end()
  })

  if (!Array.isArray(result) || !result[0]) return res.status(500).json({ error: result?.message || 'Save failed' })
  res.status(200).json({ shareToken: result[0].share_token })
}
