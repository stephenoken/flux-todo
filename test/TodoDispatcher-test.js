var expect = require('chai').expect;
var sinon = require('sinon');
var sinonChai = require("sinon-chai");

require('chai').use(sinonChai);

describe('TodoDispatcher', function () {
  var TodoDispatcher;
  beforeEach(function () {
    TodoDispatcher = require('../src/dispatcher/TodoDispatcher.jsx');
  });
  it('imports the dipsater module', function () {
    expect(TodoDispatcher).not.to.be.null;
  });
  it('sends actions to subscribers', function () {
    var listener = sinon.spy();
    TodoDispatcher.register(listener);

    var payload = {}
    TodoDispatcher.dispatch(payload);
    expect(listener).to.be.calledOnce;
  });
});
