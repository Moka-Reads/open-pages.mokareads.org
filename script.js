document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("papers-container");
  const searchInput = document.getElementById("search");
  let papers = [];

  // Modal elements
  const modal = document.getElementById("modal");
  const closeModal = document.getElementById("close-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalAbstract = document.getElementById("modal-abstract");
  const modalToc = document.getElementById("modal-toc");
  const pdfLink = document.getElementById("pdf-link");
  const purchaseLink = document.getElementById("purchase-link");
  const githubLink = document.getElementById("github-link");

  // Fetch papers
  fetch("papers.json")
    .then((res) => res.json())
    .then((data) => {
      papers = data;
      renderPapers(papers);
    });

  function renderPapers(list) {
    container.innerHTML = "";
    list.forEach((paper) => {
      const card = document.createElement("div");
      card.className = "paper-card";

      card.innerHTML = `
                <div class="paper-title">${toTitleCase(paper.title)}</div>
                <div class="paper-topics">${paper.topics.join(", ")}</div>
                <button class="expand-btn">Expand Details</button>
            `;

      card.querySelector(".expand-btn").addEventListener("click", () => {
        modalTitle.textContent = paper.title;
        modalAbstract.textContent = paper.abstract;
        modalToc.innerHTML =
          "<h3>Table of Contents:</h3><ul>" +
          paper.toc.map((item) => `<li>${item}</li>`).join("") +
          "</ul>";
        pdfLink.href = paper.pdf;
        purchaseLink.href = paper.purchase;
        githubLink.href = paper.github;
        modal.style.display = "block";
      });

      container.appendChild(card);
    });
  }

  // Search functionality
  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = papers.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.topics.some((t) => t.toLowerCase().includes(query)),
    );
    renderPapers(filtered);
  });

  closeModal.addEventListener("click", () => {
    modal.style.display = "none";
  });

  window.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });
});
