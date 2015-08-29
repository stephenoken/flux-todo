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
'use strict';

var React = require('react');
var TodoApp = require('./components/TodoApp.react.jsx');

React.render(React.createElement(TodoApp, null), document.getElementById('content'));

},{"./components/TodoApp.react.jsx":7,"react":"react"}],3:[function(require,module,exports){
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

},{"../constants/TodoConstants.jsx":10,"../dispatcher/TodoDispatcher.jsx":11}],4:[function(require,module,exports){
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

},{"../actions/TodoActions.jsx":3,"react":"react"}],5:[function(require,module,exports){
'use strict';

var React = require('react');
var TodoActions = require('../actions/TodoActions.jsx');

var TodoTextInput = require('./TodoTextInput.react.jsx');
var Header = React.createClass({
  displayName: 'Header',

  render: function render() {
    return React.createElement('header', { id: 'header' }, React.createElement('h1', null, 'Todos !!!'), React.createElement(TodoTextInput, {
      id: 'new-todo',
      placeholder: 'What needs to be done?',
      onSave: this._onSave
    }));
  },
  _onSave: function _onSave(text) {
    if (text.trim()) {
      TodoActions.create(text);
    }
  }
});

module.exports = Header;

},{"../actions/TodoActions.jsx":3,"./TodoTextInput.react.jsx":9,"react":"react"}],6:[function(require,module,exports){
'use strict';

var React = require('react');
var ReactPropTypes = React.PropTypes;
var TodoActions = require('../actions/TodoActions.jsx');
var TodoItem = require('./TodoItem.react.jsx');
// var TodoItems = require('');

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

      return React.createElement('section', { id: 'main' }, React.createElement('input', {
         id: 'toggle-all',
         type: 'checkbox',
         onChange: this._onToggleCompleteAll,
         checked: this.props.areAllComplete ? 'checked' : ''
      }), React.createElement('label', { htmlFor: 'toggle-all' }, 'Mark all as Complete'), React.createElement('ul', { id: 'todo-list' }, todos));
   },
   _onToggleCompleteAll: function _onToggleCompleteAll() {
      TodoActions.toggleAllComplete();
   }
});

module.exports = MainSection;

},{"../actions/TodoActions.jsx":3,"./TodoItem.react.jsx":8,"react":"react"}],7:[function(require,module,exports){
'use strict';

var React = require('react');
var TodoStore = require('../stores/TodoStore.jsx');

/*components*/
var Header = require('./Header.react.jsx');
var Footer = require('./Footer.react.jsx');
var MainSection = require('./MainSection.react.jsx');

function getTodoState() {
  return {
    allTodos: TodoStore.getAll(),
    areAllComplete: TodoStore.areAllComplete()
  };
}
var TodoApp = React.createClass({
  displayName: 'TodoApp',

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

},{"../stores/TodoStore.jsx":12,"./Footer.react.jsx":4,"./Header.react.jsx":5,"./MainSection.react.jsx":6,"react":"react"}],8:[function(require,module,exports){
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

},{"../actions/TodoActions.jsx":3,"./TodoTextInput.react.jsx":9,"classnames":"classnames","react":"react"}],9:[function(require,module,exports){
'use strict';

var React = require('react');

var ReactPropTypes = React.PropTypes;

var ENTER_KEY_CODE = 13;

var TodoTextInput = React.createClass({
  displayName: 'TodoTextInput',

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
    return React.createElement('input', {
      className: this.props.className,
      id: this.props.id,
      placeholder: this.props.placeholder,
      onBlur: this._save,
      onChange: this._onChange,
      onKeyDown: this._onKeyDown,
      value: this.state.value,
      autoFocus: true
    });
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

},{"react":"react"}],10:[function(require,module,exports){
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

},{}],11:[function(require,module,exports){
'use strict';

var Dispatcher = require('flux').Dispatcher;

module.exports = new Dispatcher();

},{"flux":"flux"}],12:[function(require,module,exports){
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

},{"./../constants/TodoConstants.jsx":10,"./../dispatcher/TodoDispatcher.jsx":11,"events":1}]},{},[2])


//# sourceMappingURL=bundle.js.map