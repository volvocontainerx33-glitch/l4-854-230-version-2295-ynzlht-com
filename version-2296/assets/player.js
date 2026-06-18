(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
      return;
    }
    callback();
  }

  function attachStream(video, stream, root) {
    if (root.getAttribute("data-ready") === "1") {
      return Promise.resolve();
    }

    root.setAttribute("data-ready", "1");

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = stream;
      return Promise.resolve();
    }

    if (window.Hls && window.Hls.isSupported()) {
      var hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hls.loadSource(stream);
      hls.attachMedia(video);
      root.hlsInstance = hls;
      return new Promise(function (resolve) {
        hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
          resolve();
        });
        window.setTimeout(resolve, 900);
      });
    }

    video.src = stream;
    return Promise.resolve();
  }

  function initPlayer(root) {
    var stream = root.getAttribute("data-stream");
    var video = root.querySelector("video");
    var overlay = root.querySelector(".player-overlay");

    if (!stream || !video) {
      return;
    }

    function start() {
      if (overlay) {
        overlay.classList.add("is-hidden");
      }
      attachStream(video, stream, root).then(function () {
        var request = video.play();
        if (request && request.catch) {
          request.catch(function () {
            if (overlay) {
              overlay.classList.remove("is-hidden");
            }
          });
        }
      });
    }

    if (overlay) {
      overlay.addEventListener("click", start);
    }

    video.addEventListener("click", function () {
      if (video.paused) {
        start();
      }
    });

    video.addEventListener("play", function () {
      if (overlay) {
        overlay.classList.add("is-hidden");
      }
    });
  }

  ready(function () {
    Array.prototype.slice.call(document.querySelectorAll("[data-player]")).forEach(initPlayer);
  });
})();
