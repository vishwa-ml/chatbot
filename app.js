
var builder = require('botbuilder');
var restify = require('restify');
const request = require('request');

var server =restify.createServer();
	server.listen( process.env.PORT || 3979, function () {
	console.log('%s listening to %s', server.name, server.url);
	});

var inMemoryStorage = new builder.MemoryBotStorage();

var connector = new builder.ChatConnector(); server.post('/api/messages',connector.listen());
var bot= new builder.UniversalBot(connector).set('storage',inMemoryStorage);

var luisapApId="bbfc0976-25e8-4f12-9c83-1950deeb9759";
var luisApiKey="126a7fc179ee4fd8a139f1009c356d08";
var luisApiHostname="westus.api.cognitive.microsoft.com";
var weather_api_Key = '1bf6746681544f21c8cdf01f826f17ec';
const luisModelUrl='https://'+luisApiHostname+'/luis/v2.0/apps/'+luisapApId+'?subscription-key='+luisApiKey;

var recognizer= new builder.LuisRecognizer(luisModelUrl);
var intents= new builder.IntentDialog({
	recognizers : [recognizer]
	});

bot.dialog('/',intents);
intents.matches('Greet',(session,args,nest)=>{
	session.send("Hello! This is a weather bot. I can help you know the	weather of any city.");
	});

intents.matches('weather',[(session,args,nest)=> {
	var city = args.entities.filter(e => e.type == 'city');
	if (city.length > 0) {
		session.userData.city = city[0].entity;
		let url = `http://api.openweathermap.org/data/2.5/weather?q=${session.userData.city}&units=metric&appid=${weather_api_Key}`

		request(url, function (err, response, body){
		  if (err) {
				console.log('error:', error);
			} else {
				let weather = JSON.parse(body);
				console.log('weather is ', weather);
				try {
					let message = `The weather details for
${weather.name} is-- Maximum Temperature(in Degree Celsius):
${weather.main.temp_max}, Minimum Temperature(in Degree Celsius):
${weather.main.temp_min}, Humidity : ${weather.main.humidity}%, Forecast:
${weather.weather[0].description}, Wind Speed: ${weather.wind.speed} Km/h`;
						session.send(message);
					}
				catch (e) {
					console.log('output for weather is ', weather);
					console.log('The exception message is: ',e);
					let message = 'Sorry, we could not process your request';
				    session.send(message);
				}
			}
		 });
		} else {
				delete session.userData.city;
		       }
  },
		(session, args, next) => {
		 if (!session.userData.city) {
			 session.beginDialog('askNameOfCity');
		 } else {
			next();
		 }
}]);

bot.dialog('askNameOfCity', [(session, args, next) => {
	builder.Prompts.text(session, 'Which city weather are you interested in?')
  }, (session, results) => {
	  session.userData.city = results.response.entity;
	  console.log('this is after city: ',session.userData.city);
	  onsole.log('this is after centity ',results);
	  session.endDialogWithResult(results);
 }]);