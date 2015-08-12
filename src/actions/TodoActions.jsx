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
      })
   }
}
