var React = require('react');
var mui = require('material-ui');
var TodoStore = require('../stores/TodoStore.jsx');
var ThemeManager = require('material-ui/lib/styles/theme-manager')();
var Colors = mui.Styles.Colors;

/*components*/
var Header = require('./Header.react.jsx');
var Footer = require('./Footer.react.jsx');
var MainSection = require('./MainSection.react.jsx');

ThemeManager.setTheme(ThemeManager.types.DARK);
function getTodoState() {
  return{
    allTodos: TodoStore.getAll(),
    areAllComplete: TodoStore.areAllComplete()
  };
}
var TodoApp = React.createClass({
  childContextTypes: {
   muiTheme: React.PropTypes.object
  },

  getChildContext() {
   return {
     muiTheme: ThemeManager.getCurrentTheme()
   };
  },
  componentWillMount() {
    ThemeManager.setPalette({
      accent1Color: Colors.deepOrange500,
      primary1Color: Colors.green700
    });
    ThemeManager.setComponentThemes({
      appBar: {
        color: Colors.deepOrange500,
        textColor: Colors.grey50
      }
    });
  },
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
        <MainSection allTodos={this.state.allTodos} areAllComplete={this.state.areAllComplete}/>
        <Footer allTodos={this.state.allTodos}/>
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
