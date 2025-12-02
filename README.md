# 📚 Bookshelf - Personal Reading Tracker

A beautiful, feature-rich web application for tracking your reading journey. Organize your books, track your progress, earn achievements, and discover new reads!

## ✨ Features

### 📖 Book Management
- **Organize Books**: Create multiple themed bookshelves to organize your collection
- **Detailed Tracking**: Record ratings, reviews, favorite characters, memorable moments, and more
- **Multiple Views**: Display books as covers, spines, or in a detailed table view
- **Search & Filter**: Quickly find books by title, author, or filter by rating/author
- **Import/Export**: Export your library to CSV or JSON format

### 🎮 Gamification
- **XP & Levels**: Earn experience points and level up as you read
- **Reading Streaks**: Build and maintain daily reading streaks
- **Achievements**: Unlock badges for milestones and accomplishments
- **Challenges**: Participate in reading challenges

### 📊 Statistics & Goals
- **Reading Statistics**: Track total books, monthly progress, and reading habits
- **Monthly Goals**: Set and track monthly reading targets
- **User Comparison**: Compare your reading stats with other users
- **Reading Reports**: Detailed insights into your reading patterns

### 🔍 Recommendations
- **Smart Suggestions**: Get personalized book recommendations
- **Age-Appropriate Filtering**: Content filtering for teen audiences
- **Wishlist**: Save books you want to read later

### 👤 User Features
- **Authentication**: Secure email/password and magic link authentication
- **User Profiles**: Customizable profiles with avatars and bios
- **Privacy Controls**: Option to hide from user comparisons

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Bookshelf
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Supabase**
   - Create a `.env` file in the root directory
   - Add your Supabase credentials:
     ```
     VITE_SUPABASE_URL=your_supabase_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

4. **Set up the database**
   - Run the database schema scripts in `database/` folder in your Supabase SQL Editor
   - Start with the main schema, then apply `gamification_schema_safe.sql`

5. **Configure email templates**
   - Follow the instructions in `SUPABASE_EMAIL_SETUP.md`
   - Set up custom email templates in Supabase Dashboard

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Build for production**
   ```bash
   npm run build
   ```

## 📁 Project Structure

```
Bookshelf/
├── src/
│   ├── components/        # React components
│   │   ├── modals/       # Modal components
│   │   ├── layout/        # Layout components
│   │   └── bookshelf/     # Bookshelf display components
│   ├── hooks/            # Custom React hooks
│   ├── services/         # Supabase service functions
│   ├── utils/            # Utility functions
│   └── constants/        # App constants
├── database/             # Database scripts and utilities
├── email-templates/      # Email templates for Supabase
└── public/              # Static assets
```

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Icons**: Lucide React

## 📝 Database Setup

The application requires several database tables. See the `database/` folder for:
- Main schema setup
- Gamification schema (`gamification_schema_safe.sql`)
- Utility scripts for user management

## 📧 Email Configuration

Custom email templates are configured in Supabase. See `SUPABASE_EMAIL_SETUP.md` for detailed setup instructions.

## 🎨 Customization

- **Animal Themes**: Customize bookshelf themes in `src/constants/animalThemes.js`
- **Content Filtering**: Adjust age-appropriate content filters in `src/utils/contentFilter.js`

## 📄 License

This project is private and proprietary.

## 🔗 Live Demo

Visit the live application at: [https://mybooksshelf.vercel.app/](https://mybooksshelf.vercel.app/)

## 🤝 Contributing

This is a private project. For issues or feature requests, please contact the maintainer.

---

**Happy Reading! 📖✨**

