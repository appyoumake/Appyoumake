//ordered list, provides basic editing facilities	
    this.getHTMLElement = function(el)  {
        return $(el).find("ol");
    };

    this.onCreate = function (el) {
        this.onLoad (el);
        this.highlight($(el).find("li"));
    };
    
//el = element this is initialising, config = global config from conf.yml
	this.onLoad = function (el) {
        this.getHTMLElement(el).attr("contenteditable", "true")
                .bind("blur keyup paste copy cut mouseup", function() { if ($(this).text().trim() == "") { $(this).html("<li>Add content</li>"); } } ) ;
    };
    
	this.onSave = function (el) {
		this.getHTMLElement(el).removeAttr("contenteditable");
        var temp_html = el.outerHTML;
        this.getHTMLElement(el).attr("contenteditable", "true");
        return temp_html;
    };
    
    this.onReplace = function (el, replacement_id, replacement_html) {
		var content = this.getHTMLElement(el).html();
        $(el).empty().html(replacement_html).data("mlab-type", replacement_id).children(0).html(content);
    };
           
    this.getContentSize = function (el) {
        return this.getHTMLElement(el).text().length;
    };
    
    this.custom_indent = function (el) {
		document.execCommand('indent', null, null);
    };
    
    this.custom_outdent = function (el) {
		document.execCommand('outdent', null, null);
    };
    
    this.highlight = function (el) {
        el.focus();
        var range = document.createRange();
        var sel = window.getSelection();
        range.selectNodeContents(el[0]);
        sel.removeAllRanges();
        sel.addRange(range);
    };
  
//we need to use tab to create indents/outdents
    this.onKeyPress = function (e) {
        if (e.keyCode == 9) {
            e.preventDefault();
            this.custom_indent($(e.target));
            
        }
    };
    
    