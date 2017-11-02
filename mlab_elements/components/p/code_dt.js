    this.getHTMLElement = function(el)  {
        return $(el).find("p");
    };	
	

    this.onCreate = function (el) {
        this.onLoad (el);
        $(el).find('p').text(this.api.getLocaleComponentMessage(this.config.name, ["messages", "text"]));
        this.highlight($(el).find("p"));
    };
    
     this.onCreate = function (el) {
        this.onLoad (el);
        this.getHTMLElement(el).text(this.api.getLocaleComponentMessage(this.config.name, ["placeholder"]));
        this.highlight(this.getHTMLElement(el));
    };

    
//el = element this is initialising, config = global config from conf.yml
	this.onLoad = function (el) {
        $(el).find("p").attr("contenteditable", "true");
        $(el).find("p").bind("blur keyup paste copy cut mouseup")
        //, function() { if ($(this).text().trim() == "") { $(this).text("Add content"); } } ) ;
    };
    
	this.onSave = function (el) {
		$(el).find("p").removeAttr("contenteditable");
        var temp_html = el.outerHTML;
        $(el).find("p").attr("contenteditable", "true");
        return temp_html;
    };
    
    this.onReplace = function (el, replacement_id, replacement_html) {
		var content = $(el).find("p").html();
        $(el).empty().html(replacement_html).data("mlab-type", replacement_id).children(0).html(content);
    };
            
    this.getContentSize = function (el) {
        return $(el).find("p").text().length;
    };

    this.custom_add_link = function (el, event) {
        this.api.setLink(el, event);
    };

    this.custom_remove_link = function (el) {
        this.api.removeLink();
    };
    
    this.onKeyPress = function (e) {
        if (e.keyCode == 13) {
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
    
