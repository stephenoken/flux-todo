var TodoDispatcher = require('./../dispatcher/TodoDispatcher.jsx');
var TodoConstants = require('./../constants/TodoConstants.jsx');
var EventEmitter = require('events').EventEmitter;

var CHANGE_EVENT = 'change';
var _todos = {};

function create(text) {
  var id = (new Date()+ Math.floor(Math.random() * 99999)).toString(36);
  _todos[id]= {
    id: id,
    complete: false,
    text: text
  };
}

function destroy(id) {
  delete _todos[id];
}

function update(id, updates) {
  _todos[id] = Object.assign({},_todos[id],updates);
}

var TodoStore = Object.assign({}, EventEmitter.prototype,{
  areAllComplete: function () {
    for(var id in _todos){
      if (!_todos[id].complete) {
        return false;
      }
    }
    return true;
  },
  getAll: function () {
    return _todos;
  },
  addChangeListener: function(callback) {
    this.on(CHANGE_EVENT, callback);
  },
  removeChangeListener: function(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  },
  emitChange: function () {
    this.emit(CHANGE_EVENT);
  }
});
TodoDispatcher.register(function (action) {
  var text;
  switch (action.actionType) {
    case TodoConstants.TODO_CREATE:
      text = action.text.trim();
      if(text !== ''){
        create(text);
        TodoStore.emitChange();
      }
      break;
    case TodoConstants.TODO_DESTROY:
      destroy(action.id);
      TodoStore.emitChange();
      break;
    case TodoConstants.TODO_COMPLETE:
      update(action.id, {complete:true});
      TodoStore.emitChange();
      break;
    case TodoConstants.TODO_UNDO_COMPLETE:
      update(action.id,{complete:false});
      TodoStore.emitChange();
    default:

  }
});

module.exports = TodoStore;
