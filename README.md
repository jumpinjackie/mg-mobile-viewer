MapGuide Mobile Viewer
======================

A mobile-friendly HTML5 MapGuide viewer designed for use in mobile and tablet devices (ie. Android/iOS) and any modern HTML5-capable web browser

No attempts have been made (and nor will there be any attempts) to polyfill/shim missing and/or unsupported functionality to make this work in a certain browser from Redmond. It is 2012, please use a modern browser for the sake of moving the web forward :)

This viewer is built with the following libraries:
  * OpenLayers 2.12 RC 1
  * Twitter Bootstrap 2.0.2
  * jQuery 1.7.1

License
=======

MapGuide Mobile Viewer is licensed under the GNU LGPL v2.1

How to install
==============

1. Perform a git clone of this repository (or an export of it) into a directory of your choice (eg. C:\mg-mobile-viewer)

2. Set up a new virtual directory in Apache/IIS under the root mapguide virtual directory that points to this directory (eg. mapguide/mobileviewer)

3. Launch the viewer like so:

  http://yourservername/mapguide/mobileviewer/index.php?map=Library://Samples/Sheboygan/Maps/Sheboygan.MapDefinition

Viewer parameters
=================

cmslayers: A dot-separated list of commerical layers
  * osm: OpenStreetMap
  * google: Google

glayers: A dot-separated list of google layer subtypes to make available
  * hybrid
  * streets
  * satellite
  * terrain

Please note that your Map Definition must be projected into the WGS84.PseudoMercator coordinate system in order for your data to line up with what's in Google and OpenStreetMap

Example URLs
============

With OpenStreetMap: 
  http://yourservername/mapguide/mobileviewer/index.php?map=Library://Samples/Sheboygan/Maps/Sheboygan.MapDefinition&cmslayers=osm

With Google: 
  http://yourservername/mapguide/mobileviewer/index.php?map=Library://Samples/Sheboygan/Maps/Sheboygan.MapDefinition&cmslayers=google&glayers=hybrid.streets.satellite.terrain

With both OpenStreetMap and Google:
  http://yourservername/mapguide/mobileviewer/index.php?map=Library://Samples/Sheboygan/Maps/Sheboygan.MapDefinition&cmslayers=osm.google&glayers=hybrid.streets.satellite.terrain

Un-implemented functionality
============================

Quite a few, since you're asking:

  * Legend/Layer visibility control
  * Viewing attributes of selected features
  * Non-point methods of feature selections. Current selection is a bit buggy.
  * Tools you have come to expect like buffer, measure, etc, etc.

This is currently a basic and simple map viewer. It is not an AJAX or Fusion viewer in terms of features and functionality. Nothing more. Nothing less.

Happy to accept pull requests to plug these deficiencies :)