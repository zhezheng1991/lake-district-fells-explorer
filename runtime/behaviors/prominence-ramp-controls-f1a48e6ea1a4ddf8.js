export default async function install(app) {
  const mount = app.getMount("prominence-ramp-controls");
  const layer = app.layers[app.config.layerId];
  app.assert(layer, "LakeDistrictFells is not on the map.");
  await layer.load();

  const ramps = {
    "blue-red": { label: "Blue to red", colors: ["#2166ac", "#f7f7f7", "#b2182b"] },
    "blue-orange": { label: "Blue to orange", colors: ["#2166ac", "#f7f7f7", "#e66101"] },
    "teal-magenta": { label: "Teal to magenta", colors: ["#1b9e77", "#f7f7f7", "#c51b7d"] }
  };

  const panel = document.createElement("calcite-panel");
  panel.setAttribute("heading", "Prominence ramp");
  panel.setAttribute("description", "Colors show prominence; triangle size shows height.");
  panel.style.setProperty("--calcite-color-brand", "var(--app-accent)");

  const label = document.createElement("calcite-label");
  label.textContent = "Color ramp";
  const select = document.createElement("calcite-select");
  select.setAttribute("label", "Prominence color ramp");
  Object.entries(ramps).forEach(([key, ramp]) => {
    const option = document.createElement("calcite-option");
    option.value = key;
    option.textContent = ramp.label;
    if (key === "blue-red") option.selected = true;
    select.append(option);
  });
  label.append(select);

  const samples = document.createElement("div");
  samples.style.display = "grid";
  samples.style.gridTemplateColumns = "repeat(3, 1fr)";
  samples.style.gap = "8px";
  samples.style.marginTop = "12px";

  const applyRamp = (key) => {
    const ramp = ramps[key] || ramps["blue-red"];
    const [low, mid, high] = ramp.colors;
    layer.renderer = {
      type: "simple",
      symbol: { type: "simple-marker", style: "triangle", color: low, size: 8, outline: { color: "#ffffff", width: 0.75 } },
      visualVariables: [
        { type: "size", field: app.config.heightField, legendOptions: { title: "Height (m)" }, stops: [
          { value: app.config.heightMin, size: 6, label: `${app.config.heightMin} m` },
          { value: app.config.heightMax, size: 28, label: `${app.config.heightMax} m` }
        ] },
        { type: "color", field: app.config.prominenceField, legendOptions: { title: "Prominence (m)" }, stops: [
          { value: app.config.prominenceMin, color: low, label: "Low prominence" },
          { value: (app.config.prominenceMin + app.config.prominenceMax) / 2, color: mid, label: "Medium prominence" },
          { value: app.config.prominenceMax, color: high, label: "High prominence" }
        ] }
      ]
    };
    samples.replaceChildren();
    [["Low", low], ["Middle", mid], ["High", high]].forEach(([name, color]) => {
      const card = document.createElement("div");
      card.style.display = "grid";
      card.style.gap = "4px";
      card.style.fontSize = "12px";
      card.style.color = "var(--app-text-muted)";
      const swatch = document.createElement("div");
      swatch.style.height = "22px";
      swatch.style.borderRadius = "var(--app-radius)";
      swatch.style.border = "1px solid var(--app-border)";
      swatch.style.background = color;
      const text = document.createElement("span");
      text.textContent = name;
      card.append(swatch, text);
      samples.append(card);
    });
  };

  const onChange = (event) => applyRamp(event.target.value);
  select.addEventListener("calciteSelectChange", onChange);
  app.onCleanup(() => select.removeEventListener("calciteSelectChange", onChange));
  panel.append(label, samples);
  mount.replaceChildren(panel);
  applyRamp("blue-red");
  app.onCleanup(() => mount.replaceChildren());
}