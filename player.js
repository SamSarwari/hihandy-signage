// HI-HANDY Signage Player - Tizen 4.0 Kompatibel & Clean Fullscreen
(function () {
  'use strict';

  var video = document.getElementById('player');
  var videoSource = document.getElementById('video-source');
  var toastEl = document.getElementById('toast');
  var toastTimeout = null;
  var currentVideoSrc = '';

  var CONTENT_MODES = [
    {
      id: 'clips',
      name: 'Originale Videos (SDR)',
      videos: {
        '90': 'videos/HIHANDY_USER_LOOP_ROTATED_90.mp4?v=sdr_clean',
        '270': 'videos/HIHANDY_USER_LOOP_ROTATED_270.mp4?v=sdr_clean',
        '0': 'videos/HIHANDY_USER_LOOP_PORTRAIT.mp4?v=sdr_clean'
      }
    },
    {
      id: 'anim',
      name: 'HI-HANDY Animationen',
      videos: {
        '90': 'videos/HIHANDY_ANIMATION_LOOP_ROTATED_90.mp4?v=sdr_clean',
        '270': 'videos/HIHANDY_ANIMATION_LOOP_ROTATED_270.mp4?v=sdr_clean',
        '0': 'videos/HIHANDY_ANIMATION_LOOP_PORTRAIT.mp4?v=sdr_clean'
      }
    },
    {
      id: 'all',
      name: 'Kombi-Loop (Clips + Grafiken)',
      videos: {
        '90': 'videos/HIHANDY_ALL_COMBINED_ROTATED_90.mp4?v=sdr_clean',
        '270': 'videos/HIHANDY_ALL_COMBINED_ROTATED_270.mp4?v=sdr_clean',
        '0': 'videos/HIHANDY_USER_LOOP_PORTRAIT.mp4?v=sdr_clean'
      }
    }
  ];

  var currentContentIndex = 0; // Standard: 0 = Originale Videos (SDR)
  var currentRotKey = '90';    // Standard: 90° Drehung für Vertikal-Display

  function showToast(text) {
    if (!toastEl) return;
    toastEl.textContent = text;
    toastEl.className = 'show';
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(function () {
      toastEl.className = '';
    }, 2500);
  }

  function getUrlParam(name) {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split('=');
      if (pair[0] === name) return decodeURIComponent(pair[1]);
    }
    return null;
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
      ensurePlay();
    }
  }

  function applyCurrentMode(showFeedback) {
    var mode = CONTENT_MODES[currentContentIndex];
    var src = mode.videos[currentRotKey] || mode.videos['90'];
    setVideoSource(src);
    if (showFeedback) {
      showToast(mode.name + ' (' + currentRotKey + '°)');
    }
  }

  function cycleContent() {
    currentContentIndex = (currentContentIndex + 1) % CONTENT_MODES.length;
    applyCurrentMode(true);
  }

  function cycleRotation() {
    if (currentRotKey === '90') {
      currentRotKey = '270';
    } else if (currentRotKey === '270') {
      currentRotKey = '0';
    } else {
      currentRotKey = '90';
    }
    applyCurrentMode(true);
  }

  function setContentById(id) {
    for (var i = 0; i < CONTENT_MODES.length; i++) {
      if (CONTENT_MODES[i].id === id) {
        currentContentIndex = i;
        applyCurrentMode(true);
        return;
      }
    }
  }

  function ensurePlay() {
    if (video) {
      video.muted = true;
      var p = video.play();
      if (p && p.catch) {
        p.catch(function () {});
      }
    }
  }

  // Endlosschleifen-Garantie: Event-Listener falls natives Loop-Attribut stoppt
  if (video) {
    video.addEventListener('ended', function () {
      video.currentTime = 0;
      ensurePlay();
    });

    video.addEventListener('error', function () {
      setTimeout(function () {
        if (video) {
          video.load();
          ensurePlay();
        }
      }, 2000);
    });
  }

  // Watchdog alle 3 Sekunden
  setInterval(function () {
    if (video && video.paused) {
      ensurePlay();
    }
  }, 3000);

  // Steuerung über Fernbedienung (Taste 1, 2, 3 oder Pfeile)
  window.addEventListener('keydown', function (e) {
    var key = e.key;
    var code = e.keyCode;

    if (key === '1' || code === 49) {
      currentContentIndex = 0;
      applyCurrentMode(true);
    } else if (key === '2' || code === 50) {
      currentContentIndex = 1;
      applyCurrentMode(true);
    } else if (key === '3' || code === 51) {
      currentContentIndex = 2;
      applyCurrentMode(true);
    } else if (key === 'ArrowRight' || key === 'ArrowLeft' || key === ' ' || code === 39 || code === 37 || code === 32) {
      cycleContent();
    } else if (key === 'ArrowUp' || key === 'ArrowDown' || key === '9' || key === '0' || code === 38 || code === 40 || code === 57 || code === 48) {
      cycleRotation();
    } else {
      ensurePlay();
    }
  });

  window.addEventListener('dblclick', function () {
    cycleContent();
  });

  window.addEventListener('click', function () {
    ensurePlay();
  });

  // URL-Parameter auswerten
  var rotParam = getUrlParam('rot') || getUrlParam('rotation') || getUrlParam('mode');
  if (rotParam === '270' || rotParam === 'ccw') {
    currentRotKey = '270';
  } else if (rotParam === '0' || rotParam === 'portrait') {
    currentRotKey = '0';
  } else {
    currentRotKey = '90';
  }

  var contentParam = getUrlParam('content') || getUrlParam('video');
  if (contentParam === 'anim' || contentParam === 'grafik' || contentParam === 'animation') {
    currentContentIndex = 1;
  } else if (contentParam === 'all' || contentParam === 'kombi') {
    currentContentIndex = 2;
  } else {
    currentContentIndex = 0;
  }

  // Initial starten
  applyCurrentMode(false);
  ensurePlay();
})();
