var React = require('react');
var TodoStore = require('../stores/TodoStore.jsx');

/*components*/
var Header = require('./Header.react.jsx');

function getTodoState() {
  return{
    allTodos: TodoStore.getAll(),
    areAllComplete: TodoStore.areAllComplete()
  };
}
var TodoApp = React.createClass({
  getInitialState: function () {
    return getTodoState();
  },
  componentDidMount:function () {
    TodoStore.addChangeListener(this._onChange);
  },
  componentWillUnmount:function () {
    TodoStore.removeChangeListener(this._onChange);
  },
  render: function () {
    return (
      <div>
        <Header/>
        <div>Hello World 2.0</div>
      </div>
    );
  },
  /**
  * Event handler for 'change' events coming from the TodoStore
  */
  _onChange: function() {
    this.setState(getTodoState());
  }
});

module.exports = TodoApp;
