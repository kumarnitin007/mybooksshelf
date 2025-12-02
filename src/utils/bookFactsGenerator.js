/**
 * Book Facts Generator
 * 
 * Generates interesting facts about books based on title and author.
 * Uses a curated list of facts for popular books, with fallback generic facts.
 */

// Curated book facts for popular books
const CURATED_BOOK_FACTS = {
  "The Hunger Games": {
    author: "Suzanne Collins",
    facts: [
      "The Hunger Games was inspired by the Greek myth of Theseus and the Minotaur, where Athens had to send 14 young people to Crete as tribute.",
      "Suzanne Collins came up with the idea while channel surfing between reality TV shows and coverage of the Iraq War.",
      "The book was originally written in first person, but Collins changed it to third person limited to allow for more narrative flexibility.",
      "Katniss Everdeen's name comes from a plant called katniss, which is an edible tuber that grows in water.",
      "The trilogy has sold over 100 million copies worldwide and has been translated into 51 languages."
    ]
  },
  "The Book Thief": {
    author: "Markus Zusak",
    facts: [
      "The Book Thief is narrated by Death, making it one of the few books where Death is a character and narrator.",
      "Markus Zusak's parents grew up in Nazi Germany, which inspired the setting of the book.",
      "The book took 13 years to write, with Zusak rewriting it multiple times.",
      "It was originally rejected by multiple publishers before being accepted.",
      "The book has been translated into over 40 languages and has sold millions of copies worldwide."
    ]
  },
  "To Kill a Mockingbird": {
    author: "Harper Lee",
    facts: [
      "To Kill a Mockingbird is Harper Lee's only published novel for 55 years until Go Set a Watchman was published in 2015.",
      "The character of Atticus Finch was based on Lee's own father, Amasa Coleman Lee.",
      "The book won the Pulitzer Prize for Fiction in 1961.",
      "It's one of the most frequently challenged books in American schools due to its themes of racism and violence.",
      "The book has sold over 40 million copies and has been translated into more than 40 languages."
    ]
  },
  "The Hobbit": {
    author: "J.R.R. Tolkien",
    facts: [
      "The Hobbit was originally written as a bedtime story for Tolkien's children.",
      "Tolkien created the entire world of Middle-earth, including languages, maps, and histories.",
      "The book was published in 1937 and was an immediate success.",
      "Tolkien was a professor of Anglo-Saxon at Oxford University when he wrote the book.",
      "The Hobbit was the precursor to The Lord of the Rings trilogy."
    ]
  },
  "The Giver": {
    author: "Lois Lowry",
    facts: [
      "The Giver won the Newbery Medal in 1994, one of the most prestigious awards for children's literature.",
      "Lois Lowry was inspired by her father's memory loss to write about a society without memories.",
      "The book is part of a quartet: The Giver, Gathering Blue, Messenger, and Son.",
      "It's one of the most frequently challenged books in American schools.",
      "The book explores themes of memory, individuality, and the importance of human experience."
    ]
  },
  "Wonder": {
    author: "R.J. Palacio",
    facts: [
      "R.J. Palacio was inspired to write Wonder after an incident where her son saw a girl with facial differences and started crying.",
      "The book's message 'Choose Kind' has become a movement in schools worldwide.",
      "Wonder has been adapted into a major motion picture starring Julia Roberts and Owen Wilson.",
      "The book is told from multiple perspectives, showing how different characters view the same events.",
      "It has sold over 5 million copies and has been translated into 45 languages."
    ]
  },
  "The Fault in Our Stars": {
    author: "John Green",
    facts: [
      "John Green wrote the book while working as a chaplain at a children's hospital, which inspired the story.",
      "The title comes from Shakespeare's play Julius Caesar: 'The fault, dear Brutus, is not in our stars, but in ourselves.'",
      "The book was a #1 New York Times bestseller and stayed on the list for 7 weeks.",
      "It was adapted into a major motion picture in 2014.",
      "John Green is also known for his YouTube channel 'Vlogbrothers' with his brother Hank."
    ]
  },
  "Percy Jackson and the Lightning Thief": {
    author: "Rick Riordan",
    facts: [
      "Rick Riordan originally created the Percy Jackson character as a bedtime story for his son who has ADHD and dyslexia.",
      "The series has sold over 180 million copies worldwide.",
      "Percy Jackson has been adapted into movies and a Disney+ TV series.",
      "Riordan was a middle school teacher for 15 years before becoming a full-time writer.",
      "The series has inspired many young readers to learn about Greek mythology."
    ]
  },
  "Harry Potter and the Philosopher's Stone": {
    author: "J.K. Rowling",
    facts: [
      "J.K. Rowling wrote much of the first book in cafes because she couldn't afford to heat her apartment.",
      "The book was rejected by 12 publishers before being accepted by Bloomsbury.",
      "Rowling came up with the idea for Harry Potter while on a delayed train from Manchester to London.",
      "The series has sold over 500 million copies worldwide, making it the best-selling book series in history.",
      "The book was published as 'Harry Potter and the Sorcerer's Stone' in the United States."
    ]
  },
  "The Chronicles of Narnia: The Lion, the Witch and the Wardrobe": {
    author: "C.S. Lewis",
    facts: [
      "C.S. Lewis was close friends with J.R.R. Tolkien, and they were both members of a literary group called 'The Inklings.'",
      "The book was published in 1950 and is the first published book in the Narnia series, though it's second chronologically.",
      "Lewis wrote the book during World War II, and the children are evacuated from London, reflecting real events.",
      "The character of Aslan was inspired by Jesus Christ, and the book contains many Christian allegories.",
      "The book has been adapted into multiple films, TV series, and stage productions."
    ]
  }
};

