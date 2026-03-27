let images = [];
let selectedItem = null;
const preview = document.getElementById("preview");

document.getElementById("imageInput").addEventListener("change", function(e) {
  const newFiles = Array.from(e.target.files);

  newFiles.forEach(file => {
    const reader = new FileReader();
    reader.onload = function(event) {
      const obj = { src: event.target.result };
      images.push(obj);
      createPreview(obj);
    };
    reader.readAsDataURL(file);
  });

  e.target.value = "";
});

function createPreview(obj) {
  const div = document.createElement("div");
  div.className = "preview-item";

  const img = document.createElement("img");
  img.src = obj.src;

  const del = document.createElement("button");
  del.innerText = "✖";
  del.className = "delete-btn";

  del.onclick = (e) => {
    e.stopPropagation();
    images = images.filter(i => i.src !== obj.src);
    if (selectedItem === div) {
      selectedItem = null;
      clearSelection();
    }
    div.remove();
  };

  div.addEventListener("click", () => {
    if (selectedItem === null) {
      selectedItem = div;
      div.classList.add("selected");
    } else if (selectedItem === div) {
      selectedItem = null;
      div.classList.remove("selected");
    } else {
      swapElements(selectedItem, div);
      selectedItem.classList.remove("selected");
      selectedItem = null;
      updateOrder();
    }
  });

  div.appendChild(img);
  div.appendChild(del);
  preview.appendChild(div);
}

function swapElements(el1, el2) {
  const parent1 = el1.parentNode;
  const parent2 = el2.parentNode;
  const next1 = el1.nextSibling === el2 ? el1 : el1.nextSibling;
  const next2 = el2.nextSibling === el1 ? el2 : el2.nextSibling;

  parent2.insertBefore(el1, next2);
  parent1.insertBefore(el2, next1);
}

function clearSelection() {
  document.querySelectorAll(".preview-item.selected").forEach(el => {
    el.classList.remove("selected");
  });
}

function updateOrder() {
  const newArr = [];
  document.querySelectorAll(".preview-item img").forEach(img => {
    const found = images.find(i => i.src === img.src);
    if (found) newArr.push(found);
  });
  images = newArr;
}

async function compressImage(src, quality, maxWidth) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = function() {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        const ratio = maxWidth / width;
        width = maxWidth;
        height = height * ratio;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      const compressed = canvas.toDataURL("image/jpeg", quality);
      resolve(compressed);
    };
    img.src = src;
  });
}

async function generatePDF() {
  if (images.length === 0) {
    alert("Upload gambar dulu!");
    return;
  }

  const { jsPDF } = window.jspdf;
  const paper = document.getElementById("paperSize").value;
  const quality = parseFloat(document.getElementById("quality").value);
  const maxWidth = parseInt(document.getElementById("maxWidth").value);

  let widthMM = paper === "a4" ? 210 : 216;
  let totalHeight = 0;
  let compressedImages = [];

  for (let imgObj of images) {
    const compressed = await compressImage(imgObj.src, quality, maxWidth);
    const img = await loadImage(compressed);

    let ratio = widthMM / img.width;
    let heightMM = img.height * ratio;

    totalHeight += heightMM;

    compressedImages.push({ data: compressed, heightMM });
  }

  const pdf = new jsPDF("p", "mm", [widthMM, totalHeight]);
  let y = 0;

  for (let img of compressedImages) {
    pdf.addImage(img.data, "JPEG", 0, y, widthMM, img.heightMM);
    y += img.heightMM;
  }

  let name = document.getElementById("fileName").value.trim();
  if (name === "") name = "compressed-file";

  pdf.save(name + ".pdf");
}

function loadImage(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = src;
  });
}
