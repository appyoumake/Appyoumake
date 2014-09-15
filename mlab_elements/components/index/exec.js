document.mlab_code_index = new function() {
	
	this.config = {};
    
    this.onCreate = function (el, config, designer, url) {
        debugger;
        this.onLoad (el, config, designer, url);
    };
    
//el = element this is initialising, config = global config from conf.txt
	this.onLoad = function (el, config, designer, url) {
        debugger;
        this.config = config;
    };
    
};