// Generic facts that can be applied to any book
const GENERIC_FACTS = [
  "Reading for just 6 minutes can reduce stress levels by up to 68%!",
  "Books can transport you to different worlds and help you see things from new perspectives.",
  "Reading regularly can improve your vocabulary, empathy, and critical thinking skills.",
  "Many successful people credit their love of reading as a key factor in their achievements.",
  "Books are a great way to learn about different cultures, time periods, and ways of life.",
  "Reading before bed can help you sleep better by relaxing your mind.",
  "The average person reads about 12 books per year, but avid readers can read 50+ books annually!",
  "Books have been around for thousands of years and remain one of the best ways to share knowledge and stories.",
  "Reading can improve your memory and brain function, keeping your mind sharp as you age.",
  "Every book you read adds to your knowledge and helps shape who you are as a person."
];

/**
 * Generates book facts for a given book
 * @param {string} title - The book title
 * @param {string} author - The book author
 * @param {number} count - Number of facts to generate (default: 3)
 * @returns {Array<string>} Array of fact strings
 */
export const generateBookFacts = (title, author, count = 3) => {
  if (!title) return [];

  const normalizedTitle = title.trim();
  const normalizedAuthor = author ? author.trim() : '';

  // Check if we have curated facts for this book
  const curatedEntry = CURATED_BOOK_FACTS[normalizedTitle];
  if (curatedEntry && (!normalizedAuthor || curatedEntry.author.toLowerCase() === normalizedAuthor.toLowerCase())) {
    // Return curated facts, shuffled and limited to count
    const facts = [...curatedEntry.facts];
    shuffleArray(facts);
    return facts.slice(0, count);
  }

  // If no curated facts, return generic facts
  const genericFacts = [...GENERIC_FACTS];
  shuffleArray(genericFacts);
  return genericFacts.slice(0, count);
};

/**
 * Shuffles an array in place (Fisher-Yates shuffle)
 * @param {Array} array - Array to shuffle
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * Gets a random fact about reading/books
 * @returns {string} A random generic fact
 */
export const getRandomBookFact = () => {
  const randomIndex = Math.floor(Math.random() * GENERIC_FACTS.length);
  return GENERIC_FACTS[randomIndex];
};

