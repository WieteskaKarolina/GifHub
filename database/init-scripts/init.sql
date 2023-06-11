-- Table: users
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(50),
  password VARCHAR(100),
  email VARCHAR(100)
);

-- Table: gifs
CREATE TABLE gifs (
  gif_id SERIAL PRIMARY KEY,
  gif_name VARCHAR(100),
  gif_url VARCHAR(200),
  user_id INT,
  FOREIGN KEY (user_id) REFERENCES users (user_id)
);

-- Table: favorites
CREATE TABLE favorites (
  favorite_id SERIAL PRIMARY KEY,
  user_id INT,
  gif_id INT,
  FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
  FOREIGN KEY (gif_id) REFERENCES gifs (gif_id) ON DELETE CASCADE
);

-- Table: tags
CREATE TABLE tags (
  tag_id SERIAL PRIMARY KEY,
  tag_name VARCHAR(50)
);

-- Table: gif_tags
CREATE TABLE gif_tags (
  gif_id INT,
  tag_id INT,
  FOREIGN KEY (gif_id) REFERENCES gifs (gif_id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags (tag_id) ON DELETE CASCADE
);
