document.mlab_code_index = new function() {
	
	this.config = {};
    
    this.onCreate = function (el, config, designer, api_func) {
        this.onLoad (el, config, designer, api_func);
    };
    
//el = element this is initialising, config = global config from conf.txt
	this.onLoad = function (el, config, designer, api_func) {
        this.config = config;
        this.config["api_function"] = api_func;
    };
    
};