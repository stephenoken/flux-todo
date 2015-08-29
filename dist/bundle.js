(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],2:[function(require,module,exports){
// To include this file in your project:
// let mui = require('mui');
// let Colors = mui.Styles.Colors;

'use strict';

module.exports = {

  red50: '#ffebee',
  red100: '#ffcdd2',
  red200: '#ef9a9a',
  red300: '#e57373',
  red400: '#ef5350',
  red500: '#f44336',
  red600: '#e53935',
  red700: '#d32f2f',
  red800: '#c62828',
  red900: '#b71c1c',
  redA100: '#ff8a80',
  redA200: '#ff5252',
  redA400: '#ff1744',
  redA700: '#d50000',

  pink50: '#fce4ec',
  pink100: '#f8bbd0',
  pink200: '#f48fb1',
  pink300: '#f06292',
  pink400: '#ec407a',
  pink500: '#e91e63',
  pink600: '#d81b60',
  pink700: '#c2185b',
  pink800: '#ad1457',
  pink900: '#880e4f',
  pinkA100: '#ff80ab',
  pinkA200: '#ff4081',
  pinkA400: '#f50057',
  pinkA700: '#c51162',

  purple50: '#f3e5f5',
  purple100: '#e1bee7',
  purple200: '#ce93d8',
  purple300: '#ba68c8',
  purple400: '#ab47bc',
  purple500: '#9c27b0',
  purple600: '#8e24aa',
  purple700: '#7b1fa2',
  purple800: '#6a1b9a',
  purple900: '#4a148c',
  purpleA100: '#ea80fc',
  purpleA200: '#e040fb',
  purpleA400: '#d500f9',
  purpleA700: '#aa00ff',

  deepPurple50: '#ede7f6',
  deepPurple100: '#d1c4e9',
  deepPurple200: '#b39ddb',
  deepPurple300: '#9575cd',
  deepPurple400: '#7e57c2',
  deepPurple500: '#673ab7',
  deepPurple600: '#5e35b1',
  deepPurple700: '#512da8',
  deepPurple800: '#4527a0',
  deepPurple900: '#311b92',
  deepPurpleA100: '#b388ff',
  deepPurpleA200: '#7c4dff',
  deepPurpleA400: '#651fff',
  deepPurpleA700: '#6200ea',

  indigo50: '#e8eaf6',
  indigo100: '#c5cae9',
  indigo200: '#9fa8da',
  indigo300: '#7986cb',
  indigo400: '#5c6bc0',
  indigo500: '#3f51b5',
  indigo600: '#3949ab',
  indigo700: '#303f9f',
  indigo800: '#283593',
  indigo900: '#1a237e',
  indigoA100: '#8c9eff',
  indigoA200: '#536dfe',
  indigoA400: '#3d5afe',
  indigoA700: '#304ffe',

  blue50: '#e3f2fd',
  blue100: '#bbdefb',
  blue200: '#90caf9',
  blue300: '#64b5f6',
  blue400: '#42a5f5',
  blue500: '#2196f3',
  blue600: '#1e88e5',
  blue700: '#1976d2',
  blue800: '#1565c0',
  blue900: '#0d47a1',
  blueA100: '#82b1ff',
  blueA200: '#448aff',
  blueA400: '#2979ff',
  blueA700: '#2962ff',

  lightBlue50: '#e1f5fe',
  lightBlue100: '#b3e5fc',
  lightBlue200: '#81d4fa',
  lightBlue300: '#4fc3f7',
  lightBlue400: '#29b6f6',
  lightBlue500: '#03a9f4',
  lightBlue600: '#039be5',
  lightBlue700: '#0288d1',
  lightBlue800: '#0277bd',
  lightBlue900: '#01579b',
  lightBlueA100: '#80d8ff',
  lightBlueA200: '#40c4ff',
  lightBlueA400: '#00b0ff',
  lightBlueA700: '#0091ea',

  cyan50: '#e0f7fa',
  cyan100: '#b2ebf2',
  cyan200: '#80deea',
  cyan300: '#4dd0e1',
  cyan400: '#26c6da',
  cyan500: '#00bcd4',
  cyan600: '#00acc1',
  cyan700: '#0097a7',
  cyan800: '#00838f',
  cyan900: '#006064',
  cyanA100: '#84ffff',
  cyanA200: '#18ffff',
  cyanA400: '#00e5ff',
  cyanA700: '#00b8d4',

  teal50: '#e0f2f1',
  teal100: '#b2dfdb',
  teal200: '#80cbc4',
  teal300: '#4db6ac',
  teal400: '#26a69a',
  teal500: '#009688',
  teal600: '#00897b',
  teal700: '#00796b',
  teal800: '#00695c',
  teal900: '#004d40',
  tealA100: '#a7ffeb',
  tealA200: '#64ffda',
  tealA400: '#1de9b6',
  tealA700: '#00bfa5',

  green50: '#e8f5e9',
  green100: '#c8e6c9',
  green200: '#a5d6a7',
  green300: '#81c784',
  green400: '#66bb6a',
  green500: '#4caf50',
  green600: '#43a047',
  green700: '#388e3c',
  green800: '#2e7d32',
  green900: '#1b5e20',
  greenA100: '#b9f6ca',
  greenA200: '#69f0ae',
  greenA400: '#00e676',
  greenA700: '#00c853',

  lightGreen50: '#f1f8e9',
  lightGreen100: '#dcedc8',
  lightGreen200: '#c5e1a5',
  lightGreen300: '#aed581',
  lightGreen400: '#9ccc65',
  lightGreen500: '#8bc34a',
  lightGreen600: '#7cb342',
  lightGreen700: '#689f38',
  lightGreen800: '#558b2f',
  lightGreen900: '#33691e',
  lightGreenA100: '#ccff90',
  lightGreenA200: '#b2ff59',
  lightGreenA400: '#76ff03',
  lightGreenA700: '#64dd17',

  lime50: '#f9fbe7',
  lime100: '#f0f4c3',
  lime200: '#e6ee9c',
  lime300: '#dce775',
  lime400: '#d4e157',
  lime500: '#cddc39',
  lime600: '#c0ca33',
  lime700: '#afb42b',
  lime800: '#9e9d24',
  lime900: '#827717',
  limeA100: '#f4ff81',
  limeA200: '#eeff41',
  limeA400: '#c6ff00',
  limeA700: '#aeea00',

  yellow50: '#fffde7',
  yellow100: '#fff9c4',
  yellow200: '#fff59d',
  yellow300: '#fff176',
  yellow400: '#ffee58',
  yellow500: '#ffeb3b',
  yellow600: '#fdd835',
  yellow700: '#fbc02d',
  yellow800: '#f9a825',
  yellow900: '#f57f17',
  yellowA100: '#ffff8d',
  yellowA200: '#ffff00',
  yellowA400: '#ffea00',
  yellowA700: '#ffd600',

  amber50: '#fff8e1',
  amber100: '#ffecb3',
  amber200: '#ffe082',
  amber300: '#ffd54f',
  amber400: '#ffca28',
  amber500: '#ffc107',
  amber600: '#ffb300',
  amber700: '#ffa000',
  amber800: '#ff8f00',
  amber900: '#ff6f00',
  amberA100: '#ffe57f',
  amberA200: '#ffd740',
  amberA400: '#ffc400',
  amberA700: '#ffab00',

  orange50: '#fff3e0',
  orange100: '#ffe0b2',
  orange200: '#ffcc80',
  orange300: '#ffb74d',
  orange400: '#ffa726',
  orange500: '#ff9800',
  orange600: '#fb8c00',
  orange700: '#f57c00',
  orange800: '#ef6c00',
  orange900: '#e65100',
  orangeA100: '#ffd180',
  orangeA200: '#ffab40',
  orangeA400: '#ff9100',
  orangeA700: '#ff6d00',

  deepOrange50: '#fbe9e7',
  deepOrange100: '#ffccbc',
  deepOrange200: '#ffab91',
  deepOrange300: '#ff8a65',
  deepOrange400: '#ff7043',
  deepOrange500: '#ff5722',
  deepOrange600: '#f4511e',
  deepOrange700: '#e64a19',
  deepOrange800: '#d84315',
  deepOrange900: '#bf360c',
  deepOrangeA100: '#ff9e80',
  deepOrangeA200: '#ff6e40',
  deepOrangeA400: '#ff3d00',
  deepOrangeA700: '#dd2c00',

  brown50: '#efebe9',
  brown100: '#d7ccc8',
  brown200: '#bcaaa4',
  brown300: '#a1887f',
  brown400: '#8d6e63',
  brown500: '#795548',
  brown600: '#6d4c41',
  brown700: '#5d4037',
  brown800: '#4e342e',
  brown900: '#3e2723',

  blueGrey50: '#eceff1',
  blueGrey100: '#cfd8dc',
  blueGrey200: '#b0bec5',
  blueGrey300: '#90a4ae',
  blueGrey400: '#78909c',
  blueGrey500: '#607d8b',
  blueGrey600: '#546e7a',
  blueGrey700: '#455a64',
  blueGrey800: '#37474f',
  blueGrey900: '#263238',

  grey50: '#fafafa',
  grey100: '#f5f5f5',
  grey200: '#eeeeee',
  grey300: '#e0e0e0',
  grey400: '#bdbdbd',
  grey500: '#9e9e9e',
  grey600: '#757575',
  grey700: '#616161',
  grey800: '#424242',
  grey900: '#212121',

  black: '#000000',
  white: '#ffffff',

  transparent: 'rgba(0, 0, 0, 0)',
  fullBlack: 'rgba(0, 0, 0, 1)',
  darkBlack: 'rgba(0, 0, 0, 0.87)',
  lightBlack: 'rgba(0, 0, 0, 0.54)',
  minBlack: 'rgba(0, 0, 0, 0.26)',
  faintBlack: 'rgba(0, 0, 0, 0.12)',
  fullWhite: 'rgba(255, 255, 255, 1)',
  darkWhite: 'rgba(255, 255, 255, 0.87)',
  lightWhite: 'rgba(255, 255, 255, 0.54)'

};
},{}],3:[function(require,module,exports){
"use strict";

module.exports = {
  iconSize: 24,

  desktopGutter: 24,
  desktopGutterMore: 32,
  desktopGutterLess: 16,
  desktopGutterMini: 8,
  desktopKeylineIncrement: 64,
  desktopDropDownMenuItemHeight: 32,
  desktopDropDownMenuFontSize: 15,
  desktopLeftNavMenuItemHeight: 48,
  desktopSubheaderHeight: 48,
  desktopToolbarHeight: 56
};
},{}],4:[function(require,module,exports){
'use strict';

var Extend = require('../utils/extend');

var Types = {
  LIGHT: require('./themes/light-theme'),
  DARK: require('./themes/dark-theme')
};

var ThemeManager = function ThemeManager() {
  return {

    //In most cases, theme variables remain static thoughout the life of an
    //app. If you plan on mutating theme variables after the theme has been
    //intialized, set static to false. This will allow components to update
    //when theme variables change. For more information see issue #1176
    'static': true,

    types: Types,
    template: Types.LIGHT,

    spacing: Types.LIGHT.spacing,
    contentFontFamily: 'Roboto, sans-serif',

    palette: Types.LIGHT.getPalette(),
    component: Types.LIGHT.getComponentThemes(Types.LIGHT.getPalette()),

    getCurrentTheme: function getCurrentTheme() {
      return this;
    },

    // Component gets updated to reflect palette changes.
    setTheme: function setTheme(newTheme) {
      this.setSpacing(newTheme.spacing);
      this.setContentFontFamily(newTheme.contentFontFamily);
      this.setPalette(newTheme.getPalette());
      this.setComponentThemes(newTheme.getComponentThemes(newTheme.getPalette()));
    },

    setSpacing: function setSpacing(newSpacing) {
      this.spacing = Extend(this.spacing, newSpacing);
      this.component = Extend(this.component, this.template.getComponentThemes(this.palette, this.spacing));
    },

    setContentFontFamily: function setContentFontFamily(newContentFontFamily) {
      if (typeof newContentFontFamily !== "undefined" && newContentFontFamily !== null) {
        this.contentFontFamily = newContentFontFamily;
        this.component = Extend(this.component, this.template.getComponentThemes(this.palette, this.spacing));
      }
    },

    setPalette: function setPalette(newPalette) {
      this.palette = Extend(this.palette, newPalette);
      this.component = Extend(this.component, this.template.getComponentThemes(this.palette));
    },

    setComponentThemes: function setComponentThemes(overrides) {
      this.component = Extend(this.component, overrides);
    },

    setIsRtl: function setIsRtl(isRtl) {
      this.isRtl = !!isRtl;
    }
  };
};

module.exports = ThemeManager;
},{"../utils/extend":8,"./themes/dark-theme":5,"./themes/light-theme":6}],5:[function(require,module,exports){
'use strict';

var Colors = require('../colors');
var ColorManipulator = require('../../utils/color-manipulator');

var DarkTheme = {
  getPalette: function getPalette() {
    return {
      textColor: Colors.fullWhite,
      canvasColor: '#303030',
      borderColor: ColorManipulator.fade(Colors.fullWhite, 0.3), //Colors.grey300
      disabledColor: ColorManipulator.fade(Colors.fullWhite, 0.3),
      primary1Color: Colors.teal200
    };
  },
  getComponentThemes: function getComponentThemes(palette) {
    var cardColor = Colors.grey800;
    return {
      avatar: {
        borderColor: 'rgba(0, 0, 0, 0.5)'
      },
      floatingActionButton: {
        disabledColor: ColorManipulator.fade(palette.textColor, 0.12)
      },
      leftNav: {
        color: cardColor
      },
      menu: {
        backgroundColor: cardColor,
        containerBackgroundColor: cardColor
      },
      menuItem: {
        hoverColor: 'rgba(255, 255, 255, .03)'
      },
      menuSubheader: {
        borderColor: 'rgba(255, 255, 255, 0.3)'
      },
      paper: {
        backgroundColor: cardColor
      },
      raisedButton: {
        color: Colors.grey500
      },
      toggle: {
        thumbOnColor: Colors.cyan200,
        thumbOffColor: Colors.grey400,
        thumbDisabledColor: Colors.grey800,
        thumbRequiredColor: Colors.cyan200,
        trackOnColor: ColorManipulator.fade(Colors.cyan200, 0.5),
        trackOffColor: 'rgba(255, 255, 255, 0.3)',
        trackDisabledColor: 'rgba(255, 255, 255, 0.1)'
      },
      refreshIndicator: {
        strokeColor: Colors.grey700,
        loadingStrokeColor: Colors.teal300
      },
      slider: {
        trackColor: Colors.minBlack,
        handleColorZero: cardColor,
        handleFillColor: cardColor,
        selectionColor: Colors.cyan200
      }
    };
  }
};

module.exports = DarkTheme;
},{"../../utils/color-manipulator":7,"../colors":2}],6:[function(require,module,exports){
'use strict';

var Colors = require('../colors');
var Spacing = require('../spacing');
var ColorManipulator = require('../../utils/color-manipulator');

/**
 *  Light Theme is the default theme used in material-ui. It is guaranteed to
 *  have all theme variables needed for every component. Variables not defined
 *  in a custom theme will default to these values.
 */

var LightTheme = {
  spacing: Spacing,
  contentFontFamily: 'Roboto, sans-serif',
  getPalette: function getPalette() {
    return {
      primary1Color: Colors.cyan500,
      primary2Color: Colors.cyan700,
      primary3Color: Colors.cyan100,
      accent1Color: Colors.pinkA200,
      accent2Color: Colors.pinkA400,
      accent3Color: Colors.pinkA100,
      textColor: Colors.darkBlack,
      canvasColor: Colors.white,
      borderColor: Colors.grey300,
      disabledColor: ColorManipulator.fade(Colors.darkBlack, 0.3)
    };
  },
  getComponentThemes: function getComponentThemes(palette, spacing) {
    spacing = spacing || Spacing;
    var obj = {
      appBar: {
        color: palette.primary1Color,
        textColor: Colors.darkWhite,
        height: spacing.desktopKeylineIncrement
      },
      avatar: {
        borderColor: 'rgba(0, 0, 0, 0.08)'
      },
      button: {
        height: 36,
        minWidth: 88,
        iconButtonSize: spacing.iconSize * 2
      },
      checkbox: {
        boxColor: palette.textColor,
        checkedColor: palette.primary1Color,
        requiredColor: palette.primary1Color,
        disabledColor: palette.disabledColor,
        labelColor: palette.textColor,
        labelDisabledColor: palette.disabledColor
      },
      datePicker: {
        color: palette.primary1Color,
        textColor: Colors.white,
        calendarTextColor: palette.textColor,
        selectColor: palette.primary2Color,
        selectTextColor: Colors.white
      },
      dropDownMenu: {
        accentColor: palette.borderColor
      },
      flatButton: {
        color: palette.canvasColor,
        textColor: palette.textColor,
        primaryTextColor: palette.accent1Color,
        secondaryTextColor: palette.primary1Color
      },
      floatingActionButton: {
        buttonSize: 56,
        miniSize: 40,
        color: palette.accent1Color,
        iconColor: Colors.white,
        secondaryColor: palette.primary1Color,
        secondaryIconColor: Colors.white
      },
      inkBar: {
        backgroundColor: palette.accent1Color
      },
      leftNav: {
        width: spacing.desktopKeylineIncrement * 4,
        color: Colors.white
      },
      listItem: {
        nestedLevelDepth: 18
      },
      menu: {
        backgroundColor: Colors.white,
        containerBackgroundColor: Colors.white
      },
      menuItem: {
        dataHeight: 32,
        height: 48,
        hoverColor: 'rgba(0, 0, 0, .035)',
        padding: spacing.desktopGutter,
        selectedTextColor: palette.accent1Color
      },
      menuSubheader: {
        padding: spacing.desktopGutter,
        borderColor: palette.borderColor,
        textColor: palette.primary1Color
      },
      paper: {
        backgroundColor: Colors.white
      },
      radioButton: {
        borderColor: palette.textColor,
        backgroundColor: Colors.white,
        checkedColor: palette.primary1Color,
        requiredColor: palette.primary1Color,
        disabledColor: palette.disabledColor,
        size: 24,
        labelColor: palette.textColor,
        labelDisabledColor: palette.disabledColor
      },
      raisedButton: {
        color: Colors.white,
        textColor: palette.textColor,
        primaryColor: palette.accent1Color,
        primaryTextColor: Colors.white,
        secondaryColor: palette.primary1Color,
        secondaryTextColor: Colors.white
      },
      refreshIndicator: {
        strokeColor: Colors.grey300,
        loadingStrokeColor: palette.primary1Color
      },
      slider: {
        trackSize: 2,
        trackColor: Colors.minBlack,
        trackColorSelected: Colors.grey500,
        handleSize: 12,
        handleSizeDisabled: 8,
        handleSizeActive: 18,
        handleColorZero: Colors.grey400,
        handleFillColor: Colors.white,
        selectionColor: palette.primary3Color,
        rippleColor: palette.primary1Color
      },
      snackbar: {
        textColor: Colors.white,
        backgroundColor: '#323232',
        actionColor: palette.accent1Color
      },
      table: {
        backgroundColor: Colors.white
      },
      tableHeader: {
        borderColor: palette.borderColor
      },
      tableHeaderColumn: {
        textColor: Colors.lightBlack,
        height: 56,
        spacing: 24
      },
      tableFooter: {
        borderColor: palette.borderColor,
        textColor: Colors.lightBlack
      },
      tableRow: {
        hoverColor: Colors.grey200,
        stripeColor: ColorManipulator.lighten(palette.primary1Color, 0.55),
        selectedColor: Colors.grey300,
        textColor: Colors.darkBlack,
        borderColor: palette.borderColor
      },
      tableRowColumn: {
        height: 48,
        spacing: 24
      },
      timePicker: {
        color: Colors.white,
        textColor: Colors.grey600,
        accentColor: palette.primary1Color,
        clockColor: Colors.black,
        selectColor: palette.primary2Color,
        selectTextColor: Colors.white
      },
      toggle: {
        thumbOnColor: palette.primary1Color,
        thumbOffColor: Colors.grey50,
        thumbDisabledColor: Colors.grey400,
        thumbRequiredColor: palette.primary1Color,
        trackOnColor: ColorManipulator.fade(palette.primary1Color, 0.5),
        trackOffColor: Colors.minBlack,
        trackDisabledColor: Colors.faintBlack,
        labelColor: palette.textColor,
        labelDisabledColor: palette.disabledColor
      },
      toolbar: {
        backgroundColor: ColorManipulator.darken('#eeeeee', 0.05),
        height: 56,
        titleFontSize: 20,
        iconColor: 'rgba(0, 0, 0, .40)',
        separatorColor: 'rgba(0, 0, 0, .175)',
        menuHoverColor: 'rgba(0, 0, 0, .10)'
      },
      tabs: {
        backgroundColor: palette.primary1Color
      },
      textField: {
        textColor: palette.textColor,
        hintColor: palette.disabledColor,
        floatingLabelColor: palette.textColor,
        disabledTextColor: palette.disabledColor,
        errorColor: Colors.red500,
        focusColor: palette.primary1Color,
        backgroundColor: 'transparent',
        borderColor: palette.borderColor
      }
    };

    // Properties based on previous properties
    obj.flatButton.disabledTextColor = ColorManipulator.fade(obj.flatButton.textColor, 0.3);
    obj.floatingActionButton.disabledColor = ColorManipulator.darken(Colors.white, 0.1);
    obj.floatingActionButton.disabledTextColor = ColorManipulator.fade(palette.textColor, 0.3);
    obj.raisedButton.disabledColor = ColorManipulator.darken(obj.raisedButton.color, 0.1);
    obj.raisedButton.disabledTextColor = ColorManipulator.fade(obj.raisedButton.textColor, 0.3);
    obj.toggle.trackRequiredColor = ColorManipulator.fade(obj.toggle.thumbRequiredColor, 0.5);

    return obj;
  }
};

module.exports = LightTheme;
},{"../../utils/color-manipulator":7,"../colors":2,"../spacing":3}],7:[function(require,module,exports){
'use strict';

module.exports = {

  /**
   * The relative brightness of any point in a colorspace, normalized to 0 for
   * darkest black and 1 for lightest white. RGB colors only. Does not take
   * into account alpha values.
   *
   * TODO:
   * - Take into account alpha values.
   * - Identify why there are minor discrepancies for some use cases
   *   (i.e. #F0F & #FFF). Note that these cases rarely occur.
   *
   * Formula: http://www.w3.org/TR/2008/REC-WCAG20-20081211/#relativeluminancedef
   */
  _luminance: function _luminance(color) {
    color = this._decomposeColor(color);

    if (color.type.indexOf('rgb') > -1) {
      var rgb = color.values.map(function (val) {
        val /= 255; // normalized
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
      });

      return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
    } else {
      var message = 'Calculating the relative luminance is not available for ' + 'HSL and HSLA.';
      console.error(message);
      return -1;
    }
  },

  /**
   * @params:
   * additionalValue = An extra value that has been calculated but not included
   *                   with the original color object, such as an alpha value.
   */
  _convertColorToString: function _convertColorToString(color, additonalValue) {
    var str = color.type + '(' + parseInt(color.values[0]) + ',' + parseInt(color.values[1]) + ',' + parseInt(color.values[2]);

    if (additonalValue !== undefined) {
      str += ',' + additonalValue + ')';
    } else if (color.values.length === 4) {
      str += ',' + color.values[3] + ')';
    } else {
      str += ')';
    }

    return str;
  },

  // Converts a color from hex format to rgb format.
  _convertHexToRGB: function _convertHexToRGB(color) {
    if (color.length === 4) {
      var extendedColor = '#';
      for (var i = 1; i < color.length; i++) {
        extendedColor += color.charAt(i) + color.charAt(i);
      }
      color = extendedColor;
    }

    var values = {
      r: parseInt(color.substr(1, 2), 16),
      g: parseInt(color.substr(3, 2), 16),
      b: parseInt(color.substr(5, 2), 16)
    };

    return 'rgb(' + values.r + ',' + values.g + ',' + values.b + ')';
  },

  // Returns the type and values of a color of any given type.
  _decomposeColor: function _decomposeColor(color) {
    if (color.charAt(0) === '#') {
      return this._decomposeColor(this._convertHexToRGB(color));
    }

    var marker = color.indexOf('(');
    var type = color.substring(0, marker);
    var values = color.substring(marker + 1, color.length - 1).split(',');

    return { type: type, values: values };
  },

  // Set the absolute transparency of a color.
  // Any existing alpha values are overwritten.
  fade: function fade(color, amount) {
    color = this._decomposeColor(color);
    if (color.type === 'rgb' || color.type === 'hsl') color.type += 'a';
    return this._convertColorToString(color, amount);
  },

  // Desaturates rgb and sets opacity to 0.15
  lighten: function lighten(color, amount) {
    color = this._decomposeColor(color);

    if (color.type.indexOf('hsl') > -1) {
      color.values[2] += amount;
      return this._decomposeColor(this._convertColorToString(color));
    } else if (color.type.indexOf('rgb') > -1) {
      for (var i = 0; i < 3; i++) {
        color.values[i] *= 1 + amount;
        if (color.values[i] > 255) color.values[i] = 255;
      }
    }

    if (color.type.indexOf('a') <= -1) color.type += 'a';

    return this._convertColorToString(color, '0.15');
  },

  darken: function darken(color, amount) {
    color = this._decomposeColor(color);

    if (color.type.indexOf('hsl') > -1) {
      color.values[2] += amount;
      return this._decomposeColor(this._convertColorToString(color));
    } else if (color.type.indexOf('rgb') > -1) {
      for (var i = 0; i < 3; i++) {
        color.values[i] *= 1 - amount;
        if (color.values[i] < 0) color.values[i] = 0;
      }
    }

    return this._convertColorToString(color);
  },

  // Calculates the contrast ratio between two colors.
  //
  // Formula: http://www.w3.org/TR/2008/REC-WCAG20-20081211/#contrast-ratiodef
  contrastRatio: function contrastRatio(background, foreground) {
    var lumA = this._luminance(background);
    var lumB = this._luminance(foreground);

    if (lumA >= lumB) {
      return ((lumA + 0.05) / (lumB + 0.05)).toFixed(2);
    } else {
      return ((lumB + 0.05) / (lumA + 0.05)).toFixed(2);
    }
  },

  /**
   * Determines how readable a color combination is based on its level.
   * Levels are defined from @LeaVerou:
   * https://github.com/LeaVerou/contrast-ratio/blob/gh-pages/contrast-ratio.js
   */
  contrastRatioLevel: function contrastRatioLevel(background, foreground) {
    var levels = {
      'fail': {
        range: [0, 3],
        color: 'hsl(0, 100%, 40%)'
      },
      'aa-large': {
        range: [3, 4.5],
        color: 'hsl(40, 100%, 45%)'
      },
      'aa': {
        range: [4.5, 7],
        color: 'hsl(80, 60%, 45%)'
      },
      'aaa': {
        range: [7, 22],
        color: 'hsl(95, 60%, 41%)'
      }
    };

    var ratio = this.contrastRatio(background, foreground);

    for (var level in levels) {
      var range = levels[level].range;
      if (ratio >= range[0] && ratio <= range[1]) return level;
    }
  }
};
},{}],8:[function(require,module,exports){
'use strict';

function isObject(obj) {
  return typeof obj === 'object' && obj !== null;
}

/**
*  A recursive merge between two objects.
*
*  @param base     - the object whose properties are to be overwritten. It
*                    should be either the root level or some nested level.
*  @param override - an object containing properties to be overwritten. It
*                    should have the same structure as the object object.
*/
var extend = function extend(base, override) {

  var mergedObject = {};

  //Loop through each key in the base object
  Object.keys(base).forEach(function (key) {

    var baseProp = base[key];
    var overrideProp = undefined;

    if (isObject(override)) overrideProp = override[key];

    //Recursive call extend if the prop is another object, else just copy it over
    mergedObject[key] = isObject(baseProp) && !Array.isArray(baseProp) ? extend(baseProp, overrideProp) : baseProp;
  });

  //Loop through each override key and override the props in the
  //base object
  if (isObject(override)) {

    Object.keys(override).forEach(function (overrideKey) {

      var overrideProp = override[overrideKey];

      //Only copy over props that are not objects
      if (!isObject(overrideProp) || Array.isArray(overrideProp)) {
        mergedObject[overrideKey] = overrideProp;
      }
    });
  }

  return mergedObject;
};

module.exports = extend;
},{}],9:[function(require,module,exports){
'use strict';

var React = require('react');
var injectTapEventPlugin = require('react-tap-event-plugin');

window.React = React;
injectTapEventPlugin();
var TodoApp = require('./components/TodoApp.react.jsx');

React.render(React.createElement(TodoApp, null), document.body);

},{"./components/TodoApp.react.jsx":14,"react":"react","react-tap-event-plugin":"react-tap-event-plugin"}],10:[function(require,module,exports){
'use strict';

var _createClass = (function () {
   function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
         var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ('value' in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
      }
   }return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
   };
})();

