    this.getHTMLElement = function(el)  {
        return $(el).find("p");
    };	
	

    this.onCreate = function (el) {
        this.onLoad (el);
    };
    
//el = element this is initialising, config = global config from conf.yml
	this.onLoad = function (el) {
        this.getHTMLElement(el).attr("contenteditable", "true").bind("blur keyup paste copy cut mouseup")
        //, function() { if ($(this).text().trim() == "") { $(this).text("Add content"); } } ) ;
    };
    
    this.custom_add_link = function (el, event) {
        this.api.setLink(el, event);
    };

    this.custom_remove_link = function (el) {
        this.api.removeLink();
    };
    
    this.onKeyPress = function (e) {
        if (e.keyCode == 13) {
            console.log("here");
            e.preventDefault();
            var sel, range, html;
            sel = window.getSelection();
            range = sel.getRangeAt(0);
            range.deleteContents();
            var linebreak = document.createElement("br") ;
            range.insertNode(linebreak);
            sel.modify("move", "forward", "character");
        }
    };
    
