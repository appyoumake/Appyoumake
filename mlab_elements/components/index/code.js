	
	this.config = {};
    
    this.onCreate = function (el, config, api_func) {
        this.onLoad (el, config, api_func);
    };
    
//el = element this is initialising, config = global config from conf.yml
	this.onLoad = function (el, config, api_func) {
        this.config = config;
        this.api = api_func;
    };
  
  //avoid any keyboard input
    this.onKeyPress = function (e) {
        e.preventDefault();
    }