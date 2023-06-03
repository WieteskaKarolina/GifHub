from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/similar-gif', methods=['POST'])
def get_similar_gif():
    user_preferences = request.json['preferences']
    # Logika przetwarzania danych i zwracania wyników
    similar_gif = process_user_preferences(user_preferences)
    return jsonify(similar_gif)

def process_user_preferences(preferences):
    # Przykładowa implementacja przetwarzania danych
    similar_gif = "https://example.com/similar-gif"
    return similar_gif

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
