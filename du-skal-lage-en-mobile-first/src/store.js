export function addTrip(trips, trip) {
  const clean = {
    id: `${trip.date}-${trip.place.trim()}`,
    place: trip.place.trim(),
    note: trip.note.trim(),
    date: trip.date,
    image: trip.image || ''
  };

  return [clean, ...trips];
}

export function clothingAdvice({ temperature, rain, wind = 0 }) {
  if (rain) return 'Ta på regnjakke og vanntette sko.';
  if (temperature <= 3) return 'Kle deg varmt: ull, lue og vindjakke.';
  if (wind >= 9) return 'Ta med en vindjakke og et ekstra lag.';
  if (temperature >= 18) return 'T-skjorte holder, men ta med en lett jakke.';
  return 'Kle deg i lag og ta med en lett jakke.';
}

export function loadTrips() {
  try {
    return JSON.parse(localStorage.getItem('ut-pa-tur-trips') || '[]');
  } catch {
    return [];
  }
}

export function saveTrips(trips) {
  localStorage.setItem('ut-pa-tur-trips', JSON.stringify(trips));
}
