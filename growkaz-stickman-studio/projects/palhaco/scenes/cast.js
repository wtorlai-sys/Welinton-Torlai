// cast.js — one signature item per recurring character; identical in every shot.
export const EU = { top: 'hoodie', color: '#d64a33', head: 'none', kid: true };                       // narrator, birthday kid: red-orange hoodie
export const BILL = { top: 'tshirt', color: '#2c3a34', head: 'cap', headColor: '#3fb950', kid: true }; // green cap
export const WALLACE = { top: 'tshirt', color: '#2c3a34', head: 'cap', headColor: '#f2c21a', kid: true }; // yellow cap
export const CLOWN = { top: 'suit', color: '#8a5ad6', color2: '#f2c21a', head: 'none', gloves: '#f2efe8', extra: 'clown' }; // purple suit, pink wig, red nose
export const PAIW = { top: 'trench', color: '#2a2630', head: 'fedora', headColor: '#1a171f', face: 'sunglasses' }; // Wallace's dad (the bomber)
export const PAI = { top: 'tshirt', color: '#6b5a46', head: 'none' };                                  // narrator's dad (background)
export const COP = { top: 'suit', color: '#2f4f8f', color2: '#1d2f55', head: 'cap', headColor: '#2f4f8f', gloves: '#141418' };   // men in blue uniform
export const SQUAD = { ...COP, head: 'none', extra: 'helmet' };                                       // same uniform + bomb-squad helmet
export const KIDS = [                                                                                 // the other party kids (plain ink)
  { top: 'none', head: 'ponytail', kid: true }, { top: 'none', head: 'spiky', kid: true }, { top: 'none', head: 'bun', kid: true },
];
export const RED = '#d64a33', BLUE = '#3a7ae0', GIFT = '#e8b43a', NOSE = '#e8402e', WIG = '#f29ac0';
