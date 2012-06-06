<?php

class MgResourceType
{
   ////////////////////////////////////////////////////////////////
   /// \brief
   /// This resource is the runtime definition of a map.
   ///
   /// \note1
   ///
   /// \remarks
   /// It is stored in the session repository to represent the
   /// currently visible layers and viewed extents of a map. It is
   /// constructed using a \link MgResourceType::MapDefinition MapDefinition \endlink
   /// and may contain additional layers which have been added "on
   /// the fly" by a web application. See \ref Maps_and_Layers_Module "Maps and Layers"
   /// for more details.
   ///
   const Map  = "Map"; /// \if INTERNAL  \endif 
   ////////////////////////////////////////////////////////////////
   /// \brief
   /// This resource is a map definition.
   ///
   /// \note1
   ///
   /// \remarks
   /// It represents an authored map and contains references to a \link MgResourceType::MapDefinition LayerDefinition \endlink
   /// for each layer comprising the map.
   ///
   /// \note
   /// This is different from a \link MgResourceType::Map Map \endlink
   /// resource, which records the current state of a map as it is
   /// being viewed by an end user.
   ///
   /// \see \ref MapDefinition_schema "MapDefinition schema"
   ///
   const MapDefinition  = "MapDefinition"; /// \if INTERNAL  \endif 
   ////////////////////////////////////////////////////////////////
   /// \brief
   /// This resource is a layer definition.
   ///
   /// \remarks
   /// It represents the stylization for a specific map layer. It
   /// may also reference \link drawing_source DrawingSources \endlink and \link feature_source FeatureSources \endlink
   /// depending on the source of the data.
   ///
   /// \see \ref LayerDefinition_schema "LayerDefinition schema"
   ///
   const LayerDefinition  = "LayerDefinition"; /// \if INTERNAL  \endif 
   ////////////////////////////////////////////////////////////////
   /// \brief
   /// This resource is a \link drawing_source drawing source \endlink.
   ///
   /// \note1
   ///
   /// \remarks
   /// The resource contains information required by MapGuide
   /// to access data contained in a DWF.
   ///
   /// \see \ref DrawingSource_schema "DrawingSource schema"
   ///
   const DrawingSource  = "DrawingSource"; /// \if INTERNAL  \endif 
   ////////////////////////////////////////////////////////////////
   /// \brief
   /// This resource is a \link feature_source feature source \endlink.
   ///
   /// \remarks
   /// Feature sources access data through FDO data providers like
   /// the Oracle FDO provider or the SDF FDO provider. The resource
   /// content contains the information required to access the
   /// data.
   ///
   /// \see \ref FeatureSource_schema "FeatureSource schema"
   ///
   const FeatureSource  = "FeatureSource"; /// \if INTERNAL  \endif 
   ////////////////////////////////////////////////////////////////
   /// \brief
   /// This resource is a folder.
   ///
   /// \note1
   ///
   /// \remarks
   /// Folders in a repository operate in a similar manner to file
   /// system folders. They contain other resources and can be
   /// nested to create resource trees.
   ///
   const Folder  = "Folder"; /// \if INTERNAL  \endif 
   ////////////////////////////////////////////////////////////////
   /// \brief
   /// This resource is a load procedure definition.
   ///
   /// \note1
   ///
   /// \remarks
   /// It records how to load specific data.
   ///
   /// \see \ref LoadProcedure_schema "LoadProcedure schema"
   ///
   const LoadProcedure  = "LoadProcedure"; /// \if INTERNAL  \endif 
   ////////////////////////////////////////////////////////////////
   /// \brief
   /// This resource is a print layout.
   ///
   /// \note1
   ///
   /// \remarks
   /// A print layout defines how a map is printed. It sets the size
   /// and resolution of the map on paper and also determines the
   /// location of direction arrows, legends, and other features.
   ///
   /// \see \ref PrintLayout_schema "PrintLayout schema"
   ///
   const PrintLayout  = "PrintLayout"; /// \if INTERNAL  \endif 
   ////////////////////////////////////////////////////////////////
   /// \brief
   /// This resource is the runtime definition of a selection.
   ///
   /// \note1
   ///
   /// \remarks
   /// It is stored in the session repository to represent the
   /// current selection on a map.
   ///
   const Selection  = "Selection"; /// \if INTERNAL  \endif 
   ////////////////////////////////////////////////////////////////
   /// \brief
   /// This resource is a symbol definition.
   ///
   /// \remarks
   /// It represents the stylization for a specific symbol.
   ///
   /// \see \ref SymbolDefinition_schema "SymbolDefinition schema"
   ///
   const SymbolDefinition  = "SymbolDefinition"; /// \if INTERNAL  \endif 
   ////////////////////////////////////////////////////////////////
   /// \brief
   /// This resource is a library of symbols.
   ///
   /// \note1
   ///
   /// \remarks
   /// Symbols from a symbol library can be placed on a map to represent points
   /// of interest. Symbol libraries are referenced from \link MgResourceType::LayerDefinition LayerDefinitions \endlink.
   ///
   /// \see \ref SymbolLibrary_schema "SymbolLibrary schema"
   ///
   const SymbolLibrary  = "SymbolLibrary"; /// \if INTERNAL v \endif 
   ////////////////////////////////////////////////////////////////
   /// \brief
   /// This resource represents the screen layout for a specific
   /// map.
   ///
   /// \note1
   ///
   /// \remarks
   /// Web layouts determine the location and content of toolbars,
   /// the viewed map area, the legend, and viewed items.
   /// \n
   ///
   /// \see \ref WebLayout_schema "WebLayout schema"
   ///
   const WebLayout  = "WebLayout"; /// \if INTERNAL  \endif 
   ////////////////////////////////////////////////////////////////
   /// \brief
   /// This resource represents a web application definition
   ///
   /// \note1
   ///
   /// \remarks
   /// Application definitions determine the location and content of toolbars,
   /// the viewed map area, the legend, and viewed items.
   ///
   /// \see \ref ApplicationDefinition_schema "ApplicationDefinition schema"
   ///
   const ApplicationDefinition  = "ApplicationDefinition"; /// \if INTERNAL  \endif 
   
}

