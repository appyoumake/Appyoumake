/**
 * Simple H1 headline but with chapter as the mlab-type, 
 * this is then used by the index component to create an index with chapter names as the top level items
 * @param {type} el
 * @returns {undefined}
 */
//el = element this is initialising

    this.getHTMLElement = function(el)  {
        return $(el).find("h1");
    };

    this.onCreate = function (el) {
        this.onLoad (el);
        $(el).find('h1').text(this.api.getLocaleComponentMessage(this.config.name, ["messages", "headline"]));
        $(el).attr("data-mlab-chapter-id", this.api.getGUID());
        this.highlight(this.getHTMLElement(el));
    };