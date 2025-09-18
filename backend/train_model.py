import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import joblib
import os

MODEL_FILE = "model.pkl"
CSV_FILE = "e-dravya.csv"

def train_model():
    if not os.path.exists(CSV_FILE):
        raise FileNotFoundError(f"{CSV_FILE} not found! Please add your CSV dataset.")

    df = pd.read_csv(CSV_FILE)

    X = df[['pH', 'TDS', 'Turbidity', 'Gas', 'ColorIndex', 'Temp']]
    y = df['Label']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    accuracy = model.score(X_test, y_test)
    print(f"Model trained. Accuracy: {accuracy*100:.2f}%")

    joblib.dump(model, MODEL_FILE)
    print(f"Model saved as {MODEL_FILE}")

if __name__ == "__main__":
    train_model()
