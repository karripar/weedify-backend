# weedify-backend

# Weedify documentation
## Summary

- [Introduction](#introduction)
- [Database Type](#database-type)
- [Table Structure](#table-structure)
	- [Users](#Users)
	- [UserLevels](#UserLevels)
	- [RecipePosts](#RecipePosts)
	- [Ingredients](#Ingredients)
	- [Diets](#Diets)
	- [Ratings](#Ratings)
	- [Likes](#Likes)
	- [Comments](#Comments)
- [Relationships](#relationships)
- [Database Diagram](#database-Diagram)

## Introduction

## Database type

- **Database system:** MariaDB
## Table structure

### Users

| Name        | Type          | Settings                      | References                    | Note                           |
|-------------|---------------|-------------------------------|-------------------------------|--------------------------------|
| **user_id** | INTEGER | 🔑 PK, not null , unique, autoincrement |  | |
| **username** | VARCHAR(50) | not null , unique |  | |
| **email** | VARCHAR(100) | not null , unique |  | |
| **password** | VARCHAR(100) | not null  |  | |
| **user_level_id** | INTEGER | not null , default: 2 | fk_Users_user_level_id_UserLevels | |
| **profile_image** | VARCHAR(255) | not null , default: default-profileimage |  | |
| **dietary** | VARCHAR(100) | not null  |  | |
| **created_at** | TIMESTAMP | not null  |  | | 


### UserLevels

| Name        | Type          | Settings                      | References                    | Note                           |
|-------------|---------------|-------------------------------|-------------------------------|--------------------------------|
| **level_id** | INTEGER | 🔑 PK, not null , unique, autoincrement |  | |
| **level_name** | VARCHAR(50) | not null , default: User |  | | 


### RecipePosts

| Name        | Type          | Settings                      | References                    | Note                           |
|-------------|---------------|-------------------------------|-------------------------------|--------------------------------|
| **recipe_id** | INTEGER | 🔑 PK, not null , unique, autoincrement |  | |
| **user_id** | INTEGER | not null , unique | fk_RecipePosts_user_id_Users | |
| **media_url** | VARCHAR(255) | not null  |  | |
| **media_type** | VARCHAR(50) | not null  |  | |
| **instructions** | TEXT(65535) | not null  |  | |
| **cooking_time** | INTEGER | not null  |  | |
| **created_at** | TIMESTAMP | not null  |  | | 


### Ingredients

| Name        | Type          | Settings                      | References                    | Note                           |
|-------------|---------------|-------------------------------|-------------------------------|--------------------------------|
| **ingredient_id** | INTEGER | 🔑 PK, not null , unique, autoincrement |  | |
| **recipe_id** | INTEGER | not null , unique | fk_Ingredients_recipe_id_RecipePosts | |
| **ingredient** | VARCHAR(50) | not null , unique |  | | 


### Diets

| Name        | Type          | Settings                      | References                    | Note                           |
|-------------|---------------|-------------------------------|-------------------------------|--------------------------------|
| **diet_id** | INTEGER | 🔑 PK, not null , unique, autoincrement |  | |
| **user_id** | INTEGER | not null , unique | fk_Diets_user_id_Users | |
| **recipe_id** | INTEGER | not null , unique | fk_Diets_recipe_id_RecipePosts | |
| **diet_description** | VARCHAR(50) | not null , unique |  | | 


### Ratings

| Name        | Type          | Settings                      | References                    | Note                           |
|-------------|---------------|-------------------------------|-------------------------------|--------------------------------|
| **rating_id** | INTEGER | 🔑 PK, not null , unique, autoincrement |  | |
| **user_id** | INTEGER | not null , unique | fk_Ratings_user_id_Users | |
| **recipe_id** | INTEGER | not null , unique | fk_Ratings_recipe_id_RecipePosts | |
| **rating** | INTEGER | not null  |  | | 


### Likes

| Name        | Type          | Settings                      | References                    | Note                           |
|-------------|---------------|-------------------------------|-------------------------------|--------------------------------|
| **like_id** | INTEGER | 🔑 PK, not null , unique, autoincrement |  | |
| **user_id** | INTEGER | not null , unique | fk_Likes_user_id_Users | |
| **recipe_id** | INTEGER | not null , unique | fk_Likes_recipe_id_RecipePosts | |
| **created_at** | TIMESTAMP | not null  |  | | 


### Comments

| Name        | Type          | Settings                      | References                    | Note                           |
|-------------|---------------|-------------------------------|-------------------------------|--------------------------------|
| **comment_id** | INTEGER | 🔑 PK, not null , unique, autoincrement |  | |
| **user_id** | INTEGER | not null , unique | fk_Comments_user_id_Users | |
| **recipe_id** | INTEGER | not null , unique | fk_Comments_recipe_id_RecipePosts | |
| **comment_text** | TEXT(500) | not null  |  | |
| **created_at** | TIMESTAMP | not null  |  | | 


## Relationships

- **Users to UserLevels**: one_to_one
- **Ingredients to RecipePosts**: one_to_one
- **RecipePosts to Users**: one_to_one
- **Diets to Users**: one_to_one
- **Diets to RecipePosts**: one_to_one
- **Ratings to Users**: one_to_one
- **Ratings to RecipePosts**: one_to_one
- **Likes to Users**: one_to_one
- **Likes to RecipePosts**: one_to_one
- **Comments to Users**: one_to_one
- **Comments to RecipePosts**: one_to_one

## Database Diagram

```mermaid
erDiagram
	Users ||--|| UserLevels : references
	Ingredients ||--|| RecipePosts : references
	RecipePosts ||--|| Users : references
	Diets ||--|| Users : references
	Diets ||--|| RecipePosts : references
	Ratings ||--|| Users : references
	Ratings ||--|| RecipePosts : references
	Likes ||--|| Users : references
	Likes ||--|| RecipePosts : references
	Comments ||--|| Users : references
	Comments ||--|| RecipePosts : references

	Users {
		INTEGER user_id
		VARCHAR(50) username
		VARCHAR(100) email
		VARCHAR(100) password
		INTEGER user_level_id
		VARCHAR(255) profile_image
		VARCHAR(100) dietary
		TIMESTAMP created_at
	}

	UserLevels {
		INTEGER level_id
		VARCHAR(50) level_name
	}

	RecipePosts {
		INTEGER recipe_id
		INTEGER user_id
		VARCHAR(255) media_url
		VARCHAR(50) media_type
		TEXT(65535) instructions
		INTEGER cooking_time
		TIMESTAMP created_at
	}

	Ingredients {
		INTEGER ingredient_id
		INTEGER recipe_id
		VARCHAR(50) ingredient
	}

	Diets {
		INTEGER diet_id
		INTEGER user_id
		INTEGER recipe_id
		VARCHAR(50) diet_description
	}

	Ratings {
		INTEGER rating_id
		INTEGER user_id
		INTEGER recipe_id
		INTEGER rating
	}

	Likes {
		INTEGER like_id
		INTEGER user_id
		INTEGER recipe_id
		TIMESTAMP created_at
	}

	Comments {
		INTEGER comment_id
		INTEGER user_id
		INTEGER recipe_id
		TEXT(500) comment_text
		TIMESTAMP created_at
	}
```