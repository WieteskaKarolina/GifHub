from flask import Flask, request, jsonify
import psycopg2
import requests
from transformers import BertTokenizer, BertModel
import torch

app = Flask(__name__)

conn = psycopg2.connect(
    host="db",
    port="5432",
    database="mydatabase",
    user="postgres",
    password="postgrespw"
)

cur = conn.cursor()

tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
model = BertModel.from_pretrained('bert-base-uncased')


@app.route('/recommendations', methods=['GET'])
def get_recommendations():
    user_id = request.args.get('user_id')
    top_n = int(request.args.get('top_n', 5))

    recommendations = recommend_similar_gifs(user_id, top_n)
    return jsonify({'image_urls': recommendations})


def recommend_similar_gifs(user_id, top_n=5):
    cur.execute("SELECT tags.tag_name FROM tags JOIN gif_tags ON tags.tag_id = gif_tags.tag_id JOIN gifs ON "
                "gif_tags.gif_id = gifs.gif_id WHERE gifs.user_id = %s", (user_id,))
    rows = cur.fetchall()

    liked_tags = [row[0] for row in rows]

    # Fetch tags from recommendations_by_searching
    cur.execute(
        "SELECT tags.tag_name FROM tags JOIN recommendations_by_searching ON tags.tag_id = recommendations_by_searching.tag_id WHERE recommendations_by_searching.user_id = %s",
        (user_id,))
    recommendation_rows = cur.fetchall()

    # Add tag names from recommendations_by_searching to liked_tags
    liked_tags.extend([row[0] for row in recommendation_rows])

    # Remove repetitions from liked_tags
    liked_tags = list(set(liked_tags))

    print(liked_tags)

    scored_tags = score_tags(liked_tags)
    sorted_tags = [tag for tag, _ in scored_tags]
    sorted_tags = sorted_tags[:top_n]

    print(sorted_tags)

    try:
        response = requests.get("https://api.giphy.com/v1/gifs/search", params={
            "api_key": "2HwtozSNXN1n7iOTOxjiOPC7drs5HadF",
            "limit": "100",
            "rating": "g",
            "lang": "en",
            "q": "+".join(sorted_tags)
        })
        if response.status_code == 200:
            gif_data = response.json().get("data", [])
            gif_urls = [gif.get("images", {}).get("fixed_height", {}).get("url") for gif in gif_data]

            return gif_urls

    except requests.exceptions.RequestException as e:
        print("Error occurred during API request:", e)

    return []

def score_tags(tags):
    inputs = tokenizer(tags, padding=True, truncation=True, return_tensors="pt")
    outputs = model(**inputs)
    scores = torch.mean(outputs.last_hidden_state, dim=1)
    print("Shape of inputs:", inputs.input_ids.shape)
    print("Shape of outputs:", outputs.last_hidden_state.shape)
    print("Shape of scores:", scores.shape)
    tag_scores = [(tag, score.tolist()) for tag, score in zip(tags, scores)]
    sorted_tags = sorted(tag_scores, key=lambda x: x[1], reverse=True)
    return sorted_tags

@app.route('/tags', methods=['GET'])
def get_tags():
    cur.execute("SELECT tag_name FROM tags")
    rows = cur.fetchall()
    tags = [row[0] for row in rows]
    return jsonify({'tags': tags})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
