// When the user clicks on the button, toggle between hiding and showing the dropdown content 
function serverDropdownOnClick() {
  hideDiv("datasetsDropdown");
  document.getElementById("serverDropdown").classList.toggle("show");
}

// When the user clicks on the button, toggle between hiding and showing the dropdown content 
function datasetDropdownOnclick() {
  hideDiv("serverDropdown");
  document.getElementById("datasetsDropdown").classList.toggle("show");
  document.getElementById("datasetsFilterInput").value="";
  filterFunction();
}

function filterFunction() {
  var input, filter, ul, li, a, i;
  input = document.getElementById("datasetsFilterInput");
  filter = input.value.toUpperCase();
  div = document.getElementById("datasetsDropdown");
  a = div.getElementsByTagName("a");
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
window.onclick = function(event) {
  if (!event.target.matches('.dropbtn') && !event.target.matches('#datasetsFilterInput')) 
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

function getDataset(code) {
  return data.filter(
    function(data) {
      return data.code == code
    }
  );
}

//select dataset
function selectDataset(server,dataset) {
  url=server+'/mod_visus?action=readdataset&dataset='+dataset;
  loadDataset(url)
    .then(function(details) {
      console.log("selectDataset("+server+","+dataset+")");
      document.getElementById("selected_dataset").innerHTML=dataset;
      var viewer=document.getElementById("viewer");
      var sidebar=document.getElementById("sidebar");
      var parent=viewer.parentNode;
      parent.removeChild(viewer);
      var new_viewer=document.createElement("div");
      new_viewer.id="viewer";
      new_viewer.className="openseadragon";
      parent.insertBefore(new_viewer,sidebar);
      openDataset(server,dataset,details.dims[0],details.dims[1],details.levels); //yikes, hardcoded dimensions! todo: read these from server
    }).catch(function(error) {
      console.log("There was a problem selecting the dataset: "+error);
    });
}

//select server and populate datasets menu
function selectServer(server) 
{
  document.getElementById("selected_server").innerHTML=server;
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
  return details;
}
