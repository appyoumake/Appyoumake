//use this to support inheritance in audio component
    this.media_type = "video";

    this.getHTMLElement = function(el)  {
        return $(el).find(this.media_type);
    };

    this.onCreate = function (el) {
        var media = this.getHTMLElement(el);
        if (typeof media.attr("src") == "undefined" || vid.attr("src") == "") {
            media.attr("poster", this.config.placeholder);
        }
    };

/* Hook called when component is loaded into app.
 * @param {jQuery} el Main element for component. 
 */
    this.onLoad = function (el) {
    };

/* Hook called when app is saved.
 * @param {jQuery} el Main element for component. 
 * @return {String} HTML for component.
*/
    this.onSave = function (el) {
        var html = el.outerHTML;
        return html;
    };

    this.getContentSize = function() {
        return 1;
    };

    this.custom_upload_media = function (el) {
        this.api.uploadMedia(el, this.config, this.media_type, this.cbUploadCompleted, event);
    };

    this.cbUploadCompleted = function(el, media_url) {
        console.log(media_url);
        var media = $(el).find(this.media_type);
        media.attr({'src': media_url, 'poster': media_url + ".png"});
        
    };