var Dispatcher = require('flux').Dispatcher;
function test(a) {
   return a*8;
}

var a = 2;
test(a);
module.exports = new Dispatcher();
