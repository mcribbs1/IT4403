
/* Milestone 2 - Book Search
   Fetches live book data from Open Library.
   Displays titles, covers, and links to book details.
   UPDATED: Allows users to save books to My Bookshelf.
*/

// Keep track of the current search and page.
let searchTerm = "";
let currentPage = 1;

const resultsPerPage = 10;
const maxResults = 60;

// Run a search when the user submits the form.
document.getElementById("searchForm").addEventListener("submit", function(event) {
    event.preventDefault();

    searchTerm = document.getElementById("searchInput").value.trim();
    currentPage = 1; // Start over for every new search.

    if (!searchTerm) {
        document.getElementById("results").textContent = "Please enter a search term.";
        document.getElementById("pagination").innerHTML = "";
        return;
    }

    searchBooks();
});

// NEW: Save a selected book in localStorage.
// This allows books to remain saved after refreshing the browser.
function saveBook(book) {
    let savedBooks = [];

    try {
        savedBooks = JSON.parse(localStorage.getItem("myBookshelf")) || [];

        // Make sure saved data is an array.
        if (!Array.isArray(savedBooks)) {
            savedBooks = [];
        }
    } catch (error) {
        console.error("Unable to read saved books:", error);
    }

    // NEW: Prevent saving the same book more than once.
    const alreadySaved = savedBooks.some(saved => saved.id === book.id);

    if (alreadySaved) {
        alert("This book is already on your bookshelf!");
        return;
    }

    savedBooks.push(book);

    try {
        localStorage.setItem("myBookshelf", JSON.stringify(savedBooks));
        alert("Book added to your bookshelf!");
    } catch (error) {
        console.error("Unable to save book:", error);
        alert("Unable to save this book. Please try again.");
    }
}

// Request books from the Open Library API.
async function searchBooks() {
    const results = document.getElementById("results");
    const pagination = document.getElementById("pagination");

    results.textContent = "Loading books...";
    pagination.innerHTML = "";

    const apiURL = `https://openlibrary.org/search.json?q=${encodeURIComponent(searchTerm)}&limit=${resultsPerPage}&page=${currentPage}`;

    try {
        const response = await fetch(apiURL);

        if (!response.ok) {
            throw new Error("Unable to load books.");
        }

        const data = await response.json();
        results.innerHTML = "";

        if (!data.docs || data.docs.length === 0) {
            results.textContent = "No books found. Try another search.";
            return;
        }

        // Create one card for each book returned by the API.
        for (const book of data.docs) {
            const card = document.createElement("div");
            card.className = "book-card";

            const cover = document.createElement("img");

            if (book.cover_i) {
                cover.src = `https://covers.openlibrary.org/b/id/${book.cover_i}-S.jpg`;
                cover.alt = `Cover of ${book.title}`;
                card.appendChild(cover);
            } else {
                cover.style.display = "none";

                const missingCover = document.createElement("p");
                missingCover.textContent = "No cover available";
                card.appendChild(missingCover);
            }

            const title = document.createElement("p");
            const link = document.createElement("a");

            // Work IDs identify books on the details page.
            const workID = book.key?.split("/").pop();

            link.href = `details.html?id=${encodeURIComponent(workID || "")}`;
            link.textContent = book.title || "Untitled book";

            title.appendChild(link);
            card.appendChild(title);

            // NEW: Add a Save to Bookshelf button to each book card.
            const saveButton = document.createElement("button");
            saveButton.textContent = "Save to Bookshelf";
            saveButton.className = "save-button";

            // NEW: Save the book's information when clicked.
            // The property names match what bookshelf.js expects.
            saveButton.addEventListener("click", function() {
                const bookToSave = {
                    id: book.key,
                    title: book.title || "Untitled book",
                    author: book.author_name?.[0] || "Unknown author",
                    coverId: book.cover_i || null
                };

                saveBook(bookToSave);
            });

            card.appendChild(saveButton);
            results.appendChild(card);
        }

        // Limit pagination to the first 60 search results.
        const totalPages = Math.ceil(
            Math.min(data.numFound ?? data.num_found ?? 0, maxResults) / resultsPerPage
        );

        if (totalPages > 1) {
            const label = document.createElement("label");
            label.textContent = "Page: ";
            label.htmlFor = "pageSelect";

            const select = document.createElement("select");
            select.id = "pageSelect";

            for (let page = 1; page <= totalPages; page++) {
                const option = document.createElement("option");
                option.value = page;
                option.textContent = page;
                option.selected = page === currentPage;
                select.appendChild(option);
            }

            select.addEventListener("change", function() {
                currentPage = Number(select.value);
                searchBooks();
            });

            pagination.appendChild(label);
            pagination.appendChild(select);
        }

    } catch (error) {
        results.textContent = "Error loading books. Please try again.";
        console.error(error);
    }
}
