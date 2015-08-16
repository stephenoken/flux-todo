var TodoDispatcher = require('../dispatcher/TodoDispatcher');
var TodoConstants = require('../constants/TodoConstants');
var EventEmitter = require('events').EventEmitter;

var CHANGE_EVENT = 'change';
var _todos = {};

function create(text) {
  var id = (new Date()+ Math.floor(Math.random() * 99999)).toString(36);
  _todos[id]= {
    id: id,
    text: text
  };
}
var TodoStore = Object.assign({}, EventEmitter.prototype,{
  areAllcomplete: function () {
    for(var id in _todos){
      if (!_todos[id].complete) {
        return false
      }
    }
    return true;
  },
  getAll: function () {
    return _todos;
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
    default:

  }
});

module.exports = TodoStore;
