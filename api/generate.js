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
    // Group A
    'mexico':       'Mexico vs South Africa (Jun 11, Mexico City), Mexico vs South Korea (Jun 18, Guadalajara), Czechia vs Mexico (Jun 24, Mexico City)',
    'south-africa': 'South Africa vs Mexico (Jun 11, Mexico City), South Africa vs Czechia (Jun 17, Los Angeles), South Korea vs South Africa (Jun 24, Dallas)',
    'south-korea':  'South Korea vs Czechia (Jun 11, Los Angeles), South Korea vs Mexico (Jun 18, Guadalajara), South Africa vs South Korea (Jun 24, Dallas)',
    'czechia':      'Czechia vs South Korea (Jun 11, Los Angeles), Czechia vs South Africa (Jun 17, Los Angeles), Czechia vs Mexico (Jun 24, Mexico City)',
    // Group B
    'canada':       'Canada vs Bosnia (Jun 12, Toronto), Canada vs Qatar (Jun 18, Vancouver), Switzerland vs Canada (Jun 24, Vancouver)',
    'bosnia':       'Bosnia vs Canada (Jun 12, Toronto), Bosnia vs Switzerland (Jun 18, Kansas City), Bosnia vs Qatar (Jun 24, Philadelphia)',
    'qatar':        'Qatar vs Switzerland (Jun 12, San Francisco), Qatar vs Canada (Jun 18, Vancouver), Bosnia vs Qatar (Jun 24, Philadelphia)',
    'switzerland':  'Switzerland vs Qatar (Jun 12, San Francisco), Switzerland vs Bosnia (Jun 18, Kansas City), Switzerland vs Canada (Jun 24, Vancouver)',
    // Group C
    'brazil':       'Brazil vs Morocco (Jun 13, MetLife NY), Brazil vs Haiti (Jun 19, Philadelphia), Scotland vs Brazil (Jun 24, Miami)',
    'morocco':      'Brazil vs Morocco (Jun 13, MetLife NY), Morocco vs Scotland (Jun 19, Boston), Morocco vs Haiti (Jun 24, Atlanta)',
    'haiti':        'Haiti vs Scotland (Jun 13, Atlanta), Haiti vs Brazil (Jun 19, Philadelphia), Morocco vs Haiti (Jun 24, Atlanta)',
    'scotland':     'Scotland vs Haiti (Jun 13, Atlanta), Scotland vs Morocco (Jun 19, Boston), Scotland vs Brazil (Jun 24, Miami)',
    // Group D
    'usa':          'USA vs Paraguay (Jun 12, Los Angeles), USA vs Australia (Jun 19, Seattle), Türkiye vs USA (Jun 25, Los Angeles)',
    'paraguay':     'Paraguay vs USA (Jun 12, Los Angeles), Paraguay vs Türkiye (Jun 19, Houston), Paraguay vs Australia (Jun 25, Miami)',
    'australia':    'Australia vs Türkiye (Jun 12, Houston), Australia vs USA (Jun 19, Seattle), Paraguay vs Australia (Jun 25, Miami)',
    'turkiye':      'Türkiye vs Australia (Jun 12, Houston), Türkiye vs Paraguay (Jun 19, Houston), Türkiye vs USA (Jun 25, Los Angeles)',
    // Group E
    'germany':      'Germany vs Curaçao (Jun 14, Houston), Germany vs Ivory Coast (Jun 20, Toronto), Ecuador vs Germany (Jun 25, MetLife NY)',
    'curacao':      'Curaçao vs Germany (Jun 14, Houston), Curaçao vs Ecuador (Jun 20, Philadelphia), Ivory Coast vs Curaçao (Jun 25, Dallas)',
    'ecuador':      'Ecuador vs Ivory Coast (Jun 14, Miami), Ecuador vs Curaçao (Jun 20, Philadelphia), Ecuador vs Germany (Jun 25, MetLife NY)',
    'ivory-coast':  'Ivory Coast vs Ecuador (Jun 14, Miami), Ivory Coast vs Germany (Jun 20, Toronto), Ivory Coast vs Curaçao (Jun 25, Dallas)',
    // Group F
    'netherlands':  'Netherlands vs Japan (Jun 14, Dallas), Netherlands vs Sweden (Jun 20, Houston), Tunisia vs Netherlands (Jun 25, Kansas City)',
    'japan':        'Japan vs Netherlands (Jun 14, Dallas), Japan vs Tunisia (Jun 20, Seattle), Sweden vs Japan (Jun 25, Boston)',
    'sweden':       'Sweden vs Tunisia (Jun 14, Boston), Sweden vs Netherlands (Jun 20, Houston), Sweden vs Japan (Jun 25, Boston)',
    'tunisia':      'Tunisia vs Sweden (Jun 14, Boston), Tunisia vs Japan (Jun 20, Seattle), Tunisia vs Netherlands (Jun 25, Kansas City)',
    // Group G
    'belgium':      'Belgium vs Egypt (Jun 15, Philadelphia), Belgium vs New Zealand (Jun 21, San Francisco), Iran vs Belgium (Jun 26, Kansas City)',
    'egypt':        'Egypt vs Belgium (Jun 15, Philadelphia), Egypt vs Iran (Jun 21, Atlanta), New Zealand vs Egypt (Jun 26, Seattle)',
    'iran':         'Iran vs New Zealand (Jun 15, San Francisco), Iran vs Egypt (Jun 21, Atlanta), Iran vs Belgium (Jun 26, Kansas City)',
    'new-zealand':  'New Zealand vs Iran (Jun 15, San Francisco), New Zealand vs Belgium (Jun 21, San Francisco), New Zealand vs Egypt (Jun 26, Seattle)',
    // Group H
    'spain':        'Spain vs Cape Verde (Jun 15, Atlanta), Spain vs Saudi Arabia (Jun 21, Atlanta), Uruguay vs Spain (Jun 26, Guadalajara)',
    'cape-verde':   'Cape Verde vs Spain (Jun 15, Atlanta), Cape Verde vs Uruguay (Jun 21, Miami), Saudi Arabia vs Cape Verde (Jun 26, Monterrey)',
    'saudi-arabia': 'Saudi Arabia vs Uruguay (Jun 15, Monterrey), Saudi Arabia vs Spain (Jun 21, Atlanta), Saudi Arabia vs Cape Verde (Jun 26, Monterrey)',
    'uruguay':      'Uruguay vs Saudi Arabia (Jun 15, Monterrey), Uruguay vs Cape Verde (Jun 21, Miami), Uruguay vs Spain (Jun 26, Guadalajara)',
    // Group I
    'france':       'France vs Senegal (Jun 16, MetLife NY), France vs Iraq (Jun 22, Philadelphia), Norway vs France (Jun 26, Boston)',
    'senegal':      'Senegal vs France (Jun 16, MetLife NY), Senegal vs Norway (Jun 22, Atlanta), Senegal vs Iraq (Jun 26, Dallas)',
    'norway':       'Norway vs Iraq (Jun 16, Seattle), Norway vs Senegal (Jun 22, Atlanta), Norway vs France (Jun 26, Boston)',
    'iraq':         'Iraq vs Norway (Jun 16, Seattle), Iraq vs France (Jun 22, Philadelphia), Iraq vs Senegal (Jun 26, Dallas)',
    // Group J
    'argentina':    'Argentina vs Algeria (Jun 16, Kansas City), Argentina vs Austria (Jun 22, Dallas), Jordan vs Argentina (Jun 27, Dallas)',
    'algeria':      'Algeria vs Argentina (Jun 16, Kansas City), Algeria vs Jordan (Jun 22, Miami), Austria vs Algeria (Jun 27, Houston)',
    'austria':      'Austria vs Jordan (Jun 16, Miami), Austria vs Argentina (Jun 22, Dallas), Austria vs Algeria (Jun 27, Houston)',
    'jordan':       'Jordan vs Austria (Jun 16, Miami), Jordan vs Algeria (Jun 22, Miami), Jordan vs Argentina (Jun 27, Dallas)',
    // Group K
    'portugal':     'Portugal vs DR Congo (Jun 17, Houston), Portugal vs Uzbekistan (Jun 23, Houston), Colombia vs Portugal (Jun 27, Miami)',
    'dr-congo':     'DR Congo vs Portugal (Jun 17, Houston), DR Congo vs Colombia (Jun 23, MetLife NY), DR Congo vs Uzbekistan (Jun 27, Philadelphia)',
    'uzbekistan':   'Uzbekistan vs Colombia (Jun 17, Seattle), Uzbekistan vs Portugal (Jun 23, Houston), Uzbekistan vs DR Congo (Jun 27, Philadelphia)',
    'colombia':     'Colombia vs Uzbekistan (Jun 17, Seattle), Colombia vs DR Congo (Jun 23, MetLife NY), Colombia vs Portugal (Jun 27, Miami)',
    // Group L
    'england':      'England vs Croatia (Jun 17, Dallas), England vs Ghana (Jun 23, Boston), Panama vs England (Jun 27, MetLife NY)',
    'croatia':      'Croatia vs England (Jun 17, Dallas), Croatia vs Panama (Jun 23, Kansas City), Croatia vs Ghana (Jun 27, Toronto)',
    'ghana':        'Ghana vs Panama (Jun 17, Toronto), Ghana vs England (Jun 23, Boston), Ghana vs Croatia (Jun 27, Toronto)',
    'panama':       'Panama vs Ghana (Jun 17, Toronto), Panama vs Croatia (Jun 23, Kansas City), Panama vs England (Jun 27, MetLife NY)',
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
        bookingUrl: 'https://www.awin1.com/cread.php?awinmid=6776&awinaffid=2878051&ued=' + encodeURIComponent('https://www.booking.com/searchresults.html?' + p),
      flightsUrl: 'https://www.google.com/travel/flights?q=Flights+from+' + from + '+to+' + (cd.airport || 'NYC') + '+on+' + city.arrivalDate,
      stubhubUrl: 'https://www.stubhub.com/fifa-world-cup-2026-tickets/performer/150439/?q=' + encodeURIComponent(teamName),
      gygUrl: 'https://www.getyourguide.com/' + city.cityName.toLowerCase().replace(/[\s\/]+/g,'-').replace(/[^a-z0-9-]/g,'') + '-l/',
    }
  })

  res.status(200).json(itin)
}
