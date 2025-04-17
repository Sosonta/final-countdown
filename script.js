const cardGrid = document.getElementById('card-grid');
const filterState = {
  types: new Set(),
  races: new Set(),
  attributes: new Set(),
  levels: new Set(),
  nameIncludes: '',
  effectIncludes: '',
  atkMin: null,
  atkMax: null,
  defMin: null,
  defMax: null
};

const typeGroups = {
  "Monster": (type) => type !== "Spell Card" && type !== "Trap Card",
  "Spell": ["Spell Card"],
  "Trap": ["Trap Card"],
  "Normal Monster": [
    "Normal Monster", "Gemini Monster", "Normal Tuner Monster", "Pendulum Normal Monster"
  ],
  "Effect Monster": [
    "Effect Monster", "Flip Effect Monster", "Flip Tuner Effect Monster", "Pendulum Effect Monster",
    "Pendulum Flip Effect Monster", "Pendulum Tuner Effect Monster", "Spirit Monster",
    "Toon Monster", "Tuner Monster", "Union Effect Monster"
  ],
  "Ritual Monster": [
    "Ritual Monster", "Pendulum Effect Ritual Monster", "Ritual Effect Monster"
  ],
  "Fusion Monster": [
    "Fusion Monster", "Pendulum Effect Fusion Monster"
  ],
  "Synchro Monster": [
    "Synchro Monster", "Synchro Pendulum Effect Monster", "Synchro Tuner Monster"
  ],
  "XYZ Monster": [
    "XYZ Monster", "XYZ Pendulum Effect Monster"
  ],
  "Pendulum Monster": [
    "Pendulum Normal Monster", "Pendulum Effect Fusion Monster", "Pendulum Effect Monster",
    "Pendulum Effect Ritual Monster", "Pendulum Flip Effect Monster",
    "Pendulum Tuner Effect Monster", "Synchro Pendulum Effect Monster", "XYZ Pendulum Effect Monster"
  ],
  "Link Monster": ["Link Monster"],
  "Tuner": [
    "Tuner Monster", "Flip Tuner Effect Monster", "Normal Tuner Monster",
    "Pendulum Tuner Effect Monster", "Synchro Tuner Monster"
  ]
};

// Mapping of grouped card types
const groupedTypes = {
  "Monster": type => type !== "Spell Card" && type !== "Trap Card",
  'Spell': type => type.includes('Spell'),
  'Trap': type => type.includes('Trap'),
  'Normal Monster': type => ["Normal Monster", "Gemini Monster", "Normal Tuner Monster", "Pendulum Normal Monster"].includes(type),
  'Effect Monster': type => ["Effect Monster", "Flip Effect Monster", "Flip Tuner Effect Monster", "Pendulum Effect Monster", "Pendulum Flip Effect Monster", "Pendulum Tuner Effect Monster", "Spirit Monster", "Toon Monster", "Tuner Monster", "Union Effect Monster"].includes(type),
  'Ritual Monster': type => ["Ritual Monster", "Pendulum Effect Ritual Monster", "Ritual Effect Monster"].includes(type),
  'Fusion Monster': type => ["Fusion Monster", "Pendulum Effect Fusion Monster"].includes(type),
  'Synchro Monster': type => ["Synchro Monster", "Synchro Pendulum Effect Monster", "Synchro Tuner Monster"].includes(type),
  'XYZ Monster': type => ["XYZ Monster", "XYZ Pendulum Effect Monster"].includes(type),
  'Pendulum Monster': type => ["Pendulum Normal Monster", "Pendulum Effect Fusion Monster", "Pendulum Effect Monster", "Pendulum Effect Ritual Monster", "Pendulum Flip Effect Monster", "Pendulum Tuner Effect Monster", "Synchro Pendulum Effect Monster", "XYZ Pendulum Effect Monster"].includes(type),
  'Link Monster': type => type === "Link Monster",
  'Tuner': type => ["Tuner Monster", "Flip Tuner Effect Monster", "Normal Tuner Monster", "Pendulum Tuner Effect Monster", "Synchro Tuner Monster"].includes(type),
};

