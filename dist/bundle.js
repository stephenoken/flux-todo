(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var _createClass = (function () {
   function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
         var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
      }
   }return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
   };
})();

function _classCallCheck(instance, Constructor) {
   if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
   }
}

var constant = require('./constants/TodoConstants.jsx');

var Animal = (function () {
   function Animal() {
      _classCallCheck(this, Animal);
   }

   _createClass(Animal, [{
      key: "makeNoise",
      value: function makeNoise() {
         return "Bark goes the animal";
      }
   }]);

   return Animal;
})();

var lola = new Animal();
console.log(lola.makeNoise());
var test = lola.makeNoise();
if (test == "Hello") {}

},{"./constants/TodoConstants.jsx":2}],2:[function(require,module,exports){
// class Animal {
//    constructor(name) {
//       this._name = name;
//    }
//
//    makeNoise(){
//       return `${this._name} made a noise !!`;
//    }
// }
// module.exports = Animal;
'use strict';

var constants = {
   TODO_CREATE: 'TODO_CREATE',
   TODO_COMPLETED: 'TODO_COMPLETED',
   TODO_DESTROY: 'TODO_DESTROY',
   TODO_DESTROY_COMPLETED: 'TODO_DESTROY_COMPLETED',
   TODO_TOGGLE_COMPLETE_ALL: 'TODO_TOGGLE_COMPLETE_ALL',
   TODO_UNDO_COMPLETE: 'TODO_UNDO_COMPLETE',
   TODO_UPDATE_TEXT: 'TODO_UPDATE_TEXT'
};
module.exports = constants;

},{}]},{},[1])


//# sourceMappingURL=bundle.js.map