// Mostrar la ventana emergente si el usuario no ha seleccionado "No volver a ver este mensaje"
window.addEventListener("load", function () {
  if (typeof localStorage !== "undefined" && !localStorage.getItem("dontShowMessageAgain")) {
    showPopup();
  }
});

function showPopup() {
  if (document.getElementById("popupContainer")) return; // Prevenir múltiples popups

  const popupContainer = document.createElement("div");
  popupContainer.id = "popupContainer";
  popupContainer.className = "popup-container";

  // Contenido de la ventana emergente
  popupContainer.innerHTML = `
    <p>¡Bienvenido a la nueva aplicación FEWS-Colombia!</p>
    <p>¿Quieres aprender a usarla?</p>
    <div>
      <button id="tutorialButton">Ver Video Tutorial</button>
      <button id="closeButton">No, gracias</button>
    </div>
    <div style="margin-top: 10px;">
      <label>
        <input type="checkbox" id="dontShowMessageCheckbox"> No volver a ver este mensaje
      </label>
    </div>
  `;

  document.body.appendChild(popupContainer);

  // Asignar eventos
  document.getElementById("tutorialButton").addEventListener("click", openTutorial);
  document.getElementById("closeButton").addEventListener("click", closePopup);
  document.getElementById("dontShowMessageCheckbox").addEventListener("change", setDontShowMessage);
}

function openTutorial() {
  window.open("https://youtu.be/CmYNQqvWqcM?si=0fHIfhBxIqXRV-dy", "_blank");
  closePopup();
}

function closePopup() {
  const popupContainer = document.getElementById("popupContainer");
  if (popupContainer) popupContainer.remove();
}

function setDontShowMessage() {
  if (document.getElementById("dontShowMessageCheckbox").checked) {
    localStorage.setItem("dontShowMessageAgain", "true");
  }
}
