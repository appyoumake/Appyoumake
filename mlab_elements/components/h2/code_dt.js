	
	
    
    this.onCreate = function (el) {
        this.onLoad (el);
        this.highlight($(el).find("h2"));
    };
    
//el = element this is initialising, config = global config from conf.yml
	this.onLoad = function (el) {
        $(el).find("h2").attr("contenteditable", "true");
        $(el).find("h2").bind("blur keyup paste copy cut mouseup", function() { if ($(this).text().trim() == "") { $(this).text("Add content"); } } ) ;
    };
    
	this.onSave = function (el) {
		$(el).find("h2").removeAttr("contenteditable");
        var temp_html = el.outerHTML;
        $(el).find("h2").attr("contenteditable", "true");
        return temp_html;
    };
    
    this.onReplace = function (el, replacement_id, replacement_html) {
		var content = $(el).find("h2").html();
        $(el).empty().html(replacement_html).data("mlab-type", replacement_id).children(0).html(content);
    };
            
    this.getContentSize = function (el) {
        return $(el).find("h2").text().length;
    };

    this.custom_bold = function (el) {
		document.execCommand('bold', null, null);
    };

    this.custom_italic = function (el) {
		document.execCommand('italic', null, null);
    };
    
    this.highlight = function (el) {
        el.focus();
        var range = document.createRange();
        var sel = window.getSelection();
        range.selectNodeContents(el[0]);
        sel.removeAllRanges();
        sel.addRange(range);
    }
  
//avoid line breaks in headlines
    this.onKeyPress = function (e) {
        if (e.keyCode == 13) {
            e.preventDefault();
        }
    }