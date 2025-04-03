const cardGrid = document.getElementById('card-grid');

// Fetch and render cards from cards.json
fetch('cards.json')
  .then(res => res.json())
  .then(cards => {
    // Sort alphabetically by name
    cards.sort((a, b) => a.name.localeCompare(b.name));
    renderCards(cards);
  })
  .catch(err => console.error("Could not load cards.json:", err));

function renderCards(cards) {
  const usedCards = JSON.parse(localStorage.getItem('usedCards') || '[]');

  cards.forEach(cardData => {
    const { name, image_url } = cardData;

    const card = document.createElement('div');
    card.classList.add('card');
    if (usedCards.includes(name)) card.classList.add('used');

    const img = document.createElement('img');
    img.src = image_url;
    img.alt = name;
    img.title = name;

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
      card.classList.add('highlight');
      setTimeout(() => card.classList.remove('highlight'), 2000);
      found = true;
    }
  });

  if (!found) {
    alert('Card not found!');
  }
}
