/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var jsxHTML = __webpack_require__(1);
	var jsxIDOM = __webpack_require__(11);
	var jsxDOM = __webpack_require__(14);
	var runtime = __webpack_require__(2);
	var streams = __webpack_require__(16);
	var idom = __webpack_require__(12);

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

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var jsx = __webpack_require__(2);
	var escape = __webpack_require__(7);
	var Tag = __webpack_require__(8);
	var Fragment = __webpack_require__(9);
	var hasOwn = Object.prototype.hasOwnProperty;

	var emptyTags = __webpack_require__(10).reduce(function(map, tag) {
	  map[tag] = true;
	  return map;
	}, Object.create(null));

	var renderer = jsx.register('HTML', {
	  renderTo: function(target, result) {
	    target.innerHTML = result + '';
	  },

	  fragment: function() {
	    return new Fragment();
	  },

	  params: {
	    renderType: 'individual',
	    updateType: 'difference',
	  },

	  tags: {
	    '*': {
	      enter: function(tag, props) {
	        if (escape(tag) !== tag) {
	          throw new Error('Incorrect tag name: ' + tag);
	        }

	        return new Tag(tag, props);
	      },
	      leave: function(parent, tag) {
	        return parent;
	      },
	      child: function(child, parent, index) {
	        if (child == null) return parent;

	        if (child instanceof jsx.Stream) {
	          handleStream(child);
	        } else {
	          // child = handle(child);
	          // parent.children.push(child);
	          parent.children.push(handleChild(child));
	        }

	        return child;

	        function handleStream(child) {
	          var lastCount = 0;
	          var update = function() {
	            var update = child.get()
	            var index = update[0];
	            var removeCount = update[1];
	            var items = update[2].map(handleChild);

	            // if (lastCount) {
	              [].splice.apply(parent.children, [index, removeCount].concat(items));
	            // }
	          }

	          child.listen(update);
	          update();
	        }
	      },
	      props: function(props) {
	        return Object.keys(props)
	          .map(function(key) {
	            return mapProps(key, key && props[key]);
	          }).join(' ');
	      },
	      children: function(children, parent, tag) {
	        if (typeof emptyTags[tag.toLowerCase()] !== 'undefined') {
	          throw new Error('Tag <' + tag + ' /> cannot have children');
	        }

	        return children;
	      }
	    }
	  }
	});

	module.exports = renderer;

	function mapProps(key, val) {
	  if (!key || val == null) return '';
	  if (val instanceof Tag) return '';

	  if (key === 'className') key = 'class';
	  else if (key === 'cssFor') key = 'for';
	  else key = key.toLowerCase();

	  if (key === 'style') {
	    val = handleStyle(val);
	  }

	  if (typeof val === 'string') {
	    // do nothing
	  } else {
	    val = JSON.stringify(val);
	  }

	  return escape(key) + '="' + escape(val) + '"';
	}

	function handleStyle(style) {
	  if (typeof style === 'string') return style;

	  var string = '';

	  for (var key in style) {
	    if (!hasOwn.call(style, key)) continue;

	    var val = style[key];

	    key = key.replace(/[A-Z]/g, function(m) {
	      return '-' + m.toLowerCase();
	    });

	    if (key.search(/moz-|webkit-|o-|ms-/) === 0) {
	      key = '-' + key;
	    }

	    string += (string ? ' ' : '') + key + ': ' + val + ';';
	  }

	  return string;
	}

	function handleChild(child) {
	  if (child instanceof Tag) {
	    return child;
	  } else {
	    return escape(child + '');
	  }
	}

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var Renderer = __webpack_require__(3);
	var Interpreter = __webpack_require__(5);
	var overrides = __webpack_require__(6);

	var renderers = {};

	var jsx = {
	  register: function registerRenderer(name, config) {
	    name = name.toLowerCase();

	    var interpreter = new Interpreter(config);
	    var renderer = new Renderer(overrides.get(name), config.params || {});

	    overrides.register(name, interpreter, {
	      weight: 0
	    });

	    renderers[name] = renderer;
	    return renderer;
	  },

	  render: function renderJSXTree(tree, renderer) {
	    renderer = renderer.toLowerCase();
	    renderer = renderer && renderers[renderer];

	    if (!renderer) {
	      throw new Error('Renderer [' + renderer + '] not found');
	    }

	    return renderer.render(tree);
	  },

	  override: function override(config, target, weight) {
	    if (!target) target = '*';

	    var interpreter = new Interpreter(config);

	    // Do not allow custom overrides to have 0 weight
	    if (!weight || !isFinite(weight)) {
	      weight = 1;
	    }

	    overrides.register(target, interpreter, {
	      weight: weight
	    });
	  }
	};

	module.exports = jsx;





/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var isArray = Array.isArray;
	var assign = __webpack_require__(4);

	var MAX_ARRAY_DEPTH = 3;

	function Renderer(handler, params) {
	  var _this = this;

	  this.scope = null;
	  this.renderType = params.renderType;
	  this.updateType = params.updateType;
	  this.handler = handler;
	  this.handler.setRenderer(this);

	  this._render = function _render(element, noFragment) {
	    var oldScope = _this.scope;

	    _this.scope = {};
	    element = handler.before(element);

	    var result = handler.render(function() {
	      if (!Array.isArray(element)) {
	        return _this.handleChild(element);
	      }

	      if (noFragment) {
	        var result = [];

	        _this.walkChildren(element, function(val) {
	          result.push(_this.handleChild(val));
	        });

	        return result;
	      }

	      var fragment = handler.fragment();
	      _this.handleChildren('#fragment', element, fragment);

	      return fragment;
	    })();

	    result = handler.after(result);
	    _this.scope = oldScope;

	    return result;
	  };

	  this.render = function render(element, props, children) {
	    element = _this.getElement(element, props, children);
	    return _this._render(element);
	  };

	  /*this.renderTo = function renderTo(target, element, props, children) {
	    element = _this.getElement(element, props, children);
	    handler.renderTo(element, target);
	  };*/

	  this.renderTo = function renderTo(target, element, props, children) {
	    handler.renderTo(function(element, target) {
	      return _this.render(element, props, children);
	    });
	  };
	};

	Renderer.prototype = {
	  handleChild: function(thing) {
	    if (thing == null) {
	      return null;
	    }

	    if (typeof thing === 'function') {
	      thing = thing();
	    }

	    if (this.isTagDescriptor(thing)) {
	      return this.handleTag(thing);
	    }

	    return thing;
	  },
	  walkChildren: function(children, childHandler, index) {
	    var stack = [];

	    var next = [0, children.length, children];
	    var child;
	    var length;
	    var i;

	    index = index | 0;

	    top: while (true) {
	      if (!next) {
	        throw new Error('123');
	      }

	      i = next[0]
	      length = next[1];
	      children = next[2];

	      for (; i < length; i++) {
	        child = children[i];

	        if (child == null) continue;

	        if (isArray(child) && stack.length < MAX_ARRAY_DEPTH) {
	          stack.push([i + 1, length, children]);
	          next = [0, child.length, child];
	          continue top;
	        }

	        childHandler(this.handleChild(child), index++);
	      }

	      if (!stack || !stack.length) break;

	      next = stack.pop();
	    }
	  },

	  handleTag: function(descriptor) {
	    var tag = descriptor.tag;
	    var props = descriptor.props;
	    var children = descriptor.children;
	    var parent;
	    var tagFunction;

	    props = (isArray(props) ? assign.apply(null, props) : props || null);

	    if (isArray(tag)) {
	      tagFunction = tag[1];
	      tag = tag[0];

	      var child = this.handler.custom(tag, tagFunction, props, children);
	      this.check(child, 'custom');

	      return this.render(child);
	    }

	    // Put children handling here if bottom-to-top handling is better

	    props = props && this.handler.props(tag, props);
	    this.check(props, 'props');

	    parent = this.handler.enter(tag, props);
	    this.check(parent, 'enter');

	    if (isArray(children) && children.length) {
	      children = this.handler.children(tag, children, parent);
	      this.check(children, 'children');

	      this.handleChildren(tag, children, parent);
	    }

	    parent = this.handler.leave(tag, parent);
	    this.check(parent, 'leave')

	    return parent;
	  },

	  handleChildren: function(tag, children, parent, index) {
	    var self = this;

	    this.walkChildren(children, function(child, i) {
	      // probably move this to handleTag() method
	      // and provide parentValue for handleChild() call
	      child = self.handler.child(tag, parent, child, i);
	      self.check(child, 'child');
	    }, index);
	  },

	  isTagDescriptor: function(object) {
	    return object && typeof object === 'object' && 'tag' in object &&
	      'props' in object && 'children' in object;
	  },

	  check: function(result, source) {
	    if (typeof result === 'undefined') {
	      throw new Error('Source [' + source + '] returned undefined');
	    }

	    return result;
	  },
	  getElement: function(element, props, children) {
	    if (!element) throw new Error('JSX element is not presented');
	    if (isArray(element)) return element;

	    if (typeof element === 'string') {
	      element = {
	        tag: element,
	        props: isObject(props) ? props : null,
	        children: isArray(children) ? children : null
	      };
	    } else if (typeof element === 'function') {
	      element = {
	        tag: [element.name || element.displayName || '', element],
	        props: isObject(props) ? props : null,
	        children: isArray(children) ? children : null
	      };
	    } else if (!this.isTagDescriptor(element)) {
	      throw new Error('Top level element should be a tag or function which returns a tag');
	    }

	    return element;
	  },

	  callHandle: function(handle, args) {
	    return this.handler[handle].apply(this.handler, args);
	  }
	};

	function isObject(obj) {
	  return typeof obj === 'object' && obj && !isArray(obj);
	}

	module.exports = Renderer;

