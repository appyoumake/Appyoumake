#The page.html file in detail

>Version: 1.0 (April 2016, first public release)<br>
Copyright: © Norwegian Defence Research Establishment (FFI) 2013 - 2016<br>
Initial author: Cecilie Jackbo Gran, Sinett 3.0, FFI<br>
Updating authors: <br>
Comment: _Only update the version number above when component specifications change_

_(If you have not already done it, you should first read [HOWTO - Template Design & Development.md](HOWTO - Template Design & Development.md) and [Mlab explained.md](Mlab explained.md))_

This file is the template used for all pages in an app except the first (index.html) page. It should be a complete HTML5 page that passes the standard [W3C Markup Validation Service](https://validator.w3.org/) without fail. As Mlab uses the [jQuery Mobile](https://jquerymobile.com/) framework it should use the basic layout of a jQuery mobile page, where data-role tags are used to indicate what part of a page each DIV has.

Unlike the index.html page (which originates from the template's [frontpage.html](TEMPLATES REFERENCE - frontpage.html file.md)) this file does not require navigation tools, etc. The content of this page is simply loaded into the index.html file, so all subsequent pages in an app will utilise the tools found in index.html. The loading of these pages are done using the [jQuery Mobile pageContainer change method](https://api.jquerymobile.com/pagecontainer/#method-change), this uses AJAX to load the page and inserts just the title and page content in the index.html page, hence there is no need for a very complex page.html.

The example below is adequate in most cases although you may need to change the class names and the data-role settings if you want elements displayed in a different order. In the example you can see two placeholders, one for the title of the page (as entered by the app creator when a new page is added), and the other for the actual content. These placeholders are replaced by the Mlab app builder when the page is stored on the server.

Do you think you need to add something here? If so, dont! Add it to the [frontpage.html](TEMPLATES REFERENCE - frontpage.html file.md) and simply hide it when the first page is displayed as adding it here would have the same effect: showing it on all pages in the app except the first page.

>Example of a page.html file:
```HTML
<!DOCTYPE html>
<html>
<head>
<title>%%TITLE%%</title>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
</head>
<body>
    <div data-role="page" data-title="%%TITLE%%">
        <div class="mlab_content_wrapper">
            <div role="main" class="mlab_main_body_content">
                %%CONTENT%%
            </div>
        </div>
    </div>   
</body>
</html>
```
