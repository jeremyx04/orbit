const PREFIXES = [
  'Adventurous',
  'Affectionate',
  'Ambitious',
  'Amiable',
  'Amusing',
  'Artistic',
  'Brave',
  'Bright',
  'Calm',
  'Charming',
  'Cheerful',
  'Compassionate',
  'Considerate',
  'Dependable',
  'Diligent',
  'Empathetic',
  'Energetic',
  'Enthusiastic',
  'Friendly',
  'Intelligent',
  'Loyal',
  'Optimistic',
  'Passionate',
  'Polite',
  'Reliable',
  'Sensational',
  'Thoughtful',
];

const AVATARS = [
  'Rat',
  'Ox',
  'Tiger',
  'Rabbit',
  'Dragon',
  'Snake',
  'Horse',
  'Goat',
  'Monkey',
  'Rooster',
  'Dog',
  'Pig',
  'Cat',
  'Panda',
  'Otter',
  'Whale',
  'Fox',
  'Wolf',
  'Penguin',
  'Owl'
]

export const getAvatar = () => {
  const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
  const avatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
  return `${prefix} ${avatar}`;
}
