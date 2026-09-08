// HI-HANDY Signage Player - Tizen 4.0 / Legacy WebKit Compatible
(function () {
  'use strict';

  var video = document.getElementById('player');
  var videoSource = document.getElementById('video-source');
  var statusBadge = document.getElementById('status-badge');
  var bannerBar = document.getElementById('banner-bar');
  var debugLog = document.getElementById('debug-log');

  var currentVideoSrc = '';
  var currentConfig = null;

  // Global error handler to help diagnose any TV browser issues
  window.onerror = function (msg, url, line) {
    if (debugLog) {
      debugLog.style.display = 'block';
      debugLog.innerHTML = 'JS Error (Z. ' + line + '): ' + msg;
    }
    return false;
  };

  function showStatus(text, duration) {
    if (!duration) duration = 4000;
    if (statusBadge) {
      statusBadge.textContent = text;
      statusBadge.classList.remove('fade-out');
      setTimeout(function () {
        statusBadge.classList.add('fade-out');
      }, duration);
    }
  }

  function getOrientation() {
    var query = window.location.search;
    if (query.indexOf('mode=landscape') !== -1 || query.indexOf('orientation=landscape') !== -1) {
      return 'landscape';
    }
    if (query.indexOf('mode=portrait') !== -1 || query.indexOf('orientation=portrait') !== -1) {
      return 'portrait';
    }
    return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
  }

  function setVideoSource(newSrc) {
    if (currentVideoSrc === newSrc) return;
    currentVideoSrc = newSrc;
    if (videoSource) {
      videoSource.src = newSrc;
    }
    if (video) {
      video.src = newSrc;
      video.load();
      var playPromise = video.play();
      if (playPromise && playPromise.catch) {
        playPromise.catch(function (err) {
          console.warn('Autoplay deferred:', err);
          showStatus('⚡ Klicke mit der Fernbedienung zum Starten');
        });
      }
    }
  }

  function checkPlaylist() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'playlist.json?_t=' + new Date().getTime(), true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200 || xhr.status === 0) {
          try {
            var config = JSON.parse(xhr.responseText);
            var orientation = getOrientation();
            var targetVideo = (config && config[orientation]) ? config[orientation].video : null;

            if (config && config.emergency_banner && config.emergency_banner.active) {
              bannerBar.textContent = config.emergency_banner.text || '';
              bannerBar.style.display = 'block';
            } else if (bannerBar) {
              bannerBar.style.display = 'none';
            }

            if (targetVideo) {
              setVideoSource(targetVideo);
            }

            showStatus('⚡ HI-HANDY Signage • ' + orientation.toUpperCase() + ' (' + window.innerWidth + 'x' + window.innerHeight + ')');
          } catch (e) {
            console.error('JSON Parse error', e);
          }
        }
      }
    };
    xhr.send();
  }

  // Ensure playback starts immediately
  function ensurePlay() {
    if (video) {
      video.muted = true;
      var p = video.play();
      if (p && p.catch) {
        p.catch(function () {});
      }
    }
  }

  // Watchdog: Restart if ever paused
  setInterval(function () {
    if (video && video.paused) {
      ensurePlay();
    }
  }, 4000);

  // User click / remote button press handler
  window.addEventListener('click', ensurePlay);
  window.addEventListener('keydown', ensurePlay);

  // Initialize
  var initialOrientation = getOrientation();
  var defaultSrc = initialOrientation === 'landscape' 
    ? 'videos/HIHANDY_MASTER_LOOP_LANDSCAPE.mp4' 
    : 'videos/HIHANDY_MASTER_LOOP_PORTRAIT.mp4';

  setVideoSource(defaultSrc);
  ensurePlay();
  checkPlaylist();

  // Poll for changes every 60s
  setInterval(checkPlaylist, 60000);
})();
