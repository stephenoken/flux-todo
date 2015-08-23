var constant = require('./constants/TodoConstants.jsx');
class Animal {
   makeNoise(){
      return "Bark goes the animal";
   }
}

var lola = new Animal();
console.log(lola.makeNoise());
var test = lola.makeNoise();
if(test == "Hello"){}
