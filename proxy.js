const axios   = require('axios');
const fs      = require('fs');

const SocksProxyAgent = require('socks-proxy-agent');

//const httpsProxyAgent = require('https-proxy-agent');

const check_url = 'http://postman-echo.com/post';

var module_list = {};

if(fs.existsSync("./modules")){
    fs.readdirSync("./modules/").forEach((file)=>{
        let mod = require("./modules/" + file);
        module_list[file] = mod;

        console.log("Loaded module: " + file);
    });
}

function request_succeeded(res){
    return (res.status === 200 || res.status === 202);
}

class Proxy{
    constructor(host, port){
        return (async()=>{
            this.host  = host;
            this.port  = port;

            this.data  = {
                host: this.host,
                port: parseInt(this.port)
            }

            this.raw   = `${this.host}:${this.port}`;
            this.url   = `socks://${this.raw}`;
            this.agent = new SocksProxyAgent(this.url);

            this.valid = await this.check();

            return this;
        })();
    }

    async check(){

        let result = false;

        try{

            let res = await axios.post(check_url, undefined, {
                httpAgent:  this.agent,
                httpsAgent: this.agent,
                timeout: 2000,
            });

            result = request_succeeded(res);
        } catch(err){}

        this.valid = result;

        return result;
    }
}


class ProxyList{
    constructor(autosave=true){
        this.autosave = autosave;
        this.index    = 0;

        this._list    = {};
    }

    get list_raw(){
        return Object.values(this._list);
    }

    get list(){
        return Object.keys(this._list);
    }

    async add(proxy_list=[]){
        return new Promise(async(resolve, reject)=>{

            if(!proxy_list.length) return;

            let count = 0;
            let timeout;

            proxy_list.forEach(async(v)=>{

                let proxy;

                if(typeof v === "string"){
                    let splitted = v.split(":");

                    let host = splitted[0];
                    let port = splitted[1];

                    proxy = await new Proxy(host, port);
                }else{
                    proxy = await new Proxy(v.host, v.port);
                }

                count++

                console.log(proxy.raw + " : " + proxy.valid + " (" + count + "/" + (proxy_list.length) + ")");

                this._list[proxy.raw] = proxy;

                if(count>=proxy_list.length){
                    return resolve();
                }

                if(timeout){
                    clearTimeout(timeout);
                }

                timeout = setTimeout(()=>{
                    return resolve();
                }, 2000);
            });
        });
    }

    async download(module_name){
        let mod = module_list[module_name];

        let proxy_list = await mod();

        await this.add(proxy_list);
    }

    async download_all(){
        for (const [k, v] of Object.entries(module_list)) {
            await this.download(k);
        }
    }

    async load(filename='proxies.txt'){

        let path = "./" + filename;

        if(fs.existsSync(path)){
            let proxy_list = fs.readFileSync(path).toString().split('\n');

            if(proxy_list[proxy_list.length-1] === ""){
                proxy_list.pop();
            }

            await this.add(proxy_list);
        }
    }

    get_valid(raw=false){
        let valid = [];

        this.list_raw.forEach((proxy)=>{
            if(proxy.valid){
                if(raw){
                    valid.push(proxy); 
                }else{
                    valid.push(proxy.raw);  
                }  
            }
        });

        return valid;
    }

    async get(raw=false){
        if(this.index > this.list_raw.length-1){
            this.index = 0;
        }

        let proxy = this.list_raw[this.index];

        if(!proxy){
            return;
        }

        let valid = proxy.valid;

        console.log(proxy.raw, valid);

        if(valid){
            this.index++;

            if(raw){
                return proxy;
            }else{
                return proxy.data; 
            }
        }else{
            delete this._list[this.list[this.index]];

            return await this.get(raw);
        }
    }

    save(){
        let       arr = this.list;
        let valid_arr = this.get_valid();

        fs.writeFileSync("proxies.txt",             arr.join("\n"));
        fs.writeFileSync("valid_proxies.txt", valid_arr.join("\n"));
    }

    async make_request(cfg){
        let success = false;
        let res;

        while(!success){
            let proxy = await this.get(true);

            if(!proxy){
                return false;
            }

            cfg.httpAgent  = proxy.agent;
            cfg.httpsAgent = proxy.agent;
            //cfg.timeout    = 2000;

            console.log(proxy.raw, cfg.data.arkose.token);

            try{
                res = await axios(cfg);

                success = request_succeeded(res);

                console.log(proxy, success);
            } catch(err){
                console.log(err);
            }
        }

        return res;
    }
}

module.exports = {
    load: async (cfg={})=>{
        let cfg_download_all = cfg.download || true;
        let cfg_load         = cfg.load     || true;
        let cfg_autosave     = cfg.autosave || true;

        let proxy_list = new ProxyList(cfg_autosave);

        if(cfg_load){
            await proxy_list.load();
        }

        if(cfg_download_all){
            await proxy_list.download_all();
        }


        if(cfg_autosave){
            proxy_list.save();
        }
        
        console.log("Done");

        return proxy_list;
    }
}