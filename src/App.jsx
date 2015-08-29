let React = require('react');
let injectTapEventPlugin = require('react-tap-event-plugin');

window.React = React;
injectTapEventPlugin();
var TodoApp = require('./components/TodoApp.react.jsx');

React.render(
  <TodoApp/>,
  document.body
);
