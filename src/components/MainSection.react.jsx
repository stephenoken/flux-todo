var React = require('react');
var ReactPropTypes = React.PropTypes;
var TodoActions = require('../actions/TodoActions.jsx');
var TodoItem = require('./TodoItem.react.jsx');
// var TodoItems = require('');

var MainSection = React.createClass({
   propTypes:{
      allTodos: ReactPropTypes.object.isRequired,
      areAllComplete: ReactPropTypes.bool.isRequired
   },
   render:function () {
      if (Object.keys(this.props.allTodos).length < 1) {
         return null;
      }

      var allTodos = this.props.allTodos;
      var todos = [];

      for (var key in allTodos) {
         todos.push(<TodoItem key={key} todo={allTodos[key]} />);
      }

      return(
         <section id="main">
            <input
               id="toggle-all"
               type="checkbox"
               onChange={this._onToggleCompleteAll}
               checked={this.props.areAllComplete? 'checked':''}
            />
            <label htmlFor="toggle-all">Mark all as Complete</label>
            <ul id="todo-list">{todos}</ul>
         </section>
      );
   },
   _onToggleCompleteAll:function () {
      TodoActions.toggleAllComplete();
   }
});

module.exports = MainSection;
