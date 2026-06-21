// VaCa Marquetry V2 — shared interactions

document.addEventListener('DOMContentLoaded', function () {
  // Mobile nav toggle
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var isOpen = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  // FAQ accordion
  document.querySelectorAll('.faq-item').forEach(function (item) {
    var question = item.querySelector('.faq-question');
    if (!question) return;
    question.addEventListener('click', function () {
      var isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(function (open) {
        if (open !== item) open.classList.remove('open');
      });
      item.classList.toggle('open', !isOpen);
    });
  });

  // Upload zone label feedback (Custom Portraits inquiry form)
  var uploadInput = document.querySelector('#portrait-photos');
  var uploadZone = document.querySelector('.upload-zone');
  if (uploadInput && uploadZone) {
    var defaultText = uploadZone.querySelector('.upload-zone-text').textContent;
    uploadInput.addEventListener('change', function () {
      var count = uploadInput.files.length;
      uploadZone.querySelector('.upload-zone-text').textContent =
        count > 0 ? count + ' file' + (count > 1 ? 's' : '') + ' selected' : defaultText;
    });
  }
});
