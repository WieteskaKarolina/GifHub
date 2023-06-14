from flask import Flask, request, jsonify
import psycopg2
import requests

app = Flask(__name__)

conn = psycopg2.connect(
    host="db",
    port="5432",
    database="mydatabase",
    user="postgres",
    password="postgrespw"
)

cur = conn.cursor()

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
    liked_tags = liked_tags[:5]
    try:
        response = requests.get("https://api.giphy.com/v1/gifs/search", params={
            "api_key": "2HwtozSNXN1n7iOTOxjiOPC7drs5HadF",
            "limit": "100",
            "rating": "g",
            "lang": "en",
            "q": "+".join(liked_tags)
        })
        if response.status_code == 200:
            gif_data = response.json().get("data", [])
            gif_urls = [gif.get("images", {}).get("fixed_height", {}).get("url") for gif in gif_data]

            return gif_urls

    except requests.exceptions.RequestException as e:
        print("Error occurred during API request:", e)

    return []

@app.route('/tags', methods=['GET'])
def get_tags():
    cur.execute("SELECT tag_name FROM tags")
    rows = cur.fetchall()

    tags = [row[0] for row in rows]

    return jsonify({'tags': tags})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
