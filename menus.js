// When the user clicks on the button, toggle between hiding and showing the dropdown content 
function myFunction() {
  document.getElementById("myDropdown").classList.toggle("show");
}
// When the user clicks on the button, toggle between hiding and showing the dropdown content 
function datasetDropdownOnclick() {
  document.getElementById("datasetDropdown").classList.toggle("show");
  document.getElementById("myInput").value="";
  filterFunction();
}

// Close the dropdown menu if the user clicks outside of it
window.onclick = function(event) {
  if (!event.target.matches('.dropbtn') && !event.target.matches('#myInput')) {

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

//select server and update display
function selectServer(servername) 
{
  document.getElementById("selected_server").innerHTML=servername;
  //populate datasets menu
  url='http://'+servername+'/mod_visus?action=list&format=json';
//  fetch('http://'+servername+'/mod_visus?action=list&format=json',
//        {method: 'get'})//mode:'no-cors'})
  var foo=loadJSON(url)
  //console.log("foo: "+foo);
    // .then(function(response) {
    //   return response.json();
    // })
    .then(function(jsonData) {
      console.log(jsonData);
      var obj=jsonData;//JSON.parse(jsonData); (it's already parsed? or maybe just not proper json to start with)
      console.log("Object.keys(obj): "+Object.keys(obj));
      var foo=Object.keys(obj).filter(
        function(x) {
          var name=obj[x];//.name; (x is each of the keys, 'name' and 'childs' in this case)
          console.log("trying: "+name);
          return obj[x].name=="datasets";
        });
      console.log("the datasets: "+foo);
    }).catch(function(error) {
      console.log("Houston, we've got a problem: "+error);
    });
}


//recursive version
// function flatten(arr) {  
//   return arr.reduce(function(explored, toExplore) {
//     return explored.concat(
//       Array.isArray(toExplore)?
//       flatten(toExplore) : toExplore
//     );
//   }, []);
// }

function flatten(arr) {  
  return arr.reduce(function(explored, toExplore) {
    return explored.concat(
      Array.isArray(toExplore)?
      flatten(toExplore) : toExplore
    );
  }, []);
}

//try this tail recursive version next...
// const scalar = v => !Array.isArray(v);

// const flatten = (deep, flat = []) => {  
//   if (deep.length === 0) return flat;
//   let [head, ...tail] = deep;
//   if (scalar(head)) {
//     return flatten(tail, flat.concat(head));
//   } else {
//     return flatten(tail, flat.concat(flatten(head)));
//   }
// }

function filterFunction() {
    var input, filter, ul, li, a, i;
    input = document.getElementById("myInput");
    filter = input.value.toUpperCase();
    div = document.getElementById("datasetDropdown");
    a = div.getElementsByTagName("a");
    for (i = 0; i < a.length; i++) {
        if (a[i].innerHTML.toUpperCase().indexOf(filter) > -1) {
            a[i].style.display = "";
        } else {
            a[i].style.display = "none";
        }
    }
}

function loadJSON(url) {
  return fetch(url,{method:'get'})
    .then(function (response) {
      var content_type=response.headers.get("content-type");
      console.log("content-type: "+content_type);
      if (response.headers.get("content-type").indexOf("application/json") !== -1) {// checking response header
        return response.json();
      } else {
        throw new TypeError('Response from "' + url + '" has unexpected "content-type"');
      }
    })
    .then(function (data) {
      console.log('JSON from "' + url + '" parsed successfully!');
      console.log(data);
      return data;
    })
    .catch(function (error) {
      console.error(error.message);
    });
}
