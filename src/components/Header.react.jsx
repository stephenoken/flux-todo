var React = require('react');
var mui = require('material-ui');
var ThemeManager = require('material-ui/lib/styles/theme-manager')();
var Colors = mui.Styles.Colors;

var TodoActions = require('../actions/TodoActions.jsx');

//Components
var TodoTextInput = require('./TodoTextInput.react.jsx');
//Material Components
var AppBar = mui.AppBar;
var LeftNav = mui.LeftNav;
var MenuItem = mui.MenuItem;

var Header = React.createClass({

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
  },
  render: function () {
     var menuItems = [
     { route: 'get-started', text: 'Get Started' },
     { route: 'customization', text: 'Customization' },
     { route: 'components', text: 'Components' },
     { type: MenuItem.Types.SUBHEADER, text: 'Resources' },
     {
        type: MenuItem.Types.LINK,
        payload: 'http://material-ui.com/#/',
        text: 'Material-UI'
     },
     {
        text: 'Disabled',
        disabled: true
     },
     {
        type: MenuItem.Types.LINK,
        payload: 'https://www.google.com',
        text: 'Disabled Link',
        disabled: true
     }
  ];
      return (
         <header id="header">
            <LeftNav
               ref="leftNav"
               docked={false}
               menuItems={menuItems}
            />
            <AppBar
               title="Todos !!!"
               className="toolbar"
               isInitiallyOpen={true}
               onLeftIconButtonTouchTap={this._handleClick}
            />
            <div id="app-bar-margin"></div>
            <TodoTextInput
               id="new-todo"
               placeholder="What needs to be done?"
               onSave={this._onSave}
            />
         </header>
      );
  },
  _handleClick: function (e) {
      e.preventDefault();
     this.refs.leftNav.toggle();
  },
  _onSave: function (text) {
    if(text.trim()){
      TodoActions.create(text);
    }
  }
});

module.exports = Header;
