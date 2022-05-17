const axios        = require("axios");
const fs           = require('fs');
const path         = require('path');
const tunnel       = require('tunnel');

const httpsProxyAgent = require('https-proxy-agent');

const generator    = require('./generator.js');
const funcaptcha   = require('./funcaptcha_bypass.js');

const twatch_key           = "E5554D43-23CC-1982-971D-6A2262A2CA24";
const twatch_client_id     = "kimne78kx3ncx6brgo4mv6wki5h1ko";

const twatch_register_url  = "https://passport.twitch.tv/register";
const twatch_login_url     = "https://passport.twitch.tv/login";
const twatch_api_url       = "https://gql.twitch.tv/gql";

var proxy_list = require('./proxy.js');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const legit_twatch_headers = {
	headers: {
		["Client-Id"]: twatch_client_id
	}
};

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

async function IsValidName(str){

	let data = JSON.stringify([{
		"operationName":"UsernameValidator_User",
		"variables":{"username":str},
		"extensions":{
			"persistedQuery":{
				"version":1,
				"sha256Hash":"fd1085cf8350e309b725cf8ca91cd90cac03909a3edeeedbd0872ac912f3d660"
			}
		}
	}]);

	let res = await axios.post(twatch_api_url, data, legit_twatch_headers);

	let available = res.data[0].data.isUsernameAvailable;

	console.log(str, " (Available: " + available + ")");

	return available;
}

async function GetValidName(){
	let name;

	while(!name || !await IsValidName(name)){
		name = generator.Name();
	}

	return name;
}

// async function Login(name, password){

// 	let data = {
// 		username: name,
// 		password: password,
// 		undelete_user: false,
// 		client_id: twatch_client_id
// 	};

// 	let res = await axios.post(twatch_login_url, data);

// 	if(res.data.error && res.data.error === 3022){
// 		res = await ValidateAccount(data, data.captcha_proof);
// 	}

// 	return {
// 		access_token: res.data.access_token
// 	}
// }

async function ValidateAccount(data, captcha){
	return new Promise((resolve, reject)=>{
		data.captcha = {
			proof: captcha
		};

		AccountVerificationCache[data.username] = async function(code){

			data.twitchguard_code = code;

			let res = await axios.post(twatch_login_url, data);

			resolve(res);
		}
	});
}

async function Register(session_token){

	let username = await GetValidName();
	let email    = username + "@example.com";
	let password = "very_secret_password";

	console.log(username + ":" + password);

	// let res = await proxy_list.make_request(
	// {
	// 	url: twatch_register_url,
	// 	method: "post",
	// 	data: {
	// 		arkose:{
	// 			token: session_token + "|r=eu-west-1|metabgclr=transparent|guitextcolor=%23000000|metaiconclr=%23757575|meta=3|lang=en|pk=E5554D43-23CC-1982-971D-6A2262A2CA24|at=40|atp=2|cdn_url=https%3A%2F%2Fclient-api.arkoselabs.com%2Fcdn%2Ffc|lurl=https%3A%2F%2Faudio-eu-west-1.arkoselabs.com|surl=https%3A%2F%2Fclient-api.arkoselabs.com"
	// 		},
	// 		birthday: {
	// 			day:	1,
	// 			month:	1,
	// 			year:	2000
	// 		},
	// 		client_id: twatch_client_id,
	// 		username:  username,
	// 		email:     email,
	// 		password:  password,
	// 	}
	// });

	let res = await axios.post(twatch_register_url,
	{
		arkose:{
			token: session_token + "|r=eu-west-1|metabgclr=transparent|guitextcolor=%23000000|metaiconclr=%23757575|meta=3|lang=en|pk=E5554D43-23CC-1982-971D-6A2262A2CA24|at=40|atp=2|cdn_url=https%3A%2F%2Fclient-api.arkoselabs.com%2Fcdn%2Ffc|lurl=https%3A%2F%2Faudio-eu-west-1.arkoselabs.com|surl=https%3A%2F%2Fclient-api.arkoselabs.com"
		},
		birthday: {
			day:	1,
			month:	1,
			year:	2000
		},
		client_id: twatch_client_id,
		username:  username,
		email:     email,
		password:  password,
	});

	if(res){
		return {
			username:     username,
			email:        email,
			password:     password,
			userID:       res.data.userID,
			access_token: res.data.access_token
		};
	}else{
		return false;
	}
}

