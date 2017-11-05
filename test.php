<?php
// this text was used in 2002
// we want to get this up to date for 2003
$text = "April fools day is 04/01/2002\n";
$text.= "Last christmas was 12/24/2001\n";
// the callback function
$x = "hhh";
function next_year($matches)
{
  // as usual: $matches[0] is the complete match
  // $matches[1] the match for the first subpattern
  // enclosed in '(...)' and so on
  global $x;
  print_r($matches);
  print $x;
  return $matches[1].($matches[2]+1);
}
preg_replace_callback(
            "/(\d{2}\/\d{2}\/)(\d{4})/",
            "next_year",
            $text);
