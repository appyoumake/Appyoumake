# @copyright Copyright (c) 2013-2020, Norwegian Defence Research Establishment (FFI)
# @license Licensed under the Apache License, Version 2.0 (For the full copyright and license information, please view the /LICENSE_MLAB file that was distributed with this source code)
# 
 
# For the full copyright and license information, please view the LICENSE_MLAB file that was distributed with this source code.

Instructions:

Tested with:

Python-modules:
argparse, 1.1
json, 2.0.9
python-magic
python-bs4


python document2HTML.py -c <path to config> -i <path to input file to convert> -o <path to directory for output>

In addition one can use: -t <tag to split into pages> -a <attribute as split criteria (for example id="Title*")
