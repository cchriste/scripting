
function add_dataset(ds_server,ds_name,ds_width,ds_height,ds_levels,tile_size,palette,field) {
  var half_max_levels=parseInt(ds_levels/2,10);
  if (palette !== undefined) {
    palette="&palette="+palette;
  }
  else {
    palette="";
  }
  if (field !== undefined) {
    field="&field="+field;
  }                                      
  else {
    field="";
  }
  return {
    height: ds_height,
    width:  ds_width,
    tileSize: tile_size,
    minLevel: 0,
    maxLevel: half_max_levels,
    getTileUrl: function( level, x, y ){
      var scale = Math.pow(2, half_max_levels-level);
      var level_tile_size = tile_size*scale;

      var bbox0 = level_tile_size*x
      var bbox1 = Math.min(level_tile_size*(x+1)-1, ds_width)
      var bbox3 = ds_height - level_tile_size*y
      var bbox2 = ds_height - Math.min(level_tile_size*(y+1)-1, ds_height)

      return (ds_server + "action=boxquery&box=" + bbox0 + "%20" + bbox1+ "%20" + bbox2 + "%20" + bbox3 + "&compression=png&dataset=" + ds_name + "&maxh=" + ds_levels + "&toh=" + level*2 + palette + field)
    }
  };
}

function openDataset(tileSource){
  var tile_size=visus.tile_size;
  visus.osd=OpenSeadragon({
    id: "viewer",
    prefixUrl: "openseadragon/images/",
    showNavigator: true,
    showReferenceStrip: false,
    navigatorPosition:   "TOP_RIGHT",
    immediateRender: true,  //true skips coarse resolution levels
    defaultZoomLevel: 0, //fit best
    maxImageCacheCount: 1000, //default is 200 "per drawer"
    sequenceMode: false,
    preserveViewport: true,
    minZoomImageRatio: 0.25,
    maxZoomImageRatio: Infinity,
    visibilityRatio: 0.2,
    imageLoaderLimit: 20, //maximum number of simultaneous image requests
    showRotationControl: true,
    placeholderFillStyle: "#FF8800",
    tileSources:   [tileSource]
  });
}
