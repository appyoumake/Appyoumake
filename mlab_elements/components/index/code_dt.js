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

    this.custom_decrease_size = function (el) {
        if ($(el).hasClass("mc_large")) {
            $(el).removeClass("mc_large").addClass("mc_medium");
        } else if ($(el).hasClass("mc_medium")) {
            $(el).removeClass("mc_medium").addClass("mc_small");
        } else {
            $(el).addClass("mc_small");
        }
    };
    
    this.custom_increase_size = function (el) {
        if ($(el).hasClass("mc_small")) {
            $(el).removeClass("mc_small").addClass("mc_medium");
        } else if ($(el).hasClass("mc_medium")) {
            $(el).removeClass("mc_medium").addClass("mc_large");
        } else {
            $(el).addClass("mc_large");
        }
    };