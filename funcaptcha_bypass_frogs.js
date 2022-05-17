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


function GetDist(point1, point2){
	return Math.sqrt(Math.pow(point2.x-point1.x, 2) + Math.pow(point2.y-point1.y, 2));
}

function GetFrogBounds(scale, pixels){

	let bounds = [];

	const image_bounds = [
		{x: 0,     y: 0,      x_dot:  1, y_dot:  1},
		{x: scale, y: 0,      x_dot: -1, y_dot:  1},
		{x: 0,     y: scale,  x_dot:  1, y_dot: -1},
		{x: scale, y: scale,  x_dot: -1, y_dot: -1},
	]

	image_bounds.forEach((bound)=>{

		let points = [];

		for (var _y = 0; _y < scale; _y++) {
			for (var _x = 0; _x < scale; _x++) {
				let x = bound.x + _x * bound.x_dot;
				let y = bound.y + _y * bound.y_dot;

				let pixel = pixels[y][x];

				for (var c = 0; c < 3; c++){
					if(pixel[c] != 255){
						points.push({x: x, y: y});
						break;
					}
				}
			}
		}

		let closest;

		points.forEach((point)=>{
			let x    = point.x;
			let y    = point.y;
			let dist = GetDist(bound, point);

			if(!closest || closest.dist > dist){
				closest = {
					dist: dist,
					x: x,
					y: y
				}
			}
		});

		bounds.push({
			x: closest.x,
			y: closest.y
		});
	});

	return bounds;
}

function GetFrogAngle(bounds){
	let angles = [];

	for (var i = 0; i < 4; i+=2){
		let left_bound  = bounds[i];
		let right_bound = bounds[i+1];
	    let rad = Math.atan2(left_bound.x-right_bound.x, left_bound.y-right_bound.y)
	    let deg = (rad * 180) / Math.PI + 90;

	    angles.push(deg);
	}

	let angle = (angles[0] + angles[1]) / 2;

	return angle;
}

function GetFrogDist(bounds){

	let dist_1 = GetDist(bounds[0], bounds[1]);
	let dist_2 = GetDist(bounds[0], bounds[2]);
	let dist_3 = GetDist(bounds[2], bounds[3]);
	let dist_4 = GetDist(bounds[1], bounds[3]);

	let dist_sum   = (dist_1 + dist_2 + dist_3 + dist_4) / 4;
	let dist_delta = (Math.abs(dist_1 - dist_3) + Math.abs(dist_2 - dist_4)) / 2;

	return {
		sum: dist_sum,
		delta: dist_delta
	};
}

function NDArrayToArray(arr){
	let new_arr = [];
	for (var i = 0; i < arr.length; i++) {
		new_arr.push(arr.get(i));
	}

	return new_arr;
}

async function GetValidFrog(url){
	let valid;

	let res = await axios.get(url, {
		responseType: 'arraybuffer'
	});

	let img_name = (url.split("/").slice(-1)[0]).split("?")[0].split('.gif')[0];
	let jpg;

	try{
		jpg = images(res.data);
	} catch(err){
		//console.log(err)
		return 0;
	}

	jpg = jpg.encode('jpg');

	getPixels(jpg, "image/jpg", async function(err, pixels_ndarray) {

	  let width        = pixels_ndarray.shape[0];
	  let height       = pixels_ndarray.shape[1];
	  let channels     = pixels_ndarray.shape[2];

	  let image_number = 6;

	  	for (var i = 0; i < image_number; i++) {
	  		let pixels = {};

	  		let scale         = 100;
	  		let inside_offset = 3
	  		let inside_scale  = scale - inside_offset * 2

	  		let start_x = (i%3) * scale;
	  		let start_y = ((i-i%3) / 3) * scale;

	  		for (var y = 0; y < inside_scale; y++){
		  		for (var x = 0; x < inside_scale; x++){
		  			let pixel = [];

			  		for (var k = 0; k < channels; k++){
			  			pixel.push(pixels_ndarray.get(start_x+inside_offset+x, start_y+inside_offset+y, k));
					}

					pixels[y]    = pixels[y] || {};
					pixels[y][x] = pixel;
				}
			}

	  		let bounds = GetFrogBounds(inside_scale-1, pixels);
	  		let angle  = GetFrogAngle(bounds);
	  		let dist   = GetFrogDist(bounds);

	  		let score_ratio = {
	  			angle:      (1 - Math.pow(Math.min(Math.abs(angle), 6), 2) / 36),
	  			dist_sum:   dist.sum/96,
	  			dist_delta: (1 - Math.pow(Math.min(Math.abs(dist.delta), 6), 2) / 36),
	  		}

	  		let score = score_ratio.angle * 1 + score_ratio.dist_sum * 4 + score_ratio.dist_delta * 0.12;

	  		if(!valid || score > valid.score){
				valid = {
					n: i+1, 
					score:score
				};
			}
		}
	});

	return valid.n;
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

	return res.data.response === "answered" && res.data.solved;
}

async function SolveChallenge(session_token){
	//await BeginChallenge(session_token);

	let challenge     = await GetChallenge(session_token);

	let waves         = challenge.game_data.waves;
	let images        = challenge.game_data.customGUI._challenge_imgs;
	let game_token    = challenge.challengeID;

	console.log("Session Token: ", session_token);
	console.log("Game Token: ", game_token);
	console.log("Waves: ", waves);

	// await BeginChallenge(session_token, game_token);
	// await BeginChallenge2(session_token, game_token);
	// await BeginChallenge3(session_token, game_token);

	let response = [];

	for (var i = 0; i < waves; i++) {
		let image      = images[i];
		let valid_frog = await GetValidFrog(image);

		if(!valid_frog){
			return false
		}

		response.push(MakeResponse(valid_frog-1));

		//console.log(valid_frog, "-->", image);
	}

	let encrypted = CryptoJS.AES.encrypt(JSON.stringify(response), session_token, {format: ALFCCJSAesJson}).toString();

	let result = await AnswerChallenge(session_token, game_token, encrypted);

	if(result){
	 	console.log("Le frogé content!!!");
	 }else{
	 	console.log("Pathetic.");
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