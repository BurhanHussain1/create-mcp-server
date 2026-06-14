// The browser-side logic for MCP Studio.
// It lets you add tools and inputs, then sends your design to the server
// and downloads the generated server as a zip.

const toolsContainer = document.getElementById("tools");
const statusEl = document.getElementById("status");

// Build one "input" row (a single tool parameter):
// name, type, description, and a "required" checkbox.
function createInputRow() {
  const row = document.createElement("div");
  row.className = "input-row";

  const name = document.createElement("input");
  name.type = "text";
  name.className = "input-name";
  name.placeholder = "input name (e.g. city)";

  const type = document.createElement("select");
  type.className = "input-type";
  for (const t of ["string", "number", "boolean"]) {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    type.appendChild(opt);
  }

  const desc = document.createElement("input");
  desc.type = "text";
  desc.className = "input-desc";
  desc.placeholder = "description (optional)";

  const requiredLabel = document.createElement("label");
  requiredLabel.className = "required-label";
  const required = document.createElement("input");
  required.type = "checkbox";
  required.className = "input-required";
  required.checked = true;
  requiredLabel.append(required, document.createTextNode(" required"));

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "btn-danger btn-small";
  remove.textContent = "✕";
  remove.addEventListener("click", () => row.remove());

  row.append(name, type, desc, requiredLabel, remove);
  return row;
}

// Build one tool "card" with a name, description, and a list of inputs.
function createToolCard() {
  const card = document.createElement("div");
  card.className = "tool-card";

  const header = document.createElement("div");
  header.className = "tool-header";

  const name = document.createElement("input");
  name.type = "text";
  name.className = "tool-name";
  name.placeholder = "tool name (e.g. get_weather)";

  const removeTool = document.createElement("button");
  removeTool.type = "button";
  removeTool.className = "btn-danger btn-small";
  removeTool.textContent = "Remove tool";
  removeTool.addEventListener("click", () => card.remove());

  header.append(name, removeTool);

  const desc = document.createElement("input");
  desc.type = "text";
  desc.className = "tool-desc";
  desc.placeholder = "what does this tool do?";

  const inputs = document.createElement("div");
  inputs.className = "inputs";
  inputs.appendChild(createInputRow()); // start with one input

  const addInput = document.createElement("button");
  addInput.type = "button";
  addInput.className = "btn-ghost btn-small";
  addInput.textContent = "+ Add input";
  addInput.addEventListener("click", () =>
    inputs.appendChild(createInputRow())
  );

  card.append(header, desc, inputs, addInput);
  return card;
}

// Read the whole design out of the page into a plain object.
function collectSpec() {
  const name = document.getElementById("server-name").value.trim();
  const tools = [];

  for (const card of document.querySelectorAll(".tool-card")) {
    const toolName = card.querySelector(".tool-name").value.trim();
    const description = card.querySelector(".tool-desc").value.trim();
    const inputs = [];
    for (const inputRow of card.querySelectorAll(".input-row")) {
      const inputName = inputRow.querySelector(".input-name").value.trim();
      if (!inputName) continue;
      inputs.push({
        name: inputName,
        type: inputRow.querySelector(".input-type").value,
        description: inputRow.querySelector(".input-desc").value.trim(),
        required: inputRow.querySelector(".input-required").checked,
      });
    }
    tools.push({ name: toolName, description, inputs });
  }

  return { name, tools };
}

function setStatus(message, kind) {
  statusEl.textContent = message;
  statusEl.className = "status" + (kind ? " " + kind : "");
}

// Send the design to the server and download the resulting zip.
async function generate() {
  setStatus("Generating...", "");
  const spec = collectSpec();

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(spec),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: res.statusText }));
      setStatus("Error: " + data.error, "error");
      return;
    }

    // Turn the zip response into a file download.
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = spec.name + ".zip";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    setStatus(
      `Downloaded ${spec.name}.zip — unzip it, then run "npm install" and "npm run dev".`,
      "success"
    );
  } catch (err) {
    setStatus("Error: " + err.message, "error");
  }
}

document.getElementById("add-tool").addEventListener("click", () => {
  toolsContainer.appendChild(createToolCard());
});
document.getElementById("generate").addEventListener("click", generate);

// Start with one tool card so the page isn't empty.
toolsContainer.appendChild(createToolCard());
