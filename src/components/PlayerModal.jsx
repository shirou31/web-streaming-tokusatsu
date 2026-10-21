import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Server, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  Calendar, 
  Clock, 
  FastForward,
  Sparkles,
  Subtitles,
  Film,
  Layers,
  Compass,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
  Zap
} from 'lucide-react';
import { getStreamPayload, postUserHistory } from '../services/apiService';

export default function PlayerModal({ 
  episodeId, 
  watchOrderSlug = null,
  onClose, 
  onNavigateEpisode,
  onHistoryUpdated
}) {
  const [streamData, setStreamData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Playback state
  const [selectedServerIdx, setSelectedServerIdx] = useState(0);
  const [selectedSourceIdx, setSelectedSourceIdx] = useState(0);
  const [selectedSubtitleId, setSelectedSubtitleId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [currentSeconds, setCurrentSeconds] = useState(0);
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const videoRef = useRef(null);

  // Refs to avoid stale closures in timers and cleanup
  const currentSecondsRef = useRef(0);
  const isPlayingRef = useRef(true);
  const streamDataRef = useRef(null);

  useEffect(() => {
    currentSecondsRef.current = currentSeconds;
  }, [currentSeconds]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    streamDataRef.current = streamData;
  }, [streamData]);

  // Robust function to save real watch progress
  const saveProgress = useCallback((secondsToSave, isCompleted = false) => {
    const data = streamDataRef.current;
    if (!data || !data.episode) return;
    const ep = data.episode;
    const prod = data.production || {};
    const totalDuration = ep.duration_seconds || 1440;
    const sec = typeof secondsToSave === 'number' ? secondsToSave : currentSecondsRef.current;
    const progressSec = Math.max(0, Math.floor(sec));
    const completed = isCompleted || (totalDuration > 0 && progressSec / totalDuration >= 0.92);

    postUserHistory({
      episode_id: ep.id,
      production_id: prod.id,
      series_title: prod.title || 'Serial Tokusatsu',
      episode_title: ep.title || `Episode ${ep.episode_number || 1}`,
      episode_number: ep.episode_number || 1,
      poster_url: prod.backdrop_url || prod.poster_url || ep.thumbnail_url,
      backdrop_url: prod.backdrop_url || prod.poster_url,
      progress_seconds: progressSec,
      duration_seconds: totalDuration,
      is_completed: completed
    });

    if (onHistoryUpdated) {
      onHistoryUpdated();
    }
  }, [onHistoryUpdated]);

  // Load stream payload according to GET /stream/:episode_id
  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      const res = await getStreamPayload(episodeId, { watch_order: watchOrderSlug });
      if (isMounted && res.success) {
        setStreamData(res.data);
        streamDataRef.current = res.data;
        const initialSec = res.data.resume?.progress_seconds || 5;
        setCurrentSeconds(initialSec);
        currentSecondsRef.current = initialSec;

        // Segera simpan sesi menonton real ke riwayat
        saveProgress(initialSec, false);

        if (res.data.subtitle_tracks && res.data.subtitle_tracks.length > 0) {
          setSelectedSubtitleId(res.data.subtitle_tracks[0].id);
        }
      }
      if (isMounted) setLoading(false);
    }
    load();
    return () => { isMounted = false; };
  }, [episodeId, watchOrderSlug, saveProgress]);

  // Heartbeat progress tracking: increment seconds every 1s when active
  useEffect(() => {
    if (!streamData) return;
    const interval = setInterval(() => {
      if (isPlaying && streamData.episode) {
        setCurrentSeconds((prev) => {
          const nextSec = Math.min(prev + 1, streamData.episode.duration_seconds || 1440);
          return nextSec;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, streamData]);

  // Periodic autosave to storage/backend every 5s (reliable without reset loops)
  useEffect(() => {
    if (!streamData) return;
    const saveTimer = setInterval(() => {
      if (isPlayingRef.current) {
        saveProgress(currentSecondsRef.current, false);
      }
    }, 5000);

    return () => clearInterval(saveTimer);
  }, [streamData, saveProgress]);

  // Save progress automatically on player close / modal unmount
  useEffect(() => {
    return () => {
      saveProgress(currentSecondsRef.current, false);
    };
  }, [saveProgress]);

  // Check skip markers (intro / outro)
  useEffect(() => {
    if (!streamData?.episode?.skip_markers) return;
    const { intro_start_seconds, intro_end_seconds } = streamData.episode.skip_markers;
    if (intro_start_seconds && intro_end_seconds) {
      if (currentSeconds >= intro_start_seconds && currentSeconds <= intro_end_seconds) {
        setShowSkipIntro(true);
      } else {
        setShowSkipIntro(false);
      }
    }
  }, [currentSeconds, streamData]);

  const handleSkipIntro = () => {
    if (streamData?.episode?.skip_markers?.intro_end_seconds) {
      const nextTime = streamData.episode.skip_markers.intro_end_seconds + 1;
      setCurrentSeconds(nextTime);
      currentSecondsRef.current = nextTime;
      if (videoRef.current) {
        videoRef.current.currentTime = nextTime;
      }
      saveProgress(nextTime, false);
      setShowSkipIntro(false);
    }
  };

  const handleScrub = (pct) => {
    const totalDuration = streamData?.episode?.duration_seconds || 1440;
    const targetSec = Math.floor(pct * totalDuration);
    setCurrentSeconds(targetSec);
    currentSecondsRef.current = targetSec;
    if (videoRef.current) {
      videoRef.current.currentTime = targetSec;
    }
    saveProgress(targetSec, false);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
        saveProgress(currentSecondsRef.current, false);
      }
    } else {
      setIsPlaying((prev) => {
        const next = !prev;
        if (!next) {
          saveProgress(currentSecondsRef.current, false);
        }
        return next;
      });
    }
  };

  const handleClose = () => {
    saveProgress(currentSecondsRef.current, false);
    onClose();
  };

  const handleNavigate = (nextId) => {
    saveProgress(currentSecondsRef.current, false);
    if (onNavigateEpisode) {
      onNavigateEpisode(nextId);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    const elem = document.querySelector('.video-viewport-wrapper');
    if (!document.fullscreenElement) {
      elem?.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  if (loading || !streamData) {
    return (
      <div className="player-modal-backdrop" onClick={onClose}>
        <div className="player-modal-card loading-card glass-panel" onClick={(e) => e.stopPropagation()}>
          <Sparkles size={32} className="animate-spin" color="var(--accent-red)" />
          <span>Menghubungkan ke Stream Server...</span>
        </div>
      </div>
    );
  }

  const { episode, production, video_sources, subtitle_tracks, navigation } = streamData;
  const currentServer = video_sources.servers[selectedServerIdx] || video_sources.servers[0];
  const currentSource = currentServer?.sources[selectedSourceIdx] || currentServer?.sources[0];
  const totalDuration = episode.duration_seconds || 1440;
  const progressPercent = Math.min(100, (currentSeconds / totalDuration) * 100);

  // Deteksi domain embed / web player pihak ketiga
  const isEmbedDomain = Boolean(
    currentSource?.url && (
      currentSource.url.includes('player.') ||
      currentSource.url.includes('tokusatsuindo.com') ||
      currentSource.url.includes('drive.google.com') ||
      currentSource.url.includes('dood') ||
      currentSource.url.includes('streamwish') ||
      currentSource.url.includes('youtube') ||
      currentSource.url.includes('/x/?t=') ||
      currentSource.url.includes('/p/?t=') ||
      currentSource.url.includes('/e/') ||
      currentSource.url.includes('/preview')
    )
  );

  // Deteksi apakah sumber adalah direct media binary (MP4/HLS/WebM) yang diputar langsung via HTML5 Video
  const isDirectVideo = !isEmbedDomain && (
                        currentSource?.source_type === 'direct' || 
                        currentSource?.source_type === 'mp4' || 
                        currentSource?.source_type === 'hls' || 
                        (currentSource?.url && (currentSource.url.includes('.mp4') || currentSource.url.includes('.m3u8') || currentSource.url.includes('.webm'))));

  // Deteksi embed/iframe pihak ketiga
  const isIframe = isEmbedDomain || 
                   currentSource?.source_type === 'iframe' || 
                   currentSource?.source_type === 'embed' || 
                   currentSource?.source_type === 'gdrive';

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getIframeSrc = (rawUrl) => {
    if (!rawUrl) return '';
    let url = rawUrl;
    if (url.includes('drive.google.com')) {
      // Normalize /view or /view?usp=sharing to /preview
      url = url.replace(/\/view(\?usp=sharing)?/g, '/preview').replace(/\/preview\?usp=sharing/g, '/preview');
      return url;
    }
    // Jika player.tokusatsuindo.com, jangan ubah parameter token query
    if (url.includes('player.tokusatsuindo.com')) {
      return url;
    }
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}autoplay=1`;
  };

  return (
    <div className="player-modal-backdrop" onClick={handleClose}>
      <div className="player-modal-card glass-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="header-meta-group">
            <span className="badge badge-red">{production.franchise?.name || 'Tokusatsu'}</span>
            <h2 className="header-title">{production.title}</h2>
            <span className="header-ep-badge">
              {episode.kind === 'feature' ? 'Movie Feature' : `Episode ${episode.episode_number}`}
            </span>
            {navigation.watch_order_slug && (
              <span className="order-active-badge">
                <Compass size={12} />
                <span>Urutan Kronologis</span>
              </span>
            )}
          </div>
          <button id="close-player-modal-btn" className="close-btn" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        {/* Player Layout Body */}
        <div className="player-layout-body">
          {/* Main Video Screen */}
          <div className="video-main-column">
            {/* Quick Switch / Access Permission Resolver Bar */}
            {currentSource?.url && currentSource.url.includes('drive.google.com') && (
              <div className="gdrive-permission-banner glass-panel">
                <div className="perm-banner-content">
                  <div className="perm-icon-box">
                    <AlertTriangle size={18} color="#f59e0b" />
                  </div>
                  <div className="perm-info-text">
                    <span className="perm-title">Layar Menampilkan &ldquo;Anda Memerlukan Akses&rdquo;?</span>
                    <p className="perm-sub">
                      Google Drive membatasi akses iframe untuk akun Google tertentu. Silakan beralih ke Server Direct tanpa izin atau buka langsung di tab baru:
                    </p>
                  </div>
                </div>
                <div className="perm-actions-row">
                  <button
                    className="btn-perm-switch primary"
                    onClick={() => {
                      const nonGdriveIdx = video_sources.servers.findIndex((s) => !s.server_name.toLowerCase().includes('google drive'));
                      if (nonGdriveIdx !== -1) {
                        setSelectedServerIdx(nonGdriveIdx);
                      } else {
                        setSelectedServerIdx((selectedServerIdx + 1) % video_sources.servers.length);
                      }
                      setSelectedSourceIdx(0);
                    }}
                    title="Beralih ke Server Direct tanpa izin Google"
                  >
                    <Zap size={14} />
                    <span>⚡ Pindah ke Server Direct (Anti Izin)</span>
                  </button>

                  <button
                    className="btn-perm-switch secondary"
                    onClick={() => {
                      const nextIdx = (selectedServerIdx + 1) % video_sources.servers.length;
                      setSelectedServerIdx(nextIdx);
                      setSelectedSourceIdx(0);
                    }}
                    title="Coba Server Mirror berikutnya"
                  >
                    <RefreshCw size={14} />
                    <span>Coba Mirror Lain ({selectedServerIdx + 1}/{video_sources.servers.length})</span>
                  </button>

                  <a
                    href={currentSource.direct_url || currentSource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-perm-switch external"
                    title="Buka file Google Drive di tab baru dengan akun Google Anda"
                  >
                    <ExternalLink size={14} />
                    <span>Buka Drive di Tab Baru</span>
                  </a>
                </div>
              </div>
            )}

            <div className="video-viewport-wrapper">
              {isDirectVideo ? (
                <div className="custom-cinema-screen">
                  <video
                    ref={videoRef}
                    className="html5-video-player"
                    src={currentSource?.url}
                    poster={production.backdrop_url || production.poster_url}
                    playsInline
                    autoPlay
                    muted={isMuted}
                    crossOrigin="anonymous"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onTimeUpdate={(e) => {
                      setCurrentSeconds(Math.floor(e.currentTarget.currentTime));
                    }}
                    onEnded={() => {
                      setIsPlaying(false);
                      saveProgress(totalDuration, true);
                    }}
                  >
                    {subtitle_tracks && subtitle_tracks.map((sub) => (
                      <track
                        key={sub.id}
                        kind="subtitles"
                        src={sub.url}
                        srcLang={sub.language_code}
                        label={sub.label}
                        default={sub.is_default || selectedSubtitleId === sub.id}
                      />
                    ))}
                    Browser Anda tidak mendukung tag video HTML5.
                  </video>

                  {/* Skip Intro Button Floating */}
                  {showSkipIntro && (
                    <button className="skip-intro-btn" onClick={handleSkipIntro}>
                      <FastForward size={16} />
                      <span>Lewati Opening ({formatTime(episode.skip_markers.intro_end_seconds)})</span>
                    </button>
                  )}

                  {/* Player Bottom Control Bar */}
                  <div className="screen-control-bar">
                    <button className="ctrl-btn" onClick={togglePlay} title={isPlaying ? "Jeda" : "Putar"}>
                      {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                    </button>
                    <button className="ctrl-btn" onClick={toggleMute} title={isMuted ? "Bunyikan" : "Bisukan"}>
                      {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>

                    <span className="time-code">
                      {formatTime(currentSeconds)} / {formatTime(totalDuration)}
                    </span>

                    {/* Scrub Progress Bar */}
                    <div 
                      className="scrub-bar"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clickX = e.clientX - rect.left;
                        const pct = clickX / rect.width;
                        handleScrub(pct);
                      }}
                    >
                      <div className="scrub-fill" style={{ width: `${progressPercent}%` }} />
                    </div>

                    {/* Quality & Subtitle Badges */}
                    <span className="quality-badge">{currentSource?.quality || '1440p'}</span>
                    <button className="ctrl-btn" onClick={toggleFullscreen} title="Layar Penuh">
                      <Maximize size={18} />
                    </button>
                  </div>
                </div>
              ) : isIframe ? (
                <iframe
                  key={`${selectedServerIdx}-${selectedSourceIdx}-${currentSource?.url}`}
                  src={getIframeSrc(currentSource?.url)}
                  title={episode.title}
                  className="embed-iframe"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <div className="custom-cinema-screen">
                  <img 
                    src={production.poster_url} 
                    alt={episode.title}
                    className="screen-ambient-bg"
                  />
                  <div className="screen-dark-overlay" />

                  {/* Skip Intro Button Floating */}
                  {showSkipIntro && (
                    <button className="skip-intro-btn" onClick={handleSkipIntro}>
                      <FastForward size={16} />
                      <span>Lewati Opening ({formatTime(episode.skip_markers.intro_end_seconds)})</span>
                    </button>
                  )}

                  {/* Center Play Button */}
                  <div className="screen-center-pulse" onClick={togglePlay}>
                    <div className="pulse-btn">
                      {isPlaying ? <Pause size={30} /> : <Play size={30} fill="#ffffff" />}
                    </div>
                  </div>

                  {/* Player Bottom Control Bar */}
                  <div className="screen-control-bar">
                    <button className="ctrl-btn" onClick={togglePlay}>
                      {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                    </button>
                    <button className="ctrl-btn" onClick={toggleMute}>
                      {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>

                    <span className="time-code">
                      {formatTime(currentSeconds)} / {formatTime(totalDuration)}
                    </span>

                    {/* Scrub Progress Bar */}
                    <div 
                      className="scrub-bar"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clickX = e.clientX - rect.left;
                        const pct = clickX / rect.width;
                        handleScrub(pct);
                      }}
                    >
                      <div className="scrub-fill" style={{ width: `${progressPercent}%` }} />
                    </div>

                    {/* Quality & Subtitle Badges */}
                    <span className="quality-badge">{currentSource?.quality || '1440p'}</span>
                    <button className="ctrl-btn" onClick={toggleFullscreen} title="Layar Penuh">
                      <Maximize size={18} />
                    </button>
                  </div>
                </div>
              )}

              {/* Floating Ultra HD 1440p Resolution Indicator */}
              <div className="viewport-res-badge">
                <span className="qhd-pulse-dot" />
                <span className="res-tag-main">{currentSource?.quality || '1440p'}</span>
                <span className="res-tag-sub">
                  {currentSource?.quality === '1440p' ? '2K ULTRA QHD' : currentSource?.quality === '1080p' ? 'FHD 60FPS' : 'HD READY'}
                </span>
                <span className="res-bitrate-chip">
                  {currentSource?.bitrate_kbps ? `${currentSource.bitrate_kbps} kbps` : 'Master Bitrate'}
                </span>
              </div>
            </div>

            {/* 🔥 Dedicated 1440p QHD Resolution Selector Toolbar */}
            <div className="resolution-selector-toolbar glass-panel">
              <div className="res-label-wrap">
                <Sparkles size={16} color="var(--accent-cyan)" />
                <span className="res-label-title">Resolusi Video:</span>
                <span className="res-current-indicator">
                  Aktif: <strong>{currentSource?.quality || '1440p'}</strong>
                  {currentSource?.quality === '1440p' && <span className="ultra-tag">ULTRA HD 2K</span>}
                </span>
              </div>

              <div className="res-btn-group">
                {currentServer?.sources.map((src, qIdx) => (
                  <button
                    key={qIdx}
                    className={`res-pill-btn ${selectedSourceIdx === qIdx ? 'active' : ''} ${src.quality === '1440p' ? 'qhd-pill' : ''}`}
                    onClick={() => setSelectedSourceIdx(qIdx)}
                    title={`Pilih Kualitas ${src.label || src.quality}`}
                  >
                    <span className="res-val-text">{src.quality}</span>
                    <span className="res-badge-sub">
                      {src.quality === '1440p' ? '2K QHD' : src.quality === '1080p' ? 'FHD' : src.quality === '720p' ? 'HD' : src.quality === '480p' ? 'SD' : '360p'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Resolution Explanation & Direct Player vs Google Drive Notice */}
            {currentSource?.url && currentSource.url.includes('drive.google.com') ? (
              <div className="resolution-notice-card glass-panel">
                <div className="notice-icon-box">
                  <Sparkles size={18} color="#00f2fe" />
                </div>
                <div className="notice-text-col">
                  <div className="notice-head">
                    <strong>Peningkatan Kualitas Resolusi HD & 1440p QHD Aktif</strong>
                    <span className="notice-pill">Bypass 360p Limit</span>
                  </div>
                  <p className="notice-desc">
                    Secara default, pemutar web Google Drive preview menampilkan pratinjau di 360p karena kompresi bawaan Google. Tokuflix menyediakan mode <strong>1440p (2K QHD)</strong> dan <strong>1080p FHD</strong> dengan direct bypass link berkecepatan tinggi di bawah ini:
                  </p>
                </div>
                {(streamData.scraped_metadata?.drive_download_1 || currentSource?.direct_url || (currentSource?.url && currentSource.url.includes('drive.google.com'))) && (
                  <a
                    href={streamData.scraped_metadata?.drive_download_1 || currentSource?.direct_url || currentSource?.url?.replace('/preview', '/view?usp=sharing')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-bypass-qhd"
                    title="Buka Video Resolusi 1440p (2K Ultra QHD) Penuh di Tab Baru"
                  >
                    <ExternalLink size={14} />
                    <span>Buka 1440p (2K QHD) Penuh</span>
                  </a>
                )}
              </div>
            ) : (
              <div className="resolution-notice-card glass-panel direct-player-notice">
                <div className="notice-icon-box">
                  <Zap size={18} color="#00f2fe" />
                </div>
                <div className="notice-text-col">
                  <div className="notice-head">
                    <strong>Server Direct Player HD Aktif</strong>
                    <span className="notice-pill live-pill">⚡ Siap Putar Langsung</span>
                  </div>
                  <p className="notice-desc">
                    Stream video multi-resolusi aktif dan langsung diputar tanpa hambatan batasan kuota atau izin login akun pihak ketiga.
                  </p>
                </div>
              </div>
            )}

            {/* Server Selector Bar */}
            <div className="server-toolbar glass-panel">
              <div className="server-title">
                <Server size={15} color="var(--accent-red)" />
                <span>Pilih Server:</span>
              </div>
              <div className="server-list-tabs">
                {video_sources.servers.map((srv, sIdx) => (
                  <button
                    key={sIdx}
                    className={`server-tab ${selectedServerIdx === sIdx ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedServerIdx(sIdx);
                      setSelectedSourceIdx(0);
                    }}
                  >
                    <span className="srv-dot" />
                    <span>{srv.server_name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Episode Title & Synopsis */}
            <div className="episode-meta-card">
              <div className="ep-title-header-row">
                <h3 className="ep-title-heading">{episode.title}</h3>
                <div className="ep-title-badges">
                  <span className="badge-1440p-qhd">1440p 2K QHD Supported</span>
                  {streamData.scraped_metadata?.is_live_scraped && (
                    <span className="scraped-live-tag">
                      ⚡ Live Scraped (Hasil Nyata)
                    </span>
                  )}
                </div>
              </div>
              <p className="ep-synopsis-text">{episode.synopsis}</p>

              {/* Real Google Drive & Fansub Download Links in HD/1440p */}
              {streamData.scraped_metadata && (
                <div className="scraped-download-box">
                  <div className="scraped-info-title">
                    <span className="dot-live" />
                    <strong>Download Resolusi Penuh (Bypass 360p):</strong>
                  </div>
                  <div className="download-btn-group">
                    {streamData.scraped_metadata.drive_download_1 && (
                      <a
                        href={streamData.scraped_metadata.drive_download_1}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-gdrive-dl qhd-special"
                        title="Unduh resolusi master 1440p/1080p dari Google Drive Server 1"
                      >
                        <Download size={14} />
                        <span>Unduh 1440p QHD / FHD (Drive 1)</span>
                        <ExternalLink size={12} />
                      </a>
                    )}
                    {streamData.scraped_metadata.drive_download_2 && (
                      <a
                        href={streamData.scraped_metadata.drive_download_2}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-gdrive-dl mirror"
                        title="Unduh dari Google Drive Mirror 2"
                      >
                        <Download size={14} />
                        <span>Unduh 1080p FHD (Mirror 2)</span>
                        <ExternalLink size={12} />
                      </a>
                    )}
                    {currentSource?.direct_url && (
                      <a
                        href={currentSource.direct_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-gdrive-dl active-srv"
                      >
                        <Download size={14} />
                        <span>Unduh {currentSource.quality} Aktif</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Subtitles Track Selector */}
              {subtitle_tracks && subtitle_tracks.length > 0 && (
                <div className="subtitle-selector-row">
                  <div className="sub-label">
                    <Subtitles size={15} color="var(--accent-cyan)" />
                    <span>Subtitle Trek:</span>
                  </div>
                  <div className="sub-chips">
                    {subtitle_tracks.map((st) => (
                      <button
                        key={st.id}
                        className={`sub-chip ${selectedSubtitleId === st.id ? 'active' : ''}`}
                        onClick={() => setSelectedSubtitleId(st.id)}
                      >
                        {st.label} ({st.format.toUpperCase()})
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Buttons Row */}
            <div className="navigation-row">
              <button
                className="btn-secondary"
                disabled={!navigation.previous_episode}
                onClick={() => {
                  if (navigation.previous_episode) {
                    handleNavigate(navigation.previous_episode.episode_id);
                  }
                }}
              >
                <ChevronLeft size={18} />
                <span>Episode Sebelumnya</span>
              </button>

              {/* Next Episode Button with Chronological Watch Order Awareness! */}
              {navigation.next_episode_chronological && (
                <button
                  className="btn-primary"
                  onClick={() => handleNavigate(navigation.next_episode_chronological.episode_id)}
                >
                  {navigation.next_episode_chronological.reason === 'watch_order_segment_boundary' ? (
                    <>
                      <Sparkles size={16} />
                      <span>Lanjut Kronologis: {navigation.next_episode_chronological.title}</span>
                      <ChevronRight size={18} />
                    </>
                  ) : (
                    <>
                      <span>Episode Selanjutnya</span>
                      <ChevronRight size={18} />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .player-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(3, 5, 8, 0.9);
          backdrop-filter: blur(14px);
          z-index: 1100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          overflow-y: auto;
        }
        .player-modal-card {
          background: #0d121d;
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
          width: 100%;
          max-width: 1180px;
          max-height: 94vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(255, 32, 78, 0.2);
        }
        .loading-card {
          padding: 50px 30px;
          align-items: center;
          justify-content: center;
          max-width: 380px;
          gap: 14px;
        }
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 22px;
          border-bottom: 1px solid var(--border-subtle);
          background: rgba(16, 23, 38, 0.8);
        }
        .header-meta-group {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .header-title {
          font-size: 1.2rem;
          color: #ffffff;
        }
        .header-ep-badge {
          background: rgba(0, 242, 254, 0.15);
          color: var(--accent-cyan);
          border: 1px solid rgba(0, 242, 254, 0.3);
          font-size: 0.8rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: var(--radius-sm);
        }
        .order-active-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          background: rgba(255, 183, 3, 0.15);
          color: var(--accent-gold);
          border: 1px solid rgba(255, 183, 3, 0.3);
          font-size: 0.72rem;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: var(--radius-sm);
        }
        .close-btn {
          color: var(--text-muted);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .close-btn:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.1);
        }
        .player-layout-body {
          padding: 20px;
          overflow-y: auto;
          flex: 1;
        }
        .video-main-column {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .video-viewport-wrapper {
          position: relative;
          aspect-ratio: 16 / 9;
          background: #000;
          border-radius: var(--radius-md);
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8);
        }
        .embed-iframe {
          width: 100%;
          height: 100%;
          border: none;
        }
        .html5-video-player {
          width: 100%;
          height: 100%;
          object-fit: contain;
          background: #000;
          display: block;
        }
        .custom-cinema-screen {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .screen-ambient-bg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: blur(12px) brightness(0.5);
        }
        .screen-dark-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
        }
        .skip-intro-btn {
          position: absolute;
          bottom: 70px;
          right: 20px;
          z-index: 10;
          background: rgba(0, 242, 254, 0.9);
          color: #05070a;
          font-weight: 800;
          font-size: 0.82rem;
          padding: 8px 16px;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 0 20px rgba(0, 242, 254, 0.5);
          cursor: pointer;
        }
        .screen-center-pulse {
          position: relative;
          z-index: 5;
          margin: auto;
          cursor: pointer;
        }
        .pulse-btn {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent-red) 0%, #b5179e 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          box-shadow: 0 0 35px var(--accent-red-glow);
        }
        .screen-control-bar {
          position: relative;
          z-index: 5;
          background: linear-gradient(0deg, rgba(0, 0, 0, 0.9) 0%, transparent 100%);
          padding: 14px 18px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .ctrl-btn {
          color: #ffffff;
        }
        .ctrl-btn:hover {
          color: var(--accent-red);
        }
        .time-code {
          font-size: 0.78rem;
          color: var(--text-secondary);
          font-variant-numeric: tabular-nums;
        }
        .scrub-bar {
          flex: 1;
          height: 5px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
          overflow: hidden;
          cursor: pointer;
        }
        .scrub-fill {
          height: 100%;
          background: var(--accent-red);
        }
        .quality-badge {
          background: rgba(255, 255, 255, 0.15);
          font-size: 0.72rem;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 4px;
        }
        .viewport-res-badge {
          position: absolute;
          top: 14px;
          right: 14px;
          z-index: 15;
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(3, 5, 8, 0.85);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(0, 242, 254, 0.4);
          padding: 4px 10px;
          border-radius: var(--radius-full);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.6);
        }
        .qhd-pulse-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #00f2fe;
          box-shadow: 0 0 8px #00f2fe;
        }
        .res-tag-main {
          font-size: 0.8rem;
          font-weight: 800;
          color: #00f2fe;
        }
        .res-tag-sub {
          font-size: 0.68rem;
          font-weight: 700;
          color: #ffffff;
          background: rgba(255, 255, 255, 0.1);
          padding: 1px 5px;
          border-radius: 3px;
        }
        .res-bitrate-chip {
          font-size: 0.65rem;
          color: var(--text-muted);
          font-family: monospace;
        }
        .resolution-selector-toolbar {
          padding: 12px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          background: rgba(0, 242, 254, 0.03);
          border-bottom: 1px solid var(--border-subtle);
        }
        .res-label-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .res-label-title {
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .res-current-indicator {
          font-size: 0.76rem;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .res-current-indicator strong {
          color: var(--accent-cyan);
        }
        .ultra-tag {
          font-size: 0.65rem;
          font-weight: 800;
          color: #030508;
          background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%);
          padding: 1px 6px;
          border-radius: 3px;
        }
        .res-btn-group {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .res-pill-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 4px 12px;
          border-radius: var(--radius-sm);
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: var(--text-secondary);
          transition: var(--transition-fast);
          cursor: pointer;
        }
        .res-pill-btn:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.08);
        }
        .res-pill-btn.active {
          color: #030508;
          background: var(--accent-cyan);
          border-color: var(--accent-cyan);
          box-shadow: 0 0 12px rgba(0, 242, 254, 0.4);
        }
        .res-pill-btn.qhd-pill {
          border-color: rgba(0, 242, 254, 0.3);
        }
        .res-pill-btn.qhd-pill.active {
          background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%);
          color: #030508;
          font-weight: 800;
        }
        .res-val-text {
          font-size: 0.78rem;
          font-weight: 700;
        }
        .res-badge-sub {
          font-size: 0.62rem;
          opacity: 0.8;
        }
        .resolution-notice-card {
          margin: 10px 18px 0;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          background: linear-gradient(90deg, rgba(0, 242, 254, 0.07) 0%, rgba(79, 172, 254, 0.03) 100%);
          border: 1px solid rgba(0, 242, 254, 0.2);
          border-radius: var(--radius-md);
        }
        .notice-icon-box {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          background: rgba(0, 242, 254, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .notice-text-col {
          flex: 1;
        }
        .notice-head {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 2px;
        }
        .notice-head strong {
          font-size: 0.84rem;
          color: var(--text-primary);
        }
        .notice-pill {
          font-size: 0.65rem;
          font-weight: 700;
          color: #10b981;
          background: rgba(16, 185, 129, 0.15);
          padding: 1px 6px;
          border-radius: 999px;
        }
        .notice-desc {
          font-size: 0.74rem;
          color: var(--text-secondary);
          margin-bottom: 0;
          line-height: 1.4;
        }
        .notice-desc strong {
          color: var(--accent-cyan);
        }
        .btn-bypass-qhd {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: linear-gradient(135deg, var(--accent-cyan) 0%, #4facfe 100%);
          color: #030508;
          font-size: 0.76rem;
          font-weight: 800;
          border-radius: var(--radius-sm);
          text-decoration: none;
          flex-shrink: 0;
          box-shadow: 0 0 15px rgba(0, 242, 254, 0.35);
          transition: var(--transition-fast);
        }
        .btn-bypass-qhd:hover {
          transform: translateY(-1px);
          box-shadow: 0 0 20px rgba(0, 242, 254, 0.6);
        }
        .ep-title-badges {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .badge-1440p-qhd {
          font-size: 0.7rem;
          font-weight: 800;
          color: #00f2fe;
          background: rgba(0, 242, 254, 0.12);
          border: 1px solid rgba(0, 242, 254, 0.3);
          padding: 2px 7px;
          border-radius: 4px;
        }
        .btn-gdrive-dl.qhd-special {
          background: linear-gradient(135deg, rgba(0, 242, 254, 0.18) 0%, rgba(79, 172, 254, 0.12) 100%);
          border-color: rgba(0, 242, 254, 0.4);
          color: #00f2fe;
          font-weight: 700;
        }
        .btn-gdrive-dl.qhd-special:hover {
          background: #00f2fe;
          color: #030508;
          box-shadow: 0 0 15px rgba(0, 242, 254, 0.4);
        }
        .server-toolbar {
          padding: 12px 18px;
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }
        .server-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.84rem;
          font-weight: 700;
        }
        .server-list-tabs {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .server-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: var(--radius-full);
          font-size: 0.78rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
        }
        .server-tab.active {
          background: rgba(255, 32, 78, 0.18);
          border-color: var(--accent-red);
          color: #ffffff;
        }
        .srv-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #64748b;
        }
        .server-tab.active .srv-dot {
          background: var(--accent-red);
          box-shadow: 0 0 6px var(--accent-red);
        }
        .quality-subtabs {
          margin-left: auto;
          display: flex;
          gap: 4px;
        }
        .quality-subtab {
          padding: 3px 8px;
          font-size: 0.72rem;
          font-weight: 700;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-secondary);
        }
        .quality-subtab.active {
          background: var(--accent-cyan);
          color: #05070a;
        }
        .episode-meta-card {
          background: rgba(16, 23, 38, 0.5);
          border-left: 3px solid var(--accent-red);
          padding: 14px 18px;
          border-radius: 0 var(--radius-md) var(--radius-md) 0;
        }
        .ep-title-heading {
          font-size: 1.1rem;
          margin-bottom: 4px;
        }
        .ep-synopsis-text {
          font-size: 0.88rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }
        .subtitle-selector-row {
          margin-top: 10px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .sub-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        .sub-chips {
          display: flex;
          gap: 6px;
        }
        .sub-chip {
          font-size: 0.75rem;
          padding: 3px 9px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
        }
        .sub-chip.active {
          background: rgba(0, 242, 254, 0.15);
          border-color: var(--accent-cyan);
          color: var(--accent-cyan);
        }
        .navigation-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding-top: 6px;
        }
        .ep-title-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .scraped-live-tag {
          font-size: 0.72rem;
          font-weight: 700;
          color: #10b981;
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.35);
          padding: 3px 8px;
          border-radius: 999px;
        }
        .scraped-download-box {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: var(--radius-sm);
          padding: 10px 14px;
          margin: 10px 0 14px;
        }
        .scraped-info-title {
          font-size: 0.76rem;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
        }
        .dot-live {
          width: 7px;
          height: 7px;
          background: #10b981;
          border-radius: 50%;
          box-shadow: 0 0 8px #10b981;
          display: inline-block;
        }
        .download-btn-group {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .btn-gdrive-dl {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          font-size: 0.76rem;
          font-weight: 600;
          background: rgba(0, 242, 254, 0.12);
          border: 1px solid rgba(0, 242, 254, 0.3);
          color: var(--accent-cyan);
          text-decoration: none;
          transition: var(--transition-fast);
        }
        .btn-gdrive-dl:hover {
          background: var(--accent-cyan);
          color: #030508;
          transform: translateY(-1px);
        }
        .btn-gdrive-dl.mirror {
          background: rgba(255, 183, 3, 0.12);
          border-color: rgba(255, 183, 3, 0.3);
          color: #ffb703;
        }
        .btn-gdrive-dl.mirror:hover {
          background: #ffb703;
          color: #030508;
        }
        .btn-gdrive-dl.active-srv {
          background: rgba(255, 32, 78, 0.12);
          border-color: rgba(255, 32, 78, 0.3);
          color: var(--accent-red);
        }
        .btn-gdrive-dl.active-srv:hover {
          background: var(--accent-red);
          color: #ffffff;
        }

        /* GDrive Permission Alert & Emergency Switcher */
        .gdrive-permission-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 10px 14px;
          margin-bottom: 12px;
          background: rgba(245, 158, 11, 0.08);
          border: 1px solid rgba(245, 158, 11, 0.35);
          border-radius: var(--radius-sm);
          animation: fadeIn 0.3s ease;
        }
        .perm-banner-content {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
        }
        .perm-icon-box {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(245, 158, 11, 0.15);
          flex-shrink: 0;
        }
        .perm-info-text {
          font-size: 0.78rem;
          color: #e2e8f0;
        }
        .perm-title {
          font-weight: 700;
          color: #fbbf24;
          display: block;
          margin-bottom: 2px;
        }
        .perm-sub {
          margin: 0;
          color: #94a3b8;
          font-size: 0.72rem;
          line-height: 1.3;
        }
        .perm-actions-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .btn-perm-switch {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          font-size: 0.74rem;
          font-weight: 700;
          cursor: pointer;
          border: none;
          transition: var(--transition-fast);
          text-decoration: none;
          white-space: nowrap;
        }
        .btn-perm-switch.primary {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: #ffffff;
          box-shadow: 0 2px 10px rgba(16, 185, 129, 0.35);
        }
        .btn-perm-switch.primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.5);
        }
        .btn-perm-switch.secondary {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #ffffff;
        }
        .btn-perm-switch.secondary:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #38bdf8;
        }
        .btn-perm-switch.external {
          background: rgba(0, 242, 254, 0.12);
          border: 1px solid rgba(0, 242, 254, 0.3);
          color: #00f2fe;
        }
        .btn-perm-switch.external:hover {
          background: #00f2fe;
          color: #030712;
        }
        @media (max-width: 768px) {
          .gdrive-permission-banner {
            flex-direction: column;
            align-items: flex-start;
          }
          .perm-actions-row {
            width: 100%;
            flex-wrap: wrap;
          }
        }
        @media (max-width: 640px) {
          .player-modal-backdrop {
            padding: 0;
            align-items: flex-start;
          }
          .player-modal-card {
            border-radius: 0;
            width: 100vw;
            height: 100vh;
            max-height: 100vh;
            border: none;
          }
          .video-viewport-wrapper {
            border-radius: 0;
          }
          .modal-header {
            padding: 10px 14px;
          }
          .header-title {
            font-size: 1rem;
          }
          .player-layout-body {
            padding: 12px 12px calc(80px + env(safe-area-inset-bottom, 0px));
          }
          .resolution-selector-toolbar,
          .server-toolbar {
            padding: 10px;
          }
          .res-pill-btn,
          .server-tab {
            padding: 6px 10px;
            font-size: 0.74rem;
          }
          .player-nav-footer {
            flex-direction: column;
            gap: 10px;
          }
          .nav-ep-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
