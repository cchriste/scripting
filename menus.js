//top-level namespace for visus-related globals
visus = { name: "ViSUS Web Viewer",
          dataset_details: undefined,
          tile_size: 512,
          osd: null,
          scripting: false
}

function init() {
  document.getElementById("time").onkeyup=time_keyup;
  document.getElementById("range_min").onkeyup=range_keyup;
  document.getElementById("range_max").onkeyup=range_keyup;
}

function serverDropdownOnClick() {
  hideDiv("fieldDropdown");
  hideDiv("datasetsDropdown");
  hideDiv("paletteDropdown");
  document.getElementById("serverDropdown").classList.toggle("show");
}

function datasetDropdownOnclick() {
  hideDiv("fieldDropdown");
  hideDiv("serverDropdown");
  hideDiv("paletteDropdown");
  document.getElementById("datasetsDropdown").classList.toggle("show");
  document.getElementById("datasetsFilterInput").value="";
  filter = document.getElementById("datasetsFilterInput");
  filterFunction(filter);
}

function paletteDropdownOnclick() {
  hideDiv("fieldDropdown");
  hideDiv("serverDropdown");
  hideDiv("datasetsDropdown");
  document.getElementById("paletteDropdown").classList.toggle("show");
  document.getElementById("paletteFilterInput").value="";
  filter = document.getElementById("paletteFilterInput");
  filterFunction(filter);
}

function fieldDropdownOnclick() {
  hideDiv("serverDropdown");
  hideDiv("datasetsDropdown");
  hideDiv("paletteDropdown");
  document.getElementById("fieldDropdown").classList.toggle("show");
  document.getElementById("fieldFilterInput").value="";
  filter = document.getElementById("fieldFilterInput");
  filterFunction(filter);
}

function filterFunction(input) {
  var filter, ul, li, a, i;
  filter = input.value.toUpperCase();
  a = input.parentNode.getElementsByTagName("span");
  for (i = 0; i < a.length; i++) {
    if (a[i].innerHTML.toUpperCase().indexOf(filter) > -1) {
      a[i].style.display = "";
    } else {
      a[i].style.display = "none";
    }
  }
}

function hideDiv(id) {
  var div = document.getElementById(id);
  if (div.classList.contains('show')) {
    div.classList.remove('show');
  }
}

// Close the dropdown menu if the user clicks outside of it
window.onclick = function(event){onclick1(event)}

function onclick1(event) {
  if (!event.target.matches('.dropbtn') && !event.target.matches('#datasetsFilterInput') && !event.target.matches('#paletteFilterInput') && !event.target.matches('#fieldFilterInput')) 
  {
    var dropdowns = document.getElementsByClassName("dropdown-content");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  }
}

//is this even used?
function getDataset(code) {
  return data.filter(
    function(data) {
      return data.code == code
    }
  );
}

function populateFields(fields) {
  div = document.getElementById("fieldDropdown");
  input = document.getElementById("fieldFilterInput");
  while (div.hasChildNodes()) {
    div.removeChild(div.lastChild);
  }
  div.appendChild(input);
  for (var i=0;i<fields.length;i++) {
    var field=document.createElement("span");
    field.setAttribute("onclick","selectField('"+fields[i].name+"')");
    field.innerHTML=fields[i].name;
    div.appendChild(field);
  }
}

//select dataset
function selectDataset(server,dataset) {
  //console.log("selectDataset("+server+","+dataset+")");
  url=server+'/mod_visus?action=readdataset&dataset='+dataset;
  loadDataset(url)
    .then(function(details) {
      populateFields(details.fields);
      document.getElementById("selected_dataset").firstChild.innerHTML=dataset;
      //document.getElementById("scripteditor").value=details.fields[0].name;
      selectField(details.fields[0].name);
      document.getElementById("time_range_begin").innerHTML=details.timesteps[0];
      document.getElementById("time_range_end").innerHTML=details.timesteps[1];
      document.getElementById("time").value=details.timesteps[0];
      var timeSlider=document.getElementById("time_slider");
      timeSlider.min=details.timesteps[0];
      timeSlider.max=details.timesteps[1];
      timeSlider.value=details.timesteps[0];
      updateViewer(true);
    }).catch(function(error) {
      console.log("There was a problem selecting the dataset: "+error);
    });
}