// Fetch and render cards from cards.json
let globalCards = []; // store cards globally

fetch('cards.json')
  .then(res => res.json())
  .then(cards => {
    // Remove all Skill Cards
    cards = cards.filter(card => card.type !== "Skill Card");

    globalCards = cards;
    cards.sort((a, b) => a.name.localeCompare(b.name));
    populateAutocomplete(cards);
    populateDropdownFilters(cards);
    setupFilterListeners();
    renderCards(cards);
    updateUsageStats();
  })
  .catch(err => console.error("Could not load cards.json:", err));

function populateAutocomplete(cards) {
  const datalist = document.getElementById('card-names');
  cards.forEach(card => {
    const option = document.createElement('option');
    option.value = card.name;
    datalist.appendChild(option);
  });
}

function populateDropdownFilters(cards) {
  const types = new Set();
  const races = new Set();
  const attributes = new Set();
  const levels = new Set();

  cards.forEach(card => {
    if (card.type) types.add(card.type);
    if (card.race) races.add(card.race);
    if (card.attribute) attributes.add(card.attribute);
    if (card.level !== undefined && card.level !== null) levels.add(card.level);
  });

  const typeContainer = document.getElementById("card-type-filter");
  typeContainer.innerHTML = "";

  // Add grouped types at the top
  Object.keys(groupedTypes).forEach(group => {
    const label = document.createElement("label");
    label.style.display = "flex";
    label.style.alignItems = "center";
    label.style.gap = "0.3rem";
    label.style.marginBottom = "0.3rem";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = group;
    checkbox.dataset.group = "true";

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(group));
    typeContainer.appendChild(label);
  });

  // Divider
  const divider = document.createElement("hr");
  divider.style.margin = "0.5rem 0";
  typeContainer.appendChild(divider);

  // Add individual types
  [...types].sort().forEach(option => {
    const label = document.createElement("label");
    label.style.display = "flex";
    label.style.alignItems = "center";
    label.style.gap = "0.3rem";
    label.style.marginBottom = "0.3rem";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = option;

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(option));
    typeContainer.appendChild(label);
  });

  addCheckboxesToDropdown("race-filter", [...races].sort());
  addCheckboxesToDropdown("attribute-filter", [...attributes].sort());
const filteredLevels = [...levels].filter(lvl => lvl !== 0).sort((a, b) => a - b);
addCheckboxesToDropdown("level-filter", filteredLevels);
}

function addCheckboxesToDropdown(containerId, options) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  options.forEach(option => {
    const label = document.createElement("label");
    label.style.display = "flex";
    label.style.alignItems = "center";
    label.style.gap = "0.3rem";
    label.style.marginBottom = "0.3rem";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = option;

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(option));
    container.appendChild(label);
  });
}

function setupFilterListeners() {
  // Text inputs
  document.getElementById('name-filter').addEventListener('input', (e) => {
    filterState.nameIncludes = e.target.value.toLowerCase();
    renderCards(globalCards);
  });

  document.getElementById('effect-filter').addEventListener('input', (e) => {
    filterState.effectIncludes = e.target.value.toLowerCase();
    renderCards(globalCards);
  });

  // ATK / DEF filters
// ATK / DEF filters with proper camelCase mapping
const keyMap = {
  'atk-min': 'atkMin',
  'atk-max': 'atkMax',
  'def-min': 'defMin',
  'def-max': 'defMax'
};

['atk-min', 'atk-max', 'def-min', 'def-max'].forEach(id => {
  document.getElementById(id).addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    const key = keyMap[id];
    filterState[key] = isNaN(val) ? null : val;
    console.log(`Updated ${key} to`, filterState[key]);
    renderCards(globalCards);
  });
});

  // Checkbox filters
  const checkGroups = [
    { id: 'card-type-filter', key: 'types' },
    { id: 'race-filter', key: 'races' },
    { id: 'attribute-filter', key: 'attributes' },
    { id: 'level-filter', key: 'levels' }
  ];

  checkGroups.forEach(group => {
    const container = document.getElementById(group.id);
    container.querySelectorAll('input[type=\"checkbox\"]').forEach(checkbox => {
      checkbox.addEventListener('change', () => {

let val = checkbox.value;

// Special case: Card Type groupings
if (group.id === "card-type-filter" && typeGroups[val]) {
const groupTypes = typeof typeGroups[val] === "function"
  ? [...new Set(globalCards.map(card => card.type).filter(typeGroups[val]))]
  : typeGroups[val];

  groupTypes.forEach(type => {
    if (checkbox.checked) {
      filterState[group.key].add(type);
    } else {
      filterState[group.key].delete(type);
    }
  });
} else {
  if (group.key === 'levels') val = parseInt(val, 10);
  if (checkbox.checked) {
    filterState[group.key].add(val);
  } else {
    filterState[group.key].delete(val);
  }
}

if (checkbox.checked) {
  filterState[group.key].add(val);
} else {
  filterState[group.key].delete(val);
}
        renderCards(globalCards);
      });
    });
  });
}

