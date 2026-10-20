// Tip cədvəli: EFFECT[hücum tipi][müdafiə tipi] → vuruş əmsalı (göstərilməyən = 1)
const EFFECT = {
  fire: { bug: 2, water: 0.5, fire: 0.5 },
  water: { fire: 2, water: 0.5 },
  electric: { water: 2, flying: 2, electric: 0.5 },
  bug: { poison: 2, fire: 0.5, flying: 0.5 },
  flying: { bug: 2, electric: 0.5 },
  poison: { bug: 2, poison: 0.5 },
  normal: {},
};

export const TYPES = Object.keys(EFFECT);

export const effectiveness = (atk, def) => EFFECT[atk]?.[def] ?? 1;

// Bu tip kimə qarşı güclüdür / kimdən zəifdir (modal üçün)
export const strongAgainst = (type) => TYPES.filter((t) => effectiveness(type, t) > 1);
export const weakTo = (type) => TYPES.filter((t) => effectiveness(t, type) > 1);