//select server and populate datasets menu
function selectServer(server) 
{
  //TODO: need to clear the other input fields (dataset, field, etc)
  document.getElementById("selected_server").firstChild.innerHTML=server;
  var property=visus.scripting?"&property=midx":"&property=idx";
  url=server+'/mod_visus?action=list&format=json'+property;
  loadJSON(url)
    .then(getDatasetNames)
    .then(function(datasets) {
      div = document.getElementById("datasetsDropdown");
      input = document.getElementById("datasetsFilterInput");
      while (div.hasChildNodes()) {
        div.removeChild(div.lastChild);
      }
      div.appendChild(input);
      for (var i=0;i<datasets.length;i++) {
        var dataset=document.createElement("span");
        dataset.setAttribute("onclick","selectDataset('"+server+"','"+datasets[i]+"')");
        dataset.innerHTML=datasets[i];
        div.appendChild(dataset);
      }
    }).catch(function(error) {
      console.log("Houston, we've got a problem: "+error);
    });
}

function getDatasetNames(obj) {
  var arr=obj.childs;
  var ret=[];
  while (arr.length > 0) {
    item = arr.shift();
    if (item.name == "group" && 'childs' in item)
      arr = item.childs.concat(arr);
    else if (item.name == "dataset")
      ret.push(item.attributes.name);
    else
      console.log("unknown item encountered: "+item.name);
  }
  //console.log("the datasets: "+ret);
  return ret;
}

function loadJSON(url) {
  return fetch(url,{method:'get'})
    .then(function (response) {
      if (response.headers.get("content-type").indexOf("application/json") !== -1) {// checking response header
        return response.json();
      } else {
        throw new TypeError('Response from "' + url + '" has unexpected "content-type"');
      }
    })
    .catch(function (error) {
      console.error(error.message);
    });
}

function loadDataset(url) {
  return fetch(url,{method:'get'})
    .then(function (response) {
      if (response.headers.get("content-type").indexOf("application/octet-stream") !== -1) {// checking response header
        return response.text();
      } else {
        throw new TypeError('Response from "' + url + '" has unexpected "content-type"');
      }
    })
    .then(readDetails)
    .catch(function (error) {
      console.error(error.message);
    });
}

function readDetails(header) {
  details={};
  details.timesteps=[0,0];

  //console.log("dataset header: "+header);

  var lines = header.split('\n');
  for(var i = 0;i < lines.length;i++){
    if (lines[i]=="(box)") {
      var dims=lines[++i].split(' ');
      details.dims=[];
      details.dims[0]=parseInt(dims[1])+1;
      details.dims[1]=parseInt(dims[3])+1;
      details.dims[2]=parseInt(dims[5])+1;
    }
    else if (lines[i]=="(logic_to_physic)") {
      ;//TODO: parse and utilize logical to physical scaling
    }
    else if (lines[i]=="(bits)") {
      details.levels=lines[++i].length-1;
    }
    else if (lines[i]=="(fields)") {
      details.fields=[];
      var buf="";
      do {
        buf=buf.concat(lines[++i]);
      } while (lines[i+1] != "(bits)");
      var fields=buf.split('+');
      for (var j=0;j<fields.length;j++) {
        var field_struct={};
        var field=fields[j].trim().split(' ');
        field_struct.name=field[0];
        for (var k=1;k<field.length;k++) {
          if (field[k].substring(0,3)=="min") {
            var minval=parseFloat(field[k].substring(4,field[k].length-1));
            field_struct.min=minval;
          }
          if (field[k].substring(0,3)=="max") {
            var maxval=parseFloat(field[k].substring(4,field[k].length-1));
            field_struct.max=maxval;
          }
        }
        details.fields.push(field_struct); // fieldname
      }
    }
    else if (lines[i]=="(time)") {
      var timeline=lines[++i].trim().split(' ');
      if (timeline[0]=="*") {
        console.log("TODO: I don't know what * means for timesteps");
      }
      else {
        var start=parseInt(timeline[0]);
        if (!isNaN(start)) {  //old format
          var end=parseInt(timeline[1]);
          details.timesteps=[start,end];
        }
        else { //new format
          for (t=1;t<timeline.length;t++) {
            var range=timeline[t].substring(1,timeline[t].length-1).split(','); // (start,end,step)
            var start=parseInt(range[0]);
            var end=parseInt(range[1]);
            //just ignore step for now
            details.timesteps=[Math.min(start,details.timesteps[0]),Math.max(end,details.timesteps[1])];
          }
        }
      }
    }
  }
  
  console.log("dataset details: ");
  console.log("  dims: "+details.dims);
  console.log("  levels: "+details.levels);
  console.log("  fields: "+details.fields);
  console.log("  timesteps: "+details.timesteps);
//  console.log("  physical: "+details.physical_dims);
  visus.dataset_details=details;
  return details;
}

//select palette
function selectPalette(palette) {
  //console.log("selectPalette("+palette+")");
  document.getElementById("selected_palette").firstChild.innerHTML=palette;
  updateViewer();
}

