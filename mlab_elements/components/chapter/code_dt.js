/**
 * Simple H1 headline but with chapter as the mlab-type, 
 * this is then used by the index component to create an index with chapter names as the top level items
 * @param {type} el
 * @returns {undefined}
 */

    this.LEVEL_1 = 1,
    this.LEVEL_2 = 2,
    this.LEVEL_3 = 3,

//el = element this is initialising
    this.getHTMLElement = function(el)  {
        return $(el).find("h1");
    };

    this.onCreate = function (el) {
        this.api.setVariable(el, "level", this.LEVEL_1);
        this.onLoad (el);
        $(el).find('h1').text(this.api.getLocaleComponentMessage(this.config.name, ["messages", "headline"]));
        $(el).attr("data-mlab-chapter-id", this.api.getGUID());
        this.highlight(this.getHTMLElement(el));
    };
    
/*
 * Following two functions change the level of the chapter heading and updates text size as well.
 * When the compile time index is created, then we use level to set indents
 */
    this.custom_decrease_size = function (el) {
        var level = this.api.getVariable(el, "level");
        if (level == this.LEVEL_1) {
            el.removeClass("mc_large").addClass("mc_medium");
            this.api.setVariable(el, "level", this.LEVEL_2);
        } else {
            el.removeClass("mc_medium").addClass("mc_small");
            this.api.setVariable(el, "level", this.LEVEL_3);
        } 
    };

    this.custom_increase_size = function (el) {
		var level = this.api.getVariable(el, "level");
        if (level == this.LEVEL_3) {
            el.removeClass("mc_small").addClass("mc_medium");
            this.api.setVariable(el, "level", this.LEVEL_2);
        } else {
            el.removeClass("mc_medium").addClass("mc_large");
            this.api.setVariable(el, "level", this.LEVEL_1);
        } 
    };