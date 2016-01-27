//index component, mainly a placeholder at design time, generated in pre-compile process

//here we replace some placeholders
    this.onCreate = function(el) {
        var html = $(el).html();
        var new_html = html.replace("%%TITLE%%", this.api.getLocaleComponentMessage(this.config.name, ["messages", "ph_title"]))
            .replace("%%PAGE1%%", this.api.getLocaleComponentMessage(this.config.name, ["messages", "ph_page"]) + " 1")
            .replace("%%PAGE2%%", this.api.getLocaleComponentMessage(this.config.name, ["messages", "ph_page"]) + " 2")
            .replace("%%PAGE3%%", this.api.getLocaleComponentMessage(this.config.name, ["messages", "ph_page"]) + " 3");
        $(el).html(new_html);
    }
    
//avoid any keyboard input
    this.onKeyPress = function (e) {
        e.preventDefault();
    }
    
    this.custom_summary_style = function (el) {
        this.api.setAllVariables(el, {options: {style: "summary"}});
    };
    
    this.custom_detailed_style = function (el) {
        this.api.setAllVariables(el, {options: {style: "detailed"}});
    };
    
    this.custom_folding_style = function (el) {
        this.api.setAllVariables(el, {options: {style: "folding"}});
    };
