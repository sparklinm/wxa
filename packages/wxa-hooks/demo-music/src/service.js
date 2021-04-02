const songData = [
  {
    type: 'new',
    text: '新歌',
    covers: [
      '/assets/images/music-bg1.jpg',
      '/assets/images/music-bg2.jpg',
      '/assets/images/music-bg3.jpg',
    ],
    list: [
      {
        song_id: '1',
        title: '苏绣',
        author: '林清弄',
        style: '清新',
        src: '/assets/musics/林清弄 - 苏绣.mp3',
      },
      {
        song_id: '2',
        title: '姑苏一梦（天下IP×苏州博物馆联动曲）',
        author: '司夏 ',
        style: '清新',
        src: '/assets/musics/司夏 - 姑苏一梦（天下IP×苏州博物馆联动曲）.mp3',
      },
      {
        song_id: '3',
        title: '血之哀',
        author: '文名远扬',
        style: '清新',
        src: '/assets/musics/文名远扬 - 血之哀.mp3',
      },
    ],
  },
  {
    type: 'hot',
    text: '热歌',
    covers: [
      '/assets/images/music-bg1.jpg',
      '/assets/images/music-bg2.jpg',
      '/assets/images/music-bg3.jpg',
    ],
  },
  {
    type: 'popular ',
    text: '流行音乐',
    covers: [
      '/assets/images/music-bg1.jpg',
      '/assets/images/music-bg2.jpg',
      '/assets/images/music-bg3.jpg',
    ],
  },
];

export async function getSongCategory() {
  let res = songData.map((item) => {
    return {
      type: item.type,
      text: item.text,
    };
  });

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(res);
    }, 1000);
  });
}

export async function getSongList(type) {
  console.log(type);
  let res = {};
  songData.some((item) => {
    if (item.type === type) {
      res = {
        covers: item.covers,
        list: item.list,
      };
      return true;
    }
  });

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(res);
    }, 500);
  });
}
