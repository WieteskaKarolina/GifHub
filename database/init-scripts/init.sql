CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(50),
  password VARCHAR(100),
  email VARCHAR(100)
);

CREATE TABLE gifs (
  gif_id SERIAL PRIMARY KEY,
  gif_name VARCHAR(100),
  gif_url VARCHAR(200),
  user_id INT,
  FOREIGN KEY (user_id) REFERENCES users (user_id)
);

CREATE TABLE favorites (
  favorite_id SERIAL PRIMARY KEY,
  user_id INT,
  gif_id INT,
  FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
  FOREIGN KEY (gif_id) REFERENCES gifs (gif_id) ON DELETE CASCADE
);

CREATE TABLE tags (
  tag_id SERIAL PRIMARY KEY,
  tag_name VARCHAR(50)
);

CREATE TABLE gif_tags (
  gif_id INT,
  tag_id INT,
  FOREIGN KEY (gif_id) REFERENCES gifs (gif_id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags (tag_id) ON DELETE CASCADE
);

CREATE TABLE recommendations_by_searching (
  recommendations_id SERIAL PRIMARY KEY,
  tag_id INT,
  user_id INT,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (tag_id) REFERENCES tags (tag_id),
  FOREIGN KEY (user_id) REFERENCES users (user_id)
);
