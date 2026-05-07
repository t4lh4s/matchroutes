const https = require('https')

const CITIES = {
  'new-york-new-jersey': { name: 'New York / New Jersey', airport: 'EWR', neighborhood: 'Midtown Manhattan or Jersey City' },
  'los-angeles': { name: 'Los Angeles', airport: 'LAX', neighborhood: 'Downtown LA or Santa Monica' },
  'dallas': { name: 'Dallas', airport: 'DFW', neighborhood: 'Downtown or Uptown Dallas' },
  'atlanta': { name: 'Atlanta', airport: 'ATL', neighborhood: 'Midtown or Buckhead' },
  'houston': { name: 'Houston', airport: 'IAH', neighborhood: 'Midtown or Museum District' },
  'miami': { name: 'Miami', airport: 'MIA', neighborhood: 'Brickell or Downtown' },
  'boston': { name: 'Boston', airport: 'BOS', neighborhood: 'Back Bay or Fenway' },
  'seattle': { name: 'Seattle', airport: 'SEA', neighborhood: 'Capitol Hill or South Lake Union' },
  'philadelphia': { name: 'Philadelphia', airport: 'PHL', neighborhood: 'Center City' },
  'san-francisco': { name: 'San Francisco Bay Area', airport: 'SFO', neighborhood: 'Mission or Downtown San Jose' },
  'kansas-city': { name: 'Kansas City', airport: 'MCI', neighborhood: 'Power & Light District' },
  'toronto': { name: 'Toronto', airport: 'YYZ', neighborhood: 'Downtown or King West' },
  'vancouver': { name: 'Vancouver', airport: 'YVR', neighborhood: 'Gastown or Yaletown' },
  'mexico-city': { name: 'Mexico City', airport: 'MEX', neighborhood: 'Condesa or Roma Norte' },
  'guadalajara': { name: 'Guadalajara', airport: 'GDL', neighborhood: 'Chapultepec or Tlaquepaque' },
  'monterrey': { name: 'Monterrey', airport: 'MTY', neighborhood: 'Barrio Antiguo or San Pedro' },
}

const GROUP_MATCHES = {
  'brazil': ['June 13 18:00 ET - Brazil vs Morocco - MetLife Stadium, New York/NJ','June 19 21:00 ET - Brazil vs Haiti - Lincoln Financial Field, Philadelphia','June 24 18:00 ET - Scotland vs Brazil - Hard Rock Stadium, Miami'],
  'england': ['June 17 16:00 ET - England vs Croatia - ATT Stadium, Dallas','June 23 16:00 ET - England vs Ghana - Gillette Stadium, Boston','June 27 17:00 ET - Panama vs England - MetLife Stadium, New York/NJ'],
  'argentina': ['June 16 21:00 ET - Argentina vs Algeria - Arrowhead Stadium, Kansas City','June 22 13:00 ET - Argentina vs Austria - ATT Stadium, Dallas','June 27 22:00 ET - Jordan vs Argentina - ATT Stadium, Dallas'],
  'france': ['June 16 15:00 ET - France vs Senegal - MetLife Stadium, New York/NJ','June 22 17:00 ET - France vs Iraq - Lincoln Financial Field, Philadelphia','June 26 15:00 ET - Norway vs France - Gillette Stadium, Boston'],
  'germany': ['June 14 13:00 ET - Germany vs Curacao - NRG Stadium, Houston','June 20 16:00 ET - Germany vs Ivory Coast - BMO Field, Toronto','June 25 16:00 ET - Ecuador vs Germany - MetLife Stadium, New York/NJ'],
  'spain': ['June 15 12:00 ET - Spain vs Cape Verde - Mercedes-Benz Stadium, Atlanta','June 21 12:00 ET - Spain vs Saudi Arabia - Mercedes-Benz Stadium, Atlanta','June 26 20:00 ET - Uruguay vs Spain - Estadio Akron, Guadalajara'],
  'portugal': ['June 17 13:00 ET - Portugal vs DR Congo - NRG Stadium, Houston','June 23 13:00 ET - Portugal vs Uzbekistan - NRG Stadium, Houston','June 27 19:30 ET - Colombia vs Portugal - Hard Rock Stadium, Miami'],
  'usa': ['June 12 21:00 ET - USA vs Paraguay - SoFi Stadium, Los Angeles','June 19 15:00 ET - USA vs Australia - Lumen Field, Seattle','June 25 22:00 ET - Turkey vs USA - SoFi Stadium, Los Angeles'],
  'mexico': ['June 11 15:00 ET - Mexico vs South Africa - Estadio Azteca, Mexico City','June 18 21:00 ET - Mexico vs South Korea - Estadio Akron, Guadalajara','June 24 21:00 ET - Czechia vs Mexico - Estadio Azteca, Mexico City'],
  'netherlands': ['June 14 16:00 ET - Netherlands vs Japan - ATT Stadium, Dallas','June 20 13:00 ET - Netherlands vs Sweden - NRG Stadium, Houston','June 25 19:00 ET - Tunisia vs Netherlands - Arrowhead Stadium, Kansas City'],
  'canada': ['June 12 15:00 ET - Canada vs Bosnia - BMO Field, Toronto','June 18 18:00 ET - Canada vs Qatar - BC Place, Vancouver','June 24 15:00 ET - Switzerland vs Canada - BC Place, Vancouver'],
  'morocco': ['June 13 18:00 ET - Brazil vs Morocco - MetLife Stadium, New York/NJ','June 19 18:00 ET - Morocco vs Scotland - Gillette Stadium, Boston','June 24 18:00 ET - Morocco vs Haiti - Mercedes-Benz Stadium, Atlanta'],
}

