const Anthropic = require('@anthropic-ai/sdk')

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
  'brazil': ['June 13 18:00 ET — Brazil vs Morocco — MetLife Stadium, New York/NJ','June 19 21:00 ET — Brazil vs Haiti — Lincoln Financial Field, Philadelphia','June 24 18:00 ET — Scotland vs Brazil — Hard Rock Stadium, Miami'],
  'england': ['June 17 16:00 ET — England vs Croatia — AT&T Stadium, Dallas','June 23 16:00 ET — England vs Ghana — Gillette Stadium, Boston','June 27 17:00 ET — Panama vs England — MetLife Stadium, New York/NJ'],
  'argentina': ['June 16 21:00 ET — Argentina vs Algeria — Arrowhead Stadium, Kansas City','June 22 13:00 ET — Argentina vs Austria — AT&T Stadium, Dallas','June 27 22:00 ET — Jordan vs Argentina — AT&T Stadium, Dallas'],
  'france': ['June 16 15:00 ET — France vs Senegal — MetLife Stadium, New York/NJ','June 22 17:00 ET — France vs Iraq — Lincoln Financial Field, Philadelphia','June 26 15:00 ET — Norway vs France — Gillette Stadium, Boston'],
  'germany': ['June 14 13:00 ET — Germany vs Curaçao — NRG Stadium, Houston','June 20 16:00 ET — Germany vs Ivory Coast — BMO Field, Toronto','June 25 16:00 ET — Ecuador vs Germany — MetLife Stadium, New York/NJ'],
  'spain': ['June 15 12:00 ET — Spain vs Cape Verde — Mercedes-Benz Stadium, Atlanta','June 21 12:00 ET — Spain vs Saudi Arabia — Mercedes-Benz Stadium, Atlanta','June 26 20:00 ET — Uruguay vs Spain — Estadio Akron, Guadalajara'],
  'portugal': ['June 17 13:00 ET — Portugal vs DR Congo — NRG Stadium, Houston','June 23 13:00 ET — Portugal vs Uzbekistan — NRG Stadium, Houston','June 27 19:30 ET — Colombia vs Portugal — Hard Rock Stadium, Miami'],
  'usa': ['June 12 21:00 ET — USA vs Paraguay — SoFi Stadium, Los Angeles','June 19 15:00 ET — USA vs Australia — Lumen Field, Seattle','June 25 22:00 ET — Türkiye vs USA — SoFi Stadium, Los Angeles'],
  'mexico': ['June 11 15:00 ET — Mexico vs South Africa — Estadio Azteca, Mexico City','June 18 21:00 ET — Mexico vs South Korea — Estadio Akron, Guadalajara','June 24 21:00 ET — Czechia vs Mexico — Estadio Azteca, Mexico City'],
  'netherlands': ['June 14 16:00 ET — Netherlands vs Japan — AT&T Stadium, Dallas','June 20 13:00 ET — Netherlands vs Sweden — NRG Stadium, Houston','June 25 19:00 ET — Tunisia vs Netherlands — Arrowhead Stadium, Kansas City'],
  'canada': ['June 12 15:00 ET — Canada vs Bosnia — BMO Field, Toronto','June 18 18:00 ET — Canada vs Qatar — BC Place, Vancouver','June 24 15:00 ET — Switzerland vs Canada — BC Place, Vancouver'],
  'morocco': ['June 13 18:00 ET — Brazil vs Morocco — MetLife Stadium, New York/NJ','June 19 18:00 ET — Scotland vs Morocco — Gillette Stadium, Boston','June 24 18:00 ET — Morocco vs Haiti — Mercedes-Benz Stadium, Atlanta'],
  'colombia': ['June 17 22:00 ET — Uzbekistan vs Colombia — Estadio Azteca, Mexico City','June 23 22:00 ET — Colombia vs DR Congo — Estadio Akron, Guadalajara','June 27 19:30 ET — Colombia vs Portugal — Hard Rock Stadium, Miami'],
  'japan': ['June 14 16:00 ET — Netherlands vs Japan — AT&T Stadium, Dallas','June 21 00:00 ET — Tunisia vs Japan — Estadio BBVA, Monterrey','June 25 19:00 ET — Japan vs Sweden — AT&T Stadium, Dallas'],
  'south-korea': ['June 11 22:00 ET — South Korea vs Czechia — Estadio Akron, Guadalajara','June 18 21:00 ET — Mexico vs South Korea — Estadio Akron, Guadalajara','June 24 21:00 ET — South Africa vs South Korea — Estadio BBVA, Monterrey'],
  'australia': ['June 14 00:00 ET — Australia vs Türkiye — BC Place, Vancouver','June 19 15:00 ET — USA vs Australia — Lumen Field, Seattle','June 25 22:00 ET — Paraguay vs Australia — Levi\'s Stadium, San Francisco'],
  'belgium': ['June 15 21:00 ET — Iran vs New Zealand — SoFi Stadium, Los Angeles','June 21 15:00 ET — Belgium vs Iran — SoFi Stadium, Los Angeles','June 26 23:00 ET — New Zealand vs Belgium — BC Place, Vancouver'],
  'uruguay': ['June 15 18:00 ET — Saudi Arabia vs Uruguay — Hard Rock Stadium, Miami','June 21 12:00 ET — Spain vs Saudi Arabia — Mercedes-Benz Stadium, Atlanta','June 26 20:00 ET — Uruguay vs Spain — Estadio Akron, Guadalajara'],
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { teamSlug, teamName, teamGroup, homeCity, homeAirport, dateFrom, dateTo, partySize, budget, scenario } = req.body

  const budgetMap = {
    budget: '$60-100/night hostels and budget hotels',
    mid: '$130-200/night 3-star hotels',
    premium: '$250-400/night 4-5 star hotels',
  }

  const scenarioMap = {
    winGroup: 'wins the group (1st place)',
    runnerUp: 'finishes runner-up (2nd place)',
    thirdPlace: 'sneaks through as best 3rd-placed team',
  }

  const matchList = GROUP_MATCHES[teamSlug] || ['Group match 1 — check FIFA.com for schedule', 'Group match 2 — check FIFA.com for schedule', 'Group match 3 — check FIFA.com for schedule']

  const prompt = `You are MatchRoutes, a World Cup 2026 AI trip planner. Create a practical travel itinerary.

TEAM: ${teamName} (Group ${teamGroup})
FROM: ${homeCity} (airport: ${homeAirport})
DATES: ${dateFrom} to ${dateTo}
PARTY: ${partySize} people
BUDGET: ${budgetMap[budget] || budgetMap.mid}
SCENARIO: Planning as if ${teamName} ${scenarioMap[scenario] || scenarioMap.winGroup}

CONFIRMED GROUP STAGE MATCHES:
${matchList.join('\n')}

KNOCKOUT: If ${scenarioMap[scenario]}, they continue into Round of 32 (June 28-July 3) then Round of 16 (July 4-7).

Create a complete day-by-day World Cup itinerary covering group stage + first 2 knockout rounds. Include travel days between cities.

Respond ONLY with valid JSON:
{
  "summary": "2-3 sentence trip overview",
  "teamNote": "exciting note about why this trip will be special",
  "totalDays": 18,
  "cities": [
    {
      "citySlug": "new-york-new-jersey",
      "cityName": "New York / New Jersey",
      "country": "USA",
      "arrivalDate": "2026-06-12",
      "departureDate": "2026-06-15",
      "nights": 3,
      "matches": [
        {"stage": "Group Stage", "teams": "Brazil vs Morocco", "date": "June 13", "time": "18:00 ET", "stadium": "MetLife Stadium"}
      ],
      "whereToStay": "Midtown Manhattan or Jersey City for easy access to MetLife",
      "highlights": ["Times Square fan zones", "Brooklyn for South American vibes", "Central Park"]
    }
  ],
  "knockoutNote": "Clear note about uncertainty and what to do if results change",
  "budgetEstimate": {
    "flights": "$1,200-1,800",
    "hotels": "$180/night average",
    "total": "$4,000-6,000 for 2 people"
  },
  "proTips": ["tip 1", "tip 2", "tip 3", "tip 4"]
}`

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    })

    let raw = message.content[0].text.trim()
    if (raw.startsWith('```')) raw = raw.split('\n').slice(1).join('\n')
    if (raw.endsWith('```')) raw = raw.slice(0, raw.lastIndexOf('```'))
    const itinerary = JSON.parse(raw.trim())

    const AFFILIATE_ID = process.env.BOOKING_AFFILIATE_ID || '2878051'

    itinerary.cities = itinerary.cities.map((city, i) => {
      const cityData = CITIES[city.citySlug] || {}
      const bookingParams = new URLSearchParams({
        ss: city.cityName,
        checkin: city.arrivalDate,
        checkout: city.departureDate,
        group_adults: String(partySize),
        no_rooms: '1',
        aid: AFFILIATE_ID,
        label: 'matchroutes-wc2026',
      })
      const prevAirport = i === 0 ? homeAirport : (CITIES[itinerary.cities[i-1].citySlug]?.airport || homeAirport)
      const destAirport = cityData.airport || 'NYC'

      return {
        ...city,
        neighborhood: cityData.neighborhood || city.whereToStay,
        bookingUrl: `https://www.booking.com/searchresults.html?${bookingParams}`,
        flightsUrl: `https://www.google.com/travel/flights?q=Flights+from+${prevAirport}+to+${destAirport}+on+${city.arrivalDate}`,
        stubhubUrl: `https://www.stubhub.com/fifa-world-cup-2026-tickets/performer/150439/?q=${encodeURIComponent(teamName)}`,
        gygUrl: `https://www.getyourguide.com/${city.cityName.toLowerCase().replace(/[\s\/]/g, '-').replace(/[^a-z0-9-]/g, '')}-l/`,
      }
    })

    res.status(200).json(itinerary)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
}
