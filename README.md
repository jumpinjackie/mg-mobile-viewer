MapGuide Mobile Viewer
======================

A mobile-friendly HTML5 MapGuide viewer designed for use in mobile and tablet devices (ie. Android/iOS) and any modern HTML5-capable web browser

No attempts have been made (and nor will there be any attempts) to polyfill/shim missing and/or unsupported functionality to make this work in a certain browser from Redmond. It is 2012, please use a modern browser for the sake of moving the web forward :)

This viewer is built with the following libraries:
  * OpenLayers 2.12 RC 1
  * Twitter Bootstrap 2.0.2
  * jQuery 1.7.1

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

Example URLs
============

With OpenStreetMap: 
  http://yourservername/mapguide/mobileviewer/index.php?map=Library://Samples/Sheboygan/Maps/Sheboygan.MapDefinition&cmslayers=osm

With Google: 
  http://yourservername/mapguide/mobileviewer/index.php?map=Library://Samples/Sheboygan/Maps/Sheboygan.MapDefinition&cmslayers=google&glayers=hybrid.streets.satellite.terrain

With both OpenStreetMap and Google:
  http://yourservername/mapguide/mobileviewer/index.php?map=Library://Samples/Sheboygan/Maps/Sheboygan.MapDefinition&cmslayers=osm.google&glayers=hybrid.streets.satellite.terrain