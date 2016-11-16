#!/usr/bin/env python

# @copyright Copyright (c) 2013-2016, Norwegian Defence Research Establishment (FFI) - All Rights Reserved
# @license Proprietary and confidential
# 
# Unauthorized copying of this file, via any medium is strictly prohibited 
# 
# For the full copyright and license information, please view the LICENSE_MLAB file that was distributed with this source code.

""" Example: ./document2HTML.py -c <path_to_config> -i <path_to_source_document> -o <path_to_output_directory> -t <tag_to_split_on> -a <optional_tag_attribute> """

import os
import sys
import subprocess
import re
import argparse
import json
import base64
import magic

from PIL import Image, ImageChops
from bs4 import BeautifulSoup, Comment
from io import StringIO

# make sure bs4 version is 4.0.2
bs4 = sys.modules['bs4'] 

if bs4.__version__ < '4.0.2': 
    sys.stderr.write("This script requires bs4 version 4.0.2\n")
    exit(1)
#------------------------------------------------------------------------------
def process_document(html):
    # takes the result from pyodconverter and split it into several files if needed (by attribute or just plain tag name)
    
    # feed html into beautifulsoup
    soup = BeautifulSoup(html, from_encoding=CONFIG['parsing']['input_encoding'])
    
    # remove all HTML comments
    for comment in soup.findAll(text=lambda text:isinstance(text, Comment)):
        comment.extract()
    
    # first extract any images that are embedded
    soup = extract_embedded_images(soup)
    
    # split document, no split tag results in just one list element here
    html_parts = split_document(soup)
    
    # now we process the list of html we just created
    part_number = 0
    for html_part in html_parts:
        if not html_part:
            continue
        
        # convert each HTML fragment back into a DOM object
        soup = BeautifulSoup(html_part, from_encoding=CONFIG['parsing']['input_encoding'])
        
        # skip empty documents
        if CONFIG['parsing']['skip_empty_documents'] and not soup.get_text():
            continue
        
        # remove all attributes from all tags
        if CONFIG['parsing']['strip_attributes']:
            for tag in soup.findAll(True):
                
                # except images
                if tag.name == 'img':
                    del tag['style']
                    del tag['alt']
                    continue
                
                tag.attrs = ''
        
        # remove unwanted tags
        for invalid_tag in CONFIG['parsing']['invalid_tags']: 
            for tag in soup.findAll(invalid_tag):
                tag.replaceWithChildren()
        
        # remove wrapping tags
        soup = remove_wrappers(soup)
        
        # wrap all remaining tags with mlab specifics
        soup = wrap_tags(soup)
        
        # perform some last rewrites, remove newlines and paragraphs containing nothing but double breaks
        html_string = soup.prettify(CONFIG['parsing']['output_encoding'])
        
        # output
        file_path = ARGUMENTS.output;
        file_name = file_path + '/' + str(part_number).zfill(3) + '.html'
        save_file(file_name, html_string)
        
        # for numbering files
        part_number += 1
#------------------------------------------------------------------------------
def split_document(soup):
    # each HTML fragment is stored here
    html_parts = []
    
    # if we are to split by a tag, get all those tags
    if ARGUMENTS.split_tag:
        
        (attribute_name, attribute_value) = ARGUMENTS.split_attribute and ARGUMENTS.split_attribute.split('=') or ['','']
        
        # make sure everything is lower case, and remove "
        attribute_name = attribute_name.lower()
        attribute_value = attribute_value.lower()
        attribute_value = attribute_value.replace('"', '')
        
        # for each tag
        for tag in soup.find_all(True):
            html = str(tag)
            
            # in case attribute parameter is not provided, we assume this is ok
            attribute_match = True
            
            # if we are to check attribute we have to look the other way on non usable tags
            if (ARGUMENTS.split_attribute):
                tag_attribute_value = ''
                try:
                    tag_attribute_value = str(tag[attribute_name]).lower()
                except:
                    tag_attribute_value = ''
                
                attribute_match = re.search(attribute_value, tag_attribute_value)
                
                # loop each tag siblings until we stumble upon a place to split
                while tag:
                    if (tag.name == ARGUMENTS.split_tag and attribute_match):
                        html_parts.append(html)
                        html = []
                        break
                    else:
                        tag = next_tag(tag)
                        html += str(tag)
            else:
                if (tag.name == ARGUMENTS.split_tag):
                    html_parts.append(html)
                    html = []
                    break
                else:
                    tag = next_tag(tag)
                    html += str(tag)
    else:
        # we are not going to split, just return the whole thing back
        html_parts.append(str(soup))
    
    # returning a list of html fragments
    return html_parts
#------------------------------------------------------------------------------
def next_tag(tag):
    # loop until next useful tag/sibling
    while tag is not None:
        
        tag = tag.next_sibling
        if hasattr(tag, 'name'):
            return tag
