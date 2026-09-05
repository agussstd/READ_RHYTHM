import { Song, ChartData } from '../types/game';

export const DEFAULT_SONGS: Song[] = [
  {
    id: 'song-01',
    title: 'World is Mine',
    artist: 'ryo (supercell) feat. 初音ミク',
    category: 'VOCALOID',
    youtubeVideoId: 'DTxlh8_5J7g',
    previewStartTime: 15,
    charts: {
      easy: '/charts/song-01/easy.json',
      normal: '/charts/song-01/normal.json',
      hard: '/charts/song-01/hard.json',
      master: '/charts/song-01/master.json'
    }
  },
  {
    id: 'song-02',
    title: 'Melt (メルト)',
    artist: 'ryo (supercell) feat. 初音ミク',
    category: 'VOCALOID',
    youtubeVideoId: 'o1jAMSQQ4-M',
    previewStartTime: 20,
    charts: {
      easy: '/charts/song-02/easy.json',
      normal: '/charts/song-02/normal.json',
      hard: '/charts/song-02/hard.json',
      master: '/charts/song-02/master.json'
    }
  },
  {
    id: 'song-03',
    title: 'アイドル (Idol)',
    artist: 'YOASOBI',
    category: 'J-POP',
    youtubeVideoId: 'ZRtdQ81jPUQ',
    previewStartTime: 10,
    charts: {
      easy: '/charts/song-03/easy.json',
      normal: '/charts/song-03/normal.json',
      hard: '/charts/song-03/hard.json',
      master: '/charts/song-03/master.json'
    }
  },
  {
    id: 'song-04',
    title: 'Freedom Dive',
    artist: 'xi',
    category: 'VARIETY',
    youtubeVideoId: '6q_ZqM_jJ5A',
    previewStartTime: 12,
    charts: {
      easy: '/charts/song-04/easy.json',
      normal: '/charts/song-04/normal.json',
      hard: '/charts/song-04/hard.json',
      master: '/charts/song-04/master.json'
    }
  }
];

export function generateSampleChart(songId: string, difficulty: 'easy' | 'normal' | 'hard' | 'master', bpm: number = 130): ChartData {
  const notes = [];
  const beatDuration = 60 / bpm;
  const startSec = 2.0;
  const durationSec = 60;

  let noteId = 1;
  const densityMap = {
    easy: 1.0,
    normal: 0.5,
    hard: 0.25,
    master: 0.25
  };

  const step = beatDuration * (densityMap[difficulty] || 0.5);

  for (let t = startSec; t < durationSec; t += step) {
    const lane = Math.floor((Math.sin(t * 1.5) + 1) * 2) % 4 as 0 | 1 | 2 | 3;
    const isSpecial = noteId % 8 === 0;
    const isHold = noteId % 11 === 0;

    if (isHold) {
      notes.push({
        id: `note-${songId}-${difficulty}-${noteId++}`,
        time: parseFloat(t.toFixed(3)),
        lane,
        type: 'hold' as const,
        holdDuration: parseFloat((beatDuration * 1.5).toFixed(3))
      });
      t += beatDuration * 1.0;
    } else {
      notes.push({
        id: `note-${songId}-${difficulty}-${noteId++}`,
        time: parseFloat(t.toFixed(3)),
        lane,
        type: isSpecial ? ('special' as const) : ('tap' as const)
      });
    }

    if (difficulty === 'master' && noteId % 5 === 0) {
      const secondLane = (lane + 2) % 4 as 0 | 1 | 2 | 3;
      notes.push({
        id: `note-${songId}-${difficulty}-${noteId++}`,
        time: parseFloat(t.toFixed(3)),
        lane: secondLane,
        type: 'tap' as const
      });
    }
  }

  return {
    songId,
    difficulty,
    bpm,
    offset: 0,
    notes
  };
}

export async function fetchChart(songId: string, difficulty: 'easy' | 'normal' | 'hard' | 'master'): Promise<ChartData> {
  try {
    const response = await fetch(`/charts/${songId}/${difficulty}.json`);
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.warn('Failed to fetch static chart, fallback to built-in chart', e);
  }
  return generateSampleChart(songId, difficulty);
}
