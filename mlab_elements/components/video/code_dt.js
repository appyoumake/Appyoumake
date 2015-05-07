/* Hook called when component is created.
 * @param {jQuery} el Main element for component. 
 */
this.onCreate = function (el) {
    console.log("onCreate");
    this.setUp(el);
    this.custom_upload_video(el);
};

/* Hook called when component is loaded into app.
 * @param {jQuery} el Main element for component. 
 */
this.onLoad = function (el) {
    console.log("onLoad");
    this.setUp(el);
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

this.setUp = function(el) {
    var self = this;
    self.domRoot = $(el);
    var image = self.domRoot.find("img").attr("src", self.config.placeholder);
    var video = self.domRoot.find("video");
    if (video.length && video.find("source").attr("src")) image.hide();
};

this.custom_upload_video = function (el) {
    var self = this;
    self.api.uploadMedia(el, self.config, "mp4,mov,avi,wmv", function(el, url) { self.videoUploaded(el, url); });
};

this.videoUploaded = function(el, url) {
    el = $(el);
    console.log(el);
    console.log(url);
    var url = url.split(".");
    var url = url[0] + ".mp4";
    el.find("video").remove();
    var video = $('<video style="cursor: pointer; width: 100%; height: 400px; padding: 0;" class="ui-resizable" controls="controls"></video>');
//    video.attr("poster", "");
    video.attr("id", this.api.getGUID());
    video.attr("data-src", "android_" + url.split("/")[1]);
    video.append('<source src="./' + url + '" />');
    el.append(video);
};