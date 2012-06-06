//Constants
MapGuide = {
    CLIENT_AGENT: "MapGuide HTML5 Viewer",
    MAP_TYPE: {
        FULLY_TILED: 0,
        FULLY_DYNAMIC: 1,
        MIXED: 2
    },
    OFFLINE_TILE_STRATEGY: {
        LOCAL_FIRST: 0,
        REMOTE_FIRST: 1
    }
};
/**
 * The viewer application class object
 * @requires OpenLayers.js
 */
MapGuide.Viewer = OpenLayers.Class({
    /** 
     * APIProperty: map
     * {OpenLayers.Map} Get the map object
     **/
    map: null,
    siteVersion: null,
    agentUrl: null,
    commands: null,
    // The initial viewing bounds
    _initialBounds: null,
    // The mapguide session id
    sessionId: null,
    // The mapguide runtime map name
    mapName: null,
    // The hashtable of OpenLayers controls added to the map
    olControls: null,
    // boolean flag indicating if tile seeding is in progress
    isSeedingCachedTiles: false,
    // The number of occurrences of cache reads
    nCacheReads: 0,
    // The offline caching strategy
    offlineTileStrategy: MapGuide.OFFLINE_TILE_STRATEGY.LOCAL_FIRST,
    // Indicates whether offline caching is enabled
    isOfflineTileCachingEnabled: false,
    // The default keep alive timeout
    DEFAULT_PING_TIMEOUT: 30000,
    /**
     * Constructor: MapGuide.Viewer
     * Create a new Mobile Viewer application object
     *
     * Parameters:
     * options - {Object} hashtable of additional parameters to use. Some
     *     parameters may require additional code on the server. The ones that
     *     you may want to use are: 
     *   - div - {String} The id of the div to create the OpenLayers viewer
     *   - agentUrl - {String} The mapagent url
     *   - projection - {String} The epsg code for the OpenLayers map
     *   - layers - {Object} An array of OpenLayers.Layer instances to add to this map
     *   - mapDefinition - {String} The MapGuide Map Definition resource id
     *   - mapType - {Integer} Indicates the type of the Map Definition
     *   - mapExtents - {Object} The initial extents of the map
     *   - metersPerUnit - {Double} The meters-per-unit value
     *   - dpi - {Integer} The DPI value of the MapGuide map
     *   - mgTiledGroups - {Object} An array of tiled layer groups in the Map Definition
     *   - mgFiniteScaleList - {Object} An array of finite scales from the Map Definition
     *   - offlineTileCacheImageFormat - {String} The image format for any cached offline tiles
     *   - availableCommericalLayers - {Object} Indicates the array of available commerical layer sub-types
     *   - offlineTileStrategy - {Integer} Indicates the strategy to use for offline tile caching
     *   - imageFormats - {Object} Optional hashtable of single-tile and overlay image formats to override the MapGuide defaults
     */
    initialize: function(options) {
        var ext = options.mapExtents;
        this._initialBounds = new OpenLayers.Bounds(ext.minX, ext.minY, ext.maxX, ext.maxY);
        this.map = new OpenLayers.Map(options.div, {
            projection: this.createProjection(options.projection),
            theme: null
        });
        this.agentUrl = options.agentUrl;
        this.sessionId = options.session;
        this.mapName = options.mapName;
        this.mapDefinition = options.mapDefinition;
        
        if (options.mgFiniteScaleList.length > 0) {
            this.map.setOptions({
                scales: options.mgFiniteScaleList,
                maxExtent: this._initialBounds.clone()
            });
        }
        //Google requires a sub type. If none specified, default to hybrid
        var cmsSubTypes = options.availableCommercialLayers;
        if (cmsSubTypes.GOOGLE.length == 0)
            cmsSubTypes.GOOGLE.push("HYBRID");

        //Init controls
        this.olControls = {
            "CacheReadLocalFirst": new OpenLayers.Control.CacheRead({
                eventListeners: {
                    activate: OpenLayers.Function.bind(function() {
                        this.olControls.CacheReadRemoteFirst.deactivate();
                    }, this)
                }
            }),
            "CacheReadRemoteFirst": new OpenLayers.Control.CacheRead({
                eventListeners: {
                    activate: OpenLayers.Function.bind(function() {
                        this.olControls.CacheReadLocalFirst.deactivate();
                    }, this)
                }
            }),
            "CacheWrite": new OpenLayers.Control.CacheWrite({
                autoActivate: true,
                imageFormat: options.offlineTileCacheImageFormat || "image/jpeg",
                eventListeners: {
                    cachefull: OpenLayers.Function.bind(function() {
                        if (this.isSeedingCachedTiles) {
                            stopSeeding();
                        }
                        this.notifyFullTileCache();
                    }, this)
                }
            }),
            "Scale": new OpenLayers.Control.Scale(),
            "ScaleLine": new OpenLayers.Control.ScaleLine(),
            "NavigationHistory": new OpenLayers.Control.NavigationHistory(),
            "MousePosition": new OpenLayers.Control.MousePosition(),
            "LoadingPanel": new OpenLayers.Control.LoadingPanel(),
            "MapGuideSelect": new OpenLayers.Control.MapGuideSelect({ map: this.map, mapName: this.mapName, viewer: this }),
            "MapGuideTooltip": new OpenLayers.Control.MapGuideTooltip({ map: this.map, mapName: this.mapName, viewer: this })
        };
        
        //HACK: There is some leaky logic whereby adding the cache controls before adding the layers
        //will cause all grid layers to be cached (Presumably the map will call control.setMap(this), which
        //for the cache controls will cause all layers in the map to be set for caching)
        //So we defer adding of these cache controls until after we've added all our layers to the map
        var cacheControls = [];
        var cacheableLayers = [];
        for (var name in this.olControls) {
            if (options.enableOfflineTileCache && 
                (name == "CacheReadLocalFirst" ||
                 name == "CacheReadRemoteFirst" ||
                 name == "CacheWrite")) {
                cacheControls.push(this.olControls[name]);
            } else {
                this.map.addControl(this.olControls[name]);
            }
        }
        //Fix up some dimensioning before we proceed
        this.onResize();
        $(window).bind("resize", OpenLayers.Function.bind(this.onResize, this));
        //This is required for MapGuide layers to render properly
        OpenLayers.DOTS_PER_INCH = options.dpi;
        var metersPerUnit = options.metersPerUnit; 
        var inPerUnit = OpenLayers.INCHES_PER_UNIT.m * metersPerUnit;
        OpenLayers.INCHES_PER_UNIT["dd"] = inPerUnit;
        OpenLayers.INCHES_PER_UNIT["degrees"] = inPerUnit;
        OpenLayers.DOTS_PER_INCH = 96;
        
        //Override default image formats if specified
        var imgFormats = options.imageFormats || {};
        if (imgFormats.SINGLE_TILE)
            OpenLayers.Layer.MapGuide.prototype.SINGLE_TILE_PARAMS.format = imgFormats.SINGLE_TILE;
        if (imgFormats.OVERLAY)
            OpenLayers.Layer.MapGuide.prototype.OVERLAY_PARAMS.format = imgFormats.OVERLAY;
        
        //Add base commercial layers first
        var layers = options.commercialLayers || [];
        for (var i = 0; i < layers.length; i++) {
            var layerName = layers[i].toUpperCase();
            var subTypes = cmsSubTypes[layerName];
            if (subTypes.length == 0) {
                var oLayer = this.createCommercialLayer(layerName);
                //Only OSM tiles can be cacheable. TOS of other probably prevent us from legally caching them
                if (oLayer && layerName == "OSM") {
                    cacheableLayers.push(oLayer);
                    this.map.addLayer(oLayer);
                }
            } else {
                for (var j = 0; j < subTypes.length; j++) {
                    var oLayer = this.createCommercialLayer(layerName, subTypes[j].toUpperCase());
                    if (oLayer)
                        this.map.addLayer(oLayer);
                }
            }
        }
        if (this.map.layers.length == 0) { // && options.mapType == MapGuide.MAP_TYPE.FULLY_DYNAMIC) {
            this.map.setOptions({ allOverlays: true });
        } else {
            this.olControls.LayerSwitcher = new OpenLayers.Control.LayerSwitcher();
            this.map.addControl(this.olControls.LayerSwitcher);
            this.map.setOptions({ fractionalZoom: false });
        }
        //Add the tiled OpenLayers.Layer.MapGuide
        if (options.mapType == MapGuide.MAP_TYPE.MIXED ||
            options.mapType == MapGuide.MAP_TYPE.FULLY_TILED) {
            
            var tileUrl = options.agentUrl;
            if (tileUrl.indexOf("?") == tileUrl.length - 1) {
                tileUrl += "&USERNAME=Anonymous";
            } else {
                tileUrl += "?USERNAME=Anonymous";
            }
            
            for (var i = 0; i < options.mgTiledGroups.length; i++) {
                var oMgLayer = new OpenLayers.Layer.MapGuide("MapGuide tiled layers", tileUrl, {
                    mapDefinition: options.mapDefinition,
                    basemaplayergroupname: options.mgTiledGroups[i],
                }, {
                    singleTile: false,
                    isBaseLayer: false,
                    displayInLayerSwitcher: false,
                    //Register tileloaded events for cache tracking statistics
                    eventListeners: {
                        tileloaded: OpenLayers.Function.bind(this.updateCacheStatus, this)
                    }
                });
                cacheableLayers.push(oMgLayer);
                this.map.addLayer(oMgLayer);
            }
        }
        //Add the untiled OpenLayers.Layer.MapGuide
        if (options.mapType == MapGuide.MAP_TYPE.MIXED ||
            options.mapType == MapGuide.MAP_TYPE.FULLY_DYNAMIC) {
            var oMgLayer = new OpenLayers.Layer.MapGuide("MapGuide un-tiled layers", options.agentUrl, {
                mapName: this.mapName,
                session: this.sessionId,
                //selectioncolor: '0xFF000000',
                behavior: 2
            }, {
                maxExtent: this._initialBounds.clone(),
                singleTile: true,
                isBaseLayer: false,
                displayInLayerSwitcher: false,
                transitionEffect: 'resize',
                useOverlay: true,
                useAsyncOverlay: true,
                buffer: 1
            });
            this.map.addLayer(oMgLayer);
        }
        
        //Add our selection layer
        this.oSelectionLayer = new OpenLayers.Layer.MapGuide("Selection overlay", options.agentUrl, {
            mapName: this.mapName,
            session: this.sessionId,
            selectioncolor: '0x0000FF00',
            behavior: 1
        }, {
            maxExtent: this._initialBounds.clone(),
            singleTile: true,
            isBaseLayer: false,
            displayInLayerSwitcher: false,
            transitionEffect: 'resize',
            useOverlay: true,
            useAsyncOverlay: true,
            buffer: 1
        });
        this.map.addLayer(this.oSelectionLayer);
        
        //Set the cacheable layers
        this.isOfflineTileCachingEnabled = options.enableOfflineTileCache;
        if (!options.enableOfflineTileCache) {
            this.olControls.CacheReadLocalFirst.deactivate();
            this.olControls.CacheReadRemoteFirst.deactivate();
            this.olControls.CacheWrite.deactivate();
            this.logi("Disabling offline tile cache");
        } else {
            //Specify our cacheable layers in these controls
            this.olControls.CacheReadLocalFirst.layers = cacheableLayers;
            this.olControls.CacheReadRemoteFirst.layers = cacheableLayers;
            this.olControls.CacheWrite.layers = cacheableLayers;
            
            //Activate as appropriate
            this.olControls.CacheWrite.activate();
            this.setOfflineTileStrategy(options.offlineTileStrategy);
            
            //Now add our cache controls. This will now trigger a read of only
            //the layers we've specified
            for (var i = 0; i < cacheControls.length; i++) {
                this.map.addControl(cacheControls[i]);
            }
            this.logi(cacheableLayers.length + " layers set for offline use");
        }
        
        //Init commands
        this.commands = {
            "InitialView": new MapGuide.Command.InitialView(this),
            "Refresh": new MapGuide.Command.Refresh(this),
            "Geolocate": new MapGuide.Command.Geolocate(this)
        };
        
        if (options.session && options.keepSessionAlive === true) {
            this.initKeepAlive();
        }
        //All done, now start at the specified initial view
        this.initialView();
    },
    /* == BEGIN Public API == */
    /**
     * Method: logi
     * Logs an informational message to the console
     */
    logi: function(msg) {
        if (console) console.info(msg);
    },
    /**
     * Method: logw
     * Logs a warning message to the console
     */
    logw: function(msg) {
        if (console) console.warn(msg);
    },
    /**
     * Method: loge
     * Logs an error message to the console
     */
    loge: function(msg) {
        if (console) console.error(msg);
    },
    /**
     * Method: invokeCommand
     * Invokes the specified named command with any additional arguments passed to the command
     */
    invokeCommand: function(cmdName) {
        var cmd = this.commands[cmdName];
        var newArgs = [];
        for (var i = 1; i < arguments.length; i++) 
            newArgs.push(arguments[i]);
        if (typeof(cmd) == 'undefined') 
            this.loge("Command not found: " + cmdName);
        else
            cmd.execute.apply(cmd, newArgs);
    },
    /**
     * Method: initialView
     * Zooms the map back to the initial view
     */
    initialView: function() {
        this.map.zoomToExtent(this._initialBounds);
    },
    /**
     * Method: refresh
     * Refreshes the map
     */
    refresh: function() {
        this.map.setCenter(this.map.getCenter(), this.map.getZoom(), false, true);
    },
    /**
     * Method: seedTiles
     * Populates the offline tile cache with the specified parameters
     */
    seedTiles: function(seedParams) {
        var layer = seedParams.layer;
        var tileWidth = layer.tileSize.w;
        var nextZoom = map.getZoom() + 1;
        var extentWidth = seedParams.extent.getWidth() / this.map.getResolutionForZoom(nextZoom);
        // adjust the layer's buffer size so we don't have to pan
        layer.buffer = Math.ceil((extentWidth / tileWidth - map.getSize().w / tileWidth) / 2);
        this.map.zoomIn();
        if (nextZoom === layer.numZoomLevels-1) {
            this.stopOfflineTileSeeding(seedParams);
        }
    },
    /* == END Public API == */
    createRequestParams: function(op, version, params) {
        var p = {
            CLIENTAGENT: MapGuide.CLIENT_AGENT,
            OPERATION: op,
            VERSION: version
        };
        if (this.sessionId) {
            p.SESSION = this.sessionId;
        }
        if (params) {
            for (var key in params) {
                p[key] = params[key];
            }
        }
        return p;
    },
    queryFeatureInfo: function(mapName, geomWkt, append, maxFeatures) {
        var req = this.createRequestParams("QUERYMAPFEATURES", "1.0.0", {
            MAPNAME: mapName,
            PERSIST: 1,
            MAXFEATURES: maxFeatures,
            SELECTIONVARIANT: "INTERSECTS",
            //LAYERNAMES: "Parcels",
            GEOMETRY: geomWkt,
            SEQ: Math.random()
        });
        //TODO: Need to also set req.LAYERNAMES
        OpenLayers.Request.POST({
            url: this.agentUrl,
            data: OpenLayers.Util.getParameterString(req),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            success: OpenLayers.Function.bind(function(req) {
                this.logi("QUERYMAPFEATURES success");
                this.oSelectionLayer.redraw();
            }, this)
        });
    },
    getSiteVersion: function(callback) {
        //Check site version
        OpenLayers.Request.GET({
            url: this.agentUrl,
            params: this.createRequestParams("GETSITEVERSION", "1.0.0"),
            success: OpenLayers.Function.bind(function(req) {
                var tokens = req.responseText.split(".");
                var major = parseInt(tokens[0], 10);
                var minor = parseInt(tokens[1], 10);
                var rev = parseInt(tokens[2], 10);
                callback({
                    MAJOR: major,
                    MINOR: minor,
                    REVISION: rev
                });
            }, this)
        });
    },
    initKeepAlive: function() {
        //To start the keep-alive we need to ensure the operation we're
        //pinging periodically checks out
        this.getSiteVersion(OpenLayers.Function.bind(function(ver) {
            this.startKeepAlive();
        }, this));
    },
    startKeepAlive: function() {
        var self = this;
        self.logi("Using GETSITEVERSION for keep-alive");
        var keepAlive = function() {
            self.logi("Session kept alive");
            self.getSiteVersion(function(ver) {
                setTimeout(keepAlive, self.DEFAULT_PING_TIMEOUT); //Ping every 30 secs
            });
        };
        keepAlive(); //Start the keep-alive
    },
    onMapGuideSessionExpired: function() {
        alert("The current MapGuide session has expired. Please refresh the viewer");
    },
    updateCacheStatus: function(evt) {
        if (!this.isOfflineTileCachingEnabled)
            return;
        //this.logi("Tile loaded: " + evt.tile.url);
        if (evt && evt.tile.url.substr(0, 5) === "data:")
            this.nCacheReads++;
        if (window.localStorage) 
            this.logi("Cache status: " + this.nCacheReads + " cache hits. " + localStorage.length + " entries in cache.");
        else 
            this.logw("Local storage not supported. Try a different browser.");
    },
    setOfflineTileStrategy: function(strategy) {
        this.offlineTileStrategy = strategy;
        if (strategy == MapGuide.OFFLINE_TILE_STRATEGY.CACHE_FIRST) 
            this.olControls.CacheReadLocalFirst.activate();
        else
            this.olControls.CacheReadRemoteFirst.activate();
    },
    clearOfflineTileCache: function() {
        OpenLayers.Control.CacheWrite.clearCache();
        this.nCacheReads = 0;
    },
    startOfflineTileSeeding: function(options) {
        var layer = map.baseLayer,
            zoom = map.getZoom();
        var seedParams = {
            zoom: zoom,
            extent: map.getExtent(),
            center: map.getCenter(),
            cacheWriteActive: cacheWrite.active,
            buffer: layer.buffer,
            layer: layer
        };
        // make sure the next setCenter triggers a load
        map.zoomTo(zoom === layer.numZoomLevels-1 ? zoom - 1 : zoom + 1);
        // turn on cache writing
        this.olControls.CacheWrite.activate();
        // turn off cache reading
        this.olControls.CacheReadLocalFirst.deactivate();
        this.olControls.CacheReadRemoteFirst.deactivate();
        
        layer.events.register("loadend", null, seedTiles);
        
        // start seeding
        map.setCenter(seeding.center, zoom);
    },
    stopOfflineTileSeeding: function(seedParams) {
        // we're done - restore previous settings
        seedParams.layer.events.unregister("loadend", null, seedTiles);
        seedParams.layer.buffer = seedParams.buffer;
        map.setCenter(seedParams.center, seedParams.zoom);
        if (!seedParams.cacheWriteActive) {
            this.olControls.CacheWrite.deactivate();
        }
        this.setOfflineTileStrategy(this.offlineTileStrategy);
        this.isSeedingCachedTiles = false;
    },
    notifyFullTileCache: function() {
        this.logw("Offline tile cache is full");
    },
    createProjection: function(epsg) {
        return new OpenLayers.Projection(epsg);
    },
    createCommercialLayer: function(type, subType) {
        switch(type)
        {
            case "OSM":
                return new OpenLayers.Layer.OSM("OpenStreetMap", null, {
                    //Register tileloaded events for cache tracking statistics
                    projection: new OpenLayers.Projection("EPSG:900913"),
                    eventListeners: {
                        tileloaded: OpenLayers.Function.bind(this.updateCacheStatus, this)
                    }
                });
            case "GOOGLE":
                {
                    switch(subType)
                    {
                        case "HYBRID":
                            return new OpenLayers.Layer.Google("Google Hybrid", { projection: new OpenLayers.Projection("EPSG:900913"), type: google.maps.MapTypeId.HYBRID, numZoomLevels: 20});
                        case "SATELLITE":
                            return new OpenLayers.Layer.Google("Google Satellite", { projection: new OpenLayers.Projection("EPSG:900913"), type: google.maps.MapTypeId.SATELLITE, numZoomLevels: 22});
                        case "STREETS":
                            return new OpenLayers.Layer.Google("Google Streets", { projection: new OpenLayers.Projection("EPSG:900913"), numZoomLevels: 20});
                        case "TERRAIN":
                            return new OpenLayers.Layer.Google("Google Physical", { projection: new OpenLayers.Projection("EPSG:900913"), type: google.maps.MapTypeId.TERRAIN });
                    }
                }
        }
        return null;
    },
    onResize: function() {
        $("#viewer").height($(window).height() - $("#theNavbar").height());
        this.map.updateSize();
    },
    CLASS_NAME: "MapGuide.Viewer"
});

