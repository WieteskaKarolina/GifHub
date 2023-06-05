import psycopg2
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from flask import Flask, request, jsonify

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
    gif_id = request.args.get('gifId')
    top_n = int(request.args.get('top_n', 5))

    recommendations = recommend_similar_gifs(gif_id, top_n)
    return jsonify({'recommendations': recommendations})

def recommend_similar_gifs(gif_id, top_n=5):
    cur.execute("SELECT * FROM gifs")
    rows = cur.fetchall()

    data = []

    for row in rows:
        input_data = preprocess_data(row)
        data.append(input_data)

    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(data['ulubione_gify'])

    similarity_matrix = cosine_similarity(tfidf_matrix)

    index = data[data['gif_id'] == gif_id].index[0]

    sim_scores = list(enumerate(similarity_matrix[index]))

    sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)

    recommended_gifs = [data.iloc[sim[0]]['gif_id'] for sim in sim_scores if data.iloc[sim[0]]['gif_id'] != gif_id][:top_n]

    return recommended_gifs


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
