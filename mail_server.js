const {SMTPServer} = require('smtp-server');
const simpleParser = require('mailparser');
const axios        = require("axios");

const generator  = require('./name_generator.js');

const twatch_client_id     = "kimne78kx3ncx6brgo4mv6wki5h1ko";
const twitch_api_url       = "https://gql.twitch.tv/gql";

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

async function ValidateEmail(opaqueID){

  let data = JSON.stringify([{
    "operationName":"VerifyEmail",
    "variables":{
      "input":{
        "opaqueID": opaqueID
      }
    },
    "extensions":{
      "persistedQuery":{
        "version":1,
        "sha256Hash":"4d3cbb19003b87567cb6f59b186e989c69b0751ecdd799be6004d200014258f1"
      }
    }
  }]);

  let res = await axios.post(twitch_api_url, data, legit_twatch_headers);
}

function GetUrls(str){
  return str.match(/(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/igm);
}

//<p>413380 - Your Twitch Login Verification CodeTwitch<br/>[<a href="https://static-cdn.jtvnw.net/growth-assets/email_twitch_logo_uv">https://static-cdn.jtvnw.net/growth-assets/email_twitch_logo_uv</a>]<br/>[<a href="https://www.twitch.tv/r/e/eyJsb2NhdGlvbiI6ImxvZ28iLCJlbWFpbF9pZCI6IjU4MTExM2Y2LTVjZGYtNDZlYi1iZGY2LTdmNDdiYTU0MGEyMCIsIm5hbWUiOiJuZXdfY2xpZW50X3ZlcmlmaWNhdGlvbiIsImN0YV92YWx1ZSI6IiJ9/692387043/a95f3f554d88bd0bc962c53d00269ecb9b6a12f0?ignore_query=true&tt_content=new_client_verification&tt_email_id=581113f6-5cdf-46eb-bdf6-7f47ba540a20&tt_medium=email">https://www.twitch.tv/r/e/eyJsb2NhdGlvbiI6ImxvZ28iLCJlbWFpbF9pZCI6IjU4MTExM2Y2LTVjZGYtNDZlYi1iZGY2LTdmNDdiYTU0MGEyMCIsIm5hbWUiOiJuZXdfY2xpZW50X3ZlcmlmaWNhdGlvbiIsImN0YV92YWx1ZSI6IiJ9/692387043/a95f3f554d88bd0bc962c53d00269ecb9b6a12f0?ignore_query=true&tt_content=new_client_verification&tt_email_id=581113f6-5cdf-46eb-bdf6-7f47ba540a20&tt_medium=email</a>]<br/>HEY KYFOMOTUMUWU,<br/>We noticed you&rsquo;re trying to log into Twitch! Please enter this code to finish<br/>logging in:</p><p>413380</p><p>If you did NOT initiate this log-in, we highly recommend you change your<br/>password and/or enable two-factor authentication. If you are unable to do these<br/>things, please contact support.</p><p>twitch-twitter<br/>[<a href="https://ci5.googleusercontent.com/proxy/NjrXjBJfWd_KVMGC2RlzLVYSFdY3i6I4jo6h9CG3zyai6S3SMsqcK-Ufc_rmmpLKtvpfpaRsWgDHJkCrfBUEW5JH_9uJelJhBdIka6mmYQM-bLJT95fgwlxWuqjvgUt_bWmNUq1B=s0-d-e1-ft#https://s.jtvnw.net/jtv_user_pictures/hosted_images/email-twitter-logo-20171115.png">https://ci5.googleusercontent.com/proxy/NjrXjBJfWd_KVMGC2RlzLVYSFdY3i6I4jo6h9CG3zyai6S3SMsqcK-Ufc_rmmpLKtvpfpaRsWgDHJkCrfBUEW5JH_9uJelJhBdIka6mmYQM-bLJT95fgwlxWuqjvgUt_bWmNUq1B=s0-d-e1-ft#https://s.jtvnw.net/jtv_user_pictures/hosted_images/email-twitter-logo-20171115.png</a>]<br/>[<a href="https://twitter.com/twitch/">https://twitter.com/twitch/</a>]twitch-facebook<br/>[<a href="https://ci4.googleusercontent.com/proxy/XHffVu34DLJFd5BgnT-FmR1sO6U8aNYtqIngRIAczxlyKN1dB0Fe-00F3bXbo3fVQ4PlEIpJVQrCAsfuBto15Y4neEJHUxd2v0z7gy41unT3YDbJg6bTUgmWOcju7HCKeL18r1pH8A=s0-d-e1-ft#https://s.jtvnw.net/jtv_user_pictures/hosted_images/email-facebook-logo-20171115.png">https://ci4.googleusercontent.com/proxy/XHffVu34DLJFd5BgnT-FmR1sO6U8aNYtqIngRIAczxlyKN1dB0Fe-00F3bXbo3fVQ4PlEIpJVQrCAsfuBto15Y4neEJHUxd2v0z7gy41unT3YDbJg6bTUgmWOcju7HCKeL18r1pH8A=s0-d-e1-ft#https://s.jtvnw.net/jtv_user_pictures/hosted_images/email-facebook-logo-20171115.png</a>]<br/>[<a href="https://www.facebook.com/twitch/">https://www.facebook.com/twitch/</a>]&copy; 2021 Twitch, All Rights Reserved<br/>350 Bush Street, 2nd Floor, San Francisco, CA, 94104 - USA</p><p>[<a href="https://spade.twitch.tv/track?data=eyJldmVudCI6ImVtYWlsX29wZW4iLCJwcm9wZXJ0aWVzIjp7Im5vdGlmaWNhdGlvbl9pZCI6IjU4MTExM2Y2LTVjZGYtNDZlYi1iZGY2LTdmNDdiYTU0MGEyMCJ9fQ%3D%3D&img=1&ua=1">https://spade.twitch.tv/track?data=eyJldmVudCI6ImVtYWlsX29wZW4iLCJwcm9wZXJ0aWVzIjp7Im5vdGlmaWNhdGlvbl9pZCI6IjU4MTExM2Y2LTVjZGYtNDZlYi1iZGY2LTdmNDdiYTU0MGEyMCJ9fQ%3D%3D&img=1&ua=1</a>]</p>

const EmailHandler = {
  ["Twitch <account@twitch.tv>"]: function(url){
    //let id = url.split("email-verification/")[1].split("?")[0];
    console.log("ACCOUNT", url);
  },
  ["Twitch <no-reply@twitch.tv>"]: function(url){
    console.log("EMAIL", url);
    let id = url.split("email-verification/")[1].split("?")[0];

    ValidateEmail(id);
  }
}

const server = new SMTPServer({
    disabledCommands: ['STARTTLS', 'AUTH'],
    onData(stream, session, callback){
        let data = "";
        stream.on('data', function(chunk) {
         data += chunk;
        });
        stream.on('end', function(){
          simpleParser.simpleParser(data, {}, (err, parsed) => {
            if(err){return console.log(err)}

            console.log(parsed);

            let sender = parsed.from.text;
            let handler = EmailHandler[sender];

            console.log(sender, handler);

            if(handler){

              let text = parsed.textAsHtml;

              let urls = GetUrls(text);

              let validate_url = urls[0];

              urls.forEach((url)=>{
                if(url.includes("verify_code")){
                  validate_url = url;
                }
              });


              console.log(validate_url);
              handler(validate_url);
            }
          });
          
          callback();
        });
    },
});

server.listen(25);

console.log("ok")




/*

// SERVER


async function ValidateEmail(opaqueID){

  let data = JSON.stringify([{
    "operationName":"VerifyEmail",
    "variables":{
      "input":{
        "opaqueID": opaqueID
      }
    },
    "extensions":{
      "persistedQuery":{
        "version":1,
        "sha256Hash":"4d3cbb19003b87567cb6f59b186e989c69b0751ecdd799be6004d200014258f1"
      }
    }
  }]);

  let res = await axios.post(twitch_api_url, data, legit_twatch_headers);
}

function GetUrls(str){
  return str.match(/(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/igm);
}

//<p>413380 - Your Twitch Login Verification CodeTwitch<br/>[<a href="https://static-cdn.jtvnw.net/growth-assets/email_twitch_logo_uv">https://static-cdn.jtvnw.net/growth-assets/email_twitch_logo_uv</a>]<br/>[<a href="https://www.twitch.tv/r/e/eyJsb2NhdGlvbiI6ImxvZ28iLCJlbWFpbF9pZCI6IjU4MTExM2Y2LTVjZGYtNDZlYi1iZGY2LTdmNDdiYTU0MGEyMCIsIm5hbWUiOiJuZXdfY2xpZW50X3ZlcmlmaWNhdGlvbiIsImN0YV92YWx1ZSI6IiJ9/692387043/a95f3f554d88bd0bc962c53d00269ecb9b6a12f0?ignore_query=true&tt_content=new_client_verification&tt_email_id=581113f6-5cdf-46eb-bdf6-7f47ba540a20&tt_medium=email">https://www.twitch.tv/r/e/eyJsb2NhdGlvbiI6ImxvZ28iLCJlbWFpbF9pZCI6IjU4MTExM2Y2LTVjZGYtNDZlYi1iZGY2LTdmNDdiYTU0MGEyMCIsIm5hbWUiOiJuZXdfY2xpZW50X3ZlcmlmaWNhdGlvbiIsImN0YV92YWx1ZSI6IiJ9/692387043/a95f3f554d88bd0bc962c53d00269ecb9b6a12f0?ignore_query=true&tt_content=new_client_verification&tt_email_id=581113f6-5cdf-46eb-bdf6-7f47ba540a20&tt_medium=email</a>]<br/>HEY KYFOMOTUMUWU,<br/>We noticed you&rsquo;re trying to log into Twitch! Please enter this code to finish<br/>logging in:</p><p>413380</p><p>If you did NOT initiate this log-in, we highly recommend you change your<br/>password and/or enable two-factor authentication. If you are unable to do these<br/>things, please contact support.</p><p>twitch-twitter<br/>[<a href="https://ci5.googleusercontent.com/proxy/NjrXjBJfWd_KVMGC2RlzLVYSFdY3i6I4jo6h9CG3zyai6S3SMsqcK-Ufc_rmmpLKtvpfpaRsWgDHJkCrfBUEW5JH_9uJelJhBdIka6mmYQM-bLJT95fgwlxWuqjvgUt_bWmNUq1B=s0-d-e1-ft#https://s.jtvnw.net/jtv_user_pictures/hosted_images/email-twitter-logo-20171115.png">https://ci5.googleusercontent.com/proxy/NjrXjBJfWd_KVMGC2RlzLVYSFdY3i6I4jo6h9CG3zyai6S3SMsqcK-Ufc_rmmpLKtvpfpaRsWgDHJkCrfBUEW5JH_9uJelJhBdIka6mmYQM-bLJT95fgwlxWuqjvgUt_bWmNUq1B=s0-d-e1-ft#https://s.jtvnw.net/jtv_user_pictures/hosted_images/email-twitter-logo-20171115.png</a>]<br/>[<a href="https://twitter.com/twitch/">https://twitter.com/twitch/</a>]twitch-facebook<br/>[<a href="https://ci4.googleusercontent.com/proxy/XHffVu34DLJFd5BgnT-FmR1sO6U8aNYtqIngRIAczxlyKN1dB0Fe-00F3bXbo3fVQ4PlEIpJVQrCAsfuBto15Y4neEJHUxd2v0z7gy41unT3YDbJg6bTUgmWOcju7HCKeL18r1pH8A=s0-d-e1-ft#https://s.jtvnw.net/jtv_user_pictures/hosted_images/email-facebook-logo-20171115.png">https://ci4.googleusercontent.com/proxy/XHffVu34DLJFd5BgnT-FmR1sO6U8aNYtqIngRIAczxlyKN1dB0Fe-00F3bXbo3fVQ4PlEIpJVQrCAsfuBto15Y4neEJHUxd2v0z7gy41unT3YDbJg6bTUgmWOcju7HCKeL18r1pH8A=s0-d-e1-ft#https://s.jtvnw.net/jtv_user_pictures/hosted_images/email-facebook-logo-20171115.png</a>]<br/>[<a href="https://www.facebook.com/twitch/">https://www.facebook.com/twitch/</a>]&copy; 2021 Twitch, All Rights Reserved<br/>350 Bush Street, 2nd Floor, San Francisco, CA, 94104 - USA</p><p>[<a href="https://spade.twitch.tv/track?data=eyJldmVudCI6ImVtYWlsX29wZW4iLCJwcm9wZXJ0aWVzIjp7Im5vdGlmaWNhdGlvbl9pZCI6IjU4MTExM2Y2LTVjZGYtNDZlYi1iZGY2LTdmNDdiYTU0MGEyMCJ9fQ%3D%3D&img=1&ua=1">https://spade.twitch.tv/track?data=eyJldmVudCI6ImVtYWlsX29wZW4iLCJwcm9wZXJ0aWVzIjp7Im5vdGlmaWNhdGlvbl9pZCI6IjU4MTExM2Y2LTVjZGYtNDZlYi1iZGY2LTdmNDdiYTU0MGEyMCJ9fQ%3D%3D&img=1&ua=1</a>]</p>

const EmailHandler = {
  ["Twitch <account@twitch.tv>"]: function(parsed){
    //let id = url.split("email-verification/")[1].split("?")[0];
  let text = parsed.textAsHtml;
  let email = parsed.to.text;
  let username = email.slice("@")[0];
    let id = text.slice(3).split(" ")[0];

    console.log("ACCOUNT", text, id, username);

    let cb = AccountVerificationCache[username];

    if(cb){
      cb(id);
      console.log("good")
    }
  },
  ["Twitch <no-reply@twitch.tv>"]: function(parsed){
    let text = parsed.textAsHtml;
    let urls = GetUrls(text);

    let validate_url = urls[0];

    urls.forEach((url)=>{
      if(url.includes("verify_code")){
        validate_url = url;
      }
    });

    let id = validate_url.split("email-verification/")[1].split("?")[0];

    console.log("EMAIL", validate_url, id);

    ValidateEmail(id);
  }
}

const server = new SMTPServer({
    disabledCommands: ['STARTTLS', 'AUTH'],
    onData(stream, session, callback){
        let data = "";
        stream.on('data', function(chunk) {
         data += chunk;
        });
        stream.on('end', function(){
          simpleParser.simpleParser(data, {}, (err, parsed) => {
            if(err){return console.log(err)}

            console.log(parsed);

            let sender = parsed.from.text;
            let handler = EmailHandler[sender];

            console.log(sender, handler);

            if(handler){
              handler(parsed);
            }
          });
          
          callback();
        });
    },
});

server.listen(25);

console.log("ok")
