
export const sampleSongs = [
  {
    title: "Blinding Lights",
    artist: "The Weeknd",
    album: "After Hours",
    albumArt: "https://source.unsplash.com/random/800x800/?album,music",
    year: "2020",
  },
  {
    title: "Bad Guy",
    artist: "Billie Eilish",
    album: "When We All Fall Asleep, Where Do We Go?",
    albumArt: "https://source.unsplash.com/random/800x800/?album,cover",
    year: "2019",
  },
  {
    title: "Levitating",
    artist: "Dua Lipa",
    album: "Future Nostalgia",
    albumArt: "https://source.unsplash.com/random/800x800/?music,cover",
    year: "2020",
  },
  {
    title: "Watermelon Sugar",
    artist: "Harry Styles",
    album: "Fine Line",
    albumArt: "https://source.unsplash.com/random/800x800/?singer,album",
    year: "2019",
  },
];

export const generateRoomCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};
