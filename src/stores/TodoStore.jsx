var TodoDispatcher = require('./../dispatcher/TodoDispatcher.jsx');
var TodoConstants = require('./../constants/TodoConstants.jsx');
var EventEmitter = require('events').EventEmitter;

var CHANGE_EVENT = 'change';
try {
   var _todos = JSON.parse(localStorage["todos"]);

} catch (e) {
   console.log(`No saved todos available. ${e}`);
   var _todos = {};
}

function persistTodos() {
   try {
      localStorage["todos"] = JSON.stringify(_todos);
   } catch (e) {
         console.error(`Error Occured: ${e}`);
   }
}
function create(text) {
  var id = (new Date()+ Math.floor(Math.random() * 99999)).toString(36);
  _todos[id]= {
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
  _todos[id] = Object.assign({},_todos[id],updates);
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
   for(var id in _todos){
      update(id, updates);
   }
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
  clearAll: function () {
    _todos = {};
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
   case TodoConstants.TODO_UPDATE_TEXT:
      text = action.text.trim();
      if (text !== '') {
         updateText(action.id,text);
         TodoStore.emitChange();
      }
      break;
    case TodoConstants.TODO_DESTROY:
      destroy(action.id);
      TodoStore.emitChange();
      break;
    case TodoConstants.TODO_COMPLETED:
      update(action.id, {complete:true});
      TodoStore.emitChange();
      break;
    case TodoConstants.TODO_TOGGLE_ALL_COMPLETE:
      if(TodoStore.areAllComplete()){
         updateAll({complete:false});
      }else{
         updateAll({complete:true});
      }
      TodoStore.emitChange();
      break;
    case TodoConstants.TODO_UNDO_COMPLETE:
      update(action.id,{complete:false});
      TodoStore.emitChange();
    case TodoConstants.TODO_DESTROY_COMPLETED:
      destroyCompleted();
      TodoStore.emitChange();
    default:

  }
});

module.exports = TodoStore;