MapGuide.Util = {
    makeWktPolygon: function(x1,y1,x2,y2) {
        return "POLYGON((" + x1 + " " + y1 + ", " + x2 + " " + y1 + ", " + x2 + " " + y2 + ", " + x1 + " " + y2 + ", " + x1 + " " + y1 + "))";
    }
};

//Viewer commands
MapGuide.Command = {};
MapGuide.Command.BaseCommand = OpenLayers.Class({
    viewer: null,
    initialize: function(viewer) {
        this.viewer = viewer;
    },
    execute: function() {},
    CLASS_NAME: "MapGuide.Command.BaseCommand"
});

MapGuide.Command.InitialView = OpenLayers.Class(MapGuide.Command.BaseCommand, {
    initialize: function(viewer) {
        MapGuide.Command.BaseCommand.prototype.initialize.apply(this, arguments);
    },
    execute: function() {
        this.viewer.initialView();
    },
    CLASS_NAME: "MapGuide.Command.InitialView"
});

MapGuide.Command.Refresh = OpenLayers.Class(MapGuide.Command.BaseCommand, {
    initialize: function(viewer) {
        MapGuide.Command.BaseCommand.prototype.initialize.apply(this, arguments);
    },
    execute: function() {
        this.viewer.refresh();
    },
    CLASS_NAME: "MapGuide.Command.Refresh"
});

