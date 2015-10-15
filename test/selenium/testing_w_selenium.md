
Testing MLAB with Selenium
===========================

This folder contains some selenium test scripts that may be used with MLAB.

Selenium
-------------------

Selenimu (http://www.seleniumhq.org/) is a simple test tool that automates browsers. Selenium IDE (http://www.seleniumhq.org/projects/ide/) is a Firefox add-on to record and playback scripts.



`mlab_test_suite`
--------------------------------
The `mlab_test_suite` contains test scripts to test an installation of MLAB.


Other "tests"
-------------------------
It may not be the most efficient, but Selenium may also be used to automate some common tasks.

* `create_new_app` 
* `create_user`
* `batch_create_user` will read the `new_users.json` file and add these users. This script depends on the extension... 