//select field
function selectField(field) {
  //console.log("selectField("+field+")");
  document.getElementById("scripteditor").value=field;

  var fields=visus.dataset_details.fields;
  for (var i=0;i<fields.length;i++) {
    if (fields[i].name==field) {
      var auto=("min" in fields[i] && "max" in fields[i]);
      if ("min" in fields[i])
        document.getElementById("range_min").value=fields[i].min;
      else
        document.getElementById("range_min").value=0;
      if ("max" in fields[i])
        document.getElementById("range_max").value=fields[i].max;
      else
        document.getElementById("range_max").value=1e-4;
      if (auto)
        document.getElementById("auto_range").checked=true;
      else
        document.getElementById("auto_range").checked=false;
      break;
    }
  }

  updateViewer();
}

//update range
function updateRange() {
  //console.log("updateRange()");
  updateViewer();
}

function updateTimeFromSlider() {
  //console.log("updateTimeFromSlider()");
  var time=document.getElementById("time_slider").value;
  document.getElementById("time").value=time;
  updateTime();
}

//update time
function updateTime() {
  //console.log("updateTime()");
  var time_box=document.getElementById("time");
  var slider=document.getElementById("time_slider");
  var time=parseInt(time_box.value);
  time_box.value=clamp(time,slider.min,slider.max);
  slider.value=clamp(time,slider.min,slider.max);

  updateViewer();
}

//re-reads all fields and updates (reloads) tileset
function updateViewer(reset_view=false) {
  var script=document.getElementById("scripteditor").value;
  var palette=document.getElementById("selected_palette").firstChild.innerHTML;
  var interp=document.getElementById("palette_interp_flat").checked;
  var server=document.getElementById("selected_server").firstChild.innerHTML;
  var dataset=document.getElementById("selected_dataset").firstChild.innerHTML;//+"_midx";  //<ctc> hack to use midx since server doesn't yet send necessary details
  var minRng=parseFloat(document.getElementById("range_min").value);
  var maxRng=parseFloat(document.getElementById("range_max").value);
  var time=parseInt(document.getElementById("time").value);
  document.getElementById("selected_field").firstChild.innerHTML=script;
  if (visus.dataset_details !== undefined) {
    var details=visus.dataset_details;
    var url=server+"/mod_visus?"+
      (minRng?"palette_min="+minRng+"&":"")+
      (maxRng?"palette_max="+maxRng+"&":"")+
      (interp?"palette_interp=Flat&":"")+
      (time?"time="+time+"&":"");
    var tileSource=add_dataset(url,dataset,
                               details.dims[0],details.dims[1],details.levels,visus.tile_size,
                               palette,
                               encodeURIComponent(script));
    if (visus.osd) {
      visus.osd.open(tileSource);
      if (reset_view) {
        visus.osd.viewport.goHome( true );
        visus.osd.viewport.update();
      }
    }
    else 
      openDataset(tileSource);
  }
}

//update time
function time_keyup(event) {
  if (event.which==13)
  {
    //console.log("updateTime-pressedEnter()");
    updateTime();
  }
}

//update time
function range_keyup(event) {
  if (event.which==13)
  {
    //console.log("updateRange-pressedEnter()");
    updateRange();
  }
}

function replaceViewer() {
  var viewer=document.getElementById("viewer");
  var sidebar=document.getElementById("sidebar");
  var parent=viewer.parentNode;
  if (visus.osd !== null) {
    visus.osd.destroy();
    visus.osd=null;
  }
  parent.removeChild(viewer);
  var new_viewer=document.createElement("div");
  new_viewer.id="viewer";
  new_viewer.className="openseadragon";
  parent.insertBefore(new_viewer,sidebar);
}

function toggleScriptEditor() {
  var panels = document.getElementsByClassName("accordion-panel");
  var button=document.getElementById("toggleScriptEditorButton");
  var script=document.getElementById("scripteditor");
  var selectedfield=document.getElementById("selected_field");
  if (panels[0].style.maxHeight) {
    button.innerHTML="+";
    for (var i = 0; i < panels.length; i++) {
      var panel = panels[i];
      panel.style.maxHeight = null;
    }
    selectedfield.style.display="block";
    selectedfield.firstChild.innerHTML=script.value;
  }
  else {
    button.innerHTML="-";
    for (var i = 0; i < panels.length; i++) {
      var panel = panels[i];
      panel.style.maxHeight = panel.scrollHeight + "px";
    }
    selectedfield.style.display="none";
  }
}


function clamp(val,min,max) {
  return Math.min(Math.max(min,val),max);
}


function autoRangeChanged() {
  console.log("autoRangeChanged");
}

function interpChanged() {
  console.log("interpChanged");
  updateViewer();
}
