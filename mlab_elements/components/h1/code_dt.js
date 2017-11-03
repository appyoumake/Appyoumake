//simple H1 headline, parent of all other text components


    this.getHTMLElement = function(el)  {
        return $(el).find("h1");
    };

    this.onCreate = function (el) {
        this.onLoad (el);
        this.getHTMLElement(el).text(this.api.getLocaleComponentMessage(this.config.name, ["placeholder"]));
        this.highlight(this.getHTMLElement(el));
    };

    //el = element this is initialising, config = global config from conf.yml
	this.onLoad = function (el) {
        this.getHTMLElement(el).attr("contenteditable", "true");
              //  .bind("blur keyup paste copy cut mouseup", function() { if ($(this).text().trim() == "") { $(this).text(that.api.getLocaleComponentMessage(that.config.name, ["placeholder"])); that.highlight(that.getHTMLElement(el)); } } ) ;
    };
    
	this.onSave = function (el) {
		var inner_el = this.getHTMLElement(el)
        inner_el.removeAttr("contenteditable");
        var temp_html = el.outerHTML;
        inner_el.attr("contenteditable", "true");
        return temp_html;
    };
            
    this.onReplace = function (el, replacement_id, replacement_html) {
		var content = this.getHTMLElement(el).html();
        $(el).empty().html(replacement_html).data("mlab-type", replacement_id).children(0).html(content);
    };
    
    this.getContentSize = function (el) {
        return this.getHTMLElement(el).text().length;
    };

    this.custom_bold = function (el) {
		document.execCommand('bold', null, null);
    };

    this.custom_italic = function (el) {
		document.execCommand('italic', null, null);
    };
    
    this.custom_decrease_size = function (el) {
		var content = this.getHTMLElement(el);
        if (content.hasClass("mc_large")) {
            content.removeClass("mc_large").addClass("mc_medium");
        } else if (content.hasClass("mc_medium")) {
            content.removeClass("mc_medium").addClass("mc_small");
        } else {
            content.addClass("mc_small");
        }
    };
    
    this.custom_increase_size = function (el) {
		var content = this.getHTMLElement(el);
        if (content.hasClass("mc_small")) {
            content.removeClass("mc_small").addClass("mc_medium");
        } else if (content.hasClass("mc_medium")) {
            content.removeClass("mc_medium").addClass("mc_large");
        } else {
            content.addClass("mc_large");
        }
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
    
    this.onBlur = function (el) {
        var local_el = this.getHTMLElement(el);
        if ( local_el.text().trim() == "" ) {
            local_el.text(this.api.getLocaleComponentMessage(this.config.name, ["placeholder"]));
        }
    }