document.getElementById('clear-filters').addEventListener('click', () => {
  // Reset filterState
  filterState.types.clear();
  filterState.races.clear();
  filterState.attributes.clear();
  filterState.levels.clear();
  filterState.nameIncludes = '';
  filterState.effectIncludes = '';
  filterState.atkMin = null;
  filterState.atkMax = null;
  filterState.defMin = null;
  filterState.defMax = null;

  // Reset inputs
  document.querySelectorAll('#filter-bar input[type="text"], #filter-bar input[type="number"]').forEach(input => {
    input.value = '';
  });

  document.querySelectorAll('#filter-bar input[type="checkbox"]').forEach(checkbox => {
    checkbox.checked = false;
  });

  // Re-render
  renderCards(globalCards);
});

function renderCards(cards) {
  cardGrid.innerHTML = ''; // clear grid

  const usedCards = JSON.parse(localStorage.getItem('usedCards') || '[]');
  const filter = document.getElementById('filter-select')?.value || 'all';

cards.forEach(cardData => {
const {
  name, desc = '', type, race, attribute, level, atk, def, image_url
} = cardData;

// Normalize ATK/DEF (-1, null, undefined => 0)
const atkVal = typeof atk === 'number' && atk >= 0 ? atk : 0;
const defVal = typeof def === 'number' && def >= 0 ? def : 0;

// Normalize level
const lvl = (level === null || level === undefined) ? 0 : level;

console.log(name, "ATK", atkVal, "DEF", defVal, "Filter Min:", filterState.atkMin);

// Apply ATK/DEF filters
if (filterState.atkMin !== null && atkVal < filterState.atkMin) return;
if (filterState.atkMax !== null && atkVal > filterState.atkMax) return;
if (filterState.defMin !== null && defVal < filterState.defMin) return;
if (filterState.defMax !== null && defVal > filterState.defMax) return;

  const isUsed = usedCards.includes(name);
  if ((filter === 'used' && !isUsed) || (filter === 'unused' && isUsed)) return;

  // Filter by card type
  if (filterState.types.size && !filterState.types.has(type)) return;

  // Filter by race/type
  if (filterState.races.size && !filterState.races.has(race)) return;

  // Filter by attribute
  if (filterState.attributes.size && !filterState.attributes.has(attribute)) return;

  // Filter by level/rank/link
// Check both level and linkval
const linkval = cardData.linkval ?? null;
const matchesLevelOrLink = filterState.levels.size === 0 || filterState.levels.has(lvl) || filterState.levels.has(linkval);
if (!matchesLevelOrLink) return;

  // Filter by name
  if (filterState.nameIncludes && !name.toLowerCase().includes(filterState.nameIncludes)) return;

  // Filter by effect text
  if (filterState.effectIncludes && !desc.toLowerCase().includes(filterState.effectIncludes)) return;

    const card = document.createElement('div');
    card.classList.add('card');
    if (isUsed) card.classList.add('used');

const img = document.createElement('img');
img.alt = name;
img.title = name;
img.style.opacity = 0;

img.onload = () => {
  img.style.opacity = 1;
};

img.src = image_url;

    card.appendChild(img);
    card.addEventListener('click', () => toggleCardUsed(card, name));
    cardGrid.appendChild(card);
  });
}

