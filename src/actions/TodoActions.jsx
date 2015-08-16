var TodoDispatcher = require('../dispatcher/TodoDispatcher');
var TodoConstants = require('../constants/TodoConstants');

class TodoActions {
   create(text){
         TodoDispatcher.dispatch({
            actionType: TodoConstants.TODO_CREATE,
            text: text
         });
   }

   updateText(id, text){
      TodoDispatcher.dispatch({
         actionType: TodoConstants.TODO_CREATE,
         id: id,
         text: text
      });
   }

   toggleComplete(todo){
     var id = todo.id;
     var actionType = todo.complete? TodoConstants.TODO_UNDO_COMPLETE : TodoConstants.TODO_COMPLETE;
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

   destroy(ID){
     TodoDispatcher.dispatch({
       actionType: TodoConstants.TODO_DESTROY,
       id:id
     });
   }

   destroyCompleted(){
     TodoDispatcher.dispatch({
       actionType: TodoConstants.TODO_DESTROY_COMPLETED,
       id:id
     });
   }
}

var actions  = new TodoActions();
module.exports = actions;
