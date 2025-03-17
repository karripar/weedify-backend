
-- paths for sql-files
-- Karri: c:/users/karri/webdev/weedify/weedify-backend/weedify.sql

DROP DATABASE IF EXISTS weedify;
CREATE DATABASE weedify;
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
    dietary_restrictions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_level_id) REFERENCES UserLevels(user_level_id)
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

-- Create table RecipePosts
CREATE TABLE RecipePosts (
    recipe_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    media_id INT DEFAULT NULL,
    title VARCHAR(255) NOT NULL,
    instructions TEXT NOT NULL,
    diet_type VARCHAR(50),
    cooking_time INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- Create table RecipeMedia
CREATE TABLE RecipeMedia (
    media_id INT PRIMARY KEY AUTO_INCREMENT,
    recipe_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    media_type VARCHAR(50) NOT NULL,
    filesize INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipe_id) REFERENCES RecipePosts(recipe_id) ON DELETE CASCADE
);

-- Create table Ingredients
CREATE TABLE Ingredients (
    ingredient_id INT PRIMARY KEY AUTO_INCREMENT,
    ingredient_name VARCHAR(50) NOT NULL UNIQUE
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

-- Create table 

-- Create table Tags
CREATE TABLE Tags (
    tag_id INT PRIMARY KEY AUTO_INCREMENT,
    tag_name VARCHAR(50) NOT NULL UNIQUE
);

-- Create table RecipeTags
CREATE TABLE RecipeTags (
    recipe_tag_id INT PRIMARY KEY AUTO_INCREMENT,
    recipe_id INT NOT NULL,
    tag_id INT NOT NULL,
    FOREIGN KEY (recipe_id) REFERENCES RecipePosts(recipe_id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES Tags(tag_id) ON DELETE CASCADE
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES RecipePosts(recipe_id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_recipe_title ON RecipePosts(title);
CREATE INDEX idx_recipe_diet_type ON RecipePosts(diet_type);
CREATE INDEX idx_recipe_cooking_time ON RecipePosts(cooking_time);
CREATE INDEX idx_recipe_created_at ON RecipePosts(created_at);

CREATE INDEX idx_recipe_media_filename ON RecipeMedia(filename);
CREATE INDEX idx_recipe_media_media_type ON RecipeMedia(media_type);
CREATE INDEX idx_recipe_media_filesize ON RecipeMedia(filesize);

CREATE INDEX idx_ingredient_name ON Ingredients(ingredient_name);

CREATE INDEX idx_tag_name ON Tags(tag_name);

-- Insert mock data
INSERT INTO UserLevels (level_name) VALUES ('User'), ('Admin');

INSERT INTO Users (username, password, email, user_level_id) VALUES ('karri', 'password', 'karri@testi.com', 1), ('testi', 'password', 'testi@testi.com', 1);

INSERT INTO ProfilePicture (user_id, filename, media_type, filesize) VALUES (1, 'profile.jpg', 'image/jpeg', 12345), (2, 'profile.jpg', 'image/jpeg', 12345);

INSERT INTO RecipePosts (user_id, media_id, title, instructions, diet_type, cooking_time) VALUES (1, 1, 'Testiresepti', 'Testireseptin ohjeet', 'Vegaani', 30), (2, 2, 'Testiresepti2', 'Testireseptin ohjeet', 'Kasvis', 45);

INSERT INTO RecipeMedia (recipe_id, filename, media_type, filesize) VALUES (1, 'recipe.jpg', 'image/jpeg', 12345), (2, 'recipe.jpg', 'image/jpeg', 12345);

INSERT INTO Ingredients (ingredient_name) VALUES ('Peruna'), ('Porkkana');

INSERT INTO RecipeIngredients (recipe_id, ingredient_id, amount, unit) VALUES (1, 1, 2, 'kpl'), (1, 2, 3, 'kpl'), (2, 1, 3, 'kpl'), (2, 2, 4, 'kpl');

INSERT INTO Tags (tag_name) VALUES ('Kasvis'), ('Vegaani');

INSERT INTO RecipeTags (recipe_id, tag_id) VALUES (1, 1), (1, 2), (2, 1);

INSERT INTO Comments (user_id, recipe_id, comment) VALUES (1, 1, 'Testikommentti'), (2, 1, 'Testikommentti2');

INSERT INTO Likes (user_id, recipe_id) VALUES (1, 1), (2, 1);

INSERT INTO Follows (follower_id, followed_id) VALUES (1, 2);

INSERT INTO Favorites (user_id, recipe_id) VALUES (1, 1), (2, 1);

INSERT INTO NotificationTypes (type_name) VALUES ('Like'), ('Comment'), ('Follow');

INSERT INTO Notifications (user_id, notification_text, notification_type_id) VALUES (1, 'Testi-ilmoitus', 1), (2, 'Testi-ilmoitus2', 2);

INSERT INTO Ratings (user_id, recipe_id, rating) VALUES (1, 1, 5), (2, 1, 4);




