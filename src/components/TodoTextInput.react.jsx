var React = require('react');
var mui = require('material-ui');
var ThemeManager = require('material-ui/lib/styles/theme-manager')();

//Material-components
var TextField = mui.TextField;
var ReactPropTypes = React.PropTypes;

var ENTER_KEY_CODE = 13;

var TodoTextInput = React.createClass({
  childContextTypes: {
    muiTheme: React.PropTypes.object
  },

  getChildContext() {
    return {
      muiTheme: ThemeManager.getCurrentTheme()
    };
  },
  propTypes:{
    className: ReactPropTypes.string,
    id: ReactPropTypes.string,
    placeholder: ReactPropTypes.string,
    onSave: ReactPropTypes.func.isRequired,
    value: ReactPropTypes.string
  },
  getInitialState: function () {
    return {
      value: this.props.value || ''
    };
  },
  render: function () {
    return(
      <TextField
        hintText={this.props.placeholder}
        floatingLabelText="What to do"
        id={this.props.id}
        onBlur={this._save}
        onChange={this._onChange}
        onKeyDown={this._onKeyDown}
        value={this.state.value}
        autoFocus={true}
      />
      // <input
      //   className={this.props.className}
      //   id={this.props.id}
      //   placeholder={this.props.placeholder}
      //   onBlur={this._save}
      //   onChange={this._onChange}
      //   onKeyDown={this._onKeyDown}
      //   value={this.state.value}
      //   autoFocus={true}
      //   />
    );
  },
  /**
   * Invokes the callback passed in as onSave, allowing this component to be
   * used in different ways.
   */
   _save:function () {
     this.props.onSave(this.state.value);
     this.setState({
       value: ''
     });
   },
   _onChange: function (event) {
     this.setState({
       value: event.target.value
     });
   },
   _onKeyDown: function (event) {
     if (event.keyCode == ENTER_KEY_CODE) {
       this._save();
     }
   }
});

module.exports = TodoTextInput;
