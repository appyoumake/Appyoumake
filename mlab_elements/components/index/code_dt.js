	
	
    
    this.onCreate = function (el) {
        this.onLoad (el);
    };
    
//el = element this is initialising, config = global config from conf.yml
	this.onLoad = function (el) {
    };
  
  //avoid any keyboard input
    this.onKeyPress = function (e) {
        e.preventDefault();
    }