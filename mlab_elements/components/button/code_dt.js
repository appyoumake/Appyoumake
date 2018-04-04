    this.getHTMLElement = function(el)  {
        return $(el).find("a");
    };	
	

    this.onCreate = function (el) {
        this.onLoad (el);
    };
    
//el = element this is initialising, config = global config from conf.yml
	this.onLoad = function (el) {
        this.getHTMLElement(el).attr("contenteditable", "true").bind("blur keyup paste copy cut mouseup")
        //, function() { if ($(this).text().trim() == "") { $(this).text("Add content"); } } ) ;
    };
    
    this.custom_set_link = function (el, event) {
        this.highlight(el); //inherited from H1 component
        this.api.setLink(el, event);
    };

    this.custom_toggle_button = function (el) {
        this.getHTMLElement(el).toggleClass("mc_button");
    };
    
    this.onKeyPress = function (e) {
        if (e.keyCode == 13) {
            e.preventDefault();
        }
    };
    
