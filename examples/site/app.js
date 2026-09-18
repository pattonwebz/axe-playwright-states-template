const trigger = document.querySelector('#signup-trigger');
const modal = document.querySelector('#signup-modal');
const closeButton = document.querySelector('#signup-modal-close');

trigger.addEventListener('click', () => {
  modal.hidden = false;
});

closeButton.addEventListener('click', () => {
  modal.hidden = true;
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    modal.hidden = true;
  }
});
