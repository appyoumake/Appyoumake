//index component, mainly a placeholder at design time, generated in pre-compile process

//here we replace some placeholders
    this.onCreate = function(el) {
        this.custom_summary_style(el);
    }
    
//avoid any keyboard input
    this.onKeyPress = function (e) {
        e.preventDefault();
    }

    this.updatePreview = function(el, html) {
        var title =  this.api.getLocaleComponentMessage(this.config.name, ["messages", "ph_title"]);
        var chapter =  this.api.getLocaleComponentMessage(this.config.name, ["messages", "ph_chapter"]);
        var page =  this.api.getLocaleComponentMessage(this.config.name, ["messages", "ph_page"]);
        var index = html.replace(/%%TITLE%%/g, title)
                            .replace(/%%CHAPTER%%/g, chapter)
                            .replace(/%%PAGE%%/g, page);
        $(el).html(index);
        
    }

    this.custom_summary_style = function (el) {
        var html = "<h1 class='mc_text mc_display mc_heading mc_large mc_index_heading'>%%TITLE%%</h1>" + 
                    "<ul class='mc_container mc_index mc_list'>" + 
                        "<li class='mc_text mc_display mc_list mc_bullet mc_link mc_internal'>%%CHAPTER%% 1</li>" + 
                        "<li class='mc_text mc_display mc_list mc_bullet mc_link mc_internal'>%%CHAPTER%% 2</li>" + 
                    "</ul>";
        this.api.setAllVariables(el, {options: {style: "summary"}});
        this.updatePreview(el, html);
    };
    
    this.custom_detailed_style = function (el) {
        var html = "<h1 class='mc_text mc_display mc_heading mc_large mc_index_heading'>%%TITLE%%</h1>" + 
                    "<ul class='mc_container mc_index mc_list'>" + 
                        "<li class='mc_text mc_display mc_list mc_bullet mc_link mc_internal'>%%CHAPTER%% 1" + 
                        "<ul><li class='mc_text mc_display mc_list mc_bullet mc_link mc_internal'>%%PAGE%% 1</li>" + 
                        "<li class='mc_text mc_display mc_list mc_bullet mc_link mc_internal'>%%PAGE%% 2</li></ul></li>" + 
                        "<li class='mc_text mc_display mc_list mc_bullet mc_link mc_internal'>%%CHAPTER%% 2" + 
                        "<ul><li class='mc_text mc_display mc_list mc_bullet mc_link mc_internal'>%%PAGE%% 3</li>" + 
                        "<li class='mc_text mc_display mc_list mc_bullet mc_link mc_internal'>%%PAGE%% 4</li></ul></li>" + 
                    "</ul>";
        this.api.setAllVariables(el, {options: {style: "detailed"}});
        this.updatePreview(el, html);
    };
    
    this.custom_folding_style = function (el) {
        var html =  "<h1 class='mc_text mc_display mc_heading mc_large mc_index_heading'>%%TITLE%%</h1>" + 
                    "<h3><a onclick='return false;'>%%CHAPTER%% 1</a></h3>\n" + 
                    "<p><a onclick='return false;'>%%PAGE%% 1</a></p>\n" + 
                    "<p><a onclick='return false;'>%%PAGE%% 2</a></p>\n" + 
                    "<h3><a onclick='return false;'>%%CHAPTER%% 2</a></h3>\n" + 
                    "<p><a onclick='return false;'>%%PAGE%% 3</a></p>\n" +
                    "<p><a onclick='return false;'>%%PAGE%% 4</a></p>\n";
        this.api.setAllVariables(el, {options: {style: "folding"}});
        this.updatePreview(el, html);
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