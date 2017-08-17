    this.getHTMLElement = function(el)  {
        return $(el).find("video");
    };


    this.onCreate = function (el) {
        var vid = this.getHTMLElement(el);
        if (typeof vid.attr("src") == "undefined" || vid.attr("src") == "") {
            vid.attr("poster", this.config.placeholder);
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

    this.custom_upload_video = function (el) {
        this.api.uploadMedia(el, this.config, "mp4,mov,avi,wmv", this.cbVideoUploaded, event);
    };

    this.cbVideoUploaded = function(el, video_url) {
        console.log(video_url);
        var video = $(el).find('video');
        video.attr('src', video_url);
    };