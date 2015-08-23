var expect = require('chai').expect;
var converter = require('../../src/example/test.jsx');

describe('Check if the modules are being imported', function () {
   it('imports sets the converter name', function () {
      var response = converter.sayHello("Jeb");
      expect(response).to.equal("Jeb");
   });
});

describe("Color code converter",function () {
   describe('RGB to HEX conversion', function () {
      it('converts the basic colours', function () {
         var redHex = converter.rgbToHex(255,0,0);
         var greenHex = converter.rgbToHex(0,255,0);
         var blueHex = converter.rgbToHex(0,0,255);
         expect(redHex).to.equal("ff0000");
         expect(greenHex).to.equal("00ff00");
         expect(blueHex).to.equal("0000ff");
      });
   });
   describe('HEX to RGB conversion', function () {
      it('converts the basic colours', function () {
         var red = converter.hextoRgb("ff0000");
         var green = converter.hextoRgb("00ff00");
         var blue = converter.hextoRgb("0000ff");
         expect(red).to.deep.equal([255,0,0]);
         expect(green).to.deep.equal([0,255,0]);
         expect(blue).to.deep.equal([0,0,255]);
      });
   });
});
