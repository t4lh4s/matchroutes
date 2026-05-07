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