function callClaude(apiKey, prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    })
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
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          if (parsed.error) reject(new Error(parsed.error.message))
          else resolve(parsed.content[0].text)
        } catch(e) { reject(e) }
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' })

  const { teamSlug, teamName, teamGroup, homeCity, homeAirport, dateFrom, dateTo, partySize, budget, scenario } = req.body

  const budgetMap = { budget: '$60-100/night', mid: '$130-200/night', premium: '$250-400/night' }
  const scenarioMap = { winGroup: 'wins the group', runnerUp: 'finishes runner-up', thirdPlace: 'sneaks through as best 3rd-placed team' }
  const matchList = GROUP_MATCHES[teamSlug] || ['Group match 1','Group match 2','Group match 3']

  const prompt = 'You are MatchRoutes, a World Cup 2026 AI trip planner. TEAM: ' + teamName + ' (Group ' + teamGroup + '). FROM: ' + homeCity + ' (' + homeAirport + '). DATES: ' + dateFrom + ' to ' + dateTo + '. PARTY: ' + partySize + ' people. BUDGET: ' + (budgetMap[budget] || budgetMap.mid) + '. SCENARIO: ' + teamName + ' ' + (scenarioMap[scenario] || scenarioMap.winGroup) + '. MATCHES: ' + matchList.join(', ') + '. Create a complete day-by-day World Cup trip itinerary. Respond ONLY with valid JSON: {"summary":"2-3 sentence overview","teamNote":"exciting note","totalDays":18,"cities":[{"citySlug":"new-york-new-jersey","cityName":"New York / New Jersey","country":"USA","arrivalDate":"2026-06-12","departureDate":"2026-06-15","nights":3,"matches":[{"stage":"Group Stage","teams":"Brazil vs Morocco","date":"June 13","time":"18:00 ET","stadium":"MetLife Stadium"}],"whereToStay":"Midtown Manhattan","highlights":["fan zones","Brooklyn","Central Park"]}],"knockoutNote":"knockout note","budgetEstimate":{"flights":"$1200-1800","hotels":"$180/night","total":"$4000-6000"},"proTips":["tip1","tip2","tip3"]}'

  try {
    let raw = await callClaude(apiKey, prompt)
    raw = raw.trim()
    if (raw.startsWith('```')) raw = raw.split('\n').slice(1).join('\n')
    if (raw.endsWith('```')) raw = raw.slice(0, raw.lastIndexOf('```'))
    const itinerary = JSON.parse(raw.trim())

    const AFFILIATE_ID = '2878051'
    itinerary.cities = itinerary.cities.map((city, i) => {
      const cityData = CITIES[city.citySlug] || {}
      const prevCity = i > 0 ? CITIES[itinerary.cities[i-1].citySlug] : null
      const fromAirport = prevCity ? prevCity.airport : homeAirport
      const params = new URLSearchParams({ ss: city.cityName, checkin: city.arrivalDate, checkout: city.departureDate, group_adults: String(partySize), no_rooms: '1', aid: AFFILIATE_ID, label: 'matchroutes-wc2026' })
      return {
        ...city,
        neighborhood: cityData.neighborhood || city.whereToStay,
        bookingUrl: 'https://www.booking.com/searchresults.html?' + params,
        flightsUrl: 'https://www.google.com/travel/flights?q=Flights+from+' + fromAirport + '+to+' + (cityData.airport || 'NYC') + '+on+' + city.arrivalDate,
        stubhubUrl: 'https://www.stubhub.com/fifa-world-cup-2026-tickets/performer/150439/?q=' + encodeURIComponent(teamName),
        gygUrl: 'https://www.getyourguide.com/' + city.cityName.toLowerCase().replace(/[\s\/]/g,'-').replace(/[^a-z0-9-]/g,'') + '-l/',
      }
    })

    res.status(200).json(itinerary)
  } catch (err) {
    console.error('Generate error:', err.message)
    res.status(500).json({ error: err.message })
  }
}
