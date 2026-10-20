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

// Şəkil yüklənməzsə göstərilən sadə Pokeball (inline SVG)
export const FALLBACK_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
      <circle cx='50' cy='50' r='46' fill='#fff' stroke='#222' stroke-width='6'/>
      <path d='M4 50a46 46 0 0 1 92 0z' fill='#ff4d6d' stroke='#222' stroke-width='6'/>
      <circle cx='50' cy='50' r='12' fill='#fff' stroke='#222' stroke-width='6'/>
    </svg>`
  );