async function GetUserInfo(name){

	let res = await axios.post(twatch_api_url, {
		operationName: "PlaybackAccessToken_Template",
		query: "query PlaybackAccessToken_Template($login: String!, $isLive: Boolean!, $vodID: ID!, $isVod: Boolean!, $playerType: String!) {  streamPlaybackAccessToken(channelName: $login, params: {platform: \"web\", playerBackend: \"mediaplayer\", playerType: $playerType}) @include(if: $isLive) {    value    signature    __typename  }  videoPlaybackAccessToken(id: $vodID, params: {platform: \"web\", playerBackend: \"mediaplayer\", playerType: $playerType}) @include(if: $isVod) {    value    signature    __typename  }}",
		variables: {
			isLive: true,
			login: name,
			isVod: false,
			vodID: "",
			playerType: "site"
		}
	}, legit_twatch_headers);

	return JSON.parse(res.data.data.streamPlaybackAccessToken.value);
}

async function Follow(auth, id){

	let data = JSON.stringify([{
		"operationName":"FollowButton_FollowUser",
		"variables":{
			"input":{
				"disableNotifications": false,
				"targetID": id.toString()
			}
		},
		"extensions":{
			"persistedQuery":{
				"version": 1,
				"sha256Hash": "3efee1acda90efdff9fef6e6b4a29213be3ee490781c5b54469717b6131ffdfe"
			}
		}
	}]);

	legit_twatch_headers.headers.Authorization = auth;

	console.log(legit_twatch_headers);
	
	let res = await axios.post(twatch_api_url, data, legit_twatch_headers);

	console.log(res.data);
}

var Accounts = [];

function ReadAccounts(){
    if(fs.existsSync("./accounts.json")){
        Accounts = JSON.parse(fs.readFileSync("./accounts.json").toString());
    }
}

function WriteAccounts(){
	fs.writeFileSync("./accounts.json", JSON.stringify(Accounts));
}

ReadAccounts();

async function Start(){

	let session_token = await funcaptcha(twatch_key);

	console.log('Creating account...');

	let account = await Register(session_token);

	console.log('Account created!');
	console.log(account);

	Accounts.push(account);
	WriteAccounts();

	let auth = "OAuth " + account.access_token;

	console.log("Logging in...");
	let log = await Login(account.username, account.password);
	console.log("Logged in!");
	console.log(log);

	let user_name = "Shroud";
	let user_id   = (await GetUserInfo(user_name)).channel_id;

	console.log("Following " + user_name + " (" + user_id + ")...");
	console.log("Auth: ", auth);

	await Follow(auth, user_id);

	console.log("Restarting!!!");

	Start();
}

(async()=>{

	//proxy_list = await proxy_list.load();

	console.log("Solving challenge...");

	//let session_token = await funcaptcha(twatch_key);
	//console.log(session_token)

	Start();
})();

// function MakeBDA(){
// 	// function k3T() {
// 	// 	var i3T,
// 	// 	R3T,
// 	// 	C3T,
// 	// 	j3T,
// 	// 	r3T;
// 	// 	if (!w9T || !G9T) return;
// 	// 	I9T.push({
// 	// 	key: K6i.N3D( + '260'),
// 	// 	value: JSON.stringify(Y9T)
// 	// 	});
// 	// 	i3T = new Date().getTime() / ('1000' >> 1326404352);
// 	// 	R3T = '21600' ^ 0;
// 	// 	C3T = navigator.userAgent;
// 	// 	j3T = Math.round(i3T - i3T % R3T);
// 	// 	r3T = ALFCCJS.encrypt(JSON.stringify(I9T), C3T + j3T);
// 	// 	y9T.bda = V2u.encode(r3T);
// 	// 	T3T();
// 	// }

// 	let date        = new Date().getTime() / ('1000' >> 1326404352);
// 	let user_agent  = generator.UserAgent();
// 	let rnd         = Math.round(date - date %  '21600' ^ 0);
// 	let bda         = atob(ALFCCJS.encrypt(JSON.stringify(I9T), user_agent + idk));

// 	return {
// 		rnd: rnd,
// 		bda: bda,
// 		useragent: user_agent
// 	}
// }

//POST
//	https://api.twitch.tv/kraken/users/700274961/upload_image?client_id=kimne78kx3ncx6brgo4mv6wki5h1ko&api_version=5&image_type=profile_image&format=png