function toggleCardUsed(card, name) {
  card.classList.toggle('used');

  const usedCards = JSON.parse(localStorage.getItem('usedCards') || '[]');
  if (card.classList.contains('used')) {
    usedCards.push(name);
  } else {
    const index = usedCards.indexOf(name);
    if (index > -1) usedCards.splice(index, 1);
  }
  localStorage.setItem('usedCards', JSON.stringify([...new Set(usedCards)]));
  updateUsageStats();
}
// 🔍 Scroll to card on search
document.getElementById('search-button').addEventListener('click', handleSearch);
document.getElementById('search-input').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') handleSearch();
});

function handleSearch() {
  const searchTerm = document.getElementById('search-input').value.trim().toLowerCase();
  const allCards = document.querySelectorAll('.card');

  let found = false;

  allCards.forEach(card => {
    const title = card.querySelector('img')?.alt?.toLowerCase();
    if (title && title.includes(searchTerm)) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.add('search-highlight');
      found = true;
    }
  });

  if (!found) {
    alert('Card not found!');
  }
}

// re-render cards when filter changes
document.getElementById('filter-select').addEventListener('change', () => {
  renderCards(globalCards);
});
document.getElementById('random-button').addEventListener('click', () => {
  const usedCards = JSON.parse(localStorage.getItem('usedCards') || '[]');

  // Find all card elements that are not marked as used
  const unusedCards = Array.from(document.querySelectorAll('.card'))
    .filter(card => !card.classList.contains('used'));

  if (unusedCards.length === 0) {
    alert("No unused cards left!");
    return;
  }

  const randomCard = unusedCards[Math.floor(Math.random() * unusedCards.length)];
  randomCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
  randomCard.classList.remove('random-highlight'); // reset if it's still animating
void randomCard.offsetWidth; // force reflow to restart animation
randomCard.classList.add('random-highlight');
});

function updateUsageStats() {
  const usedCards = JSON.parse(localStorage.getItem('usedCards') || '[]');
  const totalCards = globalCards.length;
  const percent = totalCards > 0 ? ((usedCards.length / totalCards) * 100).toFixed(2) : 0;

  const statsText = `Used ${usedCards.length} / ${totalCards} cards (${percent}%)`;
  document.getElementById('usage-stats').textContent = statsText;
}

document.getElementById('export-button').addEventListener('click', () => {
  const usedCards = JSON.parse(localStorage.getItem('usedCards') || '[]');
  const blob = new Blob([JSON.stringify(usedCards, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'used_cards.json';
  a.click();

  URL.revokeObjectURL(url);
});

document.getElementById('import-button').addEventListener('click', () => {
  document.getElementById('import-file').click();
});

document.getElementById('import-file').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) throw new Error("Invalid file format");

      // Save to localStorage
      localStorage.setItem('usedCards', JSON.stringify(imported));
      renderCards(globalCards);
      updateUsageStats();
      alert('Used card data imported successfully!');
    } catch (err) {
      alert('Failed to import: ' + err.message);
    }
  };
  reader.readAsText(file);
});
let resetAction = null;

document.getElementById('reset-select').addEventListener('change', (e) => {
  const value = e.target.value;
  if (value === 'used' || value === 'unused') {
    resetAction = value;
    document.getElementById('confirm-popup').classList.remove('hidden');
  }
});

document.getElementById('cancel-reset').addEventListener('click', () => {
  document.getElementById('confirm-popup').classList.add('hidden');
  document.getElementById('reset-select').value = ''; // reset dropdown
  resetAction = null;
});

document.getElementById('confirm-reset').addEventListener('click', () => {
  const allNames = globalCards.map(card => card.name);
  const usedCards = resetAction === 'used' ? allNames : [];

  localStorage.setItem('usedCards', JSON.stringify(usedCards));
  renderCards(globalCards);
  updateUsageStats();

  document.getElementById('confirm-popup').classList.add('hidden');
  document.getElementById('reset-select').value = '';
  resetAction = null;
});
