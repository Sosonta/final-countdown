const cardGrid = document.getElementById('card-grid');

// Fetch and render cards from cards.json
let globalCards = []; // store cards globally

fetch('cards.json')
  .then(res => res.json())
  .then(cards => {
    globalCards = cards;
    cards.sort((a, b) => a.name.localeCompare(b.name));
    populateAutocomplete(cards);
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

function renderCards(cards) {
  cardGrid.innerHTML = ''; // clear grid

  const usedCards = JSON.parse(localStorage.getItem('usedCards') || '[]');
  const filter = document.getElementById('filter-select')?.value || 'all';

  cards.forEach(cardData => {
    const { name, image_url } = cardData;

    const isUsed = usedCards.includes(name);
    if ((filter === 'used' && !isUsed) || (filter === 'unused' && isUsed)) {
      return; // skip card
    }

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