function _classCallCheck(instance, Constructor) {
   if (!(instance instanceof Constructor)) {
      throw new TypeError('Cannot call a class as a function');
   }
}

var TodoDispatcher = require('../dispatcher/TodoDispatcher.jsx');
var TodoConstants = require('../constants/TodoConstants.jsx');

var TodoActions = (function () {
   function TodoActions() {
      _classCallCheck(this, TodoActions);
   }

   _createClass(TodoActions, [{
      key: 'create',
      value: function create(text) {
         TodoDispatcher.dispatch({
            actionType: TodoConstants.TODO_CREATE,
            text: text
         });
      }
   }, {
      key: 'updateText',
      value: function updateText(id, text) {
         TodoDispatcher.dispatch({
            actionType: TodoConstants.TODO_UPDATE_TEXT,
            id: id,
            text: text
         });
      }
   }, {
      key: 'toggleComplete',
      value: function toggleComplete(todo) {
         var id = todo.id;
         var actionType = todo.complete ? TodoConstants.TODO_UNDO_COMPLETE : TodoConstants.TODO_COMPLETED;
         TodoDispatcher.dispatch({
            actionType: actionType,
            id: id
         });
      }
   }, {
      key: 'toggleAllComplete',
      value: function toggleAllComplete() {
         TodoDispatcher.dispatch({
            actionType: TodoConstants.TODO_TOGGLE_ALL_COMPLETE
         });
      }
   }, {
      key: 'destroy',
      value: function destroy(id) {
         TodoDispatcher.dispatch({
            actionType: TodoConstants.TODO_DESTROY,
            id: id
         });
      }
   }, {
      key: 'destroyCompleted',
      value: function destroyCompleted() {
         TodoDispatcher.dispatch({
            actionType: TodoConstants.TODO_DESTROY_COMPLETED
         });
      }
   }]);

   return TodoActions;
})();

