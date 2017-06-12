//
//
// loadJSON('http://localhost:8000/bv_fontenilles_2017_4326.geojson',function(data) {
//   mapboxgl.accessToken = 'pk.eyJ1IjoibWFyY3N0YWdpYWlyZSIsImEiOiJjajFkamp1Y3kwMDB6MnFuMmVwcTNsMXU1In0.L1qp6GMQgpRI1PszznjFKQ';
//   var map = new mapboxgl.Map({
//       container: 'map',
//       style: 'mapbox://styles/mapbox/streets-v9',
//       center : [1.223549303040727, 43.55362036156569],
//       zoom : 12.5,
//       minZoom : 12.5
//   });
//   initMap(data,map)
//   setTimeout(function(){  loadJSON('http://localhost:8000/suffragiaV9.json',function(json) {
//         setData(json,map)
//         },function(xhr) {
//           console.error(xhr);
//         }
//       )
//   }, 3000);
//   setInterval(function() {loadJSON('http://localhost:8000/suffragiaV8.json',function(blabla) {
//       setData(blabla,map)
//       },function(xhr) {
//         console.error(xhr);
//       }
//     )}
//     ,5000
//   )
//   },function(xhr) {
//     console.error(xhr);
//   }
// );

function createWholeMap(geojsonFile,jsonFile){

  loadJSON(geojsonFile,function(data) {
    console.log(data)

      mapboxgl.accessToken = 'pk.eyJ1IjoibWFyY3N0YWdpYWlyZSIsImEiOiJjajFkamp1Y3kwMDB6MnFuMmVwcTNsMXU1In0.L1qp6GMQgpRI1PszznjFKQ';
      var map = new mapboxgl.Map({
          container: 'map',
          style: 'mapbox://styles/mapbox/streets-v9',
          center : [1.223549303040727, 43.55362036156569],
          zoom : 12.5,
          minZoom : 12.5
      });
      test(data.features[0].geometry.coordinates,map)
      test(data.features[1].geometry.coordinates,map)
      test(data.features[2].geometry.coordinates,map)
      test(data.features[3].geometry.coordinates,map)
      test(data.features[4].geometry.coordinates,map)
      initMap(data,map)
      setTimeout(function(){loadJSON(jsonFile,function(json) {
          setData(json,map)
      },function(xhr) {
          console.error(xhr);
      }
          )
      }, 3000);
      setInterval(function () {loadJSON(jsonFile,function(a) {
          setData(a,map)
      },function(xhr) {
          console.error(xhr);
      }
      )}
      ,5000
    )
    },function(xhr) {
        console.error(xhr);
    }
  );
}
function test(polygon,map){
  var p = polylabel(polygon,1.0);
  console.log(p)
  var popup = new mapboxgl.Popup({closeOnClick: true});
  popup.setLngLat(p)
  .setText('coucou')
  .addTo(map);
}
function initMap(data,map){
    map.on("load",function(){

        map.addSource("dataBV",{
            "type" : "geojson",
            "data" : data
        });
        map.addLayer({
            id : "lineBureaux",
            type : "line",
            source : "dataBV",
            paint :
                {
                    'line-color': 'black',
                    'line-opacity': 1
                }
        });
        //fill empty
        map.addLayer({
            id : "fillBVEmpty",
            type : "fill",
            source : "dataBV",
            filter : ["==","$type","Polygon"],
            paint :
                {
                    'fill-color': 'white',
                    'fill-opacity': 0.0
                }
        });
        //couche des bureaux remplis
        map.addLayer({
            id : "fillBV",
            type : "fill",
            source : "dataBV",
            filter : [
                "all",
                ["==","$type","Polygon"]
            ],
            paint :
                {
                    'fill-color': 'transparent',
                    'fill-opacity': 0.3
                }
        });
    });//end onLoad
}
function setData(json,map){
    map.on("click", function(e) {
        //console.log([e.lngLat.lng,e.lngLat.lat])
    });

    var listDesks = json[1];
    editGeneralPanel(json[2])
    //edit json to add total voices by bureau
    setTotalVoices(listDesks)
    //console.log('json',json)
    //calculate the first of every bureau
    var layersColor = [];
    for(var bureau in listDesks){
        calculateFirst(listDesks[bureau],bureau,layersColor,json)
    }
    //console.log('layerColor',layersColor)
    //getTop5
    var tab5 = [];
    getTop5(listDesks,tab5);
    calculPercentage(listDesks,tab5)
    //console.log('tab5',tab5)

    //creates bureau panel
    if(!document.getElementById('1')){
        initDivs(json,tab5,layersColor);
    }else{
        updateDivs(json,tab5,layersColor)
    }
    map.setPaintProperty('fillBV', 'fill-color',    {
            property : 'bv217',
            type : 'categorical',
            stops : [
                ['1',layersColor[0].colorLayer],
                ['2',layersColor[1].colorLayer],
                ['3',layersColor[2].colorLayer],
                ['4',layersColor[3].colorLayer],
                ['5',layersColor[4].colorLayer],
            ]
        }
    );
    var lastBureauID,popup;
    // map.on("mousemove", "fillBVEmpty", (e) => {
    //   if (lastBureauID != e.features[0].properties.bv217){
    //     if(popup){
    //       popup.remove();
    //     }
    //     console.log(e)
    //     lastBureauID = e.features[0].properties.bv217;
    //     map.setFilter("fillBV", [
    //       "all",
    //       ["==","$type","Polygon"],
    //       ["==", "bv217", e.features[0].properties.bv217]
    //     ]);
    //     // var center = calculateCenterMultiplePointsV3(e.features[0].geometry.coordinates[0])
    //     // popup = new mapboxgl.Popup({closeOnClick: true});
    //     // popup.setLngLat(center)
    //     // .setText('Bureau '+e.features[0].properties.bv217)
    //     // .addTo(map);
    //   }
    // });
    //
    // map.on("mouseleave", "fillBVEmpty", () => {
    //   map.setFilter("fillBV", [
    //     "all",
    //     ["==","$type","Polygon"],
    //     ["==", "bv217","blabla"]
    //   ]);
    // });

    //for Divs on the Map
    showDivs(json,map)
}
function getFeatureColor(tab,i){
    var color;
    tab.forEach(function(e){
        if(e.idBureau == i){
        color = e.colorLayer;
        }
    })
    return color;
}
function showDivs(json,map){
    // for (var bureau in data[1]){
    var el = document.getElementById('1');
    new mapboxgl.Marker(el)//,{offset: [-25, -25]}
        .setLngLat([1.1296722167269877, 43.543666405007656])
        .addTo(map)

    var el = document.getElementById('2');
    new mapboxgl.Marker(el)//,{offset: [-25, -25]}
        .setLngLat([1.2206927895318245, 43.543847658081916])
        .addTo(map)

    var el = document.getElementById('3');
    new mapboxgl.Marker(el)//,{offset: [-25, -25]}
        .setLngLat([1.1267965667528301, 43.58860047808773])
        .addTo(map)

    var el = document.getElementById('4');
    new mapboxgl.Marker(el)//,{offset: [-25, -25]}
        .setLngLat([1.1961167622924904, 43.58818258745134])
        .addTo(map)

    var el = document.getElementById('5');
    new mapboxgl.Marker(el)//,{offset: [-25, -25]}
        .setLngLat([1.2466120585726799, 43.58739130800956])
        .addTo(map)

    //TEXT OF bureau
    var text = document.getElementById('text1');
    new mapboxgl.Marker(text,{offset: [-25, -25]})//,{offset: [-25, -25]}
        .setLngLat([1.1766954945074417, 43.547022263252956])
        .addTo(map)
    var text = document.getElementById('text2');
    new mapboxgl.Marker(text,{offset: [-25, -25]})//,{offset: [-25, -25]}
        .setLngLat([1.2038852694260243, 43.54904575686737])
        .addTo(map)
    var text = document.getElementById('text3');
    new mapboxgl.Marker(text,{offset: [-25, -25]})//,{offset: [-25, -25]}
        .setLngLat([1.1820363431605472, 43.56373604274361])
        .addTo(map)
    var text = document.getElementById('text4');
    new mapboxgl.Marker(text,{offset: [-25, -25]})//,{offset: [-25, -25]}
        .setLngLat([1.2000010158690202, 43.56065753694847])
        .addTo(map)
    var text = document.getElementById('text5');
    new mapboxgl.Marker(text,{offset: [-25, -25]})//
        .setLngLat([1.2219713250526638, 43.56136120929477])
        .addTo(map)

    // }

}
function calculateFirst(bureau,idBureau,tab,json){
    var first,name,colorLayer, score = 0;
    for (var candidat in bureau.detailCandidates){
        if(!first){
            first = candidat;
            score = bureau.detailCandidates[candidat];
        }
        if(bureau.detailCandidates[candidat] > score){
            first = candidat;
            score = bureau.detailCandidates[candidat];
            name = json[0][candidat][0];
        }
    }
    //console.log(first)
    if(name == undefined){
        colorLayer = '#ffffff'
    }else{
        colorLayer = json[0][first][2];
    }
    tab.push({idBureau : idBureau, first : first, colorLayer : colorLayer, name : name})
    return first;
}
function calculateCenterMultiplePointsV3(Tab){
    var xS = parseFloat(Tab[0][0]), xL = parseFloat(Tab[0][0]), yS = parseFloat(Tab[0][1]), yL = parseFloat(Tab[0][1]), result;
    for (var i = 1; i < Tab.length; i++) {
        if(xS > parseFloat(Tab[i][0])){
            xS = parseFloat(Tab[i][0]);
        }else if(xL < parseFloat(Tab[i][0])){
            xL = parseFloat(Tab[i][0])
        }
        if (yS > parseFloat(Tab[i][1])){
            yS = parseFloat(Tab[i][1]);
        }else if (yL < parseFloat(Tab[i][1])){
            yL = parseFloat(Tab[i][1]);
        }
    }
    var x = (xS + xL)/2, y = (yS+yL)/2
    this.ne = [xL,yL];
    this.sw = [xS,yS];
    x.toString();
    y.toString();
    result = [x,y];
    return result;
}

function replaceWithIcon(state){
    if(state == "EN COURS"){
        return '<i class="fa fa-clock-o" aria-hidden="true"></i>';
    }
    if(state == "FERME"){
        return '<i class="fa fa-close" aria-hidden="true"></i>';
    }
    if(state == "VALIDE"){
        return '<i class="fa fa-check-square-o" aria-hidden="true"></i>';
    }
    else {
        return state;
    }

}


function initDivs(data,tab,layersColor){
    var j = 0;
    for (var bureau in data[1]){
        var el = document.createElement('div');
        el.id = data[1][bureau].detailDesk[1];
        el.className = "bureau";
        el.style.border = '5px solid '+layersColor[j].colorLayer;
        el.innerHTML = '<h1 id='+'"'+"idBureau"+data[1][bureau].detailDesk[1]+'">'+data[1][bureau].detailDesk[0]+" "+replaceWithIcon(data[1][bureau].detailDesk[2])+'</h1>'
        document.body.appendChild(el)
        var ul = document.createElement('ul');
        ul.className = "listCandidats"
        el.appendChild(ul);
        for (var i = 0; i < deskNumber; i++) {
            var li = document.createElement('li');
            li.className = "candidat"
            li.id = bureau.toString()+i;
            li.innerText = data[0][tab[bureau][i].idC][0]+' ('+data[0][tab[bureau][i].idC][1]+') '+tab[bureau][i].scorePerc+'%';
            ul.appendChild(li);
        }
        var text = document.createElement('div');
        text.className = "bureauText";//nuero sur la carte
        text.id = "text"+data[1][bureau].detailDesk[1];
        text.innerHTML = '<h1>'+data[1][bureau].detailDesk[1]+'</h1>';
        document.body.appendChild(text);
        j++;
    }
}
function updateDivs(data,tab,layersColor){
    var j = 0;
    for (var bureau in data[1]){
        var el = document.getElementById("idBureau"+data[1][bureau].detailDesk[1]);
        el.innerHTML = data[1][bureau].detailDesk[0]+ " "+replaceWithIcon(data[1][bureau].detailDesk[2]);
        var el = document.getElementById(data[1][bureau].detailDesk[1]);
        el.style.border = '5px solid '+layersColor[j].colorLayer;

        for (var i = 0; i < 5; i++) {
            var li = document.getElementById(bureau.toString()+i);
            li.innerText = data[0][tab[bureau][i].idC][0]+' ('+data[0][tab[bureau][i].idC][1]+') '+tab[bureau][i].scorePerc+'%';
        }
        j++;
    }}