MapGuide.Command.Layers = OpenLayers.Class(MapGuide.Command.BaseCommand, {
    initialize: function(viewer) {
        MapGuide.Command.BaseCommand.prototype.initialize.apply(this, arguments);
    },
    execute: function() {
        alert("Not implemented");
    },
    CLASS_NAME: "MapGuide.Command.Layers"
});
MapGuide.Command.Measure = OpenLayers.Class(MapGuide.Command.BaseCommand, {
    initialize: function(viewer) {
        MapGuide.Command.BaseCommand.prototype.initialize.apply(this, arguments);
    },
    execute: function() {
        alert("Not implemented");
    },
    CLASS_NAME: "MapGuide.Command.Measure"
});
MapGuide.Command.Geolocate = OpenLayers.Class(MapGuide.Command.BaseCommand, {
    mapProj: null,
    gpsProj: null,
    initialize: function(viewer) {
        MapGuide.Command.BaseCommand.prototype.initialize.apply(this, arguments);
        this.mapProj = this.viewer.map.getProjectionObject();
        this.gpsProj = new OpenLayers.Projection("EPSG:4326");
    },
    execute: function() {
        var self = this;
        navigator.geolocation.getCurrentPosition(function(pos) { //Success
            var pt = new OpenLayers.LonLat(pos.coords.longitude, pos.coords.latitude);
            pt.transform(self.gpsProj, self.mapProj);
            if (viewer.map.getMaxExtent().contains(pt.lon, pt.lat))
                viewer.map.setCenter(pt);
            else
                alert("Your location is outside the maximum bounds of this map");
        }, function(e) { //Fail
            self.viewer.loge("Geolocation failed: " + e);
        }, { //Options
            enableHighAccuracy: false,
            maximumAge: 0,
            timeout: 7000
        });
    },
    CLASS_NAME: "MapGuide.Command.Geolocate"
});

