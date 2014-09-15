document.mlab_code_chapter = new function() {
	
	this.config = {};
    
    this.onCreate = function (el, config, designer, url) {
        
        if ($(el).siblings("[data-mlab-type='chapter']").length > 0) {
            $(el).remove();
            alert("You already have a chapter component on this page, you cannot have more than one per page");
            return;
        } 

        $(el).attr("data-mlab-chapter-id", this.generate_guid());
        this.onLoad (el, config, designer, url);
    };

    //el = element this is initialising, config = global config from conf.txt
	this.onLoad = function (el, config, designer, url) {
        this.config = config;
        $(el).find("h1").attr("contenteditable", "true");
        $(el).find("h1").bind("blur keyup paste copy cut mouseup", function() { if ($(this).text().trim() == "") { $(this).text("Add chapter headline"); } } ) ;
    };
    
	this.onSave = function (el) {
		$(el).find("h1").removeAttr("contenteditable");
    };
            
    this.onReplace = function (el, replacement_id, replacement_html) {
		var content = $(el).find("h1").html();
        $(el).empty().html(replacement_html).data("mlab-type", replacement_id).children(0).html(content);
    };
    
    this.getContentSize = function (el) {
        return $(el).find("h1").text().length;
    };

    this.custom_bold = function (el) {
		document.execCommand('bold', null, null);
    };

    this.custom_italic = function (el) {
		document.execCommand('italic', null, null);
    };
  
/**
 * we create a GUID that is rfc4122 version 4 compliant to disinguish each chapter internally
 */
    this.generate_guid = function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    }
};