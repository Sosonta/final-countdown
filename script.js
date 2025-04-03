const imageFolder = 'card_images/';
const cardGrid = document.getElementById('card-grid');

// Get list of all images in folder
fetch(imageFolder)
  .then(res => res.text())
  .then(data => {
    const parser = new DOMParser();
    const htmlDoc = parser.parseFromString(data, 'text/html');
    const links = Array.from(htmlDoc.querySelectorAll('a'));

    const images = links
      .map(link => link.getAttribute('href'))
      .filter(href => href.match(/\.(jpg|png)$/i));

// Sort alphabetically by clean name (ignoring ID prefix)
images.sort((a, b) => {
  const nameA = a.split('_').slice(1).join('_').replace(/\.(jpg|png)$/i, '').toLowerCase();
  const nameB = b.split('_').slice(1).join('_').replace(/\.(jpg|png)$/i, '').toLowerCase();
  return nameA.localeCompare(nameB);
});

// ✅ Call renderCards after sorting
renderCards(images);
  })
  .catch(err => console.error("Could not load image list:", err));

function renderCards(images) {
  const usedCards = JSON.parse(localStorage.getItem('usedCards') || '[]');

  images.forEach(filename => {
    const card = document.createElement('div');
    card.classList.add('card');
    if (usedCards.includes(filename)) card.classList.add('used');

    const img = document.createElement('img');
    img.src = `${imageFolder}${filename}`;
// Remove the ID prefix (everything before the first underscore)
const cleanName = filename.split('_').slice(1).join('_').replace(/\.(jpg|png)$/i, '').replace(/_/g, ' ');
img.alt = cleanName;
img.title = cleanName; // optional tooltip when hovering


    card.appendChild(img);
    card.addEventListener('click', () => toggleCardUsed(card, filename));
    cardGrid.appendChild(card);
  });
}

function toggleCardUsed(card, filename) {
  card.classList.toggle('used');

  const usedCards = JSON.parse(localStorage.getItem('usedCards') || '[]');
  if (card.classList.contains('used')) {
    usedCards.push(filename);
  } else {
    const index = usedCards.indexOf(filename);
    if (index > -1) usedCards.splice(index, 1);
  }
  localStorage.setItem('usedCards', JSON.stringify([...new Set(usedCards)]));
}
