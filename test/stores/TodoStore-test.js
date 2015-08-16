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
    callback = sinon.spy();
    TodoDispatcher.register(callback);
  });

  it('registers a callback with the dispatcher', function () {
    var payload = {}
    TodoDispatcher.dispatch(payload);
    expect(callback).to.be.calledOnce;
  });

  it('should initialise wiht no to-do items', function () {
    var all = TodoStore.getAll();
    expect(all).to.be.empty;
  });

  it('creates a to-do item', function () {
    // callback(actionTodoCreate);
    TodoDispatcher.dispatch(actionTodoCreate);
    var all = TodoStore.getAll();
    var keys = Onject.keys(all);
    expect(keys.length).to.be.equal(1);
  });
});