/***/ },
/* 4 */
/***/ function(module, exports) {

	'use strict';
	var propIsEnumerable = Object.prototype.propertyIsEnumerable;

	function ToObject(val) {
		if (val == null) {
			throw new TypeError('Object.assign cannot be called with null or undefined');
		}

		return Object(val);
	}

	function ownEnumerableKeys(obj) {
		var keys = Object.getOwnPropertyNames(obj);

		if (Object.getOwnPropertySymbols) {
			keys = keys.concat(Object.getOwnPropertySymbols(obj));
		}

		return keys.filter(function (key) {
			return propIsEnumerable.call(obj, key);
		});
	}

	module.exports = Object.assign || function (target, source) {
		var from;
		var keys;
		var to = ToObject(target);

		for (var s = 1; s < arguments.length; s++) {
			from = arguments[s];
			keys = ownEnumerableKeys(Object(from));

			for (var i = 0; i < keys.length; i++) {
				to[keys[i]] = from[keys[i]];
			}
		}

		return to;
	};


/***/ },
/* 5 */
/***/ function(module, exports) {

	"use strict";

	function Interpreter(config) {
	  var self = this;

	  this.tags = {};
	  this.calls = {
	    before: config.before || this.dummy,
	    after: config.after || this.dummy,
	    fragment: config.fragment || this.dummy,
	    render: config.render || this.renderDummy,
	    renderTo: config.renderTo || this.renderToDummy
	  };

	  var tags = config && config.tags;

	  if (tags) {
	    Object.keys(tags).forEach(function(tag) {
	      var handler = tags[tag];

	      self.addTagHandler(tag, handler);
	    });
	  }
	};

	Interpreter.prototype = {
	  addTagHandler: function(tag, handler) {
	    this.tags[tag] = handler;
	  },

	  getHandler: function(tag) {
	    var handler = this.tags[tag] || this.tags['*'];

	    if (!handler) {
	      throw new Error('JSX [' + tag + '] is not found and [*] is missing');
	    }

	    return handler;
	  },

	  getCall: function(call) {
	    return this.calls[call];
	  },

	  dummy: function(a) { return a },
	  renderDummy: function(fn) { return fn() },
	  renderToDummy: function(_, result) { return result; },

	  // ###########################

	  before: function(renderer, element) {
	    return this.getCall('before').call(renderer, element);
	  },

	  after: function(renderer, element) {
	    return this.getCall('after').call(renderer, element);
	  },

	  fragment: function(renderer, children) {
	    return this.getCall('fragment').call(renderer, children);
	  },

	  renderTo: function(renderer, element, target) {
	    return this.getCall('renderTo').call(renderer, target, element);
	  },

	  render: function(renderer, fn) {
	    return this.getCall('render').call(renderer, fn);
	  },

	  props: function(renderer, tag, props) {
	    var handler = this.getHandler(tag);

	    if (handler.props) {
	      return handler.props.call(renderer, props, tag);
	    }

	    return props;
	  },
	  child: function(renderer, tag, parent, child, index) {
	    var handler = this.getHandler(tag);

	    if (handler.child) {
	      return handler.child.call(renderer, child, parent, index, tag);
	    }

	    return child;
	  },
	  enter: function(renderer, tag, props) {
	    var handler = this.getHandler(tag);

	    if (!handler.enter) {
	      throw new Error('JSX Interpreter handler should provide [enter] method')
	    }

	    return handler.enter.call(renderer, tag, props);
	  },
	  leave: function(renderer, tag, parent) {
	    var handler = this.getHandler(tag);

	    if (handler.leave) {
	      return handler.leave.call(renderer, parent, tag);
	    }

	    return parent;
	  },
	  custom: function(renderer, tag, fn, props, children) {
	    var handler = this.getHandler(tag);

	    if (!handler.custom) {
	      return fn(props, children, tag);
	    }

	    return handler.custom.call(renderer, fn, props, children, tag);
	  },
	  children: function(renderer, tag, children, parent) {
	    var handler = this.getHandler(tag);

	    if (handler.children) {
	      return handler.children.call(renderer, children, parent, tag);
	    }

	    return children;
	  }
	};

	module.exports = Interpreter;

/***/ },
/* 6 */
/***/ function(module, exports) {

	"use strict";

	var interpreters = {};
	var registered = {};

	var WILDCARD = [];

	var overrides = {
	  get: function(name) {
	    return new Override(name);
	  },
	  register: function(name, interpreter, params) {
	    var weight = (params && params.weight || 0);

	    if (!isFinite(weight)) {
	      weight = 0;
	    }

	    var data = {
	      weight: weight,
	      it: interpreter,
	      time: Date.now()
	    };

	    if (name === '*') {
	      WILDCARD.push(data);

	      Object.keys(registered).forEach(function(key) {
	        interpreters[key] = WILDCARD.concat(registered[key]).sort(sortRegister);
	      });

	      return;
	    }

	    var register = registered[name];

	    if (!register) {
	      register = registered[name] = [data];
	    } else {
	      register.push(data);
	    }

	    interpreters[name] = WILDCARD.concat(register).sort(sortRegister);

	    function sortRegister(a, b) {
	      if (a.weight < b.weight) {
	        return -1;
	      } else if (b.weight < a.weight) {
	        return 1;
	      } else {
	        return a.time < b.time ? -1 : 1;
	      }
	    }
	    // console.log(interpreters[name]);
	  }
	};

	function Override(name) {
	  this.name = name;
	  this.renderer = null;
	}

	Override.prototype = {
	  setRenderer: function(renderer) {
	    this.renderer = renderer;
	  },

	  // ################

	  before: function(element) {
	    var register = interpreters[this.name];
	    var len = register.length;

	    for (var i = 0; i < len; i++) {
	      element = register[i].it.before(this.renderer, element);
	    }

	    return element;
	  },

	  after: function(element) {
	    var register = interpreters[this.name];
	    var len = register.length;

	    for (var i = 0; i < len; i++) {
	      element = register[i].it.after(this.renderer, element);
	    }

	    return element;
	  },

	  fragment: function(children) {
	    var register = interpreters[this.name];
	    var len = register.length;

	    for (var i = 0; i < len; i++) {
	      children = register[i].it.fragment(this.renderer, children);
	    }

	    return children;
	  },

	  renderTo: function(element, target) {
	    var register = interpreters[this.name];
	    var len = register.length;

	    for (var i = 0; i < len; i++) {
	      element = register[i].it.renderTo(this.renderer, element, target);
	    }

	    return element;
	  },

	  render: function(fn) {
	    var register = interpreters[this.name];
	    var len = register.length;
	    var tmp;

	    /*return register.reduce(function(fn, item) {
	      return function() {
	        return item.it.render(_this.renderer, fn);
	      };
	    }, fn);*/

	    for (var i = 0; i < len; i++) {
	      tmp = register[i].it.render(this.renderer, fn);

	      (function(tmp) {
	        fn = function() {
	          return tmp;
	        };
	      }(tmp));
	    }

	    return fn;
	  },

	  // ################

	  props: function(tag, props) {
	    var register = interpreters[this.name];
	    var len = register.length;

	    for (var i = 0; i < len; i++) {
	      props = register[i].it.props(this.renderer, tag, props);
	    }

	    return props;
	  },
	  child: function(tag, parent, child, index) {
	    var register = interpreters[this.name];
	    var len = register.length;

	    for (var i = 0; i < len; i++) {
	      child = register[i].it.child(this.renderer, tag, parent, child, index);

	      if (child === null) {
	        return null;
	      }
	    }

	    return child;
	  },
	  enter: function(tag, props) {
	    var register = interpreters[this.name];
	    var len = register.length;

	    for (var i = 0; i < len; i++) {
	      tag = register[i].it.enter(this.renderer, tag, props);
	    }

	    return tag;
	  },
	  leave: function(tag, parent) {
	    var register = interpreters[this.name];
	    var len = register.length;

	    for (var i = 0; i < len; i++) {
	      parent = register[i].it.leave(this.renderer, tag, parent);
	    }

	    return parent;
	  },
	  custom: function(tag, fn, props, children) {
	    var register = interpreters[this.name];
	    var len = register.length;

	    for (var i = 0; i < len; i++) {
	      fn = register[i].it.custom(this.renderer, tag, fn, props, children);
	    }

	    return fn;
	  },
	  children: function(tag, children, parent) {
	    var register = interpreters[this.name];
	    var len = register.length;

	    for (var i = 0; i < len; i++) {
	      children = register[i].it.children(this.renderer, tag, children, parent);
	    }

	    return children;
	  }
	};

	module.exports = overrides;

/***/ },
/* 7 */
/***/ function(module, exports) {

	/*!
	 * escape-html
	 * Copyright(c) 2012-2013 TJ Holowaychuk
	 * Copyright(c) 2015 Andreas Lubbe
	 * Copyright(c) 2015 Tiancheng "Timothy" Gu
	 * MIT Licensed
	 */

	'use strict';

	/**
	 * Module variables.
	 * @private
	 */

	var matchHtmlRegExp = /["'&<>]/;

	/**
	 * Module exports.
	 * @public
	 */

	module.exports = escapeHtml;

	/**
	 * Escape special characters in the given string of html.
	 *
	 * @param  {string} string The string to escape for inserting into HTML
	 * @return {string}
	 * @public
	 */

	function escapeHtml(string) {
	  var str = '' + string;
	  var match = matchHtmlRegExp.exec(str);

	  if (!match) {
	    return str;
	  }

	  var escape;
	  var html = '';
	  var index = 0;
	  var lastIndex = 0;

	  for (index = match.index; index < str.length; index++) {
	    switch (str.charCodeAt(index)) {
	      case 34: // "
	        escape = '&quot;';
	        break;
	      case 38: // &
	        escape = '&amp;';
	        break;
	      case 39: // '
	        escape = '&#39;';
	        break;
	      case 60: // <
	        escape = '&lt;';
	        break;
	      case 62: // >
	        escape = '&gt;';
	        break;
	      default:
	        continue;
	    }

	    if (lastIndex !== index) {
	      html += str.substring(lastIndex, index);
	    }

	    lastIndex = index + 1;
	    html += escape;
	  }

	  return lastIndex !== index
	    ? html + str.substring(lastIndex, index)
	    : html;
	}


/***/ },
/* 8 */
/***/ function(module, exports) {

	function Tag(name, props) {
	  this.name = name;
	  this.props = props;
	  this.children = [];
	}

	Tag.prototype.toString = function() {
	  var props = this.props ? ' ' + this.props : '';

	  return '<' + this.name + props + '>' +
	    this.children.join('') +
	  '</' + this.name + '>';
	};

	module.exports = Tag;

/***/ },
/* 9 */
/***/ function(module, exports) {

	function Fragment(children) {
	  this.children = children || [];
	}

	Fragment.prototype.toString = function() {
	 return this.children.join('');
	};

	module.exports = Fragment;

/***/ },
/* 10 */
/***/ function(module, exports) {

	module.exports = [
	  'area',
	  'base',
	  'br',
	  'col',
	  'command',
	  'embed',
	  'hr',
	  'img',
	  'input',
	  'keygen',
	  'link',
	  'meta',
	  'param',
	  'source',
	  'track',
	  'wbr',
	];

/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var jsx = __webpack_require__(2);
	var idom = typeof _mockdom !== 'undefined' ? _mockdom : __webpack_require__(12);
	var hasOwn = Object.prototype.hasOwnProperty;

	var openStart = idom.elementOpenStart;
	var openEnd = idom.elementOpenEnd;
	var close = idom.elementClose;
	var text = idom.text;
	var attr = idom.attr;

	var element = {};

	var renderer = jsx.register('iDOM', {
	  before: function(tree) {
	    this.scope.calls = [];
	    return tree;
	  },

	  /*after: function(tree) {
	    var calls = this.scope.calls;

	    return function() {
	      calls.forEach(function(fn) { fn() });
	    };
	  },*/

	  render: function(render) {
	    // console.log('render 0');
	    var calls = this.scope.calls;
	    render();

	    return function() {
	      calls.forEach(function(fn) { fn() });
	    };
	  },

	  fragment: function() {
	    return element;
	  },

	  params: {
	    renderType: 'all',
	    updateType: 'fragment',
	  },

	  tags: {
	    '*': {
	      enter: function(tag, props) {
	        this.scope.calls.push(function() {
	          openStart(tag);

	          if (props) {
	            handleProps(props);
	          }

	          openEnd();
	        });

	        return element;
	      },
	      leave: function(parent, tag) {
	        this.scope.calls.push(function() {
	          close(tag);
	        });

	        return parent;
	      },
	      child: function(child, parent) {
	        this.scope.calls.push(function() {
	          if (child instanceof jsx.Stream) {
	            // debugger;
	            var render = child.get();
	            console.log('render:', render, render + '');
	            // fix stream, because right now function is used as getter
	            render(); // call returned function
	            return;
	          }

	          if (child === element) {
	            console.log('child element');
	            // do nothing
	          } else {
	            console.log('child text:', child + '');
	            text(child + '');
	          }
	        });

	        return child;
	      }
	    }
	  }
	});

	module.exports = renderer;

	function handleProps(props) {
	  for (var key in props) {
	    if (!hasOwn.call(props, key)) continue;

	    var val = props[key];

	    if (key === 'className') key = 'class';
	    if (key === 'cssFor') key = 'for';

	    attr(key, val);
	  }
	}

	function handleChild(child) {
	  if (child === element) {
	    // do nothing
	  } else {
	    text(child + '');
	  }
	}

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {
	/**
	 * @license
	 * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *      http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS-IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */

	'use strict';

	/**
	 * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *      http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS-IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */

	/** */
	exports.notifications = {
	  /**
	   * Called after patch has compleated with any Nodes that have been created
	   * and added to the DOM.
	   * @type {?function(Array<!Node>)}
	   */
	  nodesCreated: null,

	  /**
	   * Called after patch has compleated with any Nodes that have been removed
	   * from the DOM.
	   * Note it's an applications responsibility to handle any childNodes.
	   * @type {?function(Array<!Node>)}
	   */
	  nodesDeleted: null
	};

	/**
	 * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *      http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS-IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */

	/**
	 * Similar to the built-in Treewalker class, but simplified and allows direct
	 * access to modify the currentNode property.
	 * @param {!Element|!DocumentFragment} node The root Node of the subtree the
	 *     walker should start traversing.
	 * @constructor
	 */
	function TreeWalker(node) {
	  /**
	   * Keeps track of the current parent node. This is necessary as the traversal
	   * methods may traverse past the last child and we still need a way to get
	   * back to the parent.
	   * @const @private {!Array<!Node>}
	   */
	  this.stack_ = [];

	  /**
	   * @const {!Element|!DocumentFragment}
	   */
	  this.root = node;

	  /**
	   * @type {?Node}
	   */
	  this.currentNode = node;
	}

	/**
	 * @return {!Node} The current parent of the current location in the subtree.
	 */
	TreeWalker.prototype.getCurrentParent = function () {
	  return this.stack_[this.stack_.length - 1];
	};

	/**
	 * Changes the current location the firstChild of the current location.
	 */
	TreeWalker.prototype.firstChild = function () {
	  this.stack_.push(this.currentNode);
	  this.currentNode = this.currentNode.firstChild;
	};

	/**
	 * Changes the current location the nextSibling of the current location.
	 */
	TreeWalker.prototype.nextSibling = function () {
	  this.currentNode = this.currentNode.nextSibling;
	};

	/**
	 * Changes the current location the parentNode of the current location.
	 */
	TreeWalker.prototype.parentNode = function () {
	  this.currentNode = this.stack_.pop();
	};

	/**
	 * Keeps track of the state of a patch.
	 * @param {!Element|!DocumentFragment} node The root Node of the subtree the
	 *     is for.
	 * @param {?Context} prevContext The previous context.
	 * @constructor
	 */
	function Context(node, prevContext) {
	  /**
	   * @const {TreeWalker}
	   */
	  this.walker = new TreeWalker(node);

	  /**
	   * @const {Document}
	   */
	  this.doc = node.ownerDocument;

	  /**
	   * Keeps track of what namespace to create new Elements in.
	   * @private
	   * @const {!Array<(string|undefined)>}
	   */
	  this.nsStack_ = [undefined];

	  /**
	   * @const {?Context}
	   */
	  this.prevContext = prevContext;

	  /**
	   * @type {(Array<!Node>|undefined)}
	   */
	  this.created = exports.notifications.nodesCreated && [];

	  /**
	   * @type {(Array<!Node>|undefined)}
	   */
	  this.deleted = exports.notifications.nodesDeleted && [];
	}

	/**
	 * @return {(string|undefined)} The current namespace to create Elements in.
	 */
	Context.prototype.getCurrentNamespace = function () {
	  return this.nsStack_[this.nsStack_.length - 1];
	};

	/**
	 * @param {string=} namespace The namespace to enter.
	 */
	Context.prototype.enterNamespace = function (namespace) {
	  this.nsStack_.push(namespace);
	};

	/**
	 * Exits the current namespace
	 */
	Context.prototype.exitNamespace = function () {
	  this.nsStack_.pop();
	};

	/**
	 * @param {!Node} node
	 */
	Context.prototype.markCreated = function (node) {
	  if (this.created) {
	    this.created.push(node);
	  }
	};

	/**
	 * @param {!Node} node
	 */
	Context.prototype.markDeleted = function (node) {
	  if (this.deleted) {
	    this.deleted.push(node);
	  }
	};

	/**
	 * Notifies about nodes that were created during the patch opearation.
	 */
	Context.prototype.notifyChanges = function () {
	  if (this.created && this.created.length > 0) {
	    exports.notifications.nodesCreated(this.created);
	  }

	  if (this.deleted && this.deleted.length > 0) {
	    exports.notifications.nodesDeleted(this.deleted);
	  }
	};

	/**
	 * The current context.
	 * @type {?Context}
	 */
	var context;

	/**
	 * Enters a new patch context.
	 * @param {!Element|!DocumentFragment} node
	 */
	var enterContext = function (node) {
	  context = new Context(node, context);
	};

	/**
	 * Restores the previous patch context.
	 */
	var restoreContext = function () {
	  context = context.prevContext;
	};

	/**
	 * Gets the current patch context.
	 * @return {?Context}
	 */
	var getContext = function () {
	  return context;
	};

	/**
	 * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *      http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS-IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */

	/**
	 * A cached reference to the hasOwnProperty function.
	 */
	var hasOwnProperty = Object.prototype.hasOwnProperty;

	/**
	 * A cached reference to the create function.
	 */
	var create = Object.create;

	/**
	 * Used to prevent property collisions between our "map" and its prototype.
	 * @param {!Object<string, *>} map The map to check.
	 * @param {string} property The property to check.
	 * @return {boolean} Whether map has property.
	 */
	var has = function (map, property) {
	  return hasOwnProperty.call(map, property);
	};

	/**
	 * Creates an map object without a prototype.
	 * @return {!Object}
	 */
	var createMap = function () {
	  return create(null);
	};

	/**
	 * Keeps track of information needed to perform diffs for a given DOM node.
	 * @param {!string} nodeName
	 * @param {?string=} key
	 * @constructor
	 */
	function NodeData(nodeName, key) {
	  /**
	   * The attributes and their values.
	   * @const
	   */
	  this.attrs = createMap();

	  /**
	   * An array of attribute name/value pairs, used for quickly diffing the
	   * incomming attributes to see if the DOM node's attributes need to be
	   * updated.
	   * @const {Array<*>}
	   */
	  this.attrsArr = [];

	  /**
	   * The incoming attributes for this Node, before they are updated.
	   * @const {!Object<string, *>}
	   */
	  this.newAttrs = createMap();

	  /**
	   * The key used to identify this node, used to preserve DOM nodes when they
	   * move within their parent.
	   * @const
	   */
	  this.key = key;

	  /**
	   * Keeps track of children within this node by their key.
	   * {?Object<string, !Element>}
	   */
	  this.keyMap = null;

	  /**
	   * Whether or not the keyMap is currently valid.
	   * {boolean}
	   */
	  this.keyMapValid = true;

	  /**
	   * The last child to have been visited within the current pass.
	   * @type {?Node}
	   */
	  this.lastVisitedChild = null;

	  /**
	   * The node name for this node.
	   * @const {string}
	   */
	  this.nodeName = nodeName;

	  /**
	   * @type {?string}
	   */
	  this.text = null;
	}

	/**
	 * Initializes a NodeData object for a Node.
	 *
	 * @param {Node} node The node to initialize data for.
	 * @param {string} nodeName The node name of node.
	 * @param {?string=} key The key that identifies the node.
	 * @return {!NodeData} The newly initialized data object
	 */
	var initData = function (node, nodeName, key) {
	  var data = new NodeData(nodeName, key);
	  node['__incrementalDOMData'] = data;
	  return data;
	};

	/**
	 * Retrieves the NodeData object for a Node, creating it if necessary.
	 *
	 * @param {Node} node The node to retrieve the data for.
	 * @return {!NodeData} The NodeData for this Node.
	 */
	var getData = function (node) {
	  var data = node['__incrementalDOMData'];

	  if (!data) {
	    var nodeName = node.nodeName.toLowerCase();
	    var key = null;

	    if (node instanceof Element) {
	      key = node.getAttribute('key');
	    }

	    data = initData(node, nodeName, key);
	  }

	  return data;
	};

	/**
	 * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *      http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS-IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */

	exports.symbols = {
	  default: '__default',

	  placeholder: '__placeholder'
	};

	/**
	 * Applies an attribute or property to a given Element. If the value is null
	 * or undefined, it is removed from the Element. Otherwise, the value is set
	 * as an attribute.
	 * @param {!Element} el
	 * @param {string} name The attribute's name.
	 * @param {?(boolean|number|string)=} value The attribute's value.
	 */
	exports.applyAttr = function (el, name, value) {
	  if (value == null) {
	    el.removeAttribute(name);
	  } else {
	    el.setAttribute(name, value);
	  }
	};

	/**
	 * Applies a property to a given Element.
	 * @param {!Element} el
	 * @param {string} name The property's name.
	 * @param {*} value The property's value.
	 */
	exports.applyProp = function (el, name, value) {
	  el[name] = value;
	};

	/**
	 * Applies a style to an Element. No vendor prefix expansion is done for
	 * property names/values.
	 * @param {!Element} el
	 * @param {string} name The attribute's name.
	 * @param {string|Object<string,string>} style The style to set. Either a
	 *     string of css or an object containing property-value pairs.
	 */
	var applyStyle = function (el, name, style) {
	  if (typeof style === 'string') {
	    el.style.cssText = style;
	  } else {
	    el.style.cssText = '';
	    var elStyle = el.style;

	    for (var prop in style) {
	      if (has(style, prop)) {
	        elStyle[prop] = style[prop];
	      }
	    }
	  }
	};

	/**
	 * Updates a single attribute on an Element.
	 * @param {!Element} el
	 * @param {string} name The attribute's name.
	 * @param {*} value The attribute's value. If the value is an object or
	 *     function it is set on the Element, otherwise, it is set as an HTML
	 *     attribute.
	 */
	var applyAttributeTyped = function (el, name, value) {
	  var type = typeof value;

	  if (type === 'object' || type === 'function') {
	    exports.applyProp(el, name, value);
	  } else {
	    exports.applyAttr(el, name, /** @type {?(boolean|number|string)} */value);
	  }
	};

	/**
	 * Calls the appropriate attribute mutator for this attribute.
	 * @param {!Element} el
	 * @param {string} name The attribute's name.
	 * @param {*} value The attribute's value.
	 */
	var updateAttribute = function (el, name, value) {
	  var data = getData(el);
	  var attrs = data.attrs;

	  if (attrs[name] === value) {
	    return;
	  }

	  var mutator = exports.attributes[name] || exports.attributes[exports.symbols.default];
	  mutator(el, name, value);

	  attrs[name] = value;
	};

	/**
	 * A publicly mutable object to provide custom mutators for attributes.
	 * @const {!Object<string, function(!Element, string, *)>}
	 */
	exports.attributes = createMap();

	// Special generic mutator that's called for any attribute that does not
	// have a specific mutator.
	exports.attributes[exports.symbols.default] = applyAttributeTyped;

	exports.attributes[exports.symbols.placeholder] = function () {};

	exports.attributes['style'] = applyStyle;

	var SVG_NS = 'http://www.w3.org/2000/svg';

	/**
	 * Enters a tag, checking to see if it is a namespace boundary, and if so,
	 * updates the current namespace.
	 * @param {string} tag The tag to enter.
	 */
	var enterTag = function (tag) {
	  if (tag === 'svg') {
	    getContext().enterNamespace(SVG_NS);
	  } else if (tag === 'foreignObject') {
	    getContext().enterNamespace(undefined);
	  }
	};

	/**
	 * Exits a tag, checking to see if it is a namespace boundary, and if so,
	 * updates the current namespace.
	 * @param {string} tag The tag to enter.
	 */
	var exitTag = function (tag) {
	  if (tag === 'svg' || tag === 'foreignObject') {
	    getContext().exitNamespace();
	  }
	};

	/**
	 * Gets the namespace to create an element (of a given tag) in.
	 * @param {string} tag The tag to get the namespace for.
	 * @return {(string|undefined)} The namespace to create the tag in.
	 */
	var getNamespaceForTag = function (tag) {
	  if (tag === 'svg') {
	    return SVG_NS;
	  }

	  return getContext().getCurrentNamespace();
	};

	/**
	 * Creates an Element.
	 * @param {Document} doc The document with which to create the Element.
	 * @param {string} tag The tag for the Element.
	 * @param {?string=} key A key to identify the Element.
	 * @param {?Array<*>=} statics An array of attribute name/value pairs of
	 *     the static attributes for the Element.
	 * @return {!Element}
	 */
	var createElement = function (doc, tag, key, statics) {
	  var namespace = getNamespaceForTag(tag);
	  var el;

	  if (namespace) {
	    el = doc.createElementNS(namespace, tag);
	  } else {
	    el = doc.createElement(tag);
	  }

	  initData(el, tag, key);

	  if (statics) {
	    for (var i = 0; i < statics.length; i += 2) {
	      updateAttribute(el, /** @type {!string}*/statics[i], statics[i + 1]);
	    }
	  }

	  return el;
	};

	/**
	 * Creates a Node, either a Text or an Element depending on the node name
	 * provided.
	 * @param {Document} doc The document with which to create the Node.
	 * @param {string} nodeName The tag if creating an element or #text to create
	 *     a Text.
	 * @param {?string=} key A key to identify the Element.
	 * @param {?Array<*>=} statics The static data to initialize the Node
	 *     with. For an Element, an array of attribute name/value pairs of
	 *     the static attributes for the Element.
	 * @return {!Node}
	 */
	var createNode = function (doc, nodeName, key, statics) {
	  if (nodeName === '#text') {
	    return doc.createTextNode('');
	  }

	  return createElement(doc, nodeName, key, statics);
	};

	/**
	 * Creates a mapping that can be used to look up children using a key.
	 * @param {!Node} el
	 * @return {!Object<string, !Element>} A mapping of keys to the children of the
	 *     Element.
	 */
	var createKeyMap = function (el) {
	  var map = createMap();
	  var children = el.children;
	  var count = children.length;

	  for (var i = 0; i < count; i += 1) {
	    var child = children[i];
	    var key = getData(child).key;

	    if (key) {
	      map[key] = child;
	    }
	  }

	  return map;
	};

	/**
	 * Retrieves the mapping of key to child node for a given Element, creating it
	 * if necessary.
	 * @param {!Node} el
	 * @return {!Object<string, !Node>} A mapping of keys to child Elements
	 */
	var getKeyMap = function (el) {
	  var data = getData(el);

	  if (!data.keyMap) {
	    data.keyMap = createKeyMap(el);
	  }

	  return data.keyMap;
	};

	/**
	 * Retrieves a child from the parent with the given key.
	 * @param {!Node} parent
	 * @param {?string=} key
	 * @return {?Element} The child corresponding to the key.
	 */
	var getChild = function (parent, key) {
	  return (/** @type {?Element} */key && getKeyMap(parent)[key]
	  );
	};

	/**
	 * Registers an element as being a child. The parent will keep track of the
	 * child using the key. The child can be retrieved using the same key using
	 * getKeyMap. The provided key should be unique within the parent Element.
	 * @param {!Node} parent The parent of child.
	 * @param {string} key A key to identify the child with.
	 * @param {!Node} child The child to register.
	 */
	var registerChild = function (parent, key, child) {
	  getKeyMap(parent)[key] = child;
	};

	if (process.env.NODE_ENV !== 'production') {
	  /**
	  * Makes sure that keyed Element matches the tag name provided.
	  * @param {!Element} node The node that is being matched.
	  * @param {string=} tag The tag name of the Element.
	  * @param {?string=} key The key of the Element.
	  */
	  var assertKeyedTagMatches = function (node, tag, key) {
	    var nodeName = getData(node).nodeName;
	    if (nodeName !== tag) {
	      throw new Error('Was expecting node with key "' + key + '" to be a ' + tag + ', not a ' + nodeName + '.');
	    }
	  };
	}

	/**
	 * Checks whether or not a given node matches the specified nodeName and key.
	 *
	 * @param {!Node} node An HTML node, typically an HTMLElement or Text.
	 * @param {?string} nodeName The nodeName for this node.
	 * @param {?string=} key An optional key that identifies a node.
	 * @return {boolean} True if the node matches, false otherwise.
	 */
	var matches = function (node, nodeName, key) {
	  var data = getData(node);

	  // Key check is done using double equals as we want to treat a null key the
	  // same as undefined. This should be okay as the only values allowed are
	  // strings, null and undefined so the == semantics are not too weird.
	  return key == data.key && nodeName === data.nodeName;
	};

	/**
	 * Aligns the virtual Element definition with the actual DOM, moving the
	 * corresponding DOM node to the correct location or creating it if necessary.
	 * @param {string} nodeName For an Element, this should be a valid tag string.
	 *     For a Text, this should be #text.
	 * @param {?string=} key The key used to identify this element.
	 * @param {?Array<*>=} statics For an Element, this should be an array of
	 *     name-value pairs.
	 * @return {!Node} The matching node.
	 */
	var alignWithDOM = function (nodeName, key, statics) {
	  var context = getContext();
	  var walker = context.walker;
	  var currentNode = walker.currentNode;
	  var parent = walker.getCurrentParent();
	  var matchingNode;

	  // Check to see if we have a node to reuse
	  if (currentNode && matches(currentNode, nodeName, key)) {
	    matchingNode = currentNode;
	  } else {
	    var existingNode = getChild(parent, key);

	    // Check to see if the node has moved within the parent or if a new one
	    // should be created
	    if (existingNode) {
	      if (process.env.NODE_ENV !== 'production') {
	        assertKeyedTagMatches(existingNode, nodeName, key);
	      }

	      matchingNode = existingNode;
	    } else {
	      matchingNode = createNode(context.doc, nodeName, key, statics);

	      if (key) {
	        registerChild(parent, key, matchingNode);
	      }

	      context.markCreated(matchingNode);
	    }

	    // If the node has a key, remove it from the DOM to prevent a large number
	    // of re-orders in the case that it moved far or was completely removed.
	    // Since we hold on to a reference through the keyMap, we can always add it
	    // back.
	    if (currentNode && getData(currentNode).key) {
	      parent.replaceChild(matchingNode, currentNode);
	      getData(parent).keyMapValid = false;
	    } else {
	      parent.insertBefore(matchingNode, currentNode);
	    }

	    walker.currentNode = matchingNode;
	  }

	  return matchingNode;
	};

	/**
	 * Clears out any unvisited Nodes, as the corresponding virtual element
	 * functions were never called for them.
	 * @param {Node} node
	 */
	var clearUnvisitedDOM = function (node) {
	  var context = getContext();
	  var walker = context.walker;
	  var data = getData(node);
	  var keyMap = data.keyMap;
	  var keyMapValid = data.keyMapValid;
	  var lastVisitedChild = data.lastVisitedChild;
	  var child = node.lastChild;
	  var key;

	  data.lastVisitedChild = null;

	  if (child === lastVisitedChild && keyMapValid) {
	    return;
	  }

	  if (data.attrs[exports.symbols.placeholder] && walker.currentNode !== walker.root) {
	    return;
	  }

	  while (child !== lastVisitedChild) {
	    node.removeChild(child);
	    context.markDeleted( /** @type {!Node}*/child);

	    key = getData(child).key;
	    if (key) {
	      delete keyMap[key];
	    }
	    child = node.lastChild;
	  }

	  // Clean the keyMap, removing any unusued keys.
	  for (key in keyMap) {
	    child = keyMap[key];
	    if (!child.parentNode) {
	      context.markDeleted(child);
	      delete keyMap[key];
	    }
	  }

	  data.keyMapValid = true;
	};

	/**
	 * Enters an Element, setting the current namespace for nested elements.
	 * @param {Node} node
	 */
	var enterNode = function (node) {
	  var data = getData(node);
	  enterTag(data.nodeName);
	};

	/**
	 * Exits an Element, unwinding the current namespace to the previous value.
	 * @param {Node} node
	 */
	var exitNode = function (node) {
	  var data = getData(node);
	  exitTag(data.nodeName);
	};

	/**
	 * Marks node's parent as having visited node.
	 * @param {Node} node
	 */
	var markVisited = function (node) {
	  var context = getContext();
	  var walker = context.walker;
	  var parent = walker.getCurrentParent();
	  var data = getData(parent);
	  data.lastVisitedChild = node;
	};

	/**
	 * Changes to the first child of the current node.
	 */
	var firstChild = function () {
	  var context = getContext();
	  var walker = context.walker;
	  enterNode(walker.currentNode);
	  walker.firstChild();
	};

	/**
	 * Changes to the next sibling of the current node.
	 */
	var nextSibling = function () {
	  var context = getContext();
	  var walker = context.walker;
	  markVisited(walker.currentNode);
	  walker.nextSibling();
	};

	/**
	 * Changes to the parent of the current node, removing any unvisited children.
	 */
	var parentNode = function () {
	  var context = getContext();
	  var walker = context.walker;
	  walker.parentNode();
	  exitNode(walker.currentNode);
	};

	if (process.env.NODE_ENV !== 'production') {
	  var assertNoUnclosedTags = function (root) {
	    var openElement = getContext().walker.getCurrentParent();
	    if (!openElement) {
	      return;
	    }

	    var openTags = [];
	    while (openElement && openElement !== root) {
	      openTags.push(openElement.nodeName.toLowerCase());
	      openElement = openElement.parentNode;
	    }

	    throw new Error('One or more tags were not closed:\n' + openTags.join('\n'));
	  };
	}

	/**
	 * Patches the document starting at el with the provided function. This function
	 * may be called during an existing patch operation.
	 * @param {!Element|!DocumentFragment} node The Element or Document
	 *     to patch.
	 * @param {!function(T)} fn A function containing elementOpen/elementClose/etc.
	 *     calls that describe the DOM.
	 * @param {T=} data An argument passed to fn to represent DOM state.
	 * @template T
	 */
	exports.patch = function (node, fn, data) {
	  enterContext(node);

	  firstChild();
	  fn(data);
	  parentNode();
	  clearUnvisitedDOM(node);

	  if (process.env.NODE_ENV !== 'production') {
	    assertNoUnclosedTags(node);
	  }

	  getContext().notifyChanges();
	  restoreContext();
	};

	/**
	 * The offset in the virtual element declaration where the attributes are
	 * specified.
	 * @const
	 */
	var ATTRIBUTES_OFFSET = 3;

	/**
	 * Builds an array of arguments for use with elementOpenStart, attr and
	 * elementOpenEnd.
	 * @const {Array<*>}
	 */
	var argsBuilder = [];

	if (process.env.NODE_ENV !== 'production') {
	  /**
	   * Keeps track whether or not we are in an attributes declaration (after
	   * elementOpenStart, but before elementOpenEnd).
	   * @type {boolean}
	   */
	  var inAttributes = false;

	  /** Makes sure that the caller is not where attributes are expected. */
	  var assertNotInAttributes = function () {
	    if (inAttributes) {
	      throw new Error('Was not expecting a call to attr or elementOpenEnd, ' + 'they must follow a call to elementOpenStart.');
	    }
	  };

	  /** Makes sure that the caller is where attributes are expected. */
	  var assertInAttributes = function () {
	    if (!inAttributes) {
	      throw new Error('Was expecting a call to attr or elementOpenEnd. ' + 'elementOpenStart must be followed by zero or more calls to attr, ' + 'then one call to elementOpenEnd.');
	    }
	  };

	  /**
	   * Makes sure that placeholders have a key specified. Otherwise, conditional
	   * placeholders and conditional elements next to placeholders will cause
	   * placeholder elements to be re-used as non-placeholders and vice versa.
	   * @param {string} key
	   */
	  var assertPlaceholderKeySpecified = function (key) {
	    if (!key) {
	      throw new Error('Placeholder elements must have a key specified.');
	    }
	  };

	  /**
	   * Makes sure that tags are correctly nested.
	   * @param {string} tag
	   */
	  var assertCloseMatchesOpenTag = function (tag) {
	    var context = getContext();
	    var walker = context.walker;
	    var closingNode = walker.getCurrentParent();
	    var data = getData(closingNode);

	    if (tag !== data.nodeName) {
	      throw new Error('Received a call to close ' + tag + ' but ' + data.nodeName + ' was open.');
	    }
	  };

	  /** Updates the state to being in an attribute declaration. */
	  var setInAttributes = function () {
	    inAttributes = true;
	  };

	  /** Updates the state to not being in an attribute declaration. */
	  var setNotInAttributes = function () {
	    inAttributes = false;
	  };
	}

	/**
	 * @param {string} tag The element's tag.
	 * @param {?string=} key The key used to identify this element. This can be an
	 *     empty string, but performance may be better if a unique value is used
	 *     when iterating over an array of items.
	 * @param {?Array<*>=} statics An array of attribute name/value pairs of the
	 *     static attributes for the Element. These will only be set once when the
	 *     Element is created.
	 * @param {...*} var_args Attribute name/value pairs of the dynamic attributes
	 *     for the Element.
	 * @return {!Element} The corresponding Element.
	 */
	exports.elementOpen = function (tag, key, statics, var_args) {
	  if (process.env.NODE_ENV !== 'production') {
	    assertNotInAttributes();
	  }

	  var node = /** @type {!Element}*/alignWithDOM(tag, key, statics);
	  var data = getData(node);

	  /*
	   * Checks to see if one or more attributes have changed for a given Element.
	   * When no attributes have changed, this is much faster than checking each
	   * individual argument. When attributes have changed, the overhead of this is
	   * minimal.
	   */
	  var attrsArr = data.attrsArr;
	  var attrsChanged = false;
	  var i = ATTRIBUTES_OFFSET;
	  var j = 0;

	  for (; i < arguments.length; i += 1, j += 1) {
	    if (attrsArr[j] !== arguments[i]) {
	      attrsChanged = true;
	      break;
	    }
	  }

	  for (; i < arguments.length; i += 1, j += 1) {
	    attrsArr[j] = arguments[i];
	  }

	  if (j < attrsArr.length) {
	    attrsChanged = true;
	    attrsArr.length = j;
	  }

	  /*
	   * Actually perform the attribute update.
	   */
	  if (attrsChanged) {
	    var attr,
	        newAttrs = data.newAttrs;

	    for (attr in newAttrs) {
	      newAttrs[attr] = undefined;
	    }

	    for (i = ATTRIBUTES_OFFSET; i < arguments.length; i += 2) {
	      newAttrs[arguments[i]] = arguments[i + 1];
	    }

	    for (attr in newAttrs) {
	      updateAttribute(node, attr, newAttrs[attr]);
	    }
	  }

	  firstChild();
	  return node;
	};

	/**
	 * Declares a virtual Element at the current location in the document. This
	 * corresponds to an opening tag and a elementClose tag is required. This is
	 * like elementOpen, but the attributes are defined using the attr function
	 * rather than being passed as arguments. Must be folllowed by 0 or more calls
	 * to attr, then a call to elementOpenEnd.
	 * @param {string} tag The element's tag.
	 * @param {?string=} key The key used to identify this element. This can be an
	 *     empty string, but performance may be better if a unique value is used
	 *     when iterating over an array of items.
	 * @param {?Array<*>=} statics An array of attribute name/value pairs of the
	 *     static attributes for the Element. These will only be set once when the
	 *     Element is created.
	 */
	exports.elementOpenStart = function (tag, key, statics) {
	  if (process.env.NODE_ENV !== 'production') {
	    assertNotInAttributes();
	    setInAttributes();
	  }

	  argsBuilder[0] = tag;
	  argsBuilder[1] = key;
	  argsBuilder[2] = statics;
	};

	/***
	 * Defines a virtual attribute at this point of the DOM. This is only valid
	 * when called between elementOpenStart and elementOpenEnd.
	 *
	 * @param {string} name
	 * @param {*} value
	 */
	exports.attr = function (name, value) {
	  if (process.env.NODE_ENV !== 'production') {
	    assertInAttributes();
	  }

	  argsBuilder.push(name, value);
	};

	/**
	 * Closes an open tag started with elementOpenStart.
	 * @return {!Element} The corresponding Element.
	 */
	exports.elementOpenEnd = function () {
	  if (process.env.NODE_ENV !== 'production') {
	    assertInAttributes();
	    setNotInAttributes();
	  }

	  var node = exports.elementOpen.apply(null, argsBuilder);
	  argsBuilder.length = 0;
	  return node;
	};

	/**
	 * Closes an open virtual Element.
	 *
	 * @param {string} tag The element's tag.
	 * @return {!Element} The corresponding Element.
	 */
	exports.elementClose = function (tag) {
	  if (process.env.NODE_ENV !== 'production') {
	    assertNotInAttributes();
	    assertCloseMatchesOpenTag(tag);
	  }

	  parentNode();

	  var node = /** @type {!Element} */getContext().walker.currentNode;

	  clearUnvisitedDOM(node);

	  nextSibling();
	  return node;
	};

	/**
	 * Declares a virtual Element at the current location in the document that has
	 * no children.
	 * @param {string} tag The element's tag.
	 * @param {?string=} key The key used to identify this element. This can be an
	 *     empty string, but performance may be better if a unique value is used
	 *     when iterating over an array of items.
	 * @param {?Array<*>=} statics An array of attribute name/value pairs of the
	 *     static attributes for the Element. These will only be set once when the
	 *     Element is created.
	 * @param {...*} var_args Attribute name/value pairs of the dynamic attributes
	 *     for the Element.
	 * @return {!Element} The corresponding Element.
	 */
	exports.elementVoid = function (tag, key, statics, var_args) {
	  var node = exports.elementOpen.apply(null, arguments);
	  exports.elementClose.apply(null, arguments);
	  return node;
	};

	/**
	 * Declares a virtual Element at the current location in the document that is a
	 * placeholder element. Children of this Element can be manually managed and
	 * will not be cleared by the library.
	 *
	 * A key must be specified to make sure that this node is correctly preserved
	 * across all conditionals.
	 *
	 * @param {string} tag The element's tag.
	 * @param {string} key The key used to identify this element.
	 * @param {?Array<*>=} statics An array of attribute name/value pairs of the
	 *     static attributes for the Element. These will only be set once when the
	 *     Element is created.
	 * @param {...*} var_args Attribute name/value pairs of the dynamic attributes
	 *     for the Element.
	 * @return {!Element} The corresponding Element.
	 */
	exports.elementPlaceholder = function (tag, key, statics, var_args) {
	  if (process.env.NODE_ENV !== 'production') {
	    assertPlaceholderKeySpecified(key);
	  }

	  var node = exports.elementOpen.apply(null, arguments);
	  updateAttribute(node, exports.symbols.placeholder, true);
	  exports.elementClose.apply(null, arguments);
	  return node;
	};

	/**
	 * Declares a virtual Text at this point in the document.
	 *
	 * @param {string|number|boolean} value The value of the Text.
	 * @param {...(function((string|number|boolean)):string)} var_args
	 *     Functions to format the value which are called only when the value has
	 *     changed.
	 * @return {!Text} The corresponding text node.
	 */
	exports.text = function (value, var_args) {
	  if (process.env.NODE_ENV !== 'production') {
	    assertNotInAttributes();
	  }

	  var node = /** @type {!Text}*/alignWithDOM('#text', null);
	  var data = getData(node);

	  if (data.text !== value) {
	    data.text = /** @type {string} */value;

	    var formatted = value;
	    for (var i = 1; i < arguments.length; i += 1) {
	      formatted = arguments[i](formatted);
	    }

	    node.data = formatted;
	  }

	  nextSibling();
	  return node;
	};
	//# sourceMappingURL=incremental-dom-cjs.js.map
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(13)))

/***/ },
/* 13 */
/***/ function(module, exports) {

	// shim for using process in browser

	var process = module.exports = {};
	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;

	function cleanUpNextTick() {
	    draining = false;
	    if (currentQueue.length) {
	        queue = currentQueue.concat(queue);
	    } else {
	        queueIndex = -1;
	    }
	    if (queue.length) {
	        drainQueue();
	    }
	}

	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    var timeout = setTimeout(cleanUpNextTick);
	    draining = true;

	    var len = queue.length;
	    while(len) {
	        currentQueue = queue;
	        queue = [];
	        while (++queueIndex < len) {
	            if (currentQueue) {
	                currentQueue[queueIndex].run();
	            }
	        }
	        queueIndex = -1;
	        len = queue.length;
	    }
	    currentQueue = null;
	    draining = false;
	    clearTimeout(timeout);
	}

	process.nextTick = function (fun) {
	    var args = new Array(arguments.length - 1);
	    if (arguments.length > 1) {
	        for (var i = 1; i < arguments.length; i++) {
	            args[i - 1] = arguments[i];
	        }
	    }
	    queue.push(new Item(fun, args));
	    if (queue.length === 1 && !draining) {
	        setTimeout(drainQueue, 0);
	    }
	};

	// v8 likes predictible objects
	function Item(fun, array) {
	    this.fun = fun;
	    this.array = array;
	}
	Item.prototype.run = function () {
	    this.fun.apply(null, this.array);
	};
	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	process.version = ''; // empty string to avoid regexp issues
	process.versions = {};

	function noop() {}

	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;

	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};

	process.cwd = function () { return '/' };
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};
	process.umask = function() { return 0; };


