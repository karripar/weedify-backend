-- paths for sql-files
-- Karri: source c:/users/karri/webdev/weedify/weedify-backend/weedify.sql;

-- elli: source C:/Users/ellir/monialustaprojekti/weedify-backend/weedify.sql;

DROP DATABASE IF EXISTS weedify;
CREATE DATABASE weedify CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE weedify;

-- Create UserLevels table
CREATE TABLE UserLevels (
    user_level_id INT PRIMARY KEY AUTO_INCREMENT,
    level_name VARCHAR(50) NOT NULL UNIQUE
);

-- Create Users table
CREATE TABLE Users (
    user_id INT PRIMARY KEY UNIQUE AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(50) NOT NULL UNIQUE,
    bio TEXT,
    user_level_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_level_id) REFERENCES UserLevels(user_level_id)
);



-- Create table ResetTokens
CREATE TABLE ResetTokens (
    token_id INT PRIMARY KEY UNIQUE AUTO_INCREMENT,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- Create table DietaryRestrictions
CREATE TABLE DietaryRestrictions (
    dietary_restriction_id INT PRIMARY KEY AUTO_INCREMENT,
    restriction_name VARCHAR(50) NOT NULL UNIQUE
);

-- Create table UserDietaryRestrictions
CREATE TABLE UserDietaryRestrictions (
    user_id INT,
    dietary_restriction_id INT,
    PRIMARY KEY (user_id, dietary_restriction_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (dietary_restriction_id) REFERENCES DietaryRestrictions(dietary_restriction_id) ON DELETE CASCADE
);

-- Create ProfilePictures table
CREATE TABLE ProfilePicture (
    profile_picture_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    media_type VARCHAR(50) NOT NULL,
    filesize INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- Difficulty levels table
CREATE TABLE DifficultyLevels (
    difficulty_level_id INT PRIMARY KEY AUTO_INCREMENT,
    level_name VARCHAR(50) NOT NULL UNIQUE
);

-- Create table RecipePosts
CREATE TABLE RecipePosts (
    recipe_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    instructions TEXT NOT NULL,
    cooking_time INT NOT NULL,
    portions INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    media_type VARCHAR(50) NOT NULL,
    filesize INT NOT NULL,
    difficulty_level_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (difficulty_level_id) REFERENCES DifficultyLevels(difficulty_level_id)
);


-- Create table Ingredients
CREATE TABLE Ingredients (
    ingredient_id INT PRIMARY KEY AUTO_INCREMENT,
    ingredient_name VARCHAR(150) NOT NULL UNIQUE
);

-- Create table RecipeIngredients
CREATE TABLE RecipeIngredients (
    recipe_ingredient_id INT PRIMARY KEY AUTO_INCREMENT,
    recipe_id INT NOT NULL,
    ingredient_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    FOREIGN KEY (recipe_id) REFERENCES RecipePosts(recipe_id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES Ingredients(ingredient_id) ON DELETE CASCADE
);

CREATE TABLE DietTypes (
    diet_type_id INT PRIMARY KEY AUTO_INCREMENT,
    diet_type_name VARCHAR(50) NOT NULL UNIQUE
);

-- Create table RecipeDietTypes
CREATE TABLE RecipeDietTypes (
    recipe_diet_id INT PRIMARY KEY AUTO_INCREMENT,
    recipe_id INT NOT NULL,
    diet_type_id INT NOT NULL,
    FOREIGN KEY (recipe_id) REFERENCES RecipePosts(recipe_id) ON DELETE CASCADE,
    FOREIGN KEY (diet_type_id) REFERENCES DietTypes(diet_type_id) ON DELETE CASCADE
);

-- Create table Comments
CREATE TABLE Comments (
    comment_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    recipe_id INT NOT NULL,
    comment TEXT NOT NULL,
    reference_comment_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES RecipePosts(recipe_id) ON DELETE CASCADE,
    FOREIGN KEY (reference_comment_id) REFERENCES Comments(comment_id) ON DELETE CASCADE
);

-- Create table Likes
CREATE TABLE Likes (
    like_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    recipe_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES RecipePosts(recipe_id) ON DELETE CASCADE
);

-- Create table Follows
CREATE TABLE Follows (
    follow_id INT PRIMARY KEY AUTO_INCREMENT,
    follower_id INT NOT NULL,
    followed_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (follower_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (followed_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- Create table Favorites   
CREATE TABLE Favorites (
    favorite_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    recipe_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES RecipePosts(recipe_id) ON DELETE CASCADE
);

-- Create table NotificationTypes
CREATE TABLE NotificationTypes (
    notification_type_id INT PRIMARY KEY AUTO_INCREMENT,
    type_name VARCHAR(50) NOT NULL UNIQUE
);

-- Create table Notifications
CREATE TABLE Notifications (
    notification_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    notification_text TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    notification_type_id INT NOT NULL,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE, 
    FOREIGN KEY (notification_type_id) REFERENCES NotificationTypes(notification_type_id)
);

-- Create table Ratings
CREATE TABLE Ratings (
    rating_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    recipe_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES RecipePosts(recipe_id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_recipe_title ON RecipePosts(title);
CREATE INDEX idx_recipe_cooking_time ON RecipePosts(cooking_time);
CREATE INDEX idx_recipe_created_at ON RecipePosts(created_at);
CREATE INDEX idx_ingredient_name ON Ingredients(ingredient_name);
CREATE INDEX idx_user_username ON Users(username);
CREATE INDEX idx_user_email ON Users(email);
CREATE INDEX idx_comment_created_at ON Comments(created_at);
CREATE INDEX idx_like_created_at ON Likes(created_at);
CREATE INDEX idx_follow_created_at ON Follows(created_at);
CREATE INDEX idx_favorite_created_at ON Favorites(created_at);
CREATE INDEX idx_notification_created_at ON Notifications(created_at);
CREATE INDEX idx_notification_is_read ON Notifications(is_read);
CREATE INDEX idx_rating_created_at ON Ratings(created_at);
CREATE INDEX idx_recipe_difficulty ON RecipePosts(difficulty_level_id);
CREATE INDEX idx_recipe_user ON RecipePosts(user_id);
CREATE INDEX idx_recipe_ingredient ON RecipeIngredients(recipe_id, ingredient_id);
CREATE INDEX idx_recipe_diet ON RecipeDietTypes(recipe_id, diet_type_id);
CREATE INDEX idx_user_level ON Users(user_level_id);
CREATE INDEX idx_user_diet ON UserDietaryRestrictions(user_id, dietary_restriction_id);
CREATE INDEX idx_notification_type ON Notifications(notification_type_id);


-- Insert mock data
INSERT INTO DifficultyLevels (level_name) VALUES ('Easy'), ('Medium'), ('Hard');

INSERT INTO UserLevels (level_name) VALUES ('Admin'), ('User'), ('Influencer');

INSERT INTO DietTypes (diet_type_name) VALUES ('Vegetarian'), ('Vegan'), ('Gluten-Free'), ('Dairy-Free'), ('Nut-Free'), ('Halal'), ('Kosher'), ('Paleo'), ('Keto'), ('Low-Carb'), ('Mediterranean');

/*
INSERT INTO Users (username, password, email, user_level_id) VALUES ('user', 'password', 'user@testi.com', 2), ('testi', 'password', 'testi@testi.com', 2);

INSERT INTO ProfilePicture (user_id, filename, media_type, filesize) VALUES (1, 'profile.jpg', 'image/jpeg', 12345), (2, 'profile.jpg', 'image/jpeg', 12345);


INSERT INTO RecipePosts (user_id, title, instructions, difficulty_level_id, cooking_time, filename, media_type, filesize, portions) VALUES (1, 'Kasvisruoka', 'Ohjeet kasvisruokaan', 1, 30, 'recipe.jpg', 'image/jpeg', 12345, 5), (2, 'Liha-annos', 'Ohjeet liha-annokseen', 2, 45, 'recipe.jpg', 'image/jpeg', 12345, 4);
*/

INSERT INTO Ingredients (ingredient_name) VALUES ('Peruna'), ('Porkkana'), ('Sipuli'), ('Kaalit'), ('Pasta'), ('Riisi'), ('Kala'), ('Liha'), ('Maito'), ('Juusto'), ('Kasvikset'), ('Hedelmät');

/*
INSERT INTO RecipeIngredients (recipe_id, ingredient_id, amount, unit) VALUES (1, 1, 2, 'kpl'), (1, 2, 3, 'kpl'), (2, 1, 3, 'kpl'), (2, 2, 4, 'kpl'), (2, 3, 1, 'kpl'), (2, 4, 5, 'kpl'), (2, 5, 2, 'kpl'), (2, 6, 1, 'kpl'), (2, 7, 1, 'kpl'), (2, 8, 1, 'kpl'), (2, 9, 1, 'kpl'), (2, 10, 1, 'kpl'), (2, 11, 1, 'kpl');


INSERT INTO Comments (user_id, recipe_id, comment) VALUES (1, 1, 'Testikommentti'), (2, 1, 'Testikommentti2');

INSERT INTO Likes (user_id, recipe_id) VALUES (1, 1), (2, 1);

INSERT INTO Follows (follower_id, followed_id) VALUES (1, 2);

INSERT INTO Favorites (user_id, recipe_id) VALUES (1, 1), (2, 1);
*/

INSERT INTO NotificationTypes (type_name) VALUES ('Like'), ('Comment'), ('Follow'), ('Rating');

/*
INSERT INTO Notifications (user_id, notification_text, notification_type_id) VALUES (1, 'Testi-ilmoitus', 1), (2, 'Testi-ilmoitus2', 2);

INSERT INTO Notifications (user_id, notification_text, notification_type_id) VALUES (1, 'Testi-ilmoitus', 1), (2, 'Testi-ilmoitus2', 2);

INSERT INTO Ratings (user_id, recipe_id, rating, review) VALUES (1, 1, 5, 'Erinomainen resepti!'), (2, 1, 4, 'Hyvä resepti, mutta kaipaisi lisää suolaa.'), (1, 2, 3, 'Ihan ok resepti.'), (2, 2, 2, 'Ei ollut makuuni.');


INSERT INTO RecipeDietTypes (recipe_id, diet_type_id) VALUES (1, 1), (2, 2);
*/
INSERT INTO DietaryRestrictions (restriction_name) VALUES ('Vegetarian'), ('Vegan'), ('Gluten-Free'), ('Dairy-Free'), ('Nut-Free'), ('Halal'), ('Kosher'), ('Paleo'), ('Keto'), ('Low-Carb'), ('Mediterranean'), ('Lactose-Free'),('Shellfish-Free'), ('Soy-Free'), ('Egg-Free'), ('Fish-Free'), ('Corn-Free'), ('Nightshade-Free'), ('FODMAP-Friendly'), ('Low-FODMAP');

-- INSERT INTO UserDietaryRestrictions (user_id, dietary_restriction_id) VALUES (1, 1), (2, 2);

-- Update Ingredients table to include nutritional data and Fineli reference
ALTER TABLE Ingredients
ADD COLUMN fineli_id INT NULL,
ADD COLUMN energy_kcal FLOAT NULL,
ADD COLUMN protein FLOAT NULL,
ADD COLUMN fat FLOAT NULL,
ADD COLUMN carbohydrate FLOAT NULL,
ADD COLUMN fiber FLOAT NULL,
ADD COLUMN sugar FLOAT NULL,
ADD INDEX idx_fineli_id (fineli_id);

-- Create RecipeNutrition table for aggregated nutritional info
CREATE TABLE IF NOT EXISTS RecipeNutrition (
  recipe_nutrition_id INT AUTO_INCREMENT PRIMARY KEY,
  recipe_id INT NOT NULL,
  energy_kcal FLOAT NOT NULL,
  protein FLOAT NOT NULL,
  fat FLOAT NOT NULL,
  carbohydrate FLOAT NOT NULL,
  fiber FLOAT NOT NULL,
  sugar FLOAT NOT NULL,
  FOREIGN KEY (recipe_id) REFERENCES RecipePosts(recipe_id) ON DELETE CASCADE,
  UNIQUE KEY (recipe_id)
);

SET GLOBAL event_scheduler = ON;

CREATE EVENT IF NOT EXISTS delete_old_notifications
ON SCHEDULE EVERY 1 DAY STARTS CURRENT_TIMESTAMP + INTERVAL 1 HOUR
DO DELETE FROM Notifications WHERE is_read = TRUE AND created_at < NOW() - INTERVAL 30 DAY;



