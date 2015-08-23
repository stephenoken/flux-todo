var React = require('react');
var TodoStore = require('../stores/TodoStore');
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
      <div>Hello World</div>
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
