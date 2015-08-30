var React = require('react');
var ReactPropTypes = React.PropTypes;
var TodoActions = require('../actions/TodoActions.jsx');
var TodoItem = require('./TodoItem.react.jsx');
var mui = require('material-ui');

// var TodoItems = require('');

//Material-components
var Checkbox = mui.Checkbox;
var List = mui.List;

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
           <Checkbox
             id="toggle-all"
             name="checkboxName1"
             value="checkboxValue1"
             label="Mark all as Complete"
             onCheck={this._onToggleCompleteAll}
             defaultChecked={this.props.areAllComplete}
            />
          <List>{todos}</List>
         </section>
      );
            // <ul id="todo-list">{todos}</ul>
   },
   _onToggleCompleteAll:function () {
      TodoActions.toggleAllComplete();
   }
});

module.exports = MainSection;
