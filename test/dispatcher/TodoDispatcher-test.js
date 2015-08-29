var expect = require('chai').expect;
var sinon = require('sinon');
var sinonChai = require("sinon-chai");

require('chai').use(sinonChai);

describe('TodoDispatcher', function () {
  var TodoDispatcher;
  beforeEach(function () {
    TodoDispatcher = require('../../src/dispatcher/TodoDispatcher.jsx');
  });
  it('imports the dipsater module', function () {
    expect(TodoDispatcher).not.to.be.null;
  });
  it('sends actions to subscribers', function () {
    var listener = sinon.spy();
    TodoDispatcher.register(listener);

    var payload = {};
    TodoDispatcher.dispatch(payload);
    expect(listener).to.be.calledOnce;
    expect(listener.getCall(0).args[0]).to.be.equal(payload);
  });
  it('waits with chained dependancies properly', function () {
    var payload = {};

    var listener1Done = false;
    var listener1 = function (pl) {
      TodoDispatcher.waitFor([index2,index4]);
      expect(listener2Done).to.be.true;
      expect(listener3Done).to.be.true;
      expect(listener4Done).to.be.true;
      listener1Done = true;
    };

    var index1 = TodoDispatcher.register(listener1);

    var listener2Done = false;
    var listener2 = function (pl) {
      TodoDispatcher.waitFor([index3]);
      expect(listener3Done).to.be.true;
      listener2Done = true;
    };

    var index2 = TodoDispatcher.register(listener2);

    var listener3Done = false;
    var listener3 = function (pl) {
      listener3Done = true;
    };

    var index3 = TodoDispatcher.register(listener3);

    var listener4Done = false;
    var listener4 = function (pl) {
      TodoDispatcher.waitFor([index3]);
      expect(listener3Done).to.be.true;
      listener4Done = true;
    };

    var index4 = TodoDispatcher.register(listener4);

    var TodoDispatcherLifeCycleAPI = {
      runs: (function () {
        TodoDispatcher.dispatch(payload);
      }),
      waitsFor: (function () {
        return listener1Done;
      }),
      runAll: (function () {
        expect(listener1Done).to.be.true;
        expect(listener2Done).to.be.true;
        expect(listener3Done).to.be.true;
      })
    };
    TodoDispatcherLifeCycleAPI.runs();
    TodoDispatcherLifeCycleAPI.waitsFor();
    TodoDispatcherLifeCycleAPI.runAll();
  });

});
