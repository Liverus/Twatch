const getPixels    = require("get-pixels");
const axios        = require("axios");
const fs           = require('fs');
const CryptoJS     = require('crypto-js');
const images       = require('images');

const generator    = require('./generator.js');

const funcaptcha_token_url  = "https://client-api.arkoselabs.com/fc/gt2/public_key/";
const funcaptcha_url        = "https://client-api.arkoselabs.com/fc/gfct/";
const funcaptcha_begin_url  = "https://client-api.arkoselabs.com/fc/a/";
const funcaptcha_answer_url = "https://client-api.arkoselabs.com/fc/ca/";

const legit_arkoselabs_headers = {
  headers: {
    Host:   "client-api.arkoselabs.com",
    Origin: "https://client-api.arkoselabs.com"
  }
};

const legit_twatch_captcha_headers = {
  headers: {
    Host:   "client-api.arkoselabs.com",
    Origin: "https://www.twitch.tv"
  }
};

// Original Code

const ALFCCJSAesJson = {
  stringify: function (d6C) {
    var Z6C;
    Z6C = {
      ct: d6C.ciphertext.toString(CryptoJS.enc.Base64)
    };
    if (d6C.iv) Z6C.iv = d6C.iv.toString();
    if (d6C.salt) Z6C.s = d6C.salt.toString();
    return JSON.stringify(Z6C);
  }
}

axios.interceptors.request.use(function (config) {

  let method = config.method;

  config.headers[method] = Object.assign(config.headers[method], {
    ["TE"]:              "Trailers",
    ["Pragma"]:          "no-cache",
    ["Connection"]:      "keep-alive",
    ["Accept-Language"]: "en-US,en;q=0.5",
    ["cache-control"]:   "no-cache",
  });

  config.headers[method]["User-Agent"] = generator.UserAgent();

  return config;
}, function (error) {
  return Promise.reject(error);
});


function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function MakeResponse(n){

	let scale   = 100;
	let start_x = (n%3) * scale;
	let start_y = ((n-n%3) / 3) * scale;

	let x  = start_x + Math.floor(Math.random() * (scale - 1) + 1);
	let y  = start_y + Math.floor(Math.random() * (scale - 1) + 1);
	let px = (x/(scale * 3)).toFixed(2).toString();
	let py = (y/(scale * 2)).toFixed(2).toString();

	let result = {x:x, y:y, px:px, py:py};

	return result;
}

async function GetChallengeToken(key){

	let data = new URLSearchParams({
		public_key: key,
		site: "https://www.twitch.tv",
		language: "en"
	}).toString();

	let res = await axios.post(funcaptcha_token_url + key, data, legit_twatch_captcha_headers);

  	return res.data.token.split('|')[0];
}

async function GetChallenge(session_token){

	let data = new URLSearchParams({
		analytics_tier: "40",
		token: session_token,
		sid: "eu-west-1",
		render_type: "canvas",
		lang: "en",
		"data[status]": "init"
	}).toString();

	let res = await axios.post(funcaptcha_url, data, legit_arkoselabs_headers);

  	return res.data;
}

async function BeginChallenge(session_token){
	
	let data = new URLSearchParams({
		session_token: session_token,
		analytics_tier: "40",
		category: "site+URL",
		render_type: "canvas",
		sid:"eu-west-1",
		action: "https://www.twitch.tv/"
	}).toString();

	let res = await axios.post(funcaptcha_begin_url, data, legit_arkoselabs_headers);
}

async function BeginChallenge2(session_token, game_token){
	
	let data = new URLSearchParams({
		session_token: session_token,
		game_token: game_token,
		analytics_tier: "40",
		category: "loaded",
		render_type: "canvas",
		sid:"eu-west-1",
		action: "game+loaded"
	}).toString();

	let res = await axios.post(funcaptcha_begin_url, data, legit_arkoselabs_headers);
}

async function BeginChallenge3(session_token, game_token){
	
	let data = new URLSearchParams({
		session_token: session_token,
		game_token: game_token,
		analytics_tier: "40",
		category: "begin+app",
		game_type: "3",
		render_type: "canvas",
		sid:"eu-west-1",
		action: "user+clicked+verify"
	}).toString();

	let res = await axios.post(funcaptcha_begin_url, data, legit_arkoselabs_headers);
}

async function AnswerChallenge(session_token, game_token, answer){
	
	let data = new URLSearchParams({
		session_token: session_token,
		game_token: game_token,
		guess: answer,
		sid:"eu-west-1",
		analytics_tier: "40"
	}).toString();
	
	let res = await axios.post(funcaptcha_answer_url, data, legit_arkoselabs_headers);

	console.log(res.data);

	return res.data.response === "answered" && res.data.solved;
}

async function SolveChallenge(session_token){
	//await BeginChallenge(session_token);

	let challenge     = await GetChallenge(session_token);

	let waves         = challenge.game_data.waves;
	let images        = challenge.game_data.customGUI._challenge_imgs;
	let game_token    = challenge.challengeID;

	//console.log("Session Token: ", session_token);
	//console.log("Game Token: ", game_token);
	//console.log("Waves: ", waves);

	// Not needed, but should be used if you wanna make it seems legit
	// await BeginChallenge(session_token, game_token);
	// await BeginChallenge2(session_token, game_token);
	// await BeginChallenge3(session_token, game_token);

	let response = [];

	for (var i = 0; i < waves; i++) {
		let image      = images[i];
		let valid_frog = await GetValidFrog(image);
		//let valid_frog = randomInteger(1, 6);
		let rep = MakeResponse(valid_frog-1)

		response.push(rep);
	}

	let encrypted = CryptoJS.AES.encrypt(JSON.stringify(response), session_token, {format: ALFCCJSAesJson}).toString();

	let result = await AnswerChallenge(session_token, game_token, encrypted);

	if(result){
	 	return true;
	 }else{
	 	return false;
	 }

	return session_token;
}

async function SolveCaptcha(key){

	let session_token;
	let attemps = 0;
	let solved  = false;

	while(!solved){

		//if(!attemps || attemps%10 == 0){
		session_token = await GetChallengeToken(key);
		//}

		attemps++;

		solved = await SolveChallenge(session_token);
	}

	console.log('Captcha solved after ' + attemps + " attempt" + (attemps-1 ? "s" : "") + " (Token: " + session_token + ")");

	return session_token;
}

module.exports = async(key)=>{
	return await SolveCaptcha(key);
};