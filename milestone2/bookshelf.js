
/* Milestone 2 - My Bookshelf
   Displays books saved in localStorage.
   UPDATED: Added the ability to remove saved books.
*/

// Find the area where saved books will appear.
const bookshelf = document.getElementById("bookshelf");

// Load books saved in the browser.
let savedBooks = [];

try {
    savedBooks = JSON.parse(localStorage.getItem("myBookshelf")) || [];

    // Make sure the saved data is an array.
    if (!Array.isArray(savedBooks)) {
        savedBooks = [];
    }
} catch (error) {
    console.error("Unable to load saved books:", error);
}

// NEW: Put book display logic inside a function.
// This lets us refresh the bookshelf after removing a book.
function displayBookshelf() {
    // Clear the previous display before rebuilding it.
    bookshelf.innerHTML = "";

    // Show a message when the bookshelf is empty.
    if (savedBooks.length === 0) {
        bookshelf.textContent =
            "Your bookshelf is empty. Search for books to add!";
        return;
    }

    // Create a card for each saved book.
    savedBooks.forEach(book => {
        const card = document.createElement("div");
        card.className = "book-card";

        // Display the book cover when available.
        if (book.coverId) {
            const cover = document.createElement("img");
            cover.src =
                `https://covers.openlibrary.org/b/id/${book.coverId}-M.jpg`;
            cover.alt = `Cover of ${book.title}`;
            card.appendChild(cover);
        }

        // Display the book title.
        const title = document.createElement("h3");
        title.textContent = book.title;
        card.appendChild(title);

        // Display the author when available.
        if (book.author) {
            const author = document.createElement("p");
            author.textContent = `Author: ${book.author}`;
            card.appendChild(author);
        }

        // NEW: Create a button to remove this book.
        const removeButton = document.createElement("button");
        removeButton.textContent = "Remove from Bookshelf";
        removeButton.className = "remove-button";

        // NEW: Remove the selected book and save the updated list.
        removeButton.addEventListener("click", function() {
            const updatedBooks = savedBooks.filter(
                savedBook => savedBook.id !== book.id
            );

            // Save the updated bookshelf in localStorage.
            try {
                localStorage.setItem(
                    "myBookshelf",
                    JSON.stringify(updatedBooks)
                );

                savedBooks = updatedBooks;

                // Refresh the display without reloading the page.
                displayBookshelf();
            } catch (error) {
                console.error("Unable to remove book:", error);
                alert("Unable to remove this book. Please try again.");
            }
        });

        card.appendChild(removeButton);
        bookshelf.appendChild(card);
    });
}

// Display saved books when the page first loads.
displayBookshelf();
