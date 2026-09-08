// HI-HANDY Signage Player - Clean Fullscreen (No Badges)
(function () {
  'use strict';

  var video = document.getElementById('player');
  var videoSource = document.getElementById('video-source');
  var currentVideoSrc = '';

  var ROT_MODES = [
    { key: '90', src: 'videos/HIHANDY_USER_LOOP_ROTATED_90.mp4' },
    { key: '270', src: 'videos/HIHANDY_USER_LOOP_ROTATED_270.mp4' },
    { key: '0', src: 'videos/HIHANDY_USER_LOOP_PORTRAIT.mp4' }
  ];
  var currentModeIndex = 0;

  function getUrlParam(name) {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split('=');
      if (pair[0] === name) return pair[1];
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
      var playPromise = video.play();
      if (playPromise && playPromise.catch) {
        playPromise.catch(function () {});
      }
    }
  }

  function cycleRotation() {
    currentModeIndex = (currentModeIndex + 1) % ROT_MODES.length;
    var mode = ROT_MODES[currentModeIndex];
    setVideoSource(mode.src);
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

  // Watchdog
  setInterval(function () {
    if (video && video.paused) {
      ensurePlay();
    }
  }, 4000);

  // Switch rotation mode with remote control buttons
  window.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === ' ' || e.keyCode === 39 || e.keyCode === 37) {
      cycleRotation();
    } else {
      ensurePlay();
    }
  });

  window.addEventListener('dblclick', function () {
    cycleRotation();
  });

  window.addEventListener('click', function () {
    ensurePlay();
  });

  // Determine initial rotation from URL param if given
  var rotParam = getUrlParam('rot') || getUrlParam('rotation') || getUrlParam('mode');
  if (rotParam === '270' || rotParam === 'ccw') {
    currentModeIndex = 1;
  } else if (rotParam === '0' || rotParam === 'portrait') {
    currentModeIndex = 2;
  } else {
    currentModeIndex = 0;
  }

  var initial = ROT_MODES[currentModeIndex];
  setVideoSource(initial.src);
  ensurePlay();
})();