#------------------------------------------------------------------------------
def extract_embedded_images(soup):
    # get all images, their source is actually the full image. Parse it and create the image files
    image_number = 0
    
    # for all img tags in the document
    for image_tag in soup.findAll('img'):
        
        # default file type is jpg
        image_name = str(image_number).zfill(3) + '.jpg'
        image_path = ARGUMENTS.output + '/' + image_name
        prefix = "data:image/*;base64,"
        image_data_string = image_tag['src']
        data = image_data_string[len(prefix):]
        
        if not data:
            # try next image if this is empty
            continue
        
        # decode data and store to disk
        data = base64.decodestring(data)
        save_file(ARGUMENTS.output + '/' + image_name, data)
        
        # detect file type by using python-magic
        file_info_string = magic.from_file(image_path)
        
        # parse file_type_string
        file_type = 'unknown'
        if file_info_string.find("Windows Enhanced Metafile") != -1:
            file_type = 'emf'
        elif file_info_string.find("PNG image data") != -1:
            file_type = 'png'
        elif file_info_string.find("JPG image data") != -1:
            file_type = 'jpg'
        
        if (file_type):
            image_file_name = image_path.replace('jpg', file_type)
            
            # rename the file to match detected file type
            # skip if the filetype is jpg, our fallback
            if (file_type != 'jpg'):
                os.system('mv ' + ARGUMENTS.output + '/' + image_name + ' ' + image_file_name)
                
                # convert the file to jpg if it is in emf format
                output = subprocess.check_output([unoconv_path, '-f', 'jpg', '-o', image_path.replace(file_type, 'jpg'), image_file_name])
                
                # trim whitespace from image
                if CONFIG['parsing']['strip_image_borders']:
                    image = Image.open(image_path.replace(file_type, 'jpg'))
                    image = trim_image(image)
                    image.save(image_path.replace(file_type, 'jpg'))
                
                # remove the old emf files
                os.system('rm ' + image_file_name)
                
                # set filetype back
                file_type = 'jpg'
                
        # update the tag source to match the newly created file
        image_name = image_name.replace(file_type, 'jpg')
        image_tag['src'] = image_name
        image_number += 1
    
    return soup
#------------------------------------------------------------------------------
def trim_image(image):
    background = Image.new(image.mode, image.size, image.getpixel((0,0)))
    diff = ImageChops.difference(image, background)
    diff = ImageChops.add(diff, diff, 2.0, -100)
    background_box = diff.getbbox()
    if background_box:
        return image.crop(background_box)
#------------------------------------------------------------------------------
def save_file(file_name, content):
    # just saves content (text) to given file_name
    file = open(file_name, 'w')
    file.write(content)
    file.close()
#------------------------------------------------------------------------------
def remove_wrappers(soup):
    # remove multiple wrapping with the same tag
    for tag in soup.findAll(True):
        # replace tags that have to have textnodes and not having any
        if tag.name in CONFIG['parsing']['textnode_required']:
            has_text_node = False
            for element in tag.children:
                if str(type(element)) == "<class 'bs4.element.NavigableString'>":
                    has_text_node = True
                    break
            
            # if the tag has a text node, do not remove it
            if has_text_node:
                continue
            else:
                tag.replaceWithChildren()
    return soup
#------------------------------------------------------------------------------
def wrap_tags(soup):
    # wrap each tag with <div data-mlab-type='original-tag-name'>
    for tag in soup.findAll(True):
        
        # we skip wrapping if the name matches skip list in config
        if tag.name and tag.name in CONFIG['parsing']['skip_wrapping']:
            continue
        
        new_tag = soup.new_tag('div')
        # in the config we can set what the mlab-type is to be for each tag type
        if tag.name in CONFIG['parsing']['mlab-type-map']:
            new_tag['data-mlab-type'] = CONFIG['parsing']['mlab-type-map'][tag.name]
        else:
            new_tag['data-mlab-type'] = tag.name
        
        wrap_element(tag, new_tag)
    return soup
#------------------------------------------------------------------------------
def wrap_element(inner, outer):
    # wraps an element with html
    contents = inner.replace_with(outer)
    outer.append(contents)
#------------------------------------------------------------------------------
# parse input parameters to this wrapper
parser = argparse.ArgumentParser(description='Python wrapper for unoconv')

# set up the options
parser.add_argument('-c', '--config_path', help='path to config file', required=True)
parser.add_argument('-i', '--input', help='path to the source document', required=True)
parser.add_argument('-o', '--output', help='path to result (directory (not file))', required=True)
parser.add_argument('-t', '--split_tag', help='tag to split document on')
parser.add_argument('-a', '--split_attribute', help='attributes split tag should have')

# gather input into args
ARGUMENTS = parser.parse_args()

# import config file in JSON format
CONFIG = json.load( open(ARGUMENTS.config_path, 'r') )

# we convert to HTML using unoconv. The location of unoconv is provided (must be) in CONFIG.
unoconv_path = CONFIG['paths']['unoconv'] + '/unoconv'
output = subprocess.check_output([unoconv_path, '-f', 'xhtml', '-o',ARGUMENTS.output + '/raw.html', ARGUMENTS.input])

with open(ARGUMENTS.output + '/raw.html', 'r') as html_file:
    html = html_file.read().replace('\n', '')

# if requested split soup into several trees and create a file for each (add number on output_path file name)
process_document(html)
#------------------------------------------------------------------------------
# done