var actions = new TodoActions();
module.exports = actions;

},{"../constants/TodoConstants.jsx":17,"../dispatcher/TodoDispatcher.jsx":18}],11:[function(require,module,exports){
'use strict';

var React = require('react');
var ReactPropTypes = React.PropTypes;
var TodoActions = require('../actions/TodoActions.jsx');

var Footer = React.createClass({
   displayName: 'Footer',

   propTypes: {
      allTodos: ReactPropTypes.object.isRequired
   },
   render: function render() {
      var allTodos = this.props.allTodos;
      var total = Object.keys(allTodos).length;

      if (total === 0) {
         return null;
      }

      var completed = 0;

      for (var key in allTodos) {
         if (allTodos[key].complete) {
            completed++;
         }
      }

      var itemsLeft = total - completed;
      var itemsLeftPhrase = itemsLeft === 1 ? ' item ' : ' items ';
      itemsLeftPhrase += ' left. \t';

      var clearCompletedButton;
      if (completed) {
         clearCompletedButton = React.createElement('input', {
            type: 'button',
            id: 'clear-completed',
            onClick: this._onClearCompletedClick,
            value: "Clear completed!!!(" + completed + ")"
         });
      }
      return React.createElement('footer', { id: 'footer' }, React.createElement('span', { id: 'todo-count' }, React.createElement('strong', null, itemsLeft), itemsLeftPhrase), clearCompletedButton);
   },
   _onClearCompletedClick: function _onClearCompletedClick() {
      TodoActions.destroyCompleted();
   }
});
module.exports = Footer;

},{"../actions/TodoActions.jsx":10,"react":"react"}],12:[function(require,module,exports){
'use strict';

var React = require('react');
var mui = require('material-ui');

var TodoActions = require('../actions/TodoActions.jsx');

//Components
var TodoTextInput = require('./TodoTextInput.react.jsx');
//Material Components
var AppBar = mui.AppBar;
var LeftNav = mui.LeftNav;
var MenuItem = mui.MenuItem;

var Header = React.createClass({
   displayName: 'Header',

   render: function render() {
      var menuItems = [{ route: 'get-started', text: 'Get Started' }, { route: 'customization', text: 'Customization' }, { route: 'components', text: 'Components' }, { type: MenuItem.Types.SUBHEADER, text: 'Resources' }, {
         type: MenuItem.Types.LINK,
         payload: 'http://material-ui.com/#/',
         text: 'Material-UI'
      }, {
         text: 'Disabled',
         disabled: true
      }, {
         type: MenuItem.Types.LINK,
         payload: 'https://www.google.com',
         text: 'Disabled Link',
         disabled: true
      }];
      return React.createElement('header', { id: 'header' }, React.createElement(LeftNav, {
         ref: 'leftNav',
         docked: false,
         menuItems: menuItems
      }), React.createElement(AppBar, {
         title: 'Todos !!!',
         className: 'toolbar',
         isInitiallyOpen: true,
         onLeftIconButtonTouchTap: this._handleClick
      }), React.createElement('div', { id: 'app-bar-margin' }), React.createElement(TodoTextInput, {
         id: 'new-todo',
         placeholder: 'What needs to be done?',
         onSave: this._onSave
      }));
   },
   _handleClick: function _handleClick(e) {
      e.preventDefault();
      this.refs.leftNav.toggle();
   },
   _onSave: function _onSave(text) {
      if (text.trim()) {
         TodoActions.create(text);
      }
   }
});

module.exports = Header;

},{"../actions/TodoActions.jsx":10,"./TodoTextInput.react.jsx":16,"material-ui":"material-ui","react":"react"}],13:[function(require,module,exports){
'use strict';

var React = require('react');
var ReactPropTypes = React.PropTypes;
var TodoActions = require('../actions/TodoActions.jsx');
var TodoItem = require('./TodoItem.react.jsx');
var mui = require('material-ui');

// var TodoItems = require('');

//Material-components
var Checkbox = mui.Checkbox;
var MainSection = React.createClass({
   displayName: 'MainSection',

   propTypes: {
      allTodos: ReactPropTypes.object.isRequired,
      areAllComplete: ReactPropTypes.bool.isRequired
   },
   render: function render() {
      if (Object.keys(this.props.allTodos).length < 1) {
         return null;
      }

      var allTodos = this.props.allTodos;
      var todos = [];

      for (var key in allTodos) {
         todos.push(React.createElement(TodoItem, { key: key, todo: allTodos[key] }));
      }

      return React.createElement('section', { id: 'main' }, React.createElement(Checkbox, {
         id: 'toggle-all',
         name: 'checkboxName1',
         value: 'checkboxValue1',
         label: 'Mark all as Complete',
         onCheck: this._onToggleCompleteAll,
         defaultChecked: this.props.areAllComplete
      }), React.createElement('ul', { id: 'todo-list' }, todos));
   },
   _onToggleCompleteAll: function _onToggleCompleteAll() {
      TodoActions.toggleAllComplete();
   }
});

module.exports = MainSection;

},{"../actions/TodoActions.jsx":10,"./TodoItem.react.jsx":15,"material-ui":"material-ui","react":"react"}],14:[function(require,module,exports){
'use strict';

var React = require('react');
var mui = require('material-ui');
var TodoStore = require('../stores/TodoStore.jsx');
var ThemeManager = require('material-ui/lib/styles/theme-manager')();
var Colors = mui.Styles.Colors;

/*components*/
var Header = require('./Header.react.jsx');
var Footer = require('./Footer.react.jsx');
var MainSection = require('./MainSection.react.jsx');

ThemeManager.setTheme(ThemeManager.types.DARK);
function getTodoState() {
  return {
    allTodos: TodoStore.getAll(),
    areAllComplete: TodoStore.areAllComplete()
  };
}
var TodoApp = React.createClass({
  displayName: 'TodoApp',

  childContextTypes: {
    muiTheme: React.PropTypes.object
  },

  getChildContext: function getChildContext() {
    return {
      muiTheme: ThemeManager.getCurrentTheme()
    };
  },
  componentWillMount: function componentWillMount() {
    ThemeManager.setPalette({
      accent1Color: Colors.deepOrange500,
      primary1Color: Colors.green700
    });
    ThemeManager.setComponentThemes({
      appBar: {
        color: Colors.deepOrange500,
        textColor: Colors.grey50
      }
    });
  },
  getInitialState: function getInitialState() {
    return getTodoState();
  },
  componentDidMount: function componentDidMount() {
    TodoStore.addChangeListener(this._onChange);
  },
  componentWillUnmount: function componentWillUnmount() {
    TodoStore.removeChangeListener(this._onChange);
  },
  render: function render() {
    return React.createElement('div', null, React.createElement(Header, null), React.createElement(MainSection, { allTodos: this.state.allTodos, areAllComplete: this.state.areAllComplete }), React.createElement(Footer, { allTodos: this.state.allTodos }));
  },
  /**
  * Event handler for 'change' events coming from the TodoStore
  */
  _onChange: function _onChange() {
    this.setState(getTodoState());
  }
});

module.exports = TodoApp;

},{"../stores/TodoStore.jsx":19,"./Footer.react.jsx":11,"./Header.react.jsx":12,"./MainSection.react.jsx":13,"material-ui":"material-ui","material-ui/lib/styles/theme-manager":4,"react":"react"}],15:[function(require,module,exports){
'use strict';

var React = require('react');
var ReactPropTypes = React.PropTypes;
var TodoActions = require('../actions/TodoActions.jsx');
var TodoTextInput = require('./TodoTextInput.react.jsx');

var classNames = require('classnames');

var TodoItem = React.createClass({
   displayName: 'TodoItem',

   propTypes: {
      todo: ReactPropTypes.object.isRequired
   },

   getInitialState: function getInitialState() {
      return {
         isEditing: false
      };
   },

   render: function render() {
      var todo = this.props.todo;

      var input;
      if (this.state.isEditing) {
         input = React.createElement(TodoTextInput, {
            className: 'edit',
            onSave: this._onSave,
            value: todo.text
         });
      }

      return React.createElement('li', {
         className: classNames({
            'completed': todo.complete,
            'editing': this.state.isEditing
         }),
         key: todo.id }, React.createElement('div', { className: 'view' }, React.createElement('input', {
         className: 'toggle',
         type: 'checkbox',
         checked: todo.complete,
         onChange: this._onToggleComplete
      }), React.createElement('label', { onDoubleClick: this._onDoubleClick }, todo.text), React.createElement('input', { type: 'button', className: 'destroy', onClick: this._onDestroyClick })), input);
   },
   _onToggleComplete: function _onToggleComplete() {
      TodoActions.toggleComplete(this.props.todo);
   },
   _onDoubleClick: function _onDoubleClick() {
      this.setState({
         isEditing: true
      });
   },
   _onDestroyClick: function _onDestroyClick() {
      TodoActions.destroy(this.props.todo.id);
   },
   _onSave: function _onSave(text) {
      TodoActions.updateText(this.props.todo.id, text);
      this.setState({
         isEditing: false
      });
   }
});

module.exports = TodoItem;

},{"../actions/TodoActions.jsx":10,"./TodoTextInput.react.jsx":16,"classnames":"classnames","react":"react"}],16:[function(require,module,exports){
'use strict';

var React = require('react');
var mui = require('material-ui');
var ThemeManager = require('material-ui/lib/styles/theme-manager')();

//Material-components
var TextField = mui.TextField;
var ReactPropTypes = React.PropTypes;

var ENTER_KEY_CODE = 13;

var TodoTextInput = React.createClass({
  displayName: 'TodoTextInput',

  childContextTypes: {
    muiTheme: React.PropTypes.object
  },

  getChildContext: function getChildContext() {
    return {
      muiTheme: ThemeManager.getCurrentTheme()
    };
  },
  propTypes: {
    className: ReactPropTypes.string,
    id: ReactPropTypes.string,
    placeholder: ReactPropTypes.string,
    onSave: ReactPropTypes.func.isRequired,
    value: ReactPropTypes.string
  },
  getInitialState: function getInitialState() {
    return {
      value: this.props.value || ''
    };
  },
  render: function render() {
    return React.createElement(TextField, {
      hintText: this.props.placeholder,
      floatingLabelText: 'What to do',
      id: this.props.id,
      onBlur: this._save,
      onChange: this._onChange,
      onKeyDown: this._onKeyDown,
      value: this.state.value,
      autoFocus: true
    })
    // <input
    //   className={this.props.className}
    //   id={this.props.id}
    //   placeholder={this.props.placeholder}
    //   onBlur={this._save}
    //   onChange={this._onChange}
    //   onKeyDown={this._onKeyDown}
    //   value={this.state.value}
    //   autoFocus={true}
    //   />
    ;
  },
  /**
   * Invokes the callback passed in as onSave, allowing this component to be
   * used in different ways.
   */
  _save: function _save() {
    this.props.onSave(this.state.value);
    this.setState({
      value: ''
    });
  },
  _onChange: function _onChange(event) {
    this.setState({
      value: event.target.value
    });
  },
  _onKeyDown: function _onKeyDown(event) {
    if (event.keyCode == ENTER_KEY_CODE) {
      this._save();
    }
  }
});

module.exports = TodoTextInput;

},{"material-ui":"material-ui","material-ui/lib/styles/theme-manager":4,"react":"react"}],17:[function(require,module,exports){
'use strict';

var constants = {
   TODO_CREATE: 'TODO_CREATE',
   TODO_COMPLETED: 'TODO_COMPLETED',
   TODO_DESTROY: 'TODO_DESTROY',
   TODO_DESTROY_COMPLETED: 'TODO_DESTROY_COMPLETED',
   TODO_TOGGLE_COMPLETE_ALL: 'TODO_TOGGLE_COMPLETE_ALL',
   TODO_UNDO_COMPLETE: 'TODO_UNDO_COMPLETE',
   TODO_UPDATE_TEXT: 'TODO_UPDATE_TEXT'
};
module.exports = constants;

},{}],18:[function(require,module,exports){
'use strict';

var Dispatcher = require('flux').Dispatcher;
function test(a) {
   return a * 8;
}

var a = 2;
test(a);
module.exports = new Dispatcher();

},{"flux":"flux"}],19:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }return target;
};

