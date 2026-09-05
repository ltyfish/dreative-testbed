// Reference photography. Every image here is a real photograph of a real
// mechanical movement or of watchmaking work, sourced under a licence that
// permits commercial use, and credited in the footer. None of them is a
// photograph of Caliber 08 itself, and the page says so where they appear.
export const CREDITS = [
  { file: 'caliber', title: 'Peseux calibre 320 movement', creator: 'misteraitch', licence: 'CC BY 2.0', href: 'https://www.flickr.com/photos/misteraitch/' },
  { file: 'stage-mainspring', title: 'Mainspring, uncoiled (shown as a negative)', creator: 'Hustvedt', licence: 'CC BY-SA 3.0', href: 'https://commons.wikimedia.org/wiki/File:Mainspring_Chinese_uncoiled.jpg' },
  { file: 'stage-barrel', title: 'Mechanism macro', creator: 'GollyGforce', licence: 'CC BY 2.0', href: 'https://www.flickr.com/photos/gollyg/' },
  { file: 'stage-train', title: 'Watch movement macro', creator: 'Guy Sie', licence: 'CC BY-SA 2.0', href: 'https://www.flickr.com/photos/guysie/' },
  { file: 'stage-escapement', title: 'Movement detail, macro', creator: 'Calgary Reviews', licence: 'CC BY 2.0', href: 'https://www.flickr.com/photos/calgaryreviews/' },
  { file: 'stage-balance', title: 'Balance wheel and hairspring', creator: 'Hustvedt', licence: 'CC BY-SA 3.0', href: 'https://commons.wikimedia.org/wiki/File:Balance_wheel_Chinese_movement.jpg' },
  { file: 'stage-hands', title: 'Dial and hands, macro', creator: 'Mario A. P.', licence: 'CC BY-SA 2.0', href: 'https://www.flickr.com/photos/mario-almeida/' },
  { file: 'layer-dial', title: 'Movement, dial side', creator: 'Wilson Hui', licence: 'CC BY 2.0', href: 'https://www.flickr.com/photos/wilsonhui/' },
  { file: 'layer-main', title: 'Hand-finished plate and bridges', creator: 'Dance of light', licence: 'CC BY-SA 2.0', href: 'https://www.flickr.com/photos/danceoflight/' },
  { file: 'layer-bridge', title: 'Molnija 3601 bridges', creator: 'Guy Sie', licence: 'CC BY-SA 2.0', href: 'https://www.flickr.com/photos/guysie/' },
  { file: 'layer-cock', title: '6498 balance cock', creator: 'Guy Sie', licence: 'CC BY-SA 2.0', href: 'https://www.flickr.com/photos/guysie/' },
  { file: 'finish-frosted', title: 'Frosted and damascened plate', creator: 'Alistair Hamilton', licence: 'CC BY 2.0', href: 'https://www.flickr.com/photos/alistair-hamilton/' },
  { file: 'finish-open', title: 'Open-worked plate, escapement and jewels', creator: 'Hustvedt', licence: 'CC BY-SA 3.0', href: 'https://commons.wikimedia.org/wiki/File:Chinese_movement_escapement_and_jewels.jpg' },
  { file: 'finish-black', title: 'Polished steel bridges', creator: 'Guy Sie', licence: 'CC BY-SA 2.0', href: 'https://www.flickr.com/photos/guysie/' },
  { file: 'atelier-lathe', title: "Watchmaker's lathe in use", creator: 'Zephyris', licence: 'CC BY-SA 3.0', href: "https://commons.wikimedia.org/wiki/File:Watchmaker's_Lathe_in_use.jpg" },
  { file: 'atelier-perlage', title: 'Perlage applied to a plate', creator: 'Watchexpert', licence: 'Public domain', href: 'https://commons.wikimedia.org/wiki/File:Perlage_03.JPG' },
]

export const src = (name) => `${import.meta.env.BASE_URL}media/${name}.webp`

// What each plate actually shows, so a caption never claims to be Caliber 08.
export const PLATE = {
  'stage-mainspring': 'Ref. plate 01 — a mainspring uncoiled, shown as a negative',
  'stage-barrel': 'Ref. plate 02 — barrel and going train',
  'stage-train': 'Ref. plate 03 — train wheels in mesh',
  'stage-escapement': 'Ref. plate 04 — escape wheel and pallet jewels',
  'stage-balance': 'Ref. plate 05 — balance wheel on its hairspring',
  'stage-hands': 'Ref. plate 06 — hands driven off the motion work',
}
