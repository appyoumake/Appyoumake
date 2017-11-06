//ordered list, provides basic editing facilities	
    this.tagName ="ol";

    this.getHTMLElement = function(el)  {
        return $(el).find("ol");
    };

    this.onCreate = function (el) {
        this.onLoad (el);
        $(el).find('li').text(this.api.getLocaleComponentMessage(this.config.name, ["messages", "list"]));
        this.highlight($(el).find("li"));
    };
    
//el = element this is initialising, config = global config from conf.yml
	this.onLoad = function (el) {
        this.getHTMLElement(el).attr("contenteditable", "true")
                .bind("blur keyup paste copy cut mouseup");
        //, function() { if ($(this).text().trim() == "") { $(this).html("<li>Add content</li>"); } } ) ;
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
        el.focus();
		var curr_node = $(window.getSelection().focusNode);
        if (typeof curr_node.prop("tagName") == "undefined") {
            curr_node = curr_node.parent();
        }
        if (curr_node.prop("tagName").toLowerCase() != "li") {
            return;
        }
        var prev_node = curr_node.prev();
        if (prev_node.length == 0) {
            return;
        }
        if (prev_node.find(this.tagName).length == 0) {
            prev_node.append("<" + this.tagName + " class='mc_container mc_list'></" + this.tagName +">");
        }
        var element = curr_node.detach();
        prev_node.find(this.tagName).append(element);
        this.api.display.setEditableFocus(element);
        this.api.dirty_flag = true;
    };
    
    this.custom_outdent = function (el) {
        el.focus();
        var curr_node = $(window.getSelection().focusNode);
        if (typeof curr_node.prop("tagName") == "undefined") {
            curr_node = curr_node.parent();
        }
        if (curr_node.prop("tagName").toLowerCase() != "li") {
            return;
        }
        var parent_node = curr_node.parent().parent();
        if (parent_node.prop("tagName").toLowerCase() != "li") {
            return;
        }
        var element = curr_node.detach();
        parent_node.after(element);
        this.api.display.setEditableFocus(element);
        this.api.dirty_flag = true;
        
    };
    
//we need to use tab to create indents/outdents
    this.onKeyPress = function (e) {
        
// tab, move right (indent)
        if (e.keyCode == 9 && e.shiftKey == false) {
            e.preventDefault();
            this.custom_indent($(e.target).parent());
            
// tab + shift, move left (outdent)
        } else if (e.keyCode == 9 && e.shiftKey == true) {
            e.preventDefault();
            this.custom_outdent($(e.target).parent());
            
//up arrow + ctrl, move up witin current parent outline (i.e. not parent of parent)
        } else if (e.keyCode == 38 && e.ctrlKey == true) {
            e.preventDefault();
            var $curr = $(this).closest('li')
            var $prev = $curr.prev('li');
            if($prev.length !== 0){
                $curr.insertBefore($prev);
            }

//down arrow + ctrl, move down witin current parent outline (i.e. not parent of parent)
        } else if (e.keyCode == 40 && e.ctrlKey == true) {
            e.preventDefault();
            var $curr = $(this).closest('li')
            var $nxt = $curr.next('li');
            if($nxt.length !== 0){
                $curr.insertAfter($nxt);
            }
//down arrow + ctrl, move down witin current parent outline (i.e. not parent of parent)
        } else if (e.keyCode == 8 || e.keyCode == 46) {
            if ( $(e.target).find('li').length <= 1 && $(e.target).find('li').text().length == 0 ) {
                e.preventDefault();
            }
        }
    };
    
    this.onBlur = function (el) {
        
        if ( $(el).find('li').text().trim() == "" ) {
            $(el).find('li').text(this.api.getLocaleComponentMessage(this.config.name, ["messages", "list"]));
        }
    }