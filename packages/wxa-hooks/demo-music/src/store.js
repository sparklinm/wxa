

let state = {
    song: null,
    songList: [],
};


export function storeSong(song) {
    state.song = song;
}


export function storeSongList(songList) {
    state.songList = songList;
}

export function getSong(song) {
    return state.song;
}


export function getSongList(songList) {
    return state.songList;
}

