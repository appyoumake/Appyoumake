//index component, generated on the backend, either for a preview or in the pre-compile process

    this.local_el = null,

//here we replace some placeholders
    this.onCreate = function(el) {
        this.local_el = el;
        that = this;
        mlab.dt.management.page_save( function() { that.getPreview(that.local_el); } );
    }
    
    this.onLoad = function(el) {
        this.getPreview(el);
    }
    
//avoid any keyboard input
    this.onKeyPress = function (e) {
        e.preventDefault();
    }

    this.getPreview = function(el) {
        mlab.dt.design.component_run_backend_code(el, this.config.name, "onCompile", this.updatePreview);
    }
    
    this.updatePreview = function(el, html) {
        $(el).find("[data-mlab-ct-index='content']").html(html).css("pointer-events", "none");
    }
    
    this.custom_summary_style = function (el) {
        var textsize = this.api.getVariable(el, "textsize");
        if (typeof textsize == "undefined"  || textsize == "") {
            textsize = "mc_medium";
        }        
        this.api.setVariable(el, "style", "summary");
        this.api.setVariable(el, "textsize", textsize);
        that = this;
        local_el = el;
        mlab.dt.management.page_save( function() { that.getPreview(local_el); } );
    };

    
    this.custom_display_chapter_page_titles = function (el) {
        var that = this;
        var displayChapterPageTitle = this.api.getVariable(el, 'displayChapterPageTitle');
        this.api.setVariable(el, 'displayChapterPageTitle', !displayChapterPageTitle);
        
        mlab.dt.management.page_save( function() { that.getPreview(el); } );
    };
    
    this.custom_detailed_style = function (el) {
        var textsize = this.api.getVariable(el, "textsize");
        if (typeof textsize == "undefined"  || textsize == "") {
            textsize = "mc_medium";
        }
        
        this.api.setVariable(el, "style", "detailed");
        this.api.setVariable(el, "textsize", textsize);
        that = this;
        local_el = el;
        mlab.dt.management.page_save( function() { that.getPreview(local_el); } );
    };
    
    this.custom_folding_style = function (el) {
        var textsize = this.api.getVariable(el, "textsize");
        if (typeof textsize == "undefined"  || textsize == "") {
            textsize = "mc_medium";
        }
        
        this.api.setVariable(el, "style", "folding");
        this.api.setVariable(el, "textsize", textsize);
        that = this;
        local_el = el;
        mlab.dt.management.page_save( function() { that.getPreview(local_el); } );
    };    

    this.custom_decrease_size = function (el) {
        if (el.hasClass("mc_large")) {
            el.removeClass("mc_large").addClass("mc_medium");
            this.api.setVariable(el, "textsize", "mc_medium");
        } else if (el.hasClass("mc_medium")) {
            el.removeClass("mc_medium").addClass("mc_small");
            this.api.setVariable(el, "textsize", "mc_small");
        } else {
            el.addClass("mc_small");
            this.api.setVariable(el, "textsize", "mc_small");
        }
    };

    this.custom_increase_size = function (el) {
        if (el.hasClass("mc_small")) {
            el.removeClass("mc_small").addClass("mc_medium");
            this.api.setVariable(el, "textsize", "mc_medium");
        } else if (el.hasClass("mc_medium")) {
            el.removeClass("mc_medium").addClass("mc_large");
            this.api.setVariable(el, "textsize", "mc_large");
        } else {
            el.addClass("mc_large");
            this.api.setVariable(el, "textsize", "mc_large");
        }
    };