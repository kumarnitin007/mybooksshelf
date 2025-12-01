/**
 * Content Filter Utilities
 * 
 * Provides functions to filter content based on age-appropriateness.
 * Currently focused on ensuring content is appropriate for teen audiences.
 */

/**
 * List of books that are not appropriate for teens
 * (mature content, sexual themes, violence, etc.)
 */
const INAPPROPRIATE_BOOKS = [
  { title: "The Seven Husbands of Evelyn Hugo", author: "Taylor Jenkins Reid" },
  { title: "The Handmaid's Tale", author: "Margaret Atwood" },
  { title: "The Kite Runner", author: "Khaled Hosseini" },
  { title: "The Song of Achilles", author: "Madeline Miller" },
  { title: "Circe", author: "Madeline Miller" },
  { title: "Where the Crawdads Sing", author: "Delia Owens" },
  { title: "Educated", author: "Tara Westover" },
  { title: "Fifty Shades of Grey", author: "E.L. James" },
  { title: "Lolita", author: "Vladimir Nabokov" },
  { title: "American Psycho", author: "Bret Easton Ellis" },
  { title: "The Girl with the Dragon Tattoo", author: "Stieg Larsson" },
  { title: "Gone Girl", author: "Gillian Flynn" },
  { title: "The Girl on the Train", author: "Paula Hawkins" },
  { title: "Fight Club", author: "Chuck Palahniuk" },
  { title: "A Clockwork Orange", author: "Anthony Burgess" }
];

/**
 * Checks if a book is age-appropriate for teens
 * @param {string} title - The book title
 * @param {string} author - The book author
 * @returns {boolean} - True if the book is age-appropriate
 */
export const isAgeAppropriate = (title, author) => {
  if (!title || !author) return true; // Allow books with missing info
  
  const lowerTitle = (title || '').toLowerCase().trim();
  const lowerAuthor = (author || '').toLowerCase().trim();

  // Check if the book is in the inappropriate list
  return !INAPPROPRIATE_BOOKS.some(book => 
    book.title.toLowerCase() === lowerTitle && 
    book.author.toLowerCase() === lowerAuthor
  );
};

