var React = require('react');
var ReactPropTypes = React.PropTypes;
var TodoActions = require('../actions/TodoActions.jsx');
var TodoTextInput = require('./TodoTextInput.react.jsx');
var mui = require('material-ui');

var classNames = require('classnames');

//Material Components
var ListItem = mui.ListItem;
var Checkbox = mui.Checkbox;

var TodoItem = React.createClass({
   propTypes: {
      todo: ReactPropTypes.object.isRequired
   },

   getInitialState: function () {
      return {
         isEditing: false
      };
   },

   render: function () {
      var todo = this.props.todo;

      var input;
      if (this.state.isEditing) {
         input =
            <TodoTextInput
               className="edit"
               onSave={this._onSave}
               value={todo.text}
            />;
        }else{
          input = todo.text;
        }

      var checkBox =
      <Checkbox
        onCheck={this._onToggleComplete}
        defaultChecked={todo.complete}
       />;


      return (
        <ListItem
          primaryText={input}
          leftCheckbox={checkBox}
        />
        //  <li
        //     className={classNames({
        //        'completed': todo.complete,
        //        'editing': this.state.isEditing
        //     })}
        //     key={todo.id}>
        //     <div className="view">
              //  <input
              //     className="toggle"
              //     type="checkbox"
              //     checked={todo.complete}
              //     onChange={this._onToggleComplete}
              //  />
        //        <label onDoubleClick={this._onEdit}>
        //           {todo.text}
        //        </label>
        //        <input type="button" className="destroy" onClick={this._onDestroyClick}/>
        //     </div>
        //     {input}
        //  </li>
      );
   },
   _onToggleComplete:function () {
      TodoActions.toggleComplete(this.props.todo);
   },
   _onEdit:function () {
      this.setState({
         isEditing: true
      });
   },
   _onDestroyClick:function () {
      TodoActions.destroy(this.props.todo.id);
   },
   _onSave:function (text) {
      TodoActions.updateText(this.props.todo.id, text);
      this.setState({
         isEditing: false
      });
   }
});

module.exports = TodoItem;