class MgServiceType
{
   ////////////////////////////////////////////////////////////////
   /// Resource Service
   const ResourceService = 0 ; 
   ////////////////////////////////////////////////////////////////
   /// DWF Drawing Service
   const DrawingService = 1 ; 
   ////////////////////////////////////////////////////////////////
   /// FDO Feature Service
   const FeatureService = 2 ; 
   ////////////////////////////////////////////////////////////////
   /// Mapping Service
   const MappingService = 3 ; 
   ////////////////////////////////////////////////////////////////
   /// Rendering Service
   const RenderingService = 4 ; 
   ////////////////////////////////////////////////////////////////
   /// Tile Service
   const TileService = 5 ; 
   ////////////////////////////////////////////////////////////////
   /// Kml Service
   const KmlService = 6 ; 
   ////////////////////////////////////////////////////////////////
   /// Profiling Service
   const ProfilingService = 10 ;   
}

class MgLayerGroupType
{
   ////////////////////////////////////////////
   /// \brief
   /// Specifies that the layer group is a normal layer group.
   ///
   const Normal = 1 ; 
   /////////////////////////////////////////////////
   /// \brief
   /// Specifies that the layer is a base map layer group (i.e.
   /// it contains base map layers).
   ///
   const BaseMap = 2 ; 
   
}

//TODO: Compute this. Currently, this is obviously meant to be installed under the www dir of your MapGuide installation
$configPath = dirname(__FILE__)."/../webconfig.ini";
MgInitializeWebTier($configPath);

function GetClientIp()
{
    $clientIp = '';
    if (array_key_exists('HTTP_CLIENT_IP', $_SERVER)
        && strcasecmp($_SERVER['HTTP_CLIENT_IP'], 'unknown') != 0)
    {
        $clientIp = $_SERVER['HTTP_CLIENT_IP'];
    }
    else if (array_key_exists('HTTP_X_FORWARDED_FOR', $_SERVER)
        && strcasecmp($_SERVER['HTTP_X_FORWARDED_FOR'], 'unknown') != 0)
    {
        $clientIp = $_SERVER['HTTP_X_FORWARDED_FOR'];
    }
    else if (array_key_exists('REMOTE_ADDR', $_SERVER))
    {
        $clientIp = $_SERVER['REMOTE_ADDR'];
    }
    return $clientIp;
}

function GetClientAgent()
{
    return "MapGuide Mobile Viewer";
}

function CreateRuntimeMap($resourceSrvc, $sessionId, $mdfId)
{
    $map = new MgMap();
    $resId = new MgResourceIdentifier($mdfId);
    $mapName = $resId->GetName();
    $map->Create($resourceSrvc, $resId, $mapName);

    //create an empty selection object and store it in the session repository
    $sel = new MgSelection($map);
    $sel->Save($resourceSrvc, $mapName);
    
    //Save the runtime map blob
    $mapStateId = new MgResourceIdentifier("Session:" . $sessionId . "//" . $mapName . "." . MgResourceType::Map);
    $map->Save($resourceSrvc, $mapStateId);
    
    return $map;
}

$production = false;
$epsg = "EPSG:900913";
$title = "MapGuide Mobile";
$req = $_GET;
//TODO: Compute this. Currently, this is obviously meant to be installed under the www dir of your MapGuide installation
$agentUrl = "../mapagent/mapagent.fcgi";

