var jsxHTML = require('jsx-to-html');
var jsxIDOM = require('jsx-to-idom');
var jsxDOM = require('jsx-to-dom');
var runtime = require('jsx-runtime');
var streams = require('jsx-streams');
var idom = require('incremental-dom');

var REDNERER = 'dom';
var renderers = {
  dom: jsxDOM,
  idom: jsxIDOM,
  html: jsxHTML
};

var jsx = renderers[REDNERER];

function init() {
  var val = 0;
  var count = new runtime.Stream(val);
  var span = {
    tag: 'span',
    props: {
      style: 'color: red'
    },
    children: [count]
  };

  var timer;

  // setTimeout(function() {
    timer = setInterval(function() {
      count.put(++val);
      count.notify();

      // if (val >= 3) {
      if (val >= 10) {
        clearInterval(timer);
      }
    }, 1000);
  // }, 3000);

  var tree = {
    tag: 'div',
    children: [{ tag: 'p', props: null, children: ['count: ', span, ', nice!'] }],
    props: null
  };

  var render = function(renderer, stream, container) {
    if (renderer === 'idom') {
      var a = stream.get();
      idom.patch(container, a);
    } else if (renderer === 'html') {
      container.innerHTML = stream.get();
    } else if (renderer === 'dom') {
      var elem = stream.get();

      if (container.children[0] !== elem) {
        container.appendChild(elem);
      }
    }
  };

  var renderAll = function() {
    ['dom', 'idom', 'html'].forEach(function(key) {
      var stream = renderers[key].render(tree);
      var container = document.getElementById(key);
      var count = 0;

      stream.listen(function() {
        // console.log('update called', key, ++count);
        render(key, stream, container);
      });

      render(key, stream, container);
    });
  };

  window.onload = function() {
    renderAll();
  }
}

init();