/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var jsx = __webpack_require__(2);
	var hasOwn = Object.prototype.hasOwnProperty;

	var emptyTags = __webpack_require__(15).reduce(function(map, tag) {
	  map[tag] = true;
	  return map;
	}, Object.create(null));

	var SVG_NS = 'http://www.w3.org/2000/svg';
	var HTML_NS = 'http://www.w3.org/1999/xhtml';

	var renderer = jsx.register('DOM', {
	  renderOne: function(target, element, props, children, index) {
	    var result = this.render(element, props, children);
	    var node = target.childNodes[index];

	    if (node) {
	      target.insertBefore(result, node.nextSibling);
	    } else {
	      target.appendChild(result);
	    }
	  },
	  /*renderTo: function(target, element) {
	    element = this._render(element);

	    if (Array.isArray(element)) {
	      var result = document.createDocumentFragment();

	      element.forEach(function(node) {
	        result.appendChild(node);
	      });

	      element = result;
	    }

	    target.appendChild(element);
	  },*/

	  before: function(element) {
	    this.scope.namespaces = [];
	    return element;
	  },

	  fragment: function() {
	    return document.createDocumentFragment();
	  },

	  params: {
	    renderType: 'individual',
	    updateType: 'difference',
	  },

	  tags: {
	    '*': {
	      enter: function(tag, props) {
	        var namespaces = this.scope.namespaces;

	        if (tag === 'svg') {
	          namespaces.unshift(SVG_NS);
	        } else if (tag === 'foreignObject') {
	          namespaces.unshift(HTML_NS);
	        }

	        var element;

	        if (namespaces.length) {
	          element = document.createElementNS(namespaces[0], tag);
	        } else {
	          element = document.createElement(tag);
	        }

	        applyProps(element, props);

	        return element;
	      },
	      leave: function(parent, tag) {
	        if (
	          tag === 'svg' && this.scope.namespaces[0] === SVG_NS ||
	          tag === 'foreignObject' && this.scope.namespaces[0] === HTML_NS
	        ) {
	          this.scope.namespaces.shift();
	        }

	        return parent;
	      },
	      child: function(child, parent) {
	        if (child instanceof jsx.Stream) {
	          handleStream(child);
	          return child;
	        }

	        parent.appendChild(handleChild(child));
	        return child;

	        function handleStream(child) {
	          var lastCount = 0;

	          var update = function() {
	            var update = child.get()
	            var index = update[0];
	            var removeCount = update[1];
	            var items = update[2];

	            var fragment;

	            if (items.length === 1) {
	              fragment = handleChild(items[0]);
	            } else {
	              fragment = document.createDocumentFragment();

	              items.forEach(function(item) {
	                fragment.appendChild(handleChild(item));
	              });
	            }

	            parent.insertBefore(fragment, parent.childNodes[index + 1]);

	            for (var i = index, len = index + removeCount; i < len; i++) {
	              parent.removeChild(parent.childNodes[i]);
	            }
	          }

	          child.listen(update);
	          update();
	        }
	      },
	      children: function(children, parent, tag) {
	        if (typeof emptyTags[tag.toLowerCase()] !== 'undefined') {
	          throw new Error('Tag <' + tag + ' /> cannot have children');
	        }

	        return children;
	      }
	    }
	  }
	});

	module.exports = renderer;

	function applyStyle(element, style) {
	  if (typeof style === 'string') {
	    element.setAttribute('style', style);
	    return;
	  }

	  var elementStyle = element.style;

	  for (var key in style) {
	    if (!hasOwn.call(style, key)) continue;

	    elementStyle[key] = style[key];
	  }
	}

	function applyProps(element, props) {
	  for (var key in props) {
	    if (!hasOwn.call(props, key)) continue;

	    var val = props[key];

	    switch (key) {
	      case 'style': applyStyle(element, val); break;
	      case 'class': element.className = val; break;
	      case 'for': element.cssFor = val; break;

	      case 'innerHTML':
	      case 'outerHTML':
	      case 'textContent':
	      case 'innerText':
	      case 'text':
	        console.warn('Direct manipulation of tags content is not allowed');
	        break;
	      default: {
	        if (key.indexOf('-') !== -1) {
	          element.setAttribute(key, val);
	        } else {
	          element[key] = val;
	        }
	      }
	    }
	  }
	}

	function handleChild(child) {
	  if (child instanceof Element) {
	    return child;
	  } else {
	    return document.createTextNode(child + '');
	  }
	}

/***/ },
/* 15 */
/***/ function(module, exports) {

	module.exports = [
	  'area',
	  'base',
	  'br',
	  'col',
	  'command',
	  'embed',
	  'hr',
	  'img',
	  'input',
	  'keygen',
	  'link',
	  'meta',
	  'param',
	  'source',
	  'track',
	  'wbr',
	];

/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	var runtime = __webpack_require__(2);
	var Stream = __webpack_require__(17);

	runtime.Stream = Stream;

	runtime.override({
	  before: function(tree) {
	    if (tree.__streams) {
	      console.log('duplicate', tree);
	    }

	    tree.__streams = true;
	    this.scope.streams = [];

	    return tree;
	  },

	  /*renderTo: function(target, stream) {
	    var renderer = this;

	    stream.listen(function() {
	      var a = stream.get();

	      console.log(a);
	      renderer.renderTo(target, a);
	    });

	    return stream.get();
	  },*/
	  tags: {
	    '*': {
	      enter: function(tag, props) {
	        return tag;
	      },
	      child: function(child, parent, index, tag) {
	        if (!(child instanceof Stream)) {
	          return child;
	        }

	        var _this = this;
	        var renderStream;
	        var lastValue;
	        var useDifference = this.updateType === 'difference';
	        var handledStream = new Stream(getHandled());

	        // debugger;

	        child.listen(function() {
	          notifyHandled(getHandled());
	        });

	        child.onClose(function() {
	          handledStream.close();

	          var oldStream = renderStream;

	          if (oldStream) {
	            renderStream = null;
	            oldStream.close();
	          }
	        });

	        if (this.scope.streams) {
	          this.scope.streams.push(child);
	        }

	        function notifyHandled(val) {
	          handledStream.put(val);
	          handledStream.notify();
	        }

	        function getHandled() {
	          var value = child.get();

	          if (value instanceof Stream) {
	            throw new Error('Stream should not return stream');
	          }

	          if (!Array.isArray(value)) {
	            value = [value];
	          }

	          if (useDifference) {
	            return handleDifference(value);
	          }

	          var oldRender = renderStream;
	          var currentStream = _this.render(value);

	          renderStream = currentStream;

	          currentStream.onClose(function() {
	            if (renderStream === currentStream) {
	              // update to null
	            }
	          });

	          currentStream.listen(function() {
	            // debugger;
	            notifyHandled(currentStream.get());
	          });
	          // doRenderStream();

	          if (oldRender) {
	            oldRender.close();
	          }

	          return currentStream.get();
	        }

	        function handleDifference(value) {
	          var difference;
	          var diffIndex;

	          // debugger;

	          if (lastValue) {
	            for (var i = 0, len = value.length; i < len; i++) {
	              if (i === lastValue.length || value[i] !== lastValue[i]) {
	                // debugger;
	                diffIndex = i;
	                difference = value.slice(i);
	                break;
	              }
	            }

	            if (!difference) {
	              difference = [];
	              diffIndex = value.length;
	            }
	          } else {
	            diffIndex = 0;
	            difference = value;
	          }

	          var removeCount = lastValue ? lastValue.length - diffIndex : 0;

	          console.log(diffIndex, removeCount, difference);

	          difference = difference.map(function(item) {
	            item = _this._render(item);

	            // listen to streams here

	            if (item instanceof Stream) {
	              return item.get();
	            }

	            return item;
	          });

	          // close lastValue streams
	          lastValue = value;

	          return [index + diffIndex, removeCount, difference];
	        }

	        return handledStream;
	      }
	    }
	  }
	}, '*', -1);

	runtime.override({
	  tags: {
	    '*': {
	      enter: function(tag) {
	        return tag;
	      }
	    }
	  },

	  render: function(result) {
	    // console.log('render +1');
	    var stream = new Stream.getter(function() {
	      // debugger;
	      return result();
	    });

	    // debugger;
	    this.scope.streams.forEach(function(input) {
	      input.listen(stream.notify);
	    });

	    return stream;
	  }
	}, '*', 1);

/***/ },
/* 17 */
/***/ function(module, exports) {

	module.exports = Stream;

	function Stream(value, type) {
	  var _this = this;
	  var valueType = '';

	  _this.value = null
	  _this.listeners = [];
	  _this.closeListeners = [];

	  _this.get = function() {
	    if (valueType === 'getter') {
	      return _this.value();
	    }

	    return _this.value;
	  };

	  _this.put = function(value, type) {
	    if (type === 'getter' && typeof value === 'function') {
	      valueType = type;
	    } else if (valueType === 'getter') {
	      valueType = '';
	    }

	    _this.value = value;
	  };

	  _this.listen = function(listener) {
	    _this.listeners.push(listener);
	  };

	  _this.notify = function() {
	    _this.listeners.forEach(call);
	  };

	  _this.close = function() {
	    ['get', 'put', 'listener', 'notify', 'close', 'onClose']
	      .forEach(function(fn) {
	        _this[fn] = function() {
	          throw new Error('Stream is closed');
	        };
	      });

	    var closeListeners = this.closeListeners;

	    this.listeners = null;
	    this.closeListeners = null;

	    closeListeners.forEach(call);
	  };

	  _this.onClose = function(fn) {
	    this.closeListeners.push(fn);
	  };

	  _this.put(value, type);
	}

	Stream.getter = function(fn) {
	  var stream = new Stream();
	  stream.put(fn, 'getter');

	  return stream;
	};

	function call(fn) {
	  fn();
	}

/***/ }
/******/ ]);