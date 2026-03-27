let images = [];
const preview = document.getElementById("preview");

preview.addEventListener("dragover", e => {
  e.preventDefault();

  const dragging = document.querySelector(".dragging");
  const afterElement = getDragAfter(preview, e.clientY);

  if (afterElement == null) {
    preview.appendChild(dragging);
  } else {
    preview.insertBefore(dragging, afterElement);
  }
});

document.getElementById("imageInput").addEventListener("change", function(e){
  images = [];
  preview.innerHTML = "";

  Array.from(e.target.files).forEach(file=>{
    const reader = new FileReader();
    reader.onload = function(event){
      const obj = { src: event.target.result };
      images.push(obj);
      createPreview(obj);
    };
    reader.readAsDataURL(file);
  });
});

function createPreview(obj){

  const div = document.createElement("div");
  div.className="preview-item";
  div.draggable=true;

  const img=document.createElement("img");
  img.src=obj.src;

  const del=document.createElement("button");
  del.innerText="✖";
  del.className="delete-btn";

  del.onclick=()=>{
    images = images.filter(i=>i.src!==obj.src);
    div.remove();
  };

  div.appendChild(img);
  div.appendChild(del);
  preview.appendChild(div);

  div.addEventListener("dragstart",()=>div.classList.add("dragging"));
  div.addEventListener("dragend",()=>{
    div.classList.remove("dragging");
    updateOrder();
  });
}
function getDragAfter(container,y){
  const els=[...container.querySelectorAll(".preview-item:not(.dragging)")];
  return els.reduce((closest,child)=>{
    const box=child.getBoundingClientRect();
    const offset=y-box.top-box.height/2;
    if(offset<0 && offset>closest.offset){
      return {offset,element:child};
    }else return closest;
  },{offset:Number.NEGATIVE_INFINITY}).element;
}

function updateOrder(){
  const newArr=[];
  document.querySelectorAll(".preview-item img").forEach(img=>{
    const found=images.find(i=>i.src===img.src);
    newArr.push(found);
  });
  images=newArr;
}

async function compressImage(src, quality, maxWidth){
  return new Promise(resolve=>{
    const img=new Image();
    img.onload=function(){
      let width=img.width;
      let height=img.height;

      if(width>maxWidth){
        const ratio=maxWidth/width;
        width=maxWidth;
        height=height*ratio;
      }

      const canvas=document.createElement("canvas");
      canvas.width=width;
      canvas.height=height;

      const ctx=canvas.getContext("2d");
      ctx.drawImage(img,0,0,width,height);

      const compressed=canvas.toDataURL("image/jpeg",quality);
      resolve(compressed);
    };
    img.src=src;
  });
}

async function generatePDF(){
  if(images.length===0){
    alert("Upload gambar dulu!");
    return;
  }

  const { jsPDF }=window.jspdf;
  const paper=document.getElementById("paperSize").value;
  const quality=parseFloat(document.getElementById("quality").value);
  const maxWidth=parseInt(document.getElementById("maxWidth").value);

  let widthMM=paper==="a4"?210:216;
  let totalHeight=0;
  let compressedImages=[];

  for(let imgObj of images){
    const compressed=await compressImage(imgObj.src,quality,maxWidth);
    const img=await loadImage(compressed);

    let ratio=widthMM/img.width;
    let heightMM=img.height*ratio;

    totalHeight+=heightMM;

    compressedImages.push({
      data:compressed,
      heightMM
    });
  }

  const pdf=new jsPDF("p","mm",[widthMM,totalHeight]);
  let y=0;

  for(let img of compressedImages){
    pdf.addImage(img.data,"JPEG",0,y,widthMM,img.heightMM);
    y+=img.heightMM;
  }

  let name=document.getElementById("fileName").value.trim();
  if(name==="") name="compressed-file";

  pdf.save(name+".pdf");
}

function loadImage(src){
  return new Promise(resolve=>{
    const img=new Image();
    img.onload=()=>resolve(img);
    img.src=src;
  });
}