//top-level namespace for visus-related globals
visus = { name: "ViSUS Web Viewer",
          dataset_details: undefined,
          tile_size: 512,
          osd: null
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
    field.setAttribute("onclick","selectField('"+fields[i]+"')");
    field.innerHTML=fields[i];
    div.appendChild(field);
  }
}

//select dataset
function selectDataset(server,dataset) {
  console.log("selectDataset("+server+","+dataset+")");
  url=server+'/mod_visus?action=readdataset&dataset='+dataset;
  loadDataset(url)
    .then(function(details) {
      populateFields(details.fields);
      document.getElementById("selected_dataset").firstChild.innerHTML=dataset;
      document.getElementById("scripteditor").value=details.fields[0];
      //<ctc> fixme: set new time range labels
      document.getElementById("time_range").firstChild.innerHTML=details.timesteps[0]+" to "+details.timesteps[1];
      updateAll();
    }).catch(function(error) {
      console.log("There was a problem selecting the dataset: "+error);
    });
}

//select server and populate datasets menu
function selectServer(server) 
{
  document.getElementById("selected_server").firstChild.innerHTML=server;
  url=server+'/mod_visus?action=list&format=json';
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
    if (item.name == "group")
      arr = item.childs.concat(arr);
    else if (item.name == "dataset")
      ret.push(item.attributes.name);
    else
      console.log("unknown item encountered: "+item.name);
  }
  console.log("the datasets: "+ret);
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

  console.log("dataset header: "+header);

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
      console.log("TODO: parse logical to physical scaling");
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
        var field=fields[j].trim().split(' ');
        details.fields.push(field[0]); // fieldname
      }
    }
    else if (lines[i]=="(time)") {
      var timeline=lines[++i].trim().split(' ');
      if (timeline[0]=="*") {
        console.log("TODO: I don't know what * means for timesteps");
      }
      else {
        details.timesteps=[0,0];
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
  console.log("selectPalette("+palette+")");
  document.getElementById("selected_palette").firstChild.innerHTML=palette;
  updateAll();
}

//select field
function selectField(field) {
  console.log("selectField("+field+")");
  document.getElementById("scripteditor").value=field;
  updateAll();
}

//update range
function updateRange() {
  console.log("updateRange()");
/*
  var script=document.getElementById("scripteditor").value;
  var palette=document.getElementById("selected_palette").innerHTML;
  var server=document.getElementById("selected_server").innerHTML;
  var dataset=document.getElementById("selected_dataset").innerHTML;
  var minRng=parseFloat(document.getElementById("rangeMin").value);
  var maxRng=parseFloat(document.getElementById("rangeMax").value);
  var details=visus.dataset_details;
  var tileSource=[add_dataset(server+"/mod_visus?palette_min="+minRng+"&palette_max="+maxRng+"&",dataset,details.dims[0],details.dims[1],details.levels,visus.tile_size,palette,encodeURIComponent(script))]
  // var osd=visus.osd;
  // osd.addTiledImage({
  //   tileSource:add_dataset(tileSource),
  //   index:0,
  //   replace:true
  // });
*/
  updateAll();
}

//update time
function updateTime() {
  console.log("updateTime()");
/*
  var script=document.getElementById("scripteditor").value;
  var palette=document.getElementById("selected_palette").innerHTML;
  var server=document.getElementById("selected_server").innerHTML;
  var dataset=document.getElementById("selected_dataset").innerHTML;
  var minRng=parseFloat(document.getElementById("rangeMin").value);
  var maxRng=parseFloat(document.getElementById("rangeMax").value);
  var time=parseInt(document.getElementById("time").value);
  var details=visus.dataset_details;
  var tileSource=[add_dataset(server+"/mod_visus?palette_min="+minRng+"&palette_max="+maxRng+"&"+"time="+time+"&",dataset,details.dims[0],details.dims[1],details.levels,visus.tile_size,palette,encodeURIComponent(script))]
  // var osd=visus.osd;
  // osd.addTiledImage({
  //   tileSource:add_dataset(tileSource),
  //   index:0,
  //   replace:true
  // });
*/
  updateAll();
}

//update time
function updateTimeKeyup(event) {
  if (event.which==13)
  {
    console.log("updateTime-pressedEnter()");
    var time=parseInt(document.getElementById("time").value);
    var slider=document.getElementById("timeRange");
    slider.value=clamp(time,slider.min,slider.max);
    updateTime();
  }
}

//update time
function rangeKeyup(event) {
  if (event.which==13)
  {
    console.log("updateRange-pressedEnter()");
    updateRange();
  }
}

function replaceViewer() {
  var viewer=document.getElementById("viewer");
  var sidebar=document.getElementById("sidebar");
  var parent=viewer.parentNode;
  parent.removeChild(viewer);
  var new_viewer=document.createElement("div");
  new_viewer.id="viewer";
  new_viewer.className="openseadragon";
  parent.insertBefore(new_viewer,sidebar);
}

function updateAll() {
  var script=document.getElementById("scripteditor").value;
  var palette=document.getElementById("selected_palette").firstChild.innerHTML;
  var server=document.getElementById("selected_server").firstChild.innerHTML;
  var dataset=document.getElementById("selected_dataset").firstChild.innerHTML;//+"_midx";  //<ctc> hack to use midx since server doesn't send necessary details
  var minRng=parseFloat(document.getElementById("rangeMin").value);
  var maxRng=parseFloat(document.getElementById("rangeMax").value);
  var time=parseInt(document.getElementById("time").value);
  document.getElementById("selected_field").firstChild.innerHTML=script;
  if (visus.dataset_details !== undefined) {
    var details=visus.dataset_details;
    replaceViewer();
    openDataset(server,
                dataset,
                details.dims[0],details.dims[1],
                details.levels,
                palette==="None"?undefined:palette,
                script,
                minRng,maxRng,
                time
               );
  }
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

/*
function modifyOffset() {
	var el, newPoint, newPlace, offset, siblings, k;
	width    = this.offsetWidth;
	newPoint = (this.value - this.getAttribute("min")) / (this.getAttribute("max") - this.getAttribute("min"));
	offset   = -1;
	if (newPoint < 0) { newPlace = 0;  }
	else if (newPoint > 1) { newPlace = width; }
	else { newPlace = width * newPoint + offset; offset -= newPoint;}
	siblings = this.parentNode.childNodes;
	for (var i = 0; i < siblings.length; i++) {
		sibling = siblings[i];
		if (sibling.id == this.id) { k = true; }
		if ((k == true) && (sibling.nodeName == "OUTPUT")) {
			outputTag = sibling;
		}
	}
	outputTag.style.left       = newPlace + "px";
	outputTag.style.marginLeft = offset + "%";
	outputTag.innerHTML        = this.value;
}

function modifyInputs() {
    
	var inputs = document.getElementsByTagName("input");
	for (var i = 0; i < inputs.length; i++) {
		if (inputs[i].getAttribute("type") == "range") {
			inputs[i].onchange = modifyOffset;

			// the following taken from http://stackoverflow.com/questions/2856513/trigger-onchange-event-manually
			if ("fireEvent" in inputs[i]) {
			    inputs[i].fireEvent("onchange");
			} else {
			    var evt = document.createEvent("HTMLEvents");
			    evt.initEvent("change", false, true);
			    inputs[i].dispatchEvent(evt);
			}
		}
	}
}

modifyInputs();
*/
