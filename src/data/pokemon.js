export const POKEMON = [
  { id: 4, name: "Charmander", move: "Ember", type: "fire", hp: 39, attack: 52 },
  { id: 7, name: "Squirtle", move: "Water Gun", type: "water", hp: 44, attack: 48 },
  { id: 11, name: "Metapod", move: "Tackle", type: "bug", hp: 50, attack: 20 },
  { id: 12, name: "Butterfree", move: "Gust", type: "flying", hp: 60, attack: 45 },
  { id: 25, name: "Pikachu", move: "Thunderbolt", type: "electric", hp: 35, attack: 55 },
  { id: 39, name: "Jigglypuff", move: "Double Slap", type: "normal", hp: 115, attack: 45 },
  { id: 94, name: "Gengar", move: "Sludge Bomb", type: "poison", hp: 60, attack: 65 },
  { id: 133, name: "Eevee", move: "Quick Attack", type: "normal", hp: 55, attack: 55 },
];

export const getImage = (id) =>
  `https://assets.pokemon.com/assets/cms2/img/pokedex/detail/${String(id).padStart(3, "0")}.png`;

// Hər tipin öz rəngi — kart, işıq və badge bu rəngdən qidalanır
const TYPE_COLORS = {
  fire: "#ff7a45",
  water: "#3fa9ff",
  bug: "#9ccc3d",
  flying: "#8aa4ff",
  electric: "#ffd23f",
  normal: "#c3b8d6",
  poison: "#b65cff",
};
export const getTypeColor = (type) => TYPE_COLORS[type] ?? "#7c5cff";

// Şəkil yüklənməzsə / kart arxası üçün real görünüşlü Pokeball (inline SVG: gradient, parıltı, kölgə)
const POKEBALL_SVG = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
  <defs>
    <radialGradient id='r' cx='.36' cy='.26' r='.9'>
      <stop offset='0' stop-color='#ff9a8f'/><stop offset='.3' stop-color='#f0383d'/>
      <stop offset='.72' stop-color='#b3141f'/><stop offset='1' stop-color='#6f0b14'/>
    </radialGradient>
    <radialGradient id='w' cx='.4' cy='.3' r='.95'>
      <stop offset='0' stop-color='#fff'/><stop offset='.55' stop-color='#eceef4'/>
      <stop offset='1' stop-color='#a9aebf'/>
    </radialGradient>
    <linearGradient id='b' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0' stop-color='#4a4a55'/><stop offset='.5' stop-color='#111116'/><stop offset='1' stop-color='#34343d'/>
    </linearGradient>
    <radialGradient id='k' cx='.38' cy='.32' r='.8'>
      <stop offset='0' stop-color='#fff'/><stop offset='.65' stop-color='#d9dbe4'/><stop offset='1' stop-color='#8f94a6'/>
    </radialGradient>
    <radialGradient id='s' cx='.35' cy='.3' r='.85'>
      <stop offset='.55' stop-color='#000' stop-opacity='0'/><stop offset='1' stop-color='#000' stop-opacity='.5'/>
    </radialGradient>
    <radialGradient id='g' cx='.5' cy='.5' r='.5'>
      <stop offset='0' stop-color='#fff' stop-opacity='.95'/><stop offset='1' stop-color='#fff' stop-opacity='0'/>
    </radialGradient>
    <clipPath id='c'><circle cx='50' cy='50' r='45'/></clipPath>
  </defs>
  <ellipse cx='50' cy='96' rx='30' ry='3' fill='#000' opacity='.25'/>
  <circle cx='50' cy='50' r='47' fill='#15151a'/>
  <g clip-path='url(#c)'>
    <rect x='0' y='0' width='100' height='50' fill='url(#r)'/>
    <rect x='0' y='50' width='100' height='50' fill='url(#w)'/>
    <rect x='0' y='43.5' width='100' height='13' fill='url(#b)'/>
    <rect x='0' y='44.3' width='100' height='1.2' fill='#fff' opacity='.18'/>
    <circle cx='50' cy='50' r='45' fill='url(#s)'/>
    <ellipse cx='31' cy='23' rx='17' ry='9' fill='#fff' opacity='.5' transform='rotate(-32 31 23)'/>
    <ellipse cx='27' cy='19' rx='6' ry='3' fill='#fff' opacity='.85' transform='rotate(-32 27 19)'/>
    <ellipse cx='68' cy='78' rx='13' ry='4' fill='#fff' opacity='.28' transform='rotate(-32 68 78)'/>
  </g>
  <circle cx='50' cy='50' r='15' fill='#15151a'/>
  <circle cx='50' cy='50' r='11.2' fill='url(#k)' stroke='#2a2a33' stroke-width='1.2'/>
  <circle cx='50' cy='50' r='6' fill='#fff' stroke='#b9bccb' stroke-width='1.4'/>
  <ellipse cx='47.6' cy='47.4' rx='2.6' ry='1.7' fill='#fff' opacity='.9' transform='rotate(-30 47.6 47.4)'/>
  <circle cx='50' cy='50' r='47' fill='none' stroke='#000' stroke-opacity='.35' stroke-width='1'/>
</svg>`;
export const FALLBACK_IMAGE = "data:image/svg+xml;utf8," + encodeURIComponent(POKEBALL_SVG);
