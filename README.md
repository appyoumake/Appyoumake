# Appyoumake App Builder; editor source code (version 0.9.1)
====================================
Copyright (c) 2013-2020, Norwegian Defence Research Establishment (FFI)

Licensed under the Apache License, Version 2.0 (http://www.apache.org/licenses/LICENSE-2.0)

## Appyoumake: the app builder that lets non-programmers build apps using the "IKEA principle"

For many, an app is the first thing they're looking for when they need to find or share information. This applies not only to commercial actors, even those responsible for socially critical tasks are needed to create new apps. This also applies in the Norwegian Armed Forces. That's why FFI developed Appyoumake, the app builder that allows non-programmers to access components that can be easily assembled into an app.

<video width="600" controls>
  <source src="./docs/appyoumake_intro.mp4" type="video/mp4">
  Your browser does not support HTML video.
</video>

Equipping an organization with tablets or smartphones is easy. Making relevant content available is more challenging, but relevant content and easy-to-use apps are also what determine whether mobile solutions are used or not. Appyoumake is an app builder that solves this problem. With Appyoumake, you can create and share professional, interactive apps without programming knowledge.

<div style="float: right; width: 300px; background-color: #ccc;">
Appyoumake breaks down an app into individual parts called components. These handle information, tasks, or communications. It works according to the same principle as IKEA furniture. You choose different components and add them together until you have something that meets your requirements. Like the parts of IKEA furniture, the components are also made by others, in this case programmers. Whoever builds the app focuses on combining them in a way that makes sense in the context they know. But unlike IKEA furniture, the components can be shared and reused without additional costs.
</div>

## Four aspects make Appyoumake unique

 * With Appyoumake, it's simple to create apps, but the apps created don't have to be basic. 
 * Appyoumake can be extended with unimited, new components, from simple images to complicated mapping solutions. 
 * Appyoumake facilitates the reuse of apps, or parts of apps, in and between organizations. 
 * Appyoumake is an ecosystem, app costs decrease when more people use Appyoumake and share components.
 
Appyoumake has attracted considerable interest from potetial users. FFI is therefore making Appyoumake available as open source solution for anyone to use.

<div style="float: right; width: 300px; background-color: #ccc;">
### What is Mlab? 

Appyoumake was initially developed under the internal name of Mlab (*m*obile *l*earning *a*pp *b*uilder). This name is already used internationally by other organisations, we have therefore renamed it to Appyoumake. You are of course free to use a different name if you create services and products based on tis source code.
</div>

## Appyoumake consists of two parts

1. An easy-to-use *editing tool* where apps are built up from individual pages, each page is built up by components added by point and click.  
2. A compilation service that compiles the HTML pages into a mobile app for iOs or Android using the Cordova tool. 

Appyoumake uses open HTML5/Javascript/CSS3 standards both for the front end of the Appyoumake framework and for the content of the apps. The open source tool Cordova is used for app-compilation as well as access to sensors and services such as SMS. This repository hold all the code for the Appyoumake editor, including the admin functionality. It uses the Symfony framework, and backend code utilises PHP/MySQL, the HTML is generated from TWIG templates. The frontend relies heavily on Javascript/HTML5 and CSS3, with most pages using AJAX to store and retrieve data.

The Appyoumake architecture allows the app builder to use components to build a page. These are independent WYSIWYG HTML5/JS elements that at design-time ask for relevant input from the user (if required). A map component can for instance ask where the map should be centered. At run-time, this information is used to display the map centered in the correct location. Components can use storage plugins to store data. The separation of components and storage allows the same component to store data in different ways depending on the app being created without the plugin beig re-written. Templates take care of navigation, in-app searches, and look-and-feel without the app builder having to do anything. Components, storage plugins and templates can all take advantage of the Appyoumake API that encapsulates a number of tasks that components often use, such as displaying dialog boxes or resizing the component.

*FOR FURTHER INFORMATION SEE THE /docs DIRECTORY*
