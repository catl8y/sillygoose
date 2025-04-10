require([
  "esri/Map",
  "esri/views/MapView",
  "esri/Basemap",
  "esri/layers/FeatureLayer",
  "esri/Graphic",
  "esri/rest/locator",
  "esri/config"
], function(Map, MapView, Basemap, FeatureLayer, Graphic, locator, esriConfig) {

  esriConfig.apiKey = "AAPTxy8BH1VEsoebNVZXo8HurP8qpCESklse0D9dY4_nD_bIlmB1lzGQ1q0-iWay_NciwWM4fwMgNT2_b_EKe7OymPTHav8Sbw0rh3x_MxgPYWNXEutyVEG7fh2cxJtJ0We1zOWpIkO81vQnolked3Mi650aJ-KJ_TeIr9ei--nsyKymxnqaf0BNqC7A4TJEwTIPXFzmtWPVFOnbfjl6Xamabbpk2wv8XePY0ahrBH21eowDNs8z8DZPMEJU2LZvs41GAT1_9gm9GYGR";

  const map = new Map({
    basemap: new Basemap({
      portalItem: {
        id: "826498a48bd0424f9c9315214f2165d4" // Colored Pencil (Web Mercator version)
      }
    })
  });

  const view = new MapView({
    container: "viewDiv",
    map: map,
    center: [-98.5795, 39.8283],
    zoom: 4,
    ui: {
      components: ["zoom", "compass", "attribution"]
    }
  });

  view.ui.move("zoom", "top-right");
  view.ui.move("compass", "bottom-right");

  const gooseLayer = new FeatureLayer({
    url: "https://services3.arcgis.com/Uyp2Wqt9tKbDqE4Z/arcgis/rest/services/Goose_Location/FeatureServer/0",
    outFields: ["*"],
    popupTemplate: {
      title: "{goose_name}",
      content: function(evt) {
        const attrs = evt.graphic.attributes;
        const imgTag = attrs.photo_url ? `<img src="${attrs.photo_url}" width="200" /><br/>` : "🪿<br/>";
        return imgTag +
          `<b>Goose Stylist:</b> ${attrs.submitted_by}<br/>` +
          `<b>City:</b> ${attrs.city_hint}<br/>` +
          `<b>State:</b> ${attrs.state}<br/>` +
          `<b>Submitted:</b> ${new Date(attrs.submission_time).toLocaleString()}`;
      }
    },
    renderer: {
      type: "simple",
      symbol: {
        type: "picture-marker",
        url: "https://raw.githubusercontent.com/catl8y/sillygoose/main/goose_clip.png",
        width: "32px",
        height: "32px"
      }
    }
  });

  map.add(gooseLayer);

  const geocodeServiceUrl = "https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer";

  document.getElementById("toggleFormBtn").addEventListener("click", () => {
    const container = document.getElementById("formContainer");
    const isVisible = container.style.display !== "none";
    container.style.display = isVisible ? "none" : "block";
    document.getElementById("toggleFormBtn").textContent = isVisible ? "Show Form" : "Hide Form";
  });

  document.getElementById("gooseForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const gooseName = document.getElementById("gooseName").value;
    const stylist = document.getElementById("submittedBy").value;
    const city = document.getElementById("cityHint").value;
    const state = document.getElementById("state").value;
    const photoFile = document.getElementById("photo").files[0];

    const address = `${city}, ${state}`;
    let location;

    try {
      const response = await locator.addressToLocations(geocodeServiceUrl, {
        address: { SingleLine: address },
        maxLocations: 1
      });
      if (response.length === 0) {
        alert("Could not find the location on the map.");
        return;
      }
      location = response[0].location;
    } catch (err) {
      alert("Geocoding error.");
      console.error(err);
      return;
    }

    let photo_url = "";
    if (photoFile) {
      const formData = new FormData();
      formData.append("image", photoFile);
      try {
        const upload = await fetch("https://api.imgur.com/3/image", {
          method: "POST",
          headers: {
            Authorization: "Client-ID 56d51ab79bcb0df"
          },
          body: formData
        });
        const result = await upload.json();
        if (result.success) {
          photo_url = result.data.link;
        }
      } catch (uploadErr) {
        console.error("Image upload error:", uploadErr);
      }
    }

    const attributes = {
      goose_name: gooseName,
      submitted_by: stylist,
      city_hint: city,
      state: state,
      submission_time: new Date().toISOString(),
      photo_url: photo_url
    };

    const graphic = new Graphic({
      geometry: location,
      attributes: attributes
    });

    try {
      const result = await gooseLayer.applyEdits({
        addFeatures: [graphic]
      });
      if (result.addFeatureResults.length > 0) {
        document.getElementById("honkSuccess").play();
        alert("HONK! Goose submitted!");
        document.getElementById("gooseForm").reset();
      } else {
        alert("Submission failed. Try again!");
      }
    } catch (addErr) {
      console.error("Error adding goose:", addErr);
      alert("Error submitting goose.");
    }
  });

  view.on("click", function(event) {
    view.hitTest(event).then(function(response) {
      const hit = response.results.find(result => result.graphic && result.graphic.layer === gooseLayer);
      if (hit) {
        document.getElementById("honkClick").play();
      }
    });
  });

  // --- Multi-Step Mobile Form Logic ---
// --- Multi-Step Mobile Form Logic ---
const steps = document.querySelectorAll('.step');
let currentStepIndex = 0;

function updateSteps() {
  if (window.innerWidth > 600) {
    // Desktop: show all steps normally
    steps.forEach(step => {
      step.classList.add("active");
      step.style.display = "block";
      const nextBtn = step.querySelector(".nextBtn");
      if (nextBtn) nextBtn.style.display = "none"; // hide next buttons
    });
  } else {
    // Mobile: show only one step
    steps.forEach((step, i) => {
      step.classList.remove("active");
      step.style.display = "none";
      const nextBtn = step.querySelector(".nextBtn");
      if (nextBtn) nextBtn.style.display = "inline-block";
    });
    steps[currentStepIndex].classList.add("active");
    steps[currentStepIndex].style.display = "block";
  }
}

// Add a "Next" button to each step (but only show on mobile)
steps.forEach((step, i) => {
  if (i < steps.length - 1 && !step.querySelector(".nextBtn")) {
    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "nextBtn";
    nextBtn.textContent = "Next";
    nextBtn.style.margin = "10px 0";
    nextBtn.addEventListener("click", () => {
      currentStepIndex = Math.min(currentStepIndex + 1, steps.length - 1);
      updateSteps();
    });
    step.appendChild(nextBtn);
  }
});

window.addEventListener("resize", updateSteps);
updateSteps();

});
