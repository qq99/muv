var process = require("child_process");

var testing = "Bobs.Burgers.S03E22.HDTV.x264-LOL.mp4";

var guessit = process.spawn('guessit', [testing, '-a']);

guessit.stdout.on('data', function(data) {
  console.log('stdout: ' + data);


  var guessitStr = data.toString();
  var dataBeginsAt = "GuessIt found: ";
  var start = guessitStr.indexOf(dataBeginsAt) + dataBeginsAt.length;

  var jsonStr = guessitStr.substring(start);

  var jsonResult = JSON.parse(jsonStr);

  console.log('json: ', jsonResult);

});

guessit.stderr.on('data', function(data) {
  console.log('stderr: ', data);
});

guessit.on('close', function(data) {
  console.log('code: ', data);
});