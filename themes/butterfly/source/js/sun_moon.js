/**
 * Initialize DarkMode class and icon on page load.
 * Must run after body and modeicon are available.
 */
(function initDarkModeState() {
  var check = function() {
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    var modeicon = document.getElementById('modeicon');
    if (!modeicon) return;
    if (isDark) {
      document.body.classList.add('DarkMode');
      modeicon.setAttribute('xlink:href', '#icon-moon');
    } else {
      document.body.classList.remove('DarkMode');
      modeicon.setAttribute('xlink:href', '#icon-sun');
    }
  };
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    check();
  } else {
    document.addEventListener('DOMContentLoaded', check);
  }

  // PJAX 换页会把 #rightside-config-hide 一起换掉，而 #modeicon 就在里面，
  // 新内容里写死的是太阳图标。换页后必须按当前 data-theme 再同步一次，
  // 否则会出现「明明是夜间模式，图标却还是太阳」的错位。
  document.addEventListener('pjax:complete', check);
})();

function switchNightMode() {
  // Insert full-screen animation overlay
  document.querySelector('body').insertAdjacentHTML(
    'beforeend',
    '<div class="Cuteen_DarkSky"><div class="Cuteen_DarkPlanet"></div></div>'
  );

  var nowMode = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  var goingDark = nowMode === 'light';
  var modeicon = document.getElementById('modeicon');

  // Next event loop: let overlay render, then trigger CSS animation + mode switch
  setTimeout(function() {
    if (goingDark) {
      // Light → Dark
      document.body.classList.add('DarkMode');
      modeicon.setAttribute('xlink:href', '#icon-moon');
      btf && btf.activateDarkMode();
      btf && btf.saveToLocal && btf.saveToLocal.set('theme', 'dark', 2);
      GLOBAL_CONFIG.Snackbar !== undefined && btf && btf.snackbarShow(GLOBAL_CONFIG.Snackbar.day_to_night);
    } else {
      // Dark → Light
      document.body.classList.remove('DarkMode');
      modeicon.setAttribute('xlink:href', '#icon-sun');
      btf && btf.activateLightMode();
      btf && btf.saveToLocal && btf.saveToLocal.set('theme', 'light', 2);
    }

    // Notify theme-change callbacks (utterances, FB, Disqus)
    typeof utterancesTheme === 'function' && utterancesTheme();
    typeof FB === 'object' && window.loadFBComment && window.loadFBComment();
    window.DISQUS && document.getElementById('disqus_thread') && document.getElementById('disqus_thread').children.length &&
      setTimeout(function() { window.disqusReset && window.disqusReset(); }, 200);

    // After 2 s (CSS planet rotation completes), fade out the overlay
    setTimeout(function() {
      var sky = document.getElementsByClassName('Cuteen_DarkSky')[0];
      if (sky) {
        sky.style.transition = 'opacity 3s';
        sky.style.opacity = '0';
        setTimeout(function() { sky && sky.remove(); }, 1000);
      }
    }, 2000);
  });
}
