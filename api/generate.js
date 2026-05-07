const https = require('https')

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'No API key' })

  const { teamSlug, teamName, teamGroup, homeCity, homeAirport, dateFrom, dateTo, partySize, budget, scenario } = req.body

  const CITIES = {
    'new-york-new-jersey': { name: 'New York / New Jersey', airport: 'EWR', hood: 'Midtown Manhattan or Jersey City' },
    'los-angeles': { name: 'Los Angeles', airport: 'LAX', hood: 'Downtown LA or Santa Monica' },
    'dallas': { name: 'Dallas', airport: 'DFW', hood: 'Downtown or Uptown Dallas' },
    'atlanta': { name: 'Atlanta', airport: 'ATL', hood: 'Midtown or Buckhead' },
    'houston': { name: 'Houston', airport: 'IAH', hood: 'Midtown or Museum District' },
    'miami': { name: 'Miami', airport: 'MIA', hood: 'Brickell or Downtown' },
    'boston': { name: 'Boston', airport: 'BOS', hood: 'Back Bay or Fenway' },
    'seattle': { name: 'Seattle', airport: 'SEA', hood: 'Capitol Hill or South Lake Union' },
    'philadelphia': { name: 'Philadelphia', airport: 'PHL', hood: 'Center City' },
    'san-francisco': { name: 'San Francisco Bay Area', airport: 'SFO', hood: 'Mission or SOMA' },
    'kansas-city': { name: 'Kansas City', airport: 'MCI', hood: 'Power and Light District' },
    'toronto': { name: 'Toronto', airport: 'YYZ', hood: 'Downtown or King West' },
    'vancouver': { name: 'Vancouver', airport: 'YVR', hood: 'Gastown or Yaletown' },
    'mexico-city': { name: 'Mexico City', airport: 'MEX', hood: 'Condesa or Roma Norte' },
    'guadalajara': { name: 'Guadalajara', airport: 'GDL', hood: 'Chapultepec or Tlaquepaque' },
    'monterrey': { name: 'Monterrey', airport: 'MTY', hood: 'Barrio Antiguo or San Pedro' },
  }

  const MATCHES = {
    'brazil': 'Brazil vs Morocco (Jun 13, MetLife NY), Brazil vs Haiti (Jun 19, Philadelphia), Scotland vs Brazil (Jun 24, Miami)',
    'england': 'England vs Croatia (Jun 17, Dallas), England vs Ghana (Jun 23, Boston), Panama vs England (Jun 27, MetLife NY)',
    'argentina': 'Argentina vs Algeria (Jun 16, Kansas City), Argentina vs Austria (Jun 22, Dallas), Jordan vs Argentina (Jun 27, Dallas)',
    'france': 'France vs Senegal (Jun 16, MetLife NY), France vs Iraq (Jun 22, Philadelphia), Norway vs France (Jun 26, Boston)',
    'germany': 'Germany vs Curacao (Jun 14, Houston), Germany vs Ivory Coast (Jun 20, Toronto), Ecuador vs Germany (Jun 25, MetLife NY)',
    'spain': 'Spain vs Cape Verde (Jun 15, Atlanta), Spain vs Saudi Arabia (Jun 21, Atlanta), Uruguay vs Spain (Jun 26, Guadalajara)',
    'portugal': 'Portugal vs DR Congo (Jun 17, Houston), Portugal vs Uzbekistan (Jun 23, Houston), Colombia vs Portugal (Jun 27, Miami)',
    'usa': 'USA vs Paraguay (Jun 12, Los Angeles), USA vs Australia (Jun 19, Seattle), Turkey vs USA (Jun 25, Los Angeles)',
    'mexico': 'Mexico vs South Africa (Jun 11, Mexico City), Mexico vs South Korea (Jun 18, Guadalajara), Czechia vs Mexico (Jun 24, Mexico City)',
    'netherlands': 'Netherlands vs Japan (Jun 14, Dallas), Netherlands vs Sweden (Jun 20, Houston), Tunisia vs Netherlands (Jun 25, Kansas City)',
    'canada': 'Canada vs Bosnia (Jun 12, Toronto), Canada vs Qatar (Jun 18, Vancouver), Switzerland vs Canada (Jun 24, Vancouver)',
    'morocco': 'Brazil vs Morocco (Jun 13, MetLife NY), Morocco vs Scotland (Jun 19, Boston), Morocco vs Haiti (Jun 24, Atlanta)',
  }

  const budgetLabel = budget === 'budget' ? 'budget ($60-100/night)' : budget === 'premium' ? 'premium ($250-400/night)' : 'mid-range ($130-200/night)'
  const scenarioLabel = scenario === 'runnerUp' ? 'finishes as group runner-up' : scenario === 'thirdPlace' ? 'advances as best 3rd-place team' : 'wins their group'
  const matchInfo = MATCHES[teamSlug] || 'Group stage matches across multiple US cities'

  const prompt = 'Create a World Cup 2026 travel itinerary as JSON. Team: ' + teamName + ' (Group ' + teamGroup + '). Flying from: ' + homeCity + ' (' + homeAirport + '). Dates: ' + dateFrom + ' to ' + dateTo + '. Party: ' + partySize + ' people. Budget: ' + budgetLabel + '. Scenario: ' + teamName + ' ' + scenarioLabel + '. Matches: ' + matchInfo + '. Include knockout rounds (Round of 32: June 28-July 3, Round of 16: July 4-7) with TBD cities. Output ONLY raw JSON with no markdown or backticks: {"summary":"string","teamNote":"string","totalDays":number,"cities":[{"citySlug":"string","cityName":"string","country":"string","arrivalDate":"YYYY-MM-DD","departureDate":"YYYY-MM-DD","nights":number,"matches":[{"stage":"Group Stage","teams":"string","date":"string","time":"string","stadium":"string"}],"whereToStay":"string","highlights":["string"]}],"knockoutNote":"string","budgetEstimate":{"flights":"string","hotels":"string","total":"string"},"proTips":["string"]}'

  const body = JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }]
  })

  const text = await new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body)
      }
    }
    const reqH = https.request(options, (r) => {
      let d = ''
      r.on('data', c => d += c)
      r.on('end', () => {
        try {
          const p = JSON.parse(d)
          if (p.error) reject(new Error(p.error.message))
          else resolve(p.content[0].text)
        } catch(e) { reject(e) }
      })
    })
    reqH.on('error', reject)
    reqH.write(body)
    reqH.end()
  })

  let raw = text.trim()
  if (raw.startsWith('```')) { raw = raw.split('\n').slice(1).join('\n'); raw = raw.replace(/```$/, '').trim() }
  const itin = JSON.parse(raw)

  const AID = '2878051'
  itin.cities = itin.cities.map((city, i) => {
    const cd = CITIES[city.citySlug] || {}
    const prev = i > 0 ? CITIES[itin.cities[i-1].citySlug] : null
    const from = prev ? prev.airport : homeAirport
    const p = new URLSearchParams({ ss: city.cityName, checkin: city.arrivalDate, checkout: city.departureDate, group_adults: String(partySize), no_rooms: '1', aid: AID, label: 'matchroutes-wc2026' })
    return {
      ...city,
      neighborhood: cd.hood || city.whereToStay,
      bookingUrl: 'https://www.booking.com/searchresults.html?' + p,
      flightsUrl: 'https://www.google.com/travel/flights?q=Flights+from+' + from + '+to+' + (cd.airport || 'NYC') + '+on+' + city.arrivalDate,
      stubhubUrl: 'https://www.stubhub.com/fifa-world-cup-2026-tickets/performer/150439/?q=' + encodeURIComponent(teamName),
      gygUrl: 'https://www.getyourguide.com/' + city.cityName.toLowerCase().replace(/[\s\/]+/g,'-').replace(/[^a-z0-9-]/g,'') + '-l/',
    }
  })

  res.status(200).json(itin)
}
