	
	this.config = new Array();
    
    this.onCreate = function (el, config, api_func) {
        this.onLoad(el, config, api_func);
    };
    
//el = element this is initialising, config = global config from conf.yml
	this.onLoad = function (el, config, api_func) {
        this.config = config;
        this.api = api_func;
    };
    
	this.onSave = function (el) {
    };
            

