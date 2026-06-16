// The browser-side logic for MCP Studio.
// It lets you add tools and inputs, then sends your design to the server
// and downloads the generated server as a zip.

const toolsContainer = document.getElementById("tools");
const statusEl = document.getElementById("status");

// Small helper: a labeled field wrapper around a control.
function field(labelText, control) {
  const wrap = document.createElement("label");
  wrap.className = "field";
  const label = document.createElement("span");
  label.className = "field-label";
  label.textContent = labelText;
  wrap.append(label, control);
  return wrap;
}

function iconButton(title, onClick, small) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = small ? "icon-btn icon-btn-sm" : "icon-btn";
  btn.title = title;
  btn.innerHTML = "&times;";
  btn.addEventListener("click", onClick);
  return btn;
}

// Build one "input" row: name, type, description, required, remove.
function createInputRow() {
  const row = document.createElement("div");
  row.className = "input-row";

  const name = document.createElement("input");
  name.type = "text";
  name.className = "input-name";
  name.placeholder = "input name";

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

  const req = document.createElement("label");
  req.className = "req";
  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.className = "input-required";
  cb.checked = true;
  req.append(cb, document.createTextNode("required"));

  row.append(
    name,
    type,
    desc,
    req,
    iconButton("Remove input", () => row.remove(), true)
  );
  return row;
}

// Build one tool "card": header, name + description, and a list of inputs.
function createToolCard() {
  const card = document.createElement("div");
  card.className = "tool-card";

  const head = document.createElement("div");
  head.className = "card-head";
  const title = document.createElement("span");
  title.className = "card-title";
  title.textContent = "Tool";
  head.append(
    title,
    iconButton("Remove tool", () => card.remove(), false)
  );

  const name = document.createElement("input");
  name.type = "text";
  name.className = "tool-name";
  name.placeholder = "get_weather";

  const desc = document.createElement("input");
  desc.type = "text";
  desc.className = "tool-desc";
  desc.placeholder = "What does this tool do?";

  const grid = document.createElement("div");
  grid.className = "field-grid";
  grid.append(field("Name", name), field("Description", desc));

  const inputsLabel = document.createElement("div");
  inputsLabel.className = "inputs-label";
  inputsLabel.textContent = "Inputs";

  const inputs = document.createElement("div");
  inputs.className = "inputs";
  inputs.appendChild(createInputRow());

  const addInput = document.createElement("button");
  addInput.type = "button";
  addInput.className = "btn btn-ghost btn-sm";
  addInput.textContent = "+ Add input";
  addInput.addEventListener("click", () => {
    const row = createInputRow();
    inputs.appendChild(row);
    row.querySelector(".input-name").focus();
  });

  card.append(head, grid, inputsLabel, inputs, addInput);
  return card;
}

// Read the whole design out of the page into a plain object.
function collectSpec() {
  const name = document.getElementById("server-name").value.trim();
  const language = document.getElementById("server-language").value;
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

  return { name, language, tools };
}

function setStatus(message, kind) {
  statusEl.textContent = message;
  statusEl.className = "status" + (kind ? " " + kind : "");
}

// Send the design to the server and download the resulting zip.
async function generate() {
  const button = document.getElementById("generate");
  button.disabled = true;
  button.classList.add("loading");
  setStatus("Generating…", "");

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
  } finally {
    button.disabled = false;
    button.classList.remove("loading");
  }
}

document.getElementById("add-tool").addEventListener("click", () => {
  const card = createToolCard();
  toolsContainer.appendChild(card);
  card.querySelector(".tool-name").focus();
});
document.getElementById("generate").addEventListener("click", generate);

// Start with one tool card so the page isn't empty.
toolsContainer.appendChild(createToolCard());
