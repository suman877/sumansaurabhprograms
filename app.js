document.getElementById('startSession').addEventListener('click', () => {
  const book = document.getElementById('bookName').value.trim();
  if (!book) return alert("Enter book name!");

  const now = new Date().toLocaleString();
  document.getElementById('sessionBook').textContent = book;
  document.getElementById('sessionTime').textContent = now;
  document.getElementById('sessionInfo').hidden = false;
  document.getElementById('mainContent').hidden = false;

  window.sessionData = { book, time: now };
});

document.getElementById('processBtn').addEventListener('click', () => {
  const file = document.getElementById('imageInput').files[0];
  if (!file) return alert("Upload an image first!");

  document.getElementById('loader').style.display = 'block';
  Tesseract.recognize(file, 'eng').then(({ data: { text } }) => {
    const points = text.split(/[.?!]\s/).filter(s => s.length > 30).slice(0, 6);
    renderPoints(points);
  }).finally(() => {
    document.getElementById('loader').style.display = 'none';
  });
});

function renderPoints(points) {
  const output = document.getElementById('output');
  output.innerHTML = "<h3>✅ Select Important Points:</h3>";

  points.forEach((pt, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'point';
    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.id = 'pt' + i;
    chk.checked = true;
    const lbl = document.createElement('label');
    lbl.htmlFor = chk.id;
    lbl.textContent = `${i + 1}. ${pt}`;
    wrap.append(chk, lbl);
    output.appendChild(wrap);
  });

  document.getElementById('exportOptions').hidden = false;
}

document.getElementById('exportSelected').addEventListener('click', () => {
  const { book, time } = window.sessionData;
  const selected = [];
  document.querySelectorAll('.point input').forEach((chk) => {
    if (chk.checked) {
      const lbl = document.querySelector(`label[for=${chk.id}]`);
      selected.push(lbl.textContent);
    }
  });

  if (selected.length === 0) return alert("No points selected!");
  const baseName = book.replace(/\s+/g, '_') + "_notes";

  const header = `📖 Book: ${book}\n⏱️ Time: ${time}\n\n`;
  const numbered = selected.map((s, i) => {
    const symbol = (i % 2 === 0) ? "卐" : "࿊";
    return `${symbol} ${s.split(". ").slice(1).join(". ")}`;
  }).join("\n\n");
  const fullText = header + numbered;

  // TXT Export
  if (document.getElementById('optTxt').checked) {
    const blob = new Blob([fullText], { type: "text/plain" });
    downloadBlob(blob, baseName + ".txt");
  }

  // PDF Export (simple for now)
  if (document.getElementById('optPdf').checked) {
    const blob = new Blob([fullText], { type: "application/pdf" });
    downloadBlob(blob, baseName + ".pdf");
  }

  // PNG Export
  if (document.getElementById('optImg').checked) {
    const captureArea = document.createElement("div");
    captureArea.style.padding = "20px";
    captureArea.style.background = "white";
    captureArea.style.fontFamily = "'Segoe UI', sans-serif";
    captureArea.innerHTML = `<h2>📖 ${book}</h2><p><strong>⏱️ ${time}</strong></p><ul style="list-style-type:none;">` +
      selected.map((s, i) => {
        const symbol = (i % 2 === 0) ? "卐" : "࿊";
        return `<li style="margin-bottom:10px;">${symbol} ${s.split(". ").slice(1).join(". ")}</li>`;
      }).join("") +
      `</ul>`;

    document.body.appendChild(captureArea);
    html2canvas(captureArea).then(canvas => {
      canvas.toBlob(blob => {
        downloadBlob(blob, baseName + ".png");
        document.body.removeChild(captureArea);
      });
    });
  }

  alert("✅ Export completed!");
});

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}
