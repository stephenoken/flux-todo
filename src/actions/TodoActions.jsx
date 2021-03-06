var TodoDispatcher = require('../dispatcher/TodoDispatcher.jsx');
var TodoConstants = require('../constants/TodoConstants.jsx');

class TodoActions {
   create(text){
         TodoDispatcher.dispatch({
            actionType: TodoConstants.TODO_CREATE,
            text: text
         });
   }

   updateText(id, text){
      TodoDispatcher.dispatch({
         actionType: TodoConstants.TODO_UPDATE_TEXT,
         id: id,
         text: text
      });
   }

   toggleComplete(todo){
     var id = todo.id;
     var actionType = todo.complete? TodoConstants.TODO_UNDO_COMPLETE : TodoConstants.TODO_COMPLETED;
     TodoDispatcher.dispatch({
       actionType: actionType,
       id : id
     });
   }

   toggleAllComplete(){
     TodoDispatcher.dispatch({
       actionType: TodoConstants.TODO_TOGGLE_ALL_COMPLETE
     });
   }

   destroy(id){
     TodoDispatcher.dispatch({
       actionType: TodoConstants.TODO_DESTROY,
       id:id
     });
   }

   destroyCompleted(){
     TodoDispatcher.dispatch({
       actionType: TodoConstants.TODO_DESTROY_COMPLETED
     });
   }
}

var actions  = new TodoActions();
module.exports = actions;
