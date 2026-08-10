// Clinic facts. Everything the page says about hours, cost and eligibility is
// derived from this file, so the answer at the top can never drift from the table.

export const CLINIC = {
  name: 'Eastside Community Health',
  phone: '(555) 014-2900',
  phoneHref: 'tel:+15550142900',
  interpreterPhone: '(555) 014-2911',
  interpreterHref: 'tel:+15550142911',
  street: '1140 East Barrow Street',
  city: 'Eastside, Springfield 62704',
}

// Walk-in registration closes this many minutes before the doors do.
export const REGISTRATION_CUTOFF_MINUTES = 30

export const HOURS = [
  { day: 'Monday', open: '8:00', close: '20:00' },
  { day: 'Tuesday', open: '8:00', close: '20:00' },
  { day: 'Wednesday', open: '8:00', close: '20:00' },
  { day: 'Thursday', open: '8:00', close: '20:00' },
  { day: 'Friday', open: '8:00', close: '17:00' },
  { day: 'Saturday', open: '9:00', close: '14:00' },
  { day: 'Sunday', open: null, close: null },
]

// `access` is drawn from the clinic's own wording: booking is only needed for
// dental and some counselling slots.
export const SERVICES = [
  {
    id: 'primary',
    name: 'General check-ups and illness',
    eligibility: 'Anyone, no appointment needed',
    cost: 'Free',
    access: 'walk-in',
  },
  {
    id: 'screening',
    name: 'Blood pressure, diabetes, and vision screening',
    eligibility: 'Anyone, no appointment needed',
    cost: 'Free',
    access: 'walk-in',
  },
  {
    id: 'pediatric',
    name: 'Children and infant care',
    eligibility: 'Under 18 with any adult',
    cost: 'Free, including vaccinations',
    access: 'walk-in',
  },
  {
    id: 'prescriptions',
    name: 'Prescriptions and refills',
    eligibility: 'Existing and new patients',
    cost: 'Free to issue, medication costs vary',
    access: 'walk-in',
  },
  {
    id: 'mental',
    name: 'Counselling and mental health',
    eligibility: 'Anyone 14+, walk-in or booked',
    cost: 'Free, first session same day when possible',
    access: 'either',
  },
  {
    id: 'dental',
    name: 'Dental cleaning and extractions',
    eligibility: 'Adults 18+, appointment needed',
    cost: 'Free, limited slots each week',
    access: 'booked',
  },
]

export const ACCESS_LABEL = {
  'walk-in': 'Walk in',
  either: 'Walk in or book',
  booked: 'Book ahead',
}

// Each language is also written in its own script, so a speaker can find it
// without reading English first.
export const LANGUAGES = [
  { en: 'English', native: 'English', dir: 'ltr' },
  { en: 'Spanish', native: 'Español', dir: 'ltr' },
  { en: 'Vietnamese', native: 'Tiếng Việt', dir: 'ltr' },
  { en: 'Somali', native: 'Soomaali', dir: 'ltr' },
  { en: 'Haitian Creole', native: 'Kreyòl Ayisyen', dir: 'ltr' },
  { en: 'Mandarin', native: '中文', dir: 'ltr' },
  { en: 'Arabic', native: 'العربية', dir: 'rtl' },
]

export const TRANSIT = [
  { mode: 'Bus', text: 'Bus 14 and 27 stop directly outside the door on East Barrow.' },
  { mode: 'Train', text: 'Green line to Barrow Street station, then a four-minute walk east.' },
  { mode: 'Car', text: 'Free parking behind the building, entrance from Alder Lane.' },
  { mode: 'Access', text: 'Step-free entrance and accessible restrooms on the ground floor.' },
]

export const ASSURANCES = [
  { title: 'No insurance required', detail: 'Bring nothing. We will not ask for a card.' },
  { title: 'No immigration status questions', detail: 'We never ask, and never share records.' },
  { title: 'No cost for any visit', detail: 'Every service on this page is free.' },
]