var TodoDispatcher = require('./../dispatcher/TodoDispatcher.jsx');
var TodoConstants = require('./../constants/TodoConstants.jsx');
var EventEmitter = require('events').EventEmitter;

var CHANGE_EVENT = 'change';
try {
  var _todos = JSON.parse(localStorage["todos"]);
} catch (e) {
  console.log('No saved todos available. ' + e);
  var _todos = {};
}

function persistTodos() {
  try {
    localStorage["todos"] = JSON.stringify(_todos);
  } catch (e) {
    console.error('Error Occured: ' + e);
  }
}
function create(text) {
  var id = (new Date() + Math.floor(Math.random() * 99999)).toString(36);
  _todos[id] = {
    id: id,
    complete: false,
    text: text
  };
  persistTodos();
}

function updateText(id, text) {
  _todos[id].text = text;
  persistTodos();
}

function destroy(id) {
  delete _todos[id];
  persistTodos();
}

function update(id, updates) {
  _todos[id] = _extends({}, _todos[id], updates);
  // persistTodos();
}

function destroyCompleted() {
  for (var id in _todos) {
    if (_todos[id].complete) {
      destroy(id);
    }
  }
}

function updateAll(updates) {
  for (var id in _todos) {
    update(id, updates);
  }
}
var TodoStore = _extends({}, EventEmitter.prototype, {
  areAllComplete: function areAllComplete() {
    for (var id in _todos) {
      if (!_todos[id].complete) {
        return false;
      }
    }
    return true;
  },
  getAll: function getAll() {
    return _todos;
  },
  clearAll: function clearAll() {
    _todos = {};
  },
  addChangeListener: function addChangeListener(callback) {
    this.on(CHANGE_EVENT, callback);
  },
  removeChangeListener: function removeChangeListener(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  },
  emitChange: function emitChange() {
    this.emit(CHANGE_EVENT);
  }
});
TodoDispatcher.register(function (action) {
  var text;
  switch (action.actionType) {
    case TodoConstants.TODO_CREATE:
      text = action.text.trim();
      if (text !== '') {
        create(text);
        TodoStore.emitChange();
      }
      break;
    case TodoConstants.TODO_UPDATE_TEXT:
      text = action.text.trim();
      if (text !== '') {
        updateText(action.id, text);
        TodoStore.emitChange();
      }
      break;
    case TodoConstants.TODO_DESTROY:
      destroy(action.id);
      TodoStore.emitChange();
      break;
    case TodoConstants.TODO_COMPLETED:
      update(action.id, { complete: true });
      TodoStore.emitChange();
      break;
    case TodoConstants.TODO_TOGGLE_ALL_COMPLETE:
      if (TodoStore.areAllComplete()) {
        updateAll({ complete: false });
      } else {
        updateAll({ complete: true });
      }
      TodoStore.emitChange();
      break;
    case TodoConstants.TODO_UNDO_COMPLETE:
      update(action.id, { complete: false });
      TodoStore.emitChange();
    case TodoConstants.TODO_DESTROY_COMPLETED:
      destroyCompleted();
      TodoStore.emitChange();
    default:

  }
});

module.exports = TodoStore;

},{"./../constants/TodoConstants.jsx":17,"./../dispatcher/TodoDispatcher.jsx":18,"events":1}]},{},[9])


//# sourceMappingURL=bundle.js.map