function getTop5(json,tab){
    for (var bureau in json){
        tab[bureau]= [];
        for (var candidat in json[bureau].detailCandidates){
            tab[bureau].push({ idC : candidat, score : json[bureau].detailCandidates[candidat]})
        }
        tab[bureau].sort(compareScoreCandidats)
        tab[bureau] = tab[bureau].slice(0,5);
    }
}
function compareScoreCandidats(a,b){
    if (a.score > b.score)
        return -1;
    if (a.score < b.score)
        return 1;
    return 0;
}
function calculPercentage(json,tab){
    for(var bureau in tab){
        tab[bureau].forEach(function(candidat) {
            var perss = candidat.score / json[bureau].totalVoices
            perss *= 100
        perss = Math.round(perss*100)/100
        candidat.scorePerc = perss
    })
    }
}
function setTotalVoices(json){
    for (var bureau in json){
        var total = 0;
        for (var candidat in json[bureau].detailCandidates){
            total += json[bureau].detailCandidates[candidat]
        }
        json[bureau].totalVoices = total;
    }
}
function editGeneralPanel(json){
    //console.log(json)
    var el = document.getElementById('general')
    table = "<table class='table'><tr><td>Nombre de votes : </td><td>"+json.totalVote+"</td></tr>"+
    '<tr><td>Avancement : </td><td>'+ json.advancement + '</td></tr>'+
    '<tr><td>Votes Blanc : </td><td>'+ json.totalBlanc + '</td></tr>'+
    '<tr><td>Votes Nuls : </td><td>'+ json.totalNul + '</td></tr>'+
    '<tr><td>Votes Valides : </td><td>'+ json.totalValidlyExpressed + '</td></tr>'+
        '<tr><td>Meneur 1 : </td><td>'+ json.leader + '</td></tr>'+
        '<tr><td>Meneur 2 : </td><td>'+ json.leader2 + '</td></tr>'+
    '<tr><td>Etat de l\'élection : </td><td>'+ json.stateElection + '</td></tr></table>';


    el.innerHTML =
        '<h1>'+ json.townHall + '</h1>'+
        '<h2>'+ json.election + '</h2>'+
        '<h3>'+ json.date + '</h3>'+table;






}

function loadJSON(path, success, error){
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function()
    {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                if (success)
                    success(JSON.parse(xhr.responseText));
            } else {
                if (error)
                    error(xhr);
            }
        }
    };
    xhr.open("GET", path, true);
    xhr.send();
}