//Additional OpenLayers controls/classes not in the main distribution

/**
 * @requires OpenLayers/Control.js
 *
 * Class: OpenLayers.Control.MapGuideSelect
 * Handles MapGuide selection rendering via mouse click
 *
 * Inherits from:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.MapGuideSelect = OpenLayers.Class(OpenLayers.Control, {
    initialize: function(options) {
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
        this.viewer = options.viewer;
        this.map = options.map;
        this.mapName = options.mapName;
        this.map.events.register("click", this, this.onMapMouseClick);
    },
    onMapMouseClick: function(e) {
        var p1 = new OpenLayers.Pixel(e.xy.x - 2, e.xy.y - 2);
        var p2 = new OpenLayers.Pixel(e.xy.x + 2, e.xy.y + 2);
        var opx1 = this.map.getLonLatFromViewPortPx(p1);
        var opx2 = this.map.getLonLatFromViewPortPx(p2);
        var wkt = MapGuide.Util.makeWktPolygon(opx1.lon, opx1.lat, opx2.lon, opx2.lat);
        this.viewer.queryFeatureInfo(this.mapName, wkt, false, -1);
    },
    CLASS_NAME: "OpenLayers.Control.MapGuideSelect"
});

/**
 * @requires OpenLayers/Control.js
 *
 * Class: OpenLayers.Control.MapGuideTooltip
 * Handles MapGuide tooltip display via mouse hover
 *
 * Inherits from:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.MapGuideTooltip = OpenLayers.Class(OpenLayers.Control, {
    initialize: function(options) {
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
        this.viewer = options.viewer;
        this.map = options.map;
        this.mapName = options.mapName;
    },
    CLASS_NAME: "OpenLayers.Control.MapGuideTooltip"
});
/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Control.js
 *
 * Class: OpenLayers.Control.LoadingPanel
 * In some applications, it makes sense to alert the user that something is 
 * happening while tiles are loading. This control displays a div across the 
 * map when this is going on.
 *
 * Inherits from:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.LoadingPanel = OpenLayers.Class(OpenLayers.Control, {

    /**
     * Property: counter
     * {Integer} A counter for the number of layers loading
     */ 
    counter: 0,

    /**
     * Property: maximized
     * {Boolean} A boolean indicating whether or not the control is maximized
    */
    maximized: false,

    /**
     * Property: visible
     * {Boolean} A boolean indicating whether or not the control is visible
    */
    visible: true,

    /**
     * Constructor: OpenLayers.Control.LoadingPanel
     * Display a panel across the map that says 'loading'. 
     *
     * Parameters:
     * options - {Object} additional options.
     */
    initialize: function(options) {
         OpenLayers.Control.prototype.initialize.apply(this, [options]);
    },

    /**
     * Function: setVisible
     * Set the visibility of this control
     *
     * Parameters:
     * visible - {Boolean} should the control be visible or not?
    */
    setVisible: function(visible) {
        this.visible = visible;
        if (visible) {
            OpenLayers.Element.show(this.div);
        } else {
            OpenLayers.Element.hide(this.div);
        }
    },

    /**
     * Function: getVisible
     * Get the visibility of this control
     *
     * Returns:
     * {Boolean} the current visibility of this control
    */
    getVisible: function() {
        return this.visible;
    },

    /**
     * APIMethod: hide
     * Hide the loading panel control
    */
    hide: function() {
        this.setVisible(false);
    },

    /**
     * APIMethod: show
     * Show the loading panel control
    */
    show: function() {
        this.setVisible(true);
    },

    /**
     * APIMethod: toggle
     * Toggle the visibility of the loading panel control
    */
    toggle: function() {
        this.setVisible(!this.getVisible());
    },

    /**
     * Method: addLayer
     * Attach event handlers when new layer gets added to the map
     *
     * Parameters:
     * evt - {Event}
    */
    addLayer: function(evt) {
        if (evt.layer) {
            evt.layer.events.register('loadstart', this, this.increaseCounter);
            evt.layer.events.register('loadend', this, this.decreaseCounter);
        }
    },

    /**
     * Method: setMap
     * Set the map property for the control and all handlers.
     *
     * Parameters: 
     * map - {<OpenLayers.Map>} The control's map.
     */
    setMap: function(map) {
        OpenLayers.Control.prototype.setMap.apply(this, arguments);
        this.map.events.register('preaddlayer', this, this.addLayer);
        for (var i = 0; i < this.map.layers.length; i++) {
            var layer = this.map.layers[i];
            layer.events.register('loadstart', this, this.increaseCounter);
            layer.events.register('loadend', this, this.decreaseCounter);
        }
    },

    /**
     * Method: increaseCounter
     * Increase the counter and show control
    */
    increaseCounter: function() {
        this.counter++;
        if (this.counter > 0) { 
            if (!this.maximized && this.visible) {
                this.maximizeControl(); 
            }
        }
    },
    
    /**
     * Method: decreaseCounter
     * Decrease the counter and hide the control if finished
    */
    decreaseCounter: function() {
        if (this.counter > 0) {
            this.counter--;
        }
        if (this.counter == 0) {
            if (this.maximized && this.visible) {
                this.minimizeControl();
            }
        }
    },

    /**
     * Method: draw
     * Create and return the element to be splashed over the map.
     */
    draw: function () {
        OpenLayers.Control.prototype.draw.apply(this, arguments);
        return this.div;
    },
     
    /**
     * Method: minimizeControl
     * Set the display properties of the control to make it disappear.
     *
     * Parameters:
     * evt - {Event}
     */
    minimizeControl: function(evt) {
        this.div.style.display = "none"; 
        this.maximized = false;
    
        if (evt != null) {
            OpenLayers.Event.stop(evt);
        }
    },
    
    /**
     * Method: maximizeControl
     * Make the control visible.
     *
     * Parameters:
     * evt - {Event}
     */
    maximizeControl: function(evt) {
        this.div.style.display = "block";
        this.maximized = true;
    
        if (evt != null) {
            OpenLayers.Event.stop(evt);
        }
    },

    /** 
     * Method: destroy
     * Destroy control.
     */
    destroy: function() {
        if (this.map) {
            this.map.events.unregister('preaddlayer', this, this.addLayer);
            if (this.map.layers) {
                for (var i = 0; i < this.map.layers.length; i++) {
                    var layer = this.map.layers[i];
                    layer.events.unregister('loadstart', this, 
                        this.increaseCounter);
                    layer.events.unregister('loadend', this, 
                        this.decreaseCounter);
                }
            }
        }
        OpenLayers.Control.prototype.destroy.apply(this, arguments);
    },     
    CLASS_NAME: "OpenLayers.Control.LoadingPanel"
});