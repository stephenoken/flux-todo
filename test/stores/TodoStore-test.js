var expect = require('chai').expect;
var sinon = require('sinon');
var sinonChai = require("sinon-chai");

require('chai').use(sinonChai);

describe('TodoStore', function () {
  var TodoConstants = require('../../src/constants/TodoConstants');
  var TodoDispatcher,
  TodoStore,
  callback;

  var actionTodoCreate = {
    actionType: TodoConstants.TODO_CREATE,
    text: 'foo'
  };
  var actionTodoDestroy = {
    actionType: TodoConstants.TODO_DESTROY,
    id: 'replace in test'
  };

  beforeEach(function () {
    TodoDispatcher = require('../../src/dispatcher/TodoDispatcher');
    TodoStore = require('../../src/stores/TodoStore');
    //Note that you will need to create a callback spy and place a spy
    //on the register function.
    callback = sinon.spy();
    sinon.spy(TodoDispatcher, "register");
    TodoDispatcher.register(callback);
  });

  afterEach(function () {
    TodoDispatcher.register.restore();
  });

  it('registers a callback with the dispatcher', function () {
    expect(TodoDispatcher.register).to.be.calledOnce;
  });

  it('should initialise with no to-do items', function () {
    var all = TodoStore.getAll();
    expect(all).to.be.empty;
  });

  it('creates a to-do item', function () {
    TodoDispatcher.dispatch(actionTodoCreate);
    var all = TodoStore.getAll();
    var keys = Object.keys(all);
    expect(keys.length).to.be.equal(1);
    expect(all[keys[0]].text).to.be.equal("foo");
  });

  it('destorys a to-do item', function () {
    var all = TodoStore.getAll();
    var keys = Object.keys(all);
    expect(keys.length).to.be.equal(1);
    actionTodoDestroy.id = keys[0];
    TodoDispatcher.dispatch(actionTodoDestroy);
    expect(all[keys[0]]).to.be.undefined;
  });

  it('can determine whether all to-do items are complete', function () {
    for (var i = 0; i < 3; i++) {
      TodoDispatcher.dispatch(actionTodoCreate);
    }
    var all = TodoStore.getAll();
    var keys = Object.keys(all);
    expect(keys.length).to.be.equal(3);
    expect(TodoStore.areAllComplete()).to.be.false;
    for(var key in all){
        TodoDispatcher.dispatch({
          actionType: TodoConstants.TODO_COMPLETED,
          id: key
        });
    }
    expect(TodoStore.areAllComplete()).to.be.true;
    TodoDispatcher.dispatch({
      actionType: TodoConstants.TODO_UNDO_COMPLETE,
      id: key
    });
    expect(TodoStore.areAllComplete()).to.be.false;
  });

  it('can update the text of a todo', function () {
     var all = TodoStore.getAll();
     var keys = Object.keys(all);
     expect(keys.length).to.be.equal(1);

     var key = keys[0];
     var todo = all[key];
     expect(todo.text).to.be.equal("foo");
     TodoDispatcher.dispatch({
        actionType: TodoConstants.TODO_UPDATE_TEXT,
        id: key,
        text: "bar"
     });
     expect(todo.text).to.be.equal("bar");
  });

  it('can destroy all completed tasks', function () {
     //Create two additional todos
     for(var i = 0; i < 2; i++){
        TodoDispatcher.dispatch(actionTodoCreate);
     }
     var all = TodoStore.getAll();
     var keys = Object.keys(all);
     expect(keys.length).to.be.equal(3);
     //Set one todo as complete
     var key = keys[0];
     TodoDispatcher.dispatch({
       actionType: TodoConstants.TODO_COMPLETED,
       id: key
     });
     var todo = all[key];
     expect(todo.complete).to.be.true;
     //Destroy completed todo
     TodoDispatcher.dispatch({
        actionType: TodoConstants.TODO_DESTROY_COMPLETED
     });
     keys = Object.keys(all);
     expect(keys.length).to.be.equal(2);
  });

  it('can set remaining todos to be all completed or uncompleted', function () {
     expect(TodoStore.areAllComplete()).to.be.false;
     TodoDispatcher.dispatch({
        actionType: TodoConstants.TODO_TOGGLE_ALL_COMPLETE
     });
     expect(TodoStore.areAllComplete()).to.be.true;
     TodoDispatcher.dispatch({
        actionType: TodoConstants.TODO_TOGGLE_ALL_COMPLETE
     });
     expect(TodoStore.areAllComplete()).to.be.false;
  });
  // TODO: Put these tests in thier own descibe block or change the others to account for localStorage
  // it('can store todos in local storage',function () {
  //    var all = TodoStore.getAll();
  //    var keys = Object.keys(all);
  //    expect(keys.length).to.be.equal(2);
  //    var todos = JSON.parse(localStorage["todos"]);
  //    expect(todos[keys[0]].text).to.be.equal("foo");
  // });
  //
  // it('can delete todos in local storage', function () {
  //    var all = TodoStore.getAll();
  //    var keys = Object.keys(all);
  //    actionTodoDestroy.id=keys[0];
  //    TodoDispatcher.dispatch(actionTodoDestroy);
  //    var todos = JSON.parse(localStorage["todos"]);
  //    expect(todos[keys[1]].id).to.be.equal(keys[1]);
  // });

});
