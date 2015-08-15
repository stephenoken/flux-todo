class Converter {
   constructor(){
      this._name = "James";
   }

   padding(value) {
      return (value.length === 1)? 0+value:value;
   }
   sayHello(name) {
      this._name = name||this._name;
      return this._name;
   }
   rgbToHex(r,g,b) {
      var _red = r.toString(16);
      var _green = g.toString(16);
      var _blue = b.toString(16);
      return this.padding(_red)+this.padding(_green)+this.padding(_blue);
   }
   hextoRgb(hex) {
      var _red = parseInt(hex.substring(0,2),16);
      var _green = parseInt(hex.substring(2,4),16);
      var _blue = parseInt(hex.substring(4,6),16);
      return [_red,_green,_blue];
   }
}

module.exports = new Converter();
