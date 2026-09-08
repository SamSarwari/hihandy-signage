(function () {
  'use strict';

  // Elements
  let activeVideo = document.getElementById('player-a');
  let standbyVideo = document.getElementById('player-b');
  const statusBadge = document.getElementById('status-badge');
  const bannerBar = document.getElementById('banner-bar');
  const diagPanel = document.getElementById('diag-panel');

  // State
  let currentConfig = null;
  let currentVideoSrc = '';
  let pollIntervalId = null;
  let lastPollTime = null;
  let pollCount = 0;

  // Determine target orientation
  function getOrientation() {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('orientation') || urlParams.get('mode');
    if (mode === 'portrait' || mode === 'landscape') {
      return mode;
    }
    return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
  }

  // Show status badge temporarily
  function showStatus(text, duration = 4000) {
    statusBadge.textContent = text;
    statusBadge.classList.remove('fade-out');
    if (duration > 0) {
      setTimeout(() => {
        statusBadge.classList.add('fade-out');
      }, duration);
    }
  }

  // Update diagnostic panel
  function updateDiag() {
    diagPanel.innerHTML = `
      <b>HI-HANDY SIGNAGE DIAGNOSTICS</b><br>
      Modus: ${getOrientation()} (${window.innerWidth}x${window.innerHeight})<br>
      Aktives Video: ${currentVideoSrc || 'Keines'}<br>
      Status: ${activeVideo && !activeVideo.paused ? '▶ Läuft (Loop)' : '⏸ Pausiert'}<br>
      Playlist Version: ${currentConfig ? currentConfig.version : 'Unbekannt'}<br>
      Letzter Check: ${lastPollTime ? lastPollTime.toLocaleTimeString() : '-'}<br>
      Poll-Counter: ${pollCount}<br>
      Tippe D oder Doppelklick zum Schließen.
    `;
  }

  // Load and apply playlist configuration
  async function checkPlaylist() {
    try {
      const response = await fetch(`playlist.json?_t=${Date.now()}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const config = await response.json();
      lastPollTime = new Date();
      pollCount++;

      const orientation = getOrientation();
      const targetVideo = config[orientation]?.video;

      if (!targetVideo) {
        console.warn('Kein Video für Orientierung:', orientation);
        return;
      }

      // Handle Emergency Banner
      if (config.emergency_banner && config.emergency_banner.active && config.emergency_banner.text) {
        bannerBar.textContent = config.emergency_banner.text;
        bannerBar.style.display = 'block';
      } else {
        bannerBar.style.display = 'none';
      }

      // Check if video needs update
      if (targetVideo !== currentVideoSrc) {
        console.log('Wechsle zu neuem Video:', targetVideo);
        switchVideo(targetVideo, config.version, orientation);
      }

      currentConfig = config;
      updateDiag();
    } catch (err) {
      console.error('Playlist-Poll fehlgeschlagen:', err);
    }
  }

  // Seamless video transition
  function switchVideo(newSrc, version, orientation) {
    if (!currentVideoSrc) {
      // First start
      currentVideoSrc = newSrc;
      activeVideo.src = newSrc;
      activeVideo.play().then(() => {
        showStatus(`⚡ HI-HANDY Signage • ${orientation.toUpperCase()} (${window.innerWidth}x${window.innerHeight})`);
      }).catch(err => {
        console.warn('Autoplay blockiert oder verzögert:', err);
        showStatus(`⚡ Klicke einmal auf den Bildschirm zum Starten`);
      });
      return;
    }

    // Preload into standby video
    standbyVideo.src = newSrc;
    standbyVideo.load();

    const onReady = () => {
      standbyVideo.removeEventListener('canplaythrough', onReady);
      standbyVideo.play().then(() => {
        // Swap classes
        standbyVideo.classList.remove('standby');
        standbyVideo.classList.add('active');

        activeVideo.classList.remove('active');
        activeVideo.classList.add('standby');
        activeVideo.pause();

        // Swap variables
        const temp = activeVideo;
        activeVideo = standbyVideo;
        standbyVideo = temp;

        currentVideoSrc = newSrc;
        showStatus(`⚡ Video aktualisiert (v${version})`);
      }).catch(err => {
        console.error('Konnte neues Video nicht abspielen:', err);
      });
    };

    standbyVideo.addEventListener('canplaythrough', onReady);
  }

  // Watchdog: ensures video never stays paused unintentionally
  setInterval(() => {
    if (activeVideo && activeVideo.paused && currentVideoSrc) {
      activeVideo.play().catch(() => {});
    }
  }, 5000);

  // Toggle diagnostics on keypress or double click
  window.addEventListener('keydown', (e) => {
    if (e.key === 'd' || e.key === 'D') {
      diagPanel.classList.toggle('visible');
      updateDiag();
    }
  });

  window.addEventListener('dblclick', () => {
    diagPanel.classList.toggle('visible');
    updateDiag();
  });

  // User click fallback if browser requires user gesture
  window.addEventListener('click', () => {
    if (activeVideo && activeVideo.paused) {
      activeVideo.play();
    }
  });

  // Initial startup
  window.addEventListener('DOMContentLoaded', () => {
    checkPlaylist();
    // Poll every 60 seconds
    pollIntervalId = setInterval(checkPlaylist, 60000);
  });
})();
