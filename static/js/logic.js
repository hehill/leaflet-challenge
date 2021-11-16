// Earthquakes & Tectonic Plates GeoJSON URL Variables
var earthquakesURL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson"
var platesURL = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json"

// Initialize & Create Two Separate LayerGroups: earthquakes & tectonicPlates
var earthquakes = new L.LayerGroup();
var tectonicPlates = new L.LayerGroup();
var heatmap = new L.LayerGroup();

// Define Variables for Tile Layers
var street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
})

var topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
	attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});

// Define baseMaps Object to Hold Base Layers
var baseMaps = {
    "Street": street,
    "Topography": topo,
};

// Create Overlay Object to Hold Overlay Layers
var overlayMaps = {
    "Earthquakes": earthquakes,
    "Fault Lines": tectonicPlates,
    "Earthquake Heatmap": heatmap
};

// Create Map, Passing In satelliteMap & earthquakes as Default Layers to Display on Load
var myMap = L.map("map", {
    center: [38.9, -102.1],
    zoom: 4,
    layers: [topo, heatmap]
});

// Create a Layer Control + Pass in baseMaps and overlayMaps + Add the Layer Control to the Map
L.control.layers(baseMaps, overlayMaps).addTo(myMap);

// Retrieve earthquakesURL (USGS Earthquakes GeoJSON Data) with D3
d3.json(earthquakesURL).then(function(earthquakeData) {
    console.log(earthquakeData);
    // console.log(earthquakeData.features[0].geometry.coordinates[2]);
    // for (i in earthquakeData.features) {
    //     var depths = earthquakeData.features[i].geometry.coordinates[2];
    //     console.log(depths);
    // }
    // Function to Determine Size of Marker Based on the Magnitude of the Earthquake
    function markerSize(magnitude) {
        if (magnitude === 0) {
          return 1;
        }
        return magnitude * 3;
    }
    // Function to Determine Style of Marker Based on the Magnitude of the Earthquake
    function styleInfo(feature) {
        return {
          opacity: 1,
          fillOpacity: 1,
          fillColor: chooseColor(feature.geometry.coordinates[2]),
          color: "#000000",
          radius: markerSize(feature.properties.mag),
          stroke: true,
          weight: 0.5
        };
    }
    // Function to Determine Color of Marker Based on the Magnitude of the Earthquake
    var colorArray = ['#d73027','#f46d43','#fdae61','#fee090','#e0f3f8','#abd9e9','#74add1','#4575b4']
    function chooseColor(depth) {
        switch (true) {
        case depth > 100:
            return colorArray[0];
        case depth > 50:
            return colorArray[1];
        case depth > 20:
            return colorArray[2];
        case depth > 10:
            return colorArray[3];
        case depth > 5:
            return colorArray[4];
        case depth > 1:
            return colorArray[5];
        default:
            return colorArray[6];
        }
    }
    // Create a GeoJSON Layer Containing the Features Array on the earthquakeData Object
    L.geoJSON(earthquakeData, {
        pointToLayer: function(feature, latlng) {
            return L.circleMarker(latlng);
        },
        style: styleInfo,
        // Function to Run Once For Each feature in the features Array
        // Give Each feature a Popup Describing the Place & Time of the Earthquake
        onEachFeature: function(feature, layer) {
            layer.bindPopup("<h4>Location: " + feature.properties.place + 
            "</h4><hr><p>Date & Time: " + new Date(feature.properties.time) + 
            "</p><p>Magnitude: " + feature.properties.mag +
            "</p><p>Depth: " + feature.geometry.coordinates[2] + " km" + "</p>");
        }
    // Add earthquakeData to earthquakes LayerGroups 
    }).addTo(earthquakes);
    // Add earthquakes Layer to the Map
    earthquakes.addTo(myMap);

    // Retrieve platesURL (Tectonic Plates GeoJSON Data) with D3
    d3.json(platesURL).then(function(plateData) {
        // console.log(plateData);
        // Create a GeoJSON Layer the plateData
        L.geoJson(plateData, {
            color: colorArray[7],
            weight: 2
        // Add plateData to tectonicPlates LayerGroups 
        }).addTo(tectonicPlates);
        // Add tectonicPlates Layer to the Map
        tectonicPlates.addTo(myMap);
    });

    // Set Up Legend
    var legend = L.control({ position: "bottomright" });
    legend.onAdd = function() {
        var div = L.DomUtil.create("div", "info legend"), 
        depthLevels = [0, 1, 5, 10, 20, 50, 100];

        div.innerHTML += "<h3>Depth (km)</h3>"

        for (var i = 0; i < depthLevels.length; i++) {
            div.innerHTML +=
                '<i style="background: ' + chooseColor(depthLevels[i] + 1) + '"></i> ' +
                depthLevels[i] + (depthLevels[i + 1] ? '&ndash;' + depthLevels[i + 1] + '<br>' : '+');
        }
        return div;
    };
    // Add Legend to the Map
    legend.addTo(myMap);

    
    var heatArray = [];

    for (var i = 0; i < earthquakeData.features.length; i++) {
        var location = earthquakeData.features[i].geometry;
    
        if (location) {
          heatArray.push([location.coordinates[1], location.coordinates[0]]);
        }
      }
    console.log(heatArray);
    var heat = L.heatLayer(heatArray, {
        radius: 25,
        maxZoom: 12,
        minOpacity: 0.5,
        max: 1,
        blur: 15
    }).addTo(heatmap);
});