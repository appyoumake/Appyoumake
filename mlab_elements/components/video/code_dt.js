//use this to support inheritance in other components
    this.media_type = "video";

    this.getHTMLElement = function(el)  {
        return $(el).find(this.media_type);
    };

    this.onCreate = function (el) {
        this.onLoad(el);
        var media = this.getHTMLElement(el);
        media.attr("poster", this.config.placeholder);
    };

/* Hook called when component is loaded into app.
 * @param {jQuery} el Main element for component. 
 */
    this.onLoad = function (el) {
        this.getHTMLElement(el).css("pointer-events", "none");
    };

/* Hook called when app is saved.
 * @param {jQuery} el Main element for component. 
 * @return {String} HTML for component.
*/
    this.onSave = function (el) {
        var html = el.outerHTML;
        return html.replace('pointer-events: none', '');
    };

    this.getContentSize = function() {
        return 1;
    };

    this.custom_upload_media = function (el) {
        this.api.uploadMedia(el, this.config, this.media_type, this.cbUploadCompleted, event);
    };

    this.cbUploadCompleted = function(el, media_url) {
        var media = $(el).find(this.media_type);
        media.attr({'src': media_url, 'poster': media_url + ".png"});
        
    };