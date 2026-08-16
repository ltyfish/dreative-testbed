// Single source of truth for everything the clinic promises on the page.
// Times are local wall-clock minutes from midnight so the status clock and the
// hours table can never disagree with each other.

export const CLINIC = {
  name: 'Eastside Community Health',
  phone: '(555) 014-2900',
  phoneHref: 'tel:+15550142900',
  interpreterPhone: '(555) 014-2911',
  interpreterHref: 'tel:+15550142911',
  street: '1140 East Barrow Street',
  city: 'Eastside, Springfield 62704',
  // Walk-in registration closes this many minutes before the doors do.
  registrationCutMinutes: 30,
}

// getDay() index -> opening span. null means closed all day.
export const SCHEDULE = {
  1: { day: 'Monday', open: 8 * 60, close: 20 * 60 },
  2: { day: 'Tuesday', open: 8 * 60, close: 20 * 60 },
  3: { day: 'Wednesday', open: 8 * 60, close: 20 * 60 },
  4: { day: 'Thursday', open: 8 * 60, close: 20 * 60 },
  5: { day: 'Friday', open: 8 * 60, close: 17 * 60 },
  6: { day: 'Saturday', open: 9 * 60, close: 14 * 60 },
  0: { day: 'Sunday', open: null, close: null },
}

// Monday-first, the order the table is read in.
export const WEEK = [1, 2, 3, 4, 5, 6, 0]

export function formatTime(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}:${String(m).padStart(2, '0')}`
}

export function formatDuration(minutes) {
  const total = Math.max(0, Math.round(minutes))
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h === 0) return `${m} min`
  if (m === 0) return h === 1 ? '1 hour' : `${h} hours`
  return `${h} hr ${m} min`
}

// walkIn drives the only grouping on the services list that patients care
// about: can I turn up, or do I have to ring first.
export const SERVICES = [
  {
    id: 'primary',
    name: 'General check-ups and illness',
    eligibility: 'Anyone, no appointment needed',
    cost: 'Free',
    walkIn: true,
  },
  {
    id: 'dental',
    name: 'Dental cleaning and extractions',
    eligibility: 'Adults 18+, appointment needed',
    cost: 'Free, limited slots each week',
    walkIn: false,
  },
  {
    id: 'mental',
    name: 'Counselling and mental health',
    eligibility: 'Anyone 14+, walk-in or booked',
    cost: 'Free, first session same day when possible',
    walkIn: true,
  },
  {
    id: 'pediatric',
    name: 'Children and infant care',
    eligibility: 'Under 18 with any adult',
    cost: 'Free, including vaccinations',
    walkIn: true,
  },
  {
    id: 'prescriptions',
    name: 'Prescriptions and refills',
    eligibility: 'Existing and new patients',
    cost: 'Free to issue, medication costs vary',
    walkIn: true,
  },
  {
    id: 'screening',
    name: 'Blood pressure, diabetes, and vision screening',
    eligibility: 'Anyone, no appointment needed',
    cost: 'Free',
    walkIn: true,
  },
]

// Each language is shown in its own script first, because someone scanning for
// a language they read cannot find it in a list written in English.
export const LANGUAGES = [
  { native: 'English', english: 'English' },
  { native: 'Español', english: 'Spanish' },
  { native: 'Tiếng Việt', english: 'Vietnamese' },
  { native: 'Soomaali', english: 'Somali' },
  { native: 'Kreyòl Ayisyen', english: 'Haitian Creole' },
  { native: '中文', english: 'Mandarin' },
  { native: 'العربية', english: 'Arabic', rtl: true },
]

export const TRANSIT = [
  { mode: 'Bus', text: 'Bus 14 and 27 stop directly outside the door on East Barrow.' },
  { mode: 'Train', text: 'Green line to Barrow Street station, then a four-minute walk east.' },
  { mode: 'Car', text: 'Free parking behind the building, entrance from Alder Lane.' },
  { mode: 'Access', text: 'Step-free entrance and accessible restrooms on the ground floor.' },
]
