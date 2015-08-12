var $ = require('jquery');
var React = require("react");
var angular = require("angular");
var underscore = require('underscore');
$(function () {
   console.log("Loaded !!!");
});
class Foo {
   constructor() {

   }
   bar(x){
      return x * 4;
   }
}

var Bar = new Foo();

console.log(Bar.bar(3));

var HelloMessage = React.createClass({
   render:function () {
      return(
         <div>
            <h1>Hello World!</h1>
            <p>One directional binding!!!!!</p>
            <ul>
            <li>jquery</li>
            <li>react</li>
            <li>angular</li>
            <li>underscore</li>
            <li>jqueryui</li>
            </ul>
         </div>
      );
   }
});

React.render(
   React.createElement(HelloMessage,null),
   document.getElementById('content')
);
