// Konstanta dan Enum Types sesuai 01_DATABASE_ARCHITECTURE.md

export const PRODUCTION_TYPE = {
  TV_SERIES: 'tv_series',
  MOVIE: 'movie',
  V_CINEMA: 'v_cinema',
  SPECIAL: 'special',
  HYPER_BATTLE_DVD: 'hyper_battle_dvd',
  NET_MOVIE: 'net_movie',
  CROSSOVER: 'crossover'
};

export const PRODUCTION_STATUS = {
  UPCOMING: 'upcoming',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  HIATUS: 'hiatus'
};

export const AGE_RATING = {
  ALL: 'all',
  SEVEN_PLUS: '7+',
  THIRTEEN_PLUS: '13+',
  FIFTEEN_PLUS: '15+',
  EIGHTEEN_PLUS: '18+'
};

export const EPISODE_KIND = {
  EPISODE: 'episode',
  FEATURE: 'feature',
  SPECIAL_CHAPTER: 'special_chapter',
  RECAP: 'recap',
  BONUS: 'bonus'
};

export const VIDEO_SOURCE_TYPE = {
  HLS: 'hls',
  MP4: 'mp4',
  IFRAME: 'iframe'
};

export const VIDEO_QUALITY = {
  Q360P: '360p',
  Q450P: '450p',
  Q480P: '480p',
  Q720P: '720p',
  Q1080P: '1080p',
  Q1440P: '1440p',
  Q2160P: '2160p',
  AUTO: 'auto'
};

export const SUBTITLE_FORMAT = {
  VTT: 'vtt',
  SRT: 'srt'
};

export const GENRE_KIND = {
  GENRE: 'genre',
  THEME: 'theme',
  TAG: 'tag'
};

export const WATCH_ORDER_TYPE = {
  CHRONOLOGICAL: 'chronological',
  RELEASE: 'release',
  RECOMMENDED: 'recommended'
};

export const USER_ROLE = {
  USER: 'user',
  EDITOR: 'editor',
  ADMIN: 'admin'
};

export const BOOKMARK_STATUS = {
  PLAN_TO_WATCH: 'plan_to_watch',
  WATCHING: 'watching',
  COMPLETED: 'completed',
  DROPPED: 'dropped'
};
