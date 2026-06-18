import { H as Hls } from './hls-dru42stk.js';

function initializePlayer(container) {
  var video = container.querySelector('video[data-src]');
  var overlay = container.querySelector('[data-player-toggle]');
  var status = container.querySelector('[data-player-status]');
  var source = video ? video.getAttribute('data-src') : '';
  var hasInitialized = false;
  var hlsInstance = null;

  if (!video || !source) {
    return;
  }

  function setStatus(message) {
    if (status) {
      status.textContent = message;
    }
  }

  function bindSource() {
    if (hasInitialized) {
      return;
    }

    hasInitialized = true;
    setStatus('正在初始化播放源...');

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = source;
      setStatus('播放源已就绪');
      return;
    }

    if (Hls && Hls.isSupported()) {
      hlsInstance = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });

      hlsInstance.loadSource(source);
      hlsInstance.attachMedia(video);

      hlsInstance.on(Hls.Events.MANIFEST_PARSED, function () {
        setStatus('播放源已就绪');
      });

      hlsInstance.on(Hls.Events.ERROR, function (event, data) {
        if (!data || !data.fatal) {
          return;
        }

        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          setStatus('网络异常，正在尝试恢复...');
          hlsInstance.startLoad();
          return;
        }

        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          setStatus('媒体异常，正在尝试恢复...');
          hlsInstance.recoverMediaError();
          return;
        }

        setStatus('播放源暂时无法加载');
        hlsInstance.destroy();
      });
    } else {
      video.src = source;
      setStatus('已尝试使用浏览器原生播放');
    }
  }

  function playVideo() {
    bindSource();
    var result = video.play();

    if (result && typeof result.catch === 'function') {
      result.catch(function () {
        setStatus('请再次点击播放按钮开始播放');
      });
    }
  }

  if (overlay) {
    overlay.addEventListener('click', playVideo);
  }

  video.addEventListener('play', function () {
    container.classList.add('is-playing');
    setStatus('正在播放');
  });

  video.addEventListener('pause', function () {
    container.classList.remove('is-playing');
    setStatus('已暂停');
  });

  video.addEventListener('ended', function () {
    container.classList.remove('is-playing');
    setStatus('播放结束');
  });

  video.addEventListener('click', function () {
    if (video.paused) {
      playVideo();
    } else {
      video.pause();
    }
  });

  window.addEventListener('beforeunload', function () {
    if (hlsInstance) {
      hlsInstance.destroy();
    }
  });
}

document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('[data-hls-player]').forEach(initializePlayer);
});