$stylesheets = array(
    "css/bootstrap.css",
    "css/bootstrap-responsive.css",
    "css/reset.css",
    "css/openlayers.css"
);
$scripts = array(
    "js/jquery-1.7.1.js",
    "js/bootstrap.js",
    "js/OpenLayers.js",
    "js/viewer.js"
);

try 
{
    $mapDefinition = "Library://Samples/Sheboygan/Maps/Sheboygan.MapDefinition";
    if (array_key_exists("map", $req)) {
        $mapDefinition = $req["map"];
    }
    $session = "";
    $layers = array();
    if (array_key_exists("cmslayers", $req)) {
        $layers = explode(".", $req["cmslayers"]);
    }
    $googleLayers = array();
    if (array_key_exists("glayers", $req)) {
        $googleLayers = explode(".", $req["glayers"]);
    }
    $createSession = false;
    $user = new MgUserInformation();
    /* If no session has been established yet, then we use the credentials passed
     * to this script to connect to the site server.  By default, we use the
     * Anonymous user.
     */
    if (!array_key_exists('session', $req)) {
        $username = isset($req['username']) ? $req['username'] : 'Anonymous';
        $password = isset($req['password']) ? $req['password'] : '';
        $user->SetMgUsernamePassword($username, $password);
        $createSession = true;
    } else {
        $user->SetMgSessionId($session);
    }
    
    //print_r("<br/>Open Site Connection");
    $user->SetClientIp(GetClientIp());
    $user->SetClientAgent(GetClientAgent());
    $siteConn = new MgSiteConnection();
    $siteConn->Open($user);
    
    if($createSession)
    {
        //print_r("<br/>Create Session");
        $site = $siteConn->GetSite();
        $session = $site->CreateSession();
        //print_r("<br/>Session: $session");
        $user = new MgUserInformation($session);
        $siteConn->Open($user);
    }

    //common resource service to be used by all scripts
    $resourceSrvc = $siteConn->CreateService(MgServiceType::ResourceService);
    
    $map = CreateRuntimeMap($resourceSrvc, $session, $mapDefinition);
    
    $csFactory = new MgCoordinateSystemFactory();
    $origSRS = $map->GetMapSRS();
    $mapCs = $csFactory->Create($origSRS);
    
    $mapExtents = $map->GetMapExtent();
    $finalCs = $mapCs;
    
    //TODO: Auto-transform to WGS84.PseudoMercator. We fail for now
    if (count($layers) > 0 && strcmp($origSRS, $csFactory->ConvertCoordinateSystemCodeToWkt("WGS84.PseudoMercator")) != 0) {
        throw new Exception("The specified Map Definition must be in WGS84.PseudoMercator if commercial layers are specified"); 
    } else {
        $epsg = "EPSG:".$finalCs->GetEpsgCode();
        if (strcmp($epsg, "EPSG:3857") == 0) {
            $epsg = "EPSG:900913";
        }
    }
    
    /*
    //Commerical layers specified, attempt transformation to WGS84.PseudoMercator. This is required
    //for commerical layers to properly line up
    if (count($layers) > 0) {
        $finalCs = $csFactory->CreateFromCode("WGS84.PseudoMercator");
        $br = $resourceSrvc->GetResource($map->GetMapDefinition());
        $xml = $br->ToString();
        //Load Map Definition
        $doc = DOMDocument::loadXML($xml);
        //Set new Coordinate System
        $doc->getElementsByTagName("CoordinateSystem")->item(0)->nodeValue = $csFactory->ConvertCoordinateSystemCodeToWkt("WGS84.PseudoMercator");
        //Set transformed extents
        $trans = $csFactory->GetTransform($mapCs, $finalCs);
        $txLL = $trans->Transform($mapExtents->GetLowerLeftCoordinate());
        $txUR = $trans->Transform($mapExtents->GetUpperRightCoordinate());
        $doc->getElementsByTagName("MinX")->item(0)->nodeValue = $txLL->GetX();
        $doc->getElementsByTagName("MinY")->item(0)->nodeValue = $txLL->GetY();
        $doc->getElementsByTagName("MaxX")->item(0)->nodeValue = $txUR->GetX();
        $doc->getElementsByTagName("MaxY")->item(0)->nodeValue = $txUR->GetY();
        //Save to session and create a new runtime map from that
        $xml = $doc->saveXML();
        $bs = new MgByteSource($xml, strlen($xml));
        $br = $bs->GetReader();
        $targetId = new MgResourceIdentifier("Session:$session//transformed.MapDefinition");
        $resourceSrvc->SetResource($targetId, $br, null);
        $map = CreateRuntimeMap($resourceSrvc, $session, $targetId);
    }
    */
    
    $header = "";
    if (in_array("google", $layers)) {
        $header .= "\n<script src=\"http://maps.google.com/maps/api/js?v=3.6&amp;sensor=false\"></script>";
    }
    if (in_array("bing", $layers)) {
        throw new Exception("No bing layer support at the moment");
    }
    
    // If minify == true, minify and compile referenced css and js files and insert 
    // reference to combined output
    if ($production == false) {
        foreach ($stylesheets as $css) {
            $header .= "\n<link rel=\"stylesheet\" href=\"$css\" />";
        }
        foreach ($scripts as $jsref) {
            $header .= "\n<script type=\"text/javascript\" src=\"$jsref\"></script>";
        }
    } else {
        echo "Compression and minification not supported yet";
    }

    $extents = $map->GetMapExtent();
    $ll = $extents->GetLowerLeftCoordinate();
    $ur = $extents->GetUpperRightCoordinate();
    $metersPerUnit = $finalCs->ConvertCoordinateSystemUnitsToMeters(1.0);

    //Set the mapType flag
    $mapType = "MapGuide.MAP_TYPE.MIXED";
    $dynamicGroups = 0;
    $tiledGroups = 0;
    $tiledLayerList = array();
    
    $groups = $map->GetLayerGroups();
    for ($i = 0; $i < $groups->GetCount(); $i++) {
        $group = $groups->GetItem($i);
        if (MgLayerGroupType::Normal == $group->GetLayerGroupType()) {
            $dynamicGroups++;
        } else if (MgLayerGroupType::BaseMap == $group->GetLayerGroupType()) {
            $tiledGroups++;
            array_push($tiledLayerList, $group->GetName());
        }
    }
    
    if ($dynamicGroups > 0 && $tiledGroups == 0)
        $mapType = "MapGuide.MAP_TYPE.FULLY_DYNAMIC";
    else if ($tiledGroups > 0 && $dynamicGroups == 0)
        $mapType = "MapGuide.MAP_TYPE.FULLY_TILED";
    else
        $mapType = "MapGuide.MAP_TYPE.MIXED";

    $fsScales = array();
    $fsCount = $map->GetFiniteDisplayScaleCount();
    for ($i = 0; $i < $fsCount; $i++) {
        array_push($fsScales, $map->GetFiniteDisplayScaleAt($i));
    }
    //Compile available google layers
    $googleLayersList = "";
    $gcount = count($googleLayers);
    if ($gcount > 0) {
        if ($gcount == 1) {
            $googleLayersList = "'".$googleLayers[0]."'";
        } else {
            $googleLayersList = "'".join("','", $googleLayers)."'";
        }
    }
    
    //Now output the templated stuff
    $inlineScript = sprintf(file_get_contents("templates/startup.js.templ"), 
        $epsg, 
        $ll->GetX(), 
        $ll->GetY(), 
        $ur->GetX(), 
        $ur->GetY(), 
        $metersPerUnit,
        $map->GetDisplayDpi(),
        $mapType,
        "'". (count($tiledLayerList) == 1 ? $tiledLayerList[0] : join("','", $tiledLayerList)) ."'",
        join(",", $fsScales),
        $agentUrl,
        $session,
        $map->GetName(),
        $map->GetMapDefinition()->ToString(),
        $googleLayersList);
        
    echo sprintf(file_get_contents("templates/viewer.templ"), 
        $title, 
        $header, 
        $inlineScript,
        substr($map->GetBackgroundColor(), 2),
        $title);
}
catch (MgException $e)
{
    $phpErrorMessage = $e->getMessage();
    $phpStackTrace = $e->getTraceAsString();
    $initializationErrorMessage = $e->GetExceptionMessage();
    $initializationErrorDetail = $e->GetDetails();
    $initializationErrorStackTrace = $e->GetStackTrace();
    echo "<p>An error occurred during initialization</p>";
    echo "<strong>PHP Exception Information</strong>";
    echo "<p>Message: $phpErrorMessage</p>";
    echo "<p>Stack Trace: <pre>$phpStackTrace</pre></p>";
    echo "<strong>MapGuide Exception Information</strong>";
    echo "<p>Message: $initializationErrorMessage</p>";
    echo "<p>Detail: $initializationErrorDetail</p>";
    echo "<p>Stack Trace: <pre>$initializationErrorStackTrace</pre></p>";
}
catch (Exception $e)
{
    $phpErrorMessage = $e->getMessage();
    $phpStackTrace = $e->getTraceAsString();
    echo "<p>An error occurred during initialization</p>";
    echo "<strong>PHP Exception Information</strong>";
    echo "<p>Message: $phpErrorMessage</p>";
    echo "<p>Stack Trace: <pre>$phpStackTrace</pre></p>";